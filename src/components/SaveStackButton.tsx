import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { Bookmark, BookmarkCheck, ExternalLink, Copy, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface SaveStackButtonProps {
  stackId: string;
  stackName: string;
  stackSlug: string;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

const LOCALSTORAGE_KEY = 'stackroast_saved_stacks';

interface LocalSavedStack {
  stackId: string;
  stackName: string;
  stackSlug: string;
  savedAt: string;
}

export function SaveStackButton({
  stackId,
  stackName,
  stackSlug,
  variant = 'outline',
  size = 'default',
}: SaveStackButtonProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isSaved, setIsSaved] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);

  // Check if stack is saved (either in DB or localStorage)
  useEffect(() => {
    async function checkSaved() {
      if (user) {
        // Check database
        const { data } = await supabase
          .from('saved_stacks')
          .select('id')
          .eq('user_id', user.id)
          .eq('stack_id', stackId)
          .maybeSingle();

        setIsSaved(!!data);
      } else {
        // Check localStorage
        const saved = getLocalSavedStacks();
        setIsSaved(saved.some(s => s.stackId === stackId));
      }
    }

    checkSaved();
  }, [user, stackId]);

  const saveToLocalStorage = (stack: LocalSavedStack) => {
    const saved = getLocalSavedStacks();
    if (!saved.find(s => s.stackId === stack.stackId)) {
      saved.push(stack);
      localStorage.setItem(LOCALSTORAGE_KEY, JSON.stringify(saved));
    }
  };

  const removeFromLocalStorage = (stackId: string) => {
    const saved = getLocalSavedStacks();
    const filtered = saved.filter(s => s.stackId !== stackId);
    localStorage.setItem(LOCALSTORAGE_KEY, JSON.stringify(filtered));
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      if (user) {
        // Save to database
        const reminderDate = new Date();
        reminderDate.setDate(reminderDate.getDate() + 3); // 3 days from now

        const { error } = await supabase
          .from('saved_stacks')
          .upsert({
            user_id: user.id,
            stack_id: stackId,
            reminder_scheduled_for: reminderDate.toISOString(),
            saved_at: new Date().toISOString(),
          }, {
            onConflict: 'user_id,stack_id',
          });

        if (error) throw error;

        setIsSaved(true);
        toast.success('Stack saved!', {
          description: 'We\'ll send you a reminder in 3 days to check back.',
        });
      } else {
        // Save to localStorage
        saveToLocalStorage({
          stackId,
          stackName,
          stackSlug,
          savedAt: new Date().toISOString(),
        });

        setIsSaved(true);
        toast.success('Stack saved locally!', {
          description: 'Sign up to sync across devices and get reminders.',
          action: {
            label: 'Sign Up',
            onClick: () => navigate('/?signup=true'),
          },
        });
      }
    } catch (error: any) {
      console.error('Error saving stack:', error);
      toast.error('Failed to save stack', {
        description: error.message || 'Please try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUnsave = async () => {
    setLoading(true);
    try {
      if (user) {
        const { error } = await supabase
          .from('saved_stacks')
          .delete()
          .eq('user_id', user.id)
          .eq('stack_id', stackId);

        if (error) throw error;
      } else {
        removeFromLocalStorage(stackId);
      }

      setIsSaved(false);
      setShowDialog(false);
      toast.success('Stack removed from saved');
    } catch (error: any) {
      console.error('Error unsaving stack:', error);
      toast.error('Failed to remove stack');
    } finally {
      setLoading(false);
    }
  };

  const copyShareLink = () => {
    const url = `${window.location.origin}/stack/${stackSlug}?saved=true`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    toast.success('Link copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClick = () => {
    if (isSaved) {
      setShowDialog(true);
    } else {
      handleSave();
    }
  };

  return (
    <>
      <Button
        onClick={handleClick}
        disabled={loading}
        variant={variant}
        size={size}
        className="gap-2"
      >
        {isSaved ? (
          <>
            <BookmarkCheck className="w-4 h-4" />
            {size !== 'icon' && 'Saved'}
          </>
        ) : (
          <>
            <Bookmark className="w-4 h-4" />
            {size !== 'icon' && 'Save Stack'}
          </>
        )}
      </Button>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BookmarkCheck className="w-5 h-5 text-green-500" />
              Stack Saved!
            </DialogTitle>
            <DialogDescription>
              This stack has been saved to your collection.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <h4 className="font-medium text-sm">Come back anytime to:</h4>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground ml-2">
                <li>Compare alternatives</li>
                <li>Track price changes</li>
                <li>Share with your team</li>
                <li>Get purchase reminders</li>
              </ul>
            </div>

            {!user && (
              <div className="p-3 rounded-lg bg-violet-500/10 border border-violet-500/20">
                <p className="text-sm text-violet-400">
                  💡 Sign up to sync your saved stacks across devices and receive email reminders!
                </p>
              </div>
            )}
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => navigate('/saved')}
              className="w-full sm:w-auto"
            >
              View Saved Stacks
            </Button>
            <Button
              variant="outline"
              onClick={copyShareLink}
              className="w-full sm:w-auto gap-2"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  Copy Share Link
                </>
              )}
            </Button>
            <Button
              variant="destructive"
              onClick={handleUnsave}
              disabled={loading}
              className="w-full sm:w-auto"
            >
              Remove from Saved
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// Helper function to get local saved stacks (exported for migration)
export function getLocalSavedStacks(): LocalSavedStack[] {
  try {
    const stored = localStorage.getItem(LOCALSTORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

// Export utility function for migrating localStorage saves to database
export async function migrateLocalStorageSaves(userId: string): Promise<void> {
  try {
    const saved = getLocalSavedStacks();
    if (saved.length === 0) return;

    // Get existing saved stacks to avoid duplicates
    const { data: existing } = await supabase
      .from('saved_stacks')
      .select('stack_id')
      .eq('user_id', userId);

    const existingIds = new Set(existing?.map(s => s.stack_id) || []);

    // Insert non-duplicate saves
    const toInsert = saved
      .filter(s => !existingIds.has(s.stackId))
      .map(s => ({
        user_id: userId,
        stack_id: s.stackId,
        saved_at: s.savedAt,
        reminder_scheduled_for: new Date(
          new Date(s.savedAt).getTime() + 3 * 24 * 60 * 60 * 1000
        ).toISOString(),
      }));

    if (toInsert.length > 0) {
      const { error } = await supabase
        .from('saved_stacks')
        .insert(toInsert);

      if (error) throw error;

      // Clear localStorage after successful migration
      localStorage.removeItem(LOCALSTORAGE_KEY);
    }
  } catch (error) {
    console.error('Error migrating localStorage saves:', error);
    // Don't throw - migration failure shouldn't break the app
  }
}
