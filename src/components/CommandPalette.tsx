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
  CommandShortcut,
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
  Github,
  Eye,
  Users,
  Sparkles,
  TrendingUp,
  LayoutDashboard,
  Mail,
  Copy,
  ExternalLink,
  Palette,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

interface CommandPaletteProps {
  onSubmitStack?: () => void;
  onImportGithub?: () => void;
  onVisualRoast?: () => void;
  onRoastFriend?: () => void;
  onSignIn?: () => void;
  onOpenSearch?: () => void;
}

interface RecentStack {
  id: string;
  name: string;
  slug: string;
}

export function CommandPalette({ 
  onSubmitStack, 
  onImportGithub,
  onVisualRoast,
  onRoastFriend,
  onSignIn,
  onOpenSearch,
}: CommandPaletteProps) {
  const [open, setOpen] = useState(false);
  const [recentStacks, setRecentStacks] = useState<RecentStack[]>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { user, profile, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();

  // Listen for Cmd+K / Ctrl+K
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
      // Additional shortcuts
      if (e.key === '/' && !e.metaKey && !e.ctrlKey && !isInputFocused()) {
        e.preventDefault();
        onOpenSearch?.();
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, [onOpenSearch]);

  // Check if an input element is focused
  const isInputFocused = () => {
    const active = document.activeElement;
    return active instanceof HTMLInputElement || 
           active instanceof HTMLTextAreaElement ||
           active?.getAttribute('contenteditable') === 'true';
  };

  // Load recent stacks when dialog opens
  useEffect(() => {
    if (open) {
      loadRecentStacks();
    }
  }, [open]);

  const loadRecentStacks = async () => {
    setLoading(true);
    try {
      const { data } = await supabase
        .from('stacks')
        .select('id, name, slug')
        .eq('is_public', true)
        .order('created_at', { ascending: false })
        .limit(5);

      setRecentStacks(data || []);
    } catch (error) {
      console.error('Error loading recent stacks:', error);
    } finally {
      setLoading(false);
    }
  };

  const runCommand = (command: () => void) => {
    setOpen(false);
    // Small delay to allow dialog to close
    setTimeout(command, 100);
  };

  const handleCopyCurrentUrl = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success('URL copied to clipboard!');
  };

  const scrollToLeaderboards = () => {
    const element = document.getElementById('leaderboards');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    } else {
      navigate('/');
      setTimeout(() => {
        document.getElementById('leaderboards')?.scrollIntoView({ behavior: 'smooth' });
      }, 300);
    }
  };

  const handleOpenInNewTab = (url: string) => {
    window.open(url, '_blank');
  };

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Type a command or search..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>

        {/* Quick Actions */}
        <CommandGroup heading="Quick Actions">
          <CommandItem onSelect={() => runCommand(() => onSubmitStack?.())}>
            <Plus className="mr-2 h-4 w-4 text-orange-500" />
            <span>Submit Your Stack</span>
            <CommandShortcut>New</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => onImportGithub?.())}>
            <Github className="mr-2 h-4 w-4" />
            <span>Import from GitHub</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => onVisualRoast?.())}>
            <Eye className="mr-2 h-4 w-4 text-purple-500" />
            <span>Visual Analysis</span>
            <CommandShortcut>AI</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => onRoastFriend?.())}>
            <Users className="mr-2 h-4 w-4 text-orange-400" />
            <span>Roast a Friend</span>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        {/* Navigation */}
        <CommandGroup heading="Navigation">
          <CommandItem onSelect={() => runCommand(() => navigate('/'))}>
            <Home className="mr-2 h-4 w-4" />
            <span>Home</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => navigate('/kits'))}>
            <Sparkles className="mr-2 h-4 w-4 text-orange-500" />
            <span>Stack Kits</span>
            <CommandShortcut>New</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => scrollToLeaderboards())}>
            <TrendingUp className="mr-2 h-4 w-4" />
            <span>Leaderboards</span>
          </CommandItem>
          {user && (
            <>
              <CommandItem onSelect={() => runCommand(() => navigate('/dashboard'))}>
                <LayoutDashboard className="mr-2 h-4 w-4" />
                <span>Dashboard</span>
              </CommandItem>
              <CommandItem onSelect={() => runCommand(() => navigate(`/user/${profile?.username || user.email?.split('@')[0]}`))}>
                <User className="mr-2 h-4 w-4" />
                <span>My Profile</span>
              </CommandItem>
            </>
          )}
        </CommandGroup>

        <CommandSeparator />

        {/* Appearance & Settings */}
        <CommandGroup heading="Settings">
          <CommandItem onSelect={() => runCommand(toggleTheme)}>
            {theme === 'dark' ? (
              <Sun className="mr-2 h-4 w-4 text-yellow-500" />
            ) : (
              <Moon className="mr-2 h-4 w-4 text-blue-500" />
            )}
            <span>Toggle {theme === 'dark' ? 'Light' : 'Dark'} Mode</span>
            <CommandShortcut>Theme</CommandShortcut>
          </CommandItem>
          {user && (
            <CommandItem onSelect={() => runCommand(() => navigate('/dashboard'))}>
              <Settings className="mr-2 h-4 w-4" />
              <span>Settings</span>
            </CommandItem>
          )}
        </CommandGroup>

        <CommandSeparator />

        {/* Account */}
        <CommandGroup heading="Account">
          {!user ? (
            <CommandItem onSelect={() => runCommand(() => onSignIn?.())}>
              <LogIn className="mr-2 h-4 w-4" />
              <span>Sign In</span>
            </CommandItem>
          ) : (
            <>
              <CommandItem onSelect={() => runCommand(() => signOut())}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Sign Out</span>
              </CommandItem>
              {profile && (
                <CommandItem disabled>
                  <Flame className="mr-2 h-4 w-4 text-orange-400" />
                  <span className="text-muted-foreground">
                    {profile.karma_points} logs
                  </span>
                </CommandItem>
              )}
            </>
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

        {/* Utilities */}
        <CommandGroup heading="Utilities">
          <CommandItem onSelect={() => runCommand(handleCopyCurrentUrl)}>
            <Copy className="mr-2 h-4 w-4" />
            <span>Copy Current URL</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => onOpenSearch?.())}>
            <Search className="mr-2 h-4 w-4" />
            <span>Open Search</span>
            <CommandShortcut>/</CommandShortcut>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        {/* Help */}
        <CommandGroup heading="Keyboard Shortcuts">
          <CommandItem disabled className="cursor-default">
            <Palette className="mr-2 h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground text-sm">
              <kbd className="px-1.5 py-0.5 rounded bg-muted text-xs">⌘K</kbd> Command Palette
              <span className="mx-2">•</span>
              <kbd className="px-1.5 py-0.5 rounded bg-muted text-xs">/</kbd> Search
            </span>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
