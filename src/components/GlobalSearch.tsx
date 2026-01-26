import { useState, useEffect, useCallback } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Search, Flame, User, Package } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { LoadingFire } from "@/components/LoadingFire";
import { useNavigate } from "react-router-dom";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

interface SearchResult {
  id: string;
  type: 'stack' | 'user' | 'tool';
  title: string;
  subtitle?: string;
  url: string;
  icon?: string;
  metadata?: any;
}

interface GlobalSearchProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function GlobalSearch({ open: controlledOpen, onOpenChange }: GlobalSearchProps) {
  const navigate = useNavigate();
  const [internalOpen, setInternalOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Use controlled or internal state
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = onOpenChange || setInternalOpen;

  // Listen for CMD+K / CTRL+K
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [setOpen]);

  // Reset when dialog closes
  useEffect(() => {
    if (!open) {
      setQuery("");
      setResults([]);
      setSelectedIndex(0);
    }
  }, [open]);

  // Search function
  const performSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }

    setLoading(true);
    const searchResults: SearchResult[] = [];

    try {
      // Search Stacks
      const { data: stacks } = await supabase
        .from("stacks")
        .select("id, name, slug, profile_id, profiles(username)")
        .ilike("name", `%${searchQuery}%`)
        .eq("is_public", true)
        .limit(5);

      if (stacks) {
        stacks.forEach((stack: any) => {
          searchResults.push({
            id: stack.id,
            type: 'stack',
            title: stack.name,
            subtitle: `by @${stack.profiles?.username || 'anonymous'}`,
            url: `/stack/${stack.slug}`,
            icon: '🔥',
          });
        });
      }

      // Search Users
      const { data: users } = await supabase
        .from("profiles")
        .select("id, username, karma_points, avatar_url")
        .ilike("username", `%${searchQuery}%`)
        .limit(5);

      if (users) {
        users.forEach((user) => {
          searchResults.push({
            id: user.id,
            type: 'user',
            title: `@${user.username}`,
            subtitle: `${user.karma_points} karma`,
            url: `/user/${user.username}`,
            icon: user.avatar_url,
            metadata: user,
          });
        });
      }

      // Tools are searchable via the Submit Stack dialog
      // Removed from global search to avoid 404 (no /tool/:slug route exists)

      setResults(searchResults);
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      performSearch(query);
    }, 300);

    return () => clearTimeout(timer);
  }, [query, performSearch]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!open) return;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % results.length);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + results.length) % results.length);
      } else if (e.key === "Enter" && results[selectedIndex]) {
        e.preventDefault();
        handleSelect(results[selectedIndex]);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, results, selectedIndex]);

  const handleSelect = (result: SearchResult) => {
    setOpen(false);
    navigate(result.url);
  };

  const getIcon = (result: SearchResult) => {
    if (result.type === 'user') {
      return (
        <Avatar className="w-8 h-8">
          <AvatarImage src={result.icon} alt={result.title} />
          <AvatarFallback>{result.title[1]?.toUpperCase()}</AvatarFallback>
        </Avatar>
      );
    }

    if (result.type === 'tool' && result.icon) {
      return <img src={result.icon} alt={result.title} className="w-8 h-8 rounded" />;
    }

    const icons = {
      stack: <Flame className="w-8 h-8 text-orange-500" />,
      user: <User className="w-8 h-8 text-blue-500" />,
      tool: <Package className="w-8 h-8 text-purple-500" />,
    };

    return icons[result.type];
  };

  const groupedResults = results.reduce((acc, result) => {
    if (!acc[result.type]) {
      acc[result.type] = [];
    }
    acc[result.type].push(result);
    return acc;
  }, {} as Record<string, SearchResult[]>);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-2xl p-0 gap-0 overflow-hidden" hideCloseButton>
        {/* Search Input */}
        <div className="flex items-center border-b border-border px-4 py-3">
          <Search className="w-5 h-5 text-muted-foreground mr-3" />
          <Input
            placeholder="Search stacks, users, tools..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-base"
            autoFocus
          />
          <kbd className="hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border border-border bg-muted px-1.5 font-mono text-xs font-medium text-muted-foreground ml-3">
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div className="max-h-[400px] overflow-y-auto p-2">
          {loading && (
            <div className="flex items-center justify-center py-8">
              <LoadingFire size="sm" />
            </div>
          )}

          {!loading && query && results.length === 0 && (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <Search className="w-12 h-12 mb-2 opacity-50" />
              <p className="text-sm">No results found for "{query}"</p>
            </div>
          )}

          {!loading && results.length > 0 && (
            <div className="space-y-4">
              {Object.entries(groupedResults).map(([type, items]) => (
                <div key={type}>
                  <div className="flex items-center gap-2 px-2 py-1 text-xs font-medium text-muted-foreground uppercase">
                    {type === 'stack' && <Flame className="w-3 h-3" />}
                    {type === 'user' && <User className="w-3 h-3" />}
                    {type === 'tool' && <Package className="w-3 h-3" />}
                    {type}s
                  </div>
                  <div className="space-y-1">
                    {items.map((result) => {
                      const globalIndex = results.indexOf(result);
                      return (
                        <button
                          key={result.id}
                          onClick={() => handleSelect(result)}
                          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                            globalIndex === selectedIndex
                              ? 'bg-orange-500/20 text-foreground'
                              : 'hover:bg-muted text-foreground'
                          }`}
                        >
                          <div className="flex-shrink-0">
                            {getIcon(result)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{result.title}</p>
                            {result.subtitle && (
                              <p className="text-sm text-muted-foreground truncate">
                                {result.subtitle}
                              </p>
                            )}
                          </div>
                          {globalIndex === selectedIndex && (
                            <kbd className="hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border border-border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
                              ↵
                            </kbd>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

          {!query && (
            <div className="py-8 px-4">
              <p className="text-sm text-muted-foreground text-center mb-4">
                Quick tips
              </p>
              <div className="space-y-2 text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                  <kbd className="px-2 py-1 rounded bg-muted border border-border">↑↓</kbd>
                  <span>Navigate</span>
                </div>
                <div className="flex items-center gap-2">
                  <kbd className="px-2 py-1 rounded bg-muted border border-border">↵</kbd>
                  <span>Select</span>
                </div>
                <div className="flex items-center gap-2">
                  <kbd className="px-2 py-1 rounded bg-muted border border-border">ESC</kbd>
                  <span>Close</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}