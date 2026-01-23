import { supabase } from '@/lib/supabase';

export const LOCALSTORAGE_KEY = 'stackroast_saved_stacks';

export interface LocalSavedStack {
  stackId: string;
  stackName: string;
  stackSlug: string;
  savedAt: string;
}

// Helper function to get local saved stacks
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
