import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LoadingFire } from '@/components/LoadingFire';
import { BookmarkCheck, ExternalLink, Trash2, Calendar, DollarSign } from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { migrateLocalStorageSaves } from '@/components/SaveStackButton';

interface SavedStack {
  id: string;
  stack_id: string;
  stack_kit_id?: string;
  custom_name?: string;
  notes?: string;
  saved_at: string;
  last_viewed_at?: string;
  reminder_scheduled_for?: string;
  reminder_sent: boolean;
  stack?: {
    id: string;
    name: string;
    slug: string;
    burn_score?: number;
    total_cost?: number;
    view_count?: number;
    ai_alternatives?: any;
  };
}

export default function SavedStacks() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [savedStacks, setSavedStacks] = useState<SavedStack[]>([]);
  const [loading, setLoading] = useState(true);
  const [localStacks, setLocalStacks] = useState<any[]>([]);

  useEffect(() => {
    async function loadSavedStacks() {
      setLoading(true);

      if (user) {
        // Load from database
        try {
          const { data, error } = await supabase
            .from('saved_stacks')
            .select(`
              id,
              stack_id,
              stack_kit_id,
              custom_name,
              notes,
              saved_at,
              last_viewed_at,
              reminder_scheduled_for,
              reminder_sent,
              stack:stacks (
                id,
                name,
                slug,
                burn_score,
                total_cost,
                view_count
              )
            `)
            .eq('user_id', user.id)
            .order('saved_at', { ascending: false });

          if (error) throw error;

          setSavedStacks((data || []) as SavedStack[]);

          // Migrate localStorage saves if any exist
          await migrateLocalStorageSaves(user.id);
        } catch (error: any) {
          console.error('Error loading saved stacks:', error);
          toast.error('Failed to load saved stacks');
        }
      } else {
        // Load from localStorage
        try {
          const stored = localStorage.getItem('stackroast_saved_stacks');
          if (stored) {
            const parsed = JSON.parse(stored);
            setLocalStacks(parsed);
          }
        } catch (error) {
          console.error('Error loading localStorage stacks:', error);
        }
      }

      setLoading(false);
    }

    if (!authLoading) {
      loadSavedStacks();
    }
  }, [user, authLoading]);

  const handleRemove = async (savedStackId: string, stackId: string) => {
    try {
      if (user) {
        const { error } = await supabase
          .from('saved_stacks')
          .delete()
          .eq('id', savedStackId);

        if (error) throw error;

        setSavedStacks(prev => prev.filter(s => s.id !== savedStackId));
        toast.success('Stack removed from saved');
      } else {
        // Remove from localStorage
        const stored = localStorage.getItem('stackroast_saved_stacks');
        if (stored) {
          const parsed = JSON.parse(stored);
          const filtered = parsed.filter((s: any) => s.stackId !== stackId);
          localStorage.setItem('stackroast_saved_stacks', JSON.stringify(filtered));
          setLocalStacks(filtered);
          toast.success('Stack removed from saved');
        }
      }
    } catch (error: any) {
      console.error('Error removing saved stack:', error);
      toast.error('Failed to remove stack');
    }
  };

  const handleView = (slug: string) => {
    navigate(`/stack/${slug}`);
  };

  const calculateSavings = (alternatives: any): { monthly: string; yearly: string } | null => {
    if (!alternatives?.total_savings) return null;
    return {
      monthly: alternatives.total_savings.monthly_money || '$0',
      yearly: alternatives.total_savings.yearly_money || '$0',
    };
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-canvas flex items-center justify-center">
        <LoadingFire size="md" text="Loading saved stacks..." />
      </div>
    );
  }

  const allStacks = user ? savedStacks : localStacks.map((ls: any) => ({
    id: `local-${ls.stackId}`,
    stack_id: ls.stackId,
    saved_at: ls.savedAt,
    stack: {
      id: ls.stackId,
      name: ls.stackName,
      slug: ls.stackSlug,
    },
  }));

  return (
    <div className="min-h-screen bg-canvas pb-20">
      {/* Header */}
      <header className="border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-2">
            <BookmarkCheck className="w-6 h-6 text-violet-500" />
            <h1 className="text-2xl font-bold text-foreground">Saved Stacks</h1>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            {allStacks.length === 0
              ? 'No saved stacks yet'
              : `${allStacks.length} stack${allStacks.length !== 1 ? 's' : ''} saved`}
          </p>
        </div>
      </header>

      {/* Content */}
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {!user && (
          <Card className="mb-6 bg-gradient-to-br from-violet-500/10 to-purple-500/10 border-violet-500/30">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <BookmarkCheck className="w-5 h-5 text-violet-400 mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-semibold mb-1">Sign up to sync your saved stacks</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    Your saved stacks are currently stored locally. Sign up to sync across devices
                    and receive email reminders.
                  </p>
                  <Button
                    onClick={() => navigate('/?signup=true')}
                    className="bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-600 hover:to-purple-600"
                  >
                    Sign Up
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {allStacks.length === 0 ? (
          <Card className="bg-card border-border">
            <CardContent className="pt-12 pb-12 text-center">
              <BookmarkCheck className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-xl font-semibold mb-2 text-foreground">
                No saved stacks yet
              </h3>
              <p className="text-muted-foreground mb-6">
                Save stacks you want to revisit later. They'll appear here.
              </p>
              <Button onClick={() => navigate('/')} variant="outline">
                Browse Stacks
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {allStacks.map((savedStack) => {
              const stack = savedStack.stack;
              if (!stack) return null;

              // ai_alternatives may not exist if migration hasn't been run
              const savings = stack.ai_alternatives ? calculateSavings(stack.ai_alternatives) : null;
              const savedDate = new Date(savedStack.saved_at);
              const daysAgo = Math.floor(
                (Date.now() - savedDate.getTime()) / (1000 * 60 * 60 * 24)
              );

              return (
                <Card
                  key={savedStack.id}
                  className="bg-card border-border hover:border-violet-500/50 transition-all"
                >
                  <CardContent className="pt-6">
                    <div className="space-y-4">
                      {/* Header */}
                      <div>
                        <h3 className="font-semibold text-lg mb-1 text-foreground line-clamp-2">
                          {savedStack.custom_name || stack.name}
                        </h3>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Calendar className="w-3 h-3" />
                          <span>Saved {daysAgo === 0 ? 'today' : `${daysAgo} day${daysAgo !== 1 ? 's' : ''} ago`}</span>
                        </div>
                      </div>

                      {/* Stats */}
                      <div className="flex items-center gap-4 text-sm">
                        {stack.burn_score !== undefined && (
                          <div className="flex items-center gap-1">
                            <span className="text-orange-500 font-bold">{stack.burn_score}</span>
                            <span className="text-muted-foreground">burn</span>
                          </div>
                        )}
                        {stack.total_cost !== undefined && stack.total_cost > 0 && (
                          <div className="flex items-center gap-1">
                            <DollarSign className="w-3 h-3 text-muted-foreground" />
                            <span className="text-muted-foreground">
                              ${stack.total_cost.toFixed(0)}/mo
                            </span>
                          </div>
                        )}
                        {savings && (
                          <Badge variant="outline" className="bg-green-500/10 text-green-400 border-green-500/50">
                            Save {savings.yearly}
                          </Badge>
                        )}
                      </div>

                      {/* Notes */}
                      {savedStack.notes && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {savedStack.notes}
                        </p>
                      )}

                      {/* Actions */}
                      <div className="flex items-center gap-2 pt-2 border-t border-border">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleView(stack.slug)}
                          className="flex-1"
                        >
                          <ExternalLink className="w-3 h-3 mr-1" />
                          View
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemove(savedStack.id, stack.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
