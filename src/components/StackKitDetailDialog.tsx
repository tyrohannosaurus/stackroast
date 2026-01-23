import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { 
  DollarSign, 
  Wrench, 
  Check, 
  X, 
  Copy, 
  Flame,
  ExternalLink,
  Sparkles,
  Share2
} from 'lucide-react';
import { toast } from 'sonner';
import { type StackKit, DIFFICULTY_INFO, CATEGORY_INFO } from '@/data/stackKits';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { LoadingFire } from '@/components/LoadingFire';
import { getAffiliateLink } from '@/data/affiliateLinks';
import { trackAffiliateClick } from '@/lib/analytics';
import { trackStackKitClone } from '@/lib/analytics';

interface StackKitDetailDialogProps {
  kit: StackKit | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function StackKitDetailDialog({ kit, open, onOpenChange }: StackKitDetailDialogProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [cloning, setCloning] = useState(false);

  if (!kit) return null;

  const difficultyInfo = DIFFICULTY_INFO[kit.difficulty];
  const categoryInfo = CATEGORY_INFO[kit.category];

  const handleCloneKit = async () => {
    setCloning(true);
    try {
      // Get affiliate links for tools in the kit
      const toolsWithAffiliates = kit.tools
        .map(tool => {
          const affiliateLink = getAffiliateLink(tool.name);
          return {
            ...tool,
            affiliate_url: affiliateLink?.url || null,
            commission: affiliateLink?.commission || 0,
          };
        })
        .filter(tool => tool.affiliate_url); // Only tools with affiliate links

      // Track kit clone
      await trackStackKitClone(kit.id, kit.name, user?.id);

      if (toolsWithAffiliates.length === 0) {
        toast.info('No affiliate links available for this kit');
        setCloning(false);
        return;
      }

      // Open affiliate links with delay to avoid popup blockers
      toolsWithAffiliates.forEach((tool, index) => {
        setTimeout(() => {
          if (tool.affiliate_url) {
            trackAffiliateClick({
              toolName: tool.name,
              affiliateUrl: tool.affiliate_url,
              source: "stack_kit",
              userId: user?.id || null,
            });
            window.open(tool.affiliate_url, '_blank', 'noopener,noreferrer');
          }
        }, index * 300); // 300ms delay between each link
      });

      // If user is authenticated, also create a stack in database
      if (user) {
        try {
          const stackName = `My ${kit.name}`;
          const slug = `${kit.id}-${Date.now().toString(36)}`;

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

          if (!stackError && stackData) {
            // Find matching tools in database and add them
            const toolSlugs = kit.tools.map(t => t.slug);
            const { data: tools } = await supabase
              .from('tools')
              .select('id, slug')
              .in('slug', toolSlugs);

            if (tools && tools.length > 0) {
              const stackItems = tools.map((tool, index) => ({
                stack_id: stackData.id,
                tool_id: tool.id,
                sort_order: index,
              }));

              await supabase.from('stack_items').insert(stackItems);
            }

            // Show success and navigate
            setTimeout(() => {
              toast.success('Stack kit cloned! Opening affiliate links...');
              onOpenChange(false);
              navigate(`/stack/${slug}`);
            }, toolsWithAffiliates.length * 300 + 500);
            return;
          }
        } catch (dbError) {
          console.error('Error creating stack in DB:', dbError);
          // Continue to show affiliate links even if DB creation fails
        }
      }

      // Show success toast
      setTimeout(() => {
        toast.success(`Opening ${toolsWithAffiliates.length} tools in new tabs...`, {
          description: 'Sign up for each tool to complete your stack setup.',
        });
        setCloning(false);
      }, toolsWithAffiliates.length * 300 + 500);
    } catch (error) {
      console.error('Error cloning kit:', error);
      toast.error('Failed to clone kit. Please try again.');
      setCloning(false);
    }
  };

  const handleShare = async () => {
    const url = `${window.location.origin}/kits?kit=${kit.id}`;
    try {
      await navigator.clipboard.writeText(url);
      toast.success('Link copied to clipboard!');
    } catch {
      toast.error('Failed to copy link');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-xl bg-muted flex items-center justify-center text-4xl shrink-0">
              {kit.icon}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="outline">{categoryInfo.icon} {categoryInfo.label}</Badge>
                <Badge variant="outline" className={difficultyInfo.color}>
                  {difficultyInfo.label}
                </Badge>
              </div>
              <DialogTitle className="text-2xl">{kit.name}</DialogTitle>
              <DialogDescription className="text-base mt-1">
                {kit.tagline}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 pt-4">
          {/* Description */}
          <p className="text-muted-foreground">{kit.description}</p>

          {/* Key Stats */}
          <div className="grid grid-cols-3 gap-4">
            <Card className="p-4 text-center bg-surface/50">
              <Wrench className="w-5 h-5 mx-auto mb-1 text-orange-500" />
              <div className="text-2xl font-bold">{kit.tools.length}</div>
              <div className="text-xs text-muted-foreground">Tools</div>
            </Card>
            <Card className="p-4 text-center bg-surface/50">
              <DollarSign className="w-5 h-5 mx-auto mb-1 text-green-500" />
              <div className="text-2xl font-bold">
                {kit.totalMonthlyCost === 0 ? 'Free' : `$${kit.totalMonthlyCost}`}
              </div>
              <div className="text-xs text-muted-foreground">/month</div>
            </Card>
            <Card className="p-4 text-center bg-surface/50">
              <Sparkles className="w-5 h-5 mx-auto mb-1 text-purple-500" />
              <div className="text-2xl font-bold capitalize">{kit.difficulty}</div>
              <div className="text-xs text-muted-foreground">Complexity</div>
            </Card>
          </div>

          {/* Highlights */}
          <div>
            <h3 className="font-semibold mb-3">Highlights</h3>
            <div className="flex flex-wrap gap-2">
              {kit.highlights.map((highlight, i) => (
                <Badge key={i} variant="secondary" className="bg-orange-500/10 text-orange-400">
                  {highlight}
                </Badge>
              ))}
            </div>
          </div>

          <Separator />

          {/* Tools */}
          <div>
            <h3 className="font-semibold mb-3">Included Tools ({kit.tools.length})</h3>
            <div className="space-y-3">
              {kit.tools.map((tool, i) => (
                <Card key={i} className="p-3 bg-surface/30">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{tool.name}</span>
                        <Badge variant="outline" className="text-xs">
                          {tool.category}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {tool.reason}
                      </p>
                    </div>
                    <div className="text-sm text-right shrink-0 ml-4">
                      {tool.monthlyPrice === 0 ? (
                        <span className="text-green-500 font-medium">Free</span>
                      ) : tool.monthlyPrice ? (
                        <span className="text-muted-foreground">${tool.monthlyPrice}/mo</span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          <Separator />

          {/* Best For / Not For */}
          <div className="grid grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Check className="w-4 h-4 text-green-500" />
                Best For
              </h3>
              <ul className="space-y-2">
                {kit.bestFor.map((item, i) => (
                  <li key={i} className="text-sm text-muted-foreground flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <X className="w-4 h-4 text-red-500" />
                Not Ideal For
              </h3>
              <ul className="space-y-2">
                {kit.notFor.map((item, i) => (
                  <li key={i} className="text-sm text-muted-foreground flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <Separator />

          {/* Commission Info */}
          {kit.totalCommission && kit.totalCommission > 0 && (
            <Card className="p-3 bg-green-500/10 border-green-500/30">
              <div className="flex items-center gap-2 text-sm">
                <Sparkles className="w-4 h-4 text-green-400" />
                <span className="text-green-400 font-medium">
                  Potential commission: ${kit.totalCommission} if all tools are signed up
                </span>
              </div>
            </Card>
          )}

          {/* Actions */}
          <div className="flex items-center gap-3">
            <Button 
              onClick={handleCloneKit}
              disabled={cloning}
              className="flex-1 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
              size="lg"
            >
              {cloning ? (
                <>
                  <LoadingFire size="sm" />
                  <span className="ml-2">Opening links...</span>
                </>
              ) : (
                <>
                  <Copy className="w-5 h-5 mr-2" />
                  Clone This Stack
                </>
              )}
            </Button>
            <Button 
              onClick={handleShare}
              variant="outline"
              size="lg"
            >
              <Share2 className="w-5 h-5" />
            </Button>
          </div>

          {kit.testimonial && (
            <Card className="p-4 bg-muted/30 border-border">
              <p className="text-sm italic text-muted-foreground mb-1">
                "{kit.testimonial.text}"
              </p>
              <p className="text-xs text-muted-foreground">— {kit.testimonial.author}</p>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
