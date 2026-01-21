import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import { 
  Flame, 
  Home, 
  Plus, 
  Search, 
  User, 
  Settings, 
  LogIn, 
  LogOut,
  Moon,
  Sun,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

interface CommandPaletteProps {
  onSubmitStack?: () => void;
  onSignIn?: () => void;
}

interface RecentStack {
  id: string;
  name: string;
  slug: string;
}

export function CommandPalette({ onSubmitStack, onSignIn }: CommandPaletteProps) {
  const [open, setOpen] = useState(false);
  const [recentStacks, setRecentStacks] = useState<RecentStack[]>([]);
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  // Listen for Cmd+K / Ctrl+K
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  // Load recent stacks when dialog opens
  useEffect(() => {
    if (open) {
      loadRecentStacks();
    }
  }, [open]);

  const loadRecentStacks = async () => {
    const { data } = await supabase
      .from('stacks')
      .select('id, name, slug')
      .eq('is_public', true)
      .order('created_at', { ascending: false })
      .limit(5);

    setRecentStacks(data || []);
  };

  const runCommand = (command: () => void) => {
    setOpen(false);
    command();
  };

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Type a command or search..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>

        {/* Navigation */}
        <CommandGroup heading="Navigation">
          <CommandItem onSelect={() => runCommand(() => navigate('/'))}>
            <Home className="mr-2 h-4 w-4" />
            <span>Go to Home</span>
          </CommandItem>
          {user && (
            <CommandItem onSelect={() => runCommand(() => navigate(`/user/${user.email?.split('@')[0]}`))}>
              <User className="mr-2 h-4 w-4" />
              <span>My Profile</span>
            </CommandItem>
          )}
        </CommandGroup>

        <CommandSeparator />

        {/* Actions */}
        <CommandGroup heading="Actions">
          <CommandItem onSelect={() => runCommand(() => onSubmitStack?.())}>
            <Plus className="mr-2 h-4 w-4" />
            <span>Submit Your Stack</span>
            <span className="ml-auto text-xs text-muted-foreground">New</span>
          </CommandItem>
          {!user ? (
            <CommandItem onSelect={() => runCommand(() => onSignIn?.())}>
              <LogIn className="mr-2 h-4 w-4" />
              <span>Sign In</span>
            </CommandItem>
          ) : (
            <CommandItem onSelect={() => runCommand(() => signOut())}>
              <LogOut className="mr-2 h-4 w-4" />
              <span>Sign Out</span>
            </CommandItem>
          )}
        </CommandGroup>

        {/* Recent Stacks */}
        {recentStacks.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Recent Stacks">
              {recentStacks.map((stack) => (
                <CommandItem
                  key={stack.id}
                  onSelect={() => runCommand(() => navigate(`/stack/${stack.slug}`))}
                >
                  <Flame className="mr-2 h-4 w-4 text-orange-400" />
                  <span>{stack.name}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}

        <CommandSeparator />

        {/* Quick Tips */}
        <CommandGroup heading="Shortcuts">
          <CommandItem disabled>
            <Search className="mr-2 h-4 w-4" />
            <span className="text-muted-foreground">Press</span>
            <kbd className="ml-2 pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
              <span className="text-xs">⌘</span>K
            </kbd>
            <span className="ml-2 text-muted-foreground">to open this menu</span>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
