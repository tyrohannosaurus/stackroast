import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  Wrench,
  Share2,
  TrendingUp,
  Eye,
  MessageSquare,
  ExternalLink,
  Sparkles,
  Loader2,
  Copy
} from 'lucide-react';
import { toast } from 'sonner';
import type { StackKitWithStats, ToolInKit } from '@/types/database';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { getKitById, type StackKitTool } from '@/data/stackKits';
import { stringToUUID } from '@/lib/uuid';

interface StackKitDetailDialogProps {
  kit: StackKitWithStats | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function StackKitDetailDialog({ kit, open, onOpenChange }: StackKitDetailDialogProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [tools, setTools] = useState<ToolInKit[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasUpvoted, setHasUpvoted] = useState(false);
  const [upvoting, setUpvoting] = useState(false);

  useEffect(() => {
    if (kit && open) {
      loadKitDetails();
      checkUpvoteStatus();
      incrementViewCount();
    }
  }, [kit, open]);

  const loadKitDetails = async () => {
    if (!kit) return;

    setLoading(true);
    try {
      // Check if this is a hardcoded kit (creator_id is 'system')
      if (kit.creator_id === 'system') {
        const hardcodedKit = getKitById(kit.id);
        if (hardcodedKit) {
          // Fetch tool logos from database using slugs
          const toolSlugs = hardcodedKit.tools.map(t => t.slug);
          const { data: dbTools } = await supabase
            .from('tools')
            .select('id, name, slug, logo_url, category, website_url')
            .in('slug', toolSlugs);

          // Create a map of slug -> tool data for quick lookup
          const toolMap = new Map((dbTools || []).map(t => [t.slug, t]));

          // Convert hardcoded tools to ToolInKit format, using database data when available
          const transformedTools: ToolInKit[] = hardcodedKit.tools.map((tool: StackKitTool, index: number) => {
            const dbTool = toolMap.get(tool.slug);
            // Use placeholder if no logo is available
            const logoUrl = dbTool?.logo_url || tool.logoUrl || '/placeholder.svg';
            return {
              id: dbTool?.id || tool.slug, // Use database ID if available, otherwise slug
              name: tool.name,
              slug: tool.slug,
              logo_url: logoUrl,
              category: dbTool?.category || tool.category,
              website_url: dbTool?.website_url,
              reason_text: tool.reason,
              sort_order: index,
            };
          });
          setTools(transformedTools);
          setLoading(false);
          return;
        }
      }

      // Load from database for user-submitted kits
      const { data, error } = await supabase
        .from('kit_tools')
        .select(`
          reason_text,
          sort_order,
          tool:tools (
            id,
            name,
            slug,
            logo_url,
            category,
            website_url
          )
        `)
        .eq('kit_id', kit.id)
        .order('sort_order');

      if (error) throw error;

      // Transform the data to ToolInKit format
      const transformedTools: ToolInKit[] = (data || []).map((item: any) => ({
        ...item.tool,
        reason_text: item.reason_text,
        sort_order: item.sort_order,
      }));

      setTools(transformedTools);
    } catch (error: any) {
      console.error('Error loading kit tools:', error);
      toast.error('Failed to load kit details');
    } finally {
      setLoading(false);
    }
  };

  const checkUpvoteStatus = async () => {
    if (!kit || !user) return;

    try {
      // For hardcoded kits, check if they exist in database first
      let kitIdToCheck = kit.id;
      if (kit.creator_id === 'system') {
        const kitUUID = stringToUUID(`hardcoded-kit-${kit.slug}`);
        // Check if kit exists in database
        const { data: existingKit } = await supabase
          .from('stack_kits')
          .select('id')
          .eq('id', kitUUID)
          .maybeSingle();
        
        if (existingKit) {
          kitIdToCheck = existingKit.id;
        } else {
          // Kit doesn't exist in DB yet, so user hasn't upvoted
          setHasUpvoted(false);
          return;
        }
      }

      const { data } = await supabase.rpc('user_has_upvoted_kit', {
        kit_id_param: kitIdToCheck,
        user_id_param: user.id,
      });

      setHasUpvoted(data === true);
    } catch (error) {
      console.error('Error checking upvote status:', error);
      setHasUpvoted(false);
    }
  };

  const incrementViewCount = async () => {
    if (!kit) return;

    // Skip for hardcoded kits
    if (kit.creator_id === 'system') return;

    try {
      await supabase.rpc('increment_kit_view_count', {
        kit_id_param: kit.id,
      });
    } catch (error) {
      console.error('Error incrementing view count:', error);
    }
  };

  const handleUpvote = async () => {
    if (!kit || !user) {
      toast.error('Please sign in to upvote');
      return;
    }

    setUpvoting(true);
    try {
      // For hardcoded kits, ensure they exist in the database first
      if (kit.creator_id === 'system') {
        // Generate deterministic UUID for hardcoded kit
        const kitUUID = stringToUUID(`hardcoded-kit-${kit.slug}`);
        
        // Check if kit exists in database
        const { data: existingKit } = await supabase
          .from('stack_kits')
          .select('id')
          .eq('id', kitUUID)
          .maybeSingle();

        if (!existingKit) {
          // Get the hardcoded kit data
          const hardcodedKit = getKitById(kit.id);
          if (!hardcodedKit) {
            toast.error('Kit not found');
            setUpvoting(false);
            return;
          }

          // Find system user (StackRoast profile)
          // Try multiple approaches to find the system user
          let systemUserId: string | null = null;
          
          // First, try the standard system user ID
          const STANDARD_SYSTEM_USER_ID = '00000000-0000-0000-0000-000000000001';
          const { data: standardSystemUser } = await supabase
            .from('profiles')
            .select('id')
            .eq('id', STANDARD_SYSTEM_USER_ID)
            .maybeSingle();

          if (standardSystemUser) {
            systemUserId = STANDARD_SYSTEM_USER_ID;
          } else {
            // Try to find by username
            const { data: systemUserByUsername } = await supabase
              .from('profiles')
              .select('id')
              .eq('username', 'StackRoast')
              .maybeSingle();

            if (systemUserByUsername) {
              systemUserId = systemUserByUsername.id;
            } else {
              // Fallback: Use hello@stackroast.com user if it exists
              const FALLBACK_SYSTEM_USER_ID = '4a4dbd5a-e119-4c41-b4d6-382a426d0ae4';
              const { data: fallbackUser } = await supabase
                .from('profiles')
                .select('id')
                .eq('id', FALLBACK_SYSTEM_USER_ID)
                .maybeSingle();

              if (fallbackUser) {
                systemUserId = FALLBACK_SYSTEM_USER_ID;
              } else {
                toast.error('System configuration missing. Please create a system user or run migration 20260127_create_system_user.sql');
                setUpvoting(false);
                return;
              }
            }
          }

          // Create kit in database using SECURITY DEFINER function (bypasses RLS)
          const { data: createdKitId, error: createError } = await supabase.rpc('create_hardcoded_kit', {
            p_kit_id: kitUUID,
            p_creator_id: systemUserId,
            p_name: kit.name,
            p_slug: kit.slug,
            p_tagline: kit.tagline,
            p_description: kit.description,
            p_icon: kit.icon,
            p_category: kit.category,
            p_tags: kit.tags,
            p_difficulty: kit.difficulty,
            p_total_monthly_cost_min: kit.total_monthly_cost_min || 0,
            p_total_monthly_cost_max: kit.total_monthly_cost_max || 0,
            p_featured: kit.featured || false,
          });

          if (createError) {
            console.error('Error creating hardcoded kit:', createError);
            // If insert fails, try to find by slug (might have been created differently)
            const { data: foundKit } = await supabase
              .from('stack_kits')
              .select('id')
              .eq('slug', kit.slug)
              .maybeSingle();
            
            if (foundKit) {
              kit.id = foundKit.id;
            } else {
              throw createError;
            }
          } else {
            kit.id = createdKitId || kitUUID;
          }

          // Create kit_tools entries
          const toolSlugs = hardcodedKit.tools.map(t => t.slug);
          const { data: tools } = await supabase
            .from('tools')
            .select('id, slug')
            .in('slug', toolSlugs);

          if (tools && tools.length > 0) {
            const toolMap = new Map(tools.map(t => [t.slug, t.id]));
            const kitTools = hardcodedKit.tools
              .map((tool, index) => {
                const toolId = toolMap.get(tool.slug);
                if (!toolId) return null;
                return {
                  kit_id: kit.id,
                  tool_id: toolId,
                  reason_text: tool.reason,
                  sort_order: index,
                };
              })
              .filter(Boolean) as Array<{ kit_id: string; tool_id: string; reason_text: string; sort_order: number }>;

            if (kitTools.length > 0) {
              await supabase.from('kit_tools').insert(kitTools);
            }
          }
        } else {
          // Kit exists, use its database ID
          kit.id = existingKit.id;
        }
      }

      if (hasUpvoted) {
        // Remove upvote
        const { error } = await supabase
          .from('kit_upvotes')
          .delete()
          .eq('kit_id', kit.id)
          .eq('user_id', user.id);

        if (error) {
          console.error('Error removing upvote:', error);
          throw error;
        }

        setHasUpvoted(false);
        toast.success('Upvote removed');
      } else {
        // Add upvote
        const { error } = await supabase
          .from('kit_upvotes')
          .insert({
            kit_id: kit.id,
            user_id: user.id,
          });

        if (error) {
          console.error('Error adding upvote:', error);
          console.error('Kit ID:', kit.id);
          console.error('User ID:', user.id);
          throw error;
        }

        setHasUpvoted(true);
        toast.success('Upvoted!');
      }
    } catch (error: any) {
      console.error('Error toggling upvote:', error);
      const errorMessage = error?.message || 'Unknown error occurred';
      toast.error(`Failed to upvote: ${errorMessage}`);
    } finally {
      setUpvoting(false);
    }
  };

  const handleCloneKit = async () => {
    if (!kit || !user) {
      toast.error('Please sign in to clone this kit');
      return;
    }

    try {
      const stackName = `My ${kit.name}`;
      const slug = `${kit.slug}-clone-${Date.now().toString(36)}`;

      // Create the stack
      const { data: stackData, error: stackError } = await supabase
        .from('stacks')
        .insert({
          name: stackName,
          slug,
          profile_id: user.id,
          is_public: true,
        })
        .select()
        .single();

      if (stackError) throw stackError;

      // Add tools to the stack
      if (tools.length > 0) {
        const stackItems = tools.map((tool, index) => ({
          stack_id: stackData.id,
          tool_id: tool.id,
          sort_order: index,
        }));

        const { error: itemsError } = await supabase
          .from('stack_items')
          .insert(stackItems);

        if (itemsError) throw itemsError;
      }

      toast.success('Kit cloned successfully!');
      onOpenChange(false);
      navigate(`/stack/${slug}`);
    } catch (error: any) {
      console.error('Error cloning kit:', error);
      toast.error('Failed to clone kit');
    }
  };

  const handleShare = async () => {
    if (!kit) return;

    const url = `${window.location.origin}/kits?kit=${kit.slug}`;
    try {
      await navigator.clipboard.writeText(url);
      toast.success('Link copied to clipboard!');
    } catch {
      toast.error('Failed to copy link');
    }
  };

  if (!kit) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-xl bg-muted flex items-center justify-center text-4xl shrink-0">
              {kit.icon || '📦'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="outline">{kit.category}</Badge>
                {kit.difficulty && (
                  <Badge variant="outline">
                    {kit.difficulty}
                  </Badge>
                )}
              </div>
              <DialogTitle className="text-2xl">{kit.name}</DialogTitle>
              <DialogDescription className="text-base mt-1">
                {kit.tagline}
              </DialogDescription>
              <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                by <span className="font-medium">{kit.creator_username}</span>
              </div>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 pt-4">
          {/* Description */}
          <p className="text-muted-foreground">{kit.description}</p>

          {/* Tags */}
          {kit.tags && kit.tags.length > 0 && (
            <div>
              <h3 className="font-semibold mb-2 text-sm">Tags</h3>
              <div className="flex flex-wrap gap-2">
                {kit.tags.map((tag, i) => (
                  <Badge key={i} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Key Stats */}
          <div className="grid grid-cols-4 gap-4">
            <Card className="p-4 text-center bg-surface/50">
              <Wrench className="w-5 h-5 mx-auto mb-1 text-orange-500" />
              <div className="text-2xl font-bold">{kit.tool_count}</div>
              <div className="text-xs text-muted-foreground">Tools</div>
            </Card>
            <Card className="p-4 text-center bg-surface/50">
              <TrendingUp className="w-5 h-5 mx-auto mb-1 text-green-500" />
              <div className="text-2xl font-bold">{kit.upvote_count}</div>
              <div className="text-xs text-muted-foreground">Upvotes</div>
            </Card>
            <Card className="p-4 text-center bg-surface/50">
              <Eye className="w-5 h-5 mx-auto mb-1 text-blue-500" />
              <div className="text-2xl font-bold">{kit.view_count}</div>
              <div className="text-xs text-muted-foreground">Views</div>
            </Card>
            <Card className="p-4 text-center bg-surface/50">
              <MessageSquare className="w-5 h-5 mx-auto mb-1 text-purple-500" />
              <div className="text-2xl font-bold">{kit.comment_count}</div>
              <div className="text-xs text-muted-foreground">Comments</div>
            </Card>
          </div>

          <Separator />

          {/* Tools */}
          <div>
            <h3 className="font-semibold mb-3">Included Tools ({tools.length})</h3>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-orange-500" />
              </div>
            ) : (
              <div className="space-y-3">
                {tools.map((tool, i) => (
                  <Card key={i} className="p-3 bg-surface/30">
                    <div className="flex items-start gap-3">
                      <img
                        src={tool.logo_url}
                        alt={tool.name}
                        className="w-10 h-10 rounded"
                        loading="lazy"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium">{tool.name}</span>
                          <Badge variant="outline" className="text-xs">
                            {tool.category}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {tool.reason_text}
                        </p>
                      </div>
                      {tool.website_url && (
                        <a
                          href={tool.website_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="shrink-0"
                        >
                          <Button variant="ghost" size="sm">
                            <ExternalLink className="w-4 h-4" />
                          </Button>
                        </a>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>

          <Separator />

          {/* Actions */}
          <div className="flex items-center gap-3">
            <Button
              onClick={handleUpvote}
              disabled={upvoting || !user}
              variant={hasUpvoted ? 'default' : 'outline'}
              size="lg"
            >
              {upvoting ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <TrendingUp className={`w-5 h-5 mr-2 ${hasUpvoted ? 'fill-current' : ''}`} />
                  {hasUpvoted ? 'Upvoted' : 'Upvote'}
                </>
              )}
            </Button>

            <Button
              onClick={handleCloneKit}
              disabled={!user}
              className="flex-1 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
              size="lg"
            >
              <Copy className="w-5 h-5 mr-2" />
              Clone This Kit
            </Button>

            <Button
              onClick={handleShare}
              variant="outline"
              size="lg"
            >
              <Share2 className="w-5 h-5" />
            </Button>
          </div>

          {!user && (
            <p className="text-xs text-center text-muted-foreground">
              Sign in to upvote and clone this kit
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
