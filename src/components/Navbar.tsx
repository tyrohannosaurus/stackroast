import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { AuthDialog } from "@/components/AuthDialog";
import { SearchTrigger } from "@/components/SearchTrigger";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  LogOut, 
  Menu, 
  X, 
  Home,
  TrendingUp,
  Info,
  Mail,
  LifeBuoy,
  Settings,
  Flame,
  Sun,
  Moon,
  Search,
  Sparkles,
  BookmarkCheck
} from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

interface NavbarProps {
  onSearchOpen?: () => void;
}

export function Navbar({ onSearchOpen }: NavbarProps) {
  const { user, profile, loading: authLoading, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"signup" | "signin">("signup");
  const [menuOpen, setMenuOpen] = useState(false);

  const closeMenu = () => setMenuOpen(false);

  // Debug logging
  if (user && !profile && !authLoading) {
    console.warn("User is logged in but profile is not loaded:", user.id);
  }

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between gap-4">
            {/* Logo */}
            <Link to="/" className="text-xl font-bold flex items-center gap-2">
              <img src="/logo.svg" alt="StackRoast" className="w-10 h-10" />
              <span className="text-foreground hidden sm:inline">StackRoast</span>
            </Link>

            {/* Right Side - Search Bar + User Profile + Theme Toggle + Karma + Hamburger */}
            <div className="flex items-center gap-2">
              {/* Search Bar - Desktop */}
              <div className="hidden md:block w-64">
                <SearchTrigger onClick={onSearchOpen || (() => {})} />
              </div>

              {/* Search Icon - Mobile */}
              <Button
                variant="ghost"
                size="sm"
                onClick={onSearchOpen}
                className="md:hidden w-9 h-9 p-0"
              >
                <Search className="w-5 h-5" />
              </Button>

              {/* User Profile Link (Desktop) */}
              {authLoading && user ? (
                // Loading skeleton when auth is loading but we know user exists
                <div className="hidden md:flex items-center gap-2 px-3 py-1.5">
                  <Skeleton className="w-7 h-7 rounded-full" />
                  <Skeleton className="hidden lg:block w-20 h-4" />
                </div>
              ) : user && profile ? (
                // Show profile when loaded
                <Link
                  to={`/user/${profile.username}`}
                  className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-md hover:bg-muted transition-colors"
                >
                  <Avatar className="w-7 h-7 ring-2 ring-orange-500/50">
                    <AvatarImage src={profile.avatar_url} />
                    <AvatarFallback className="bg-orange-500/20 text-orange-500 text-xs">
                      {profile.username[0]?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium hidden lg:inline">{profile.username}</span>
                </Link>
              ) : null}

              {/* Theme Toggle */}
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleTheme}
                className="w-9 h-9 p-0"
              >
                {theme === "dark" ? (
                  <Sun className="w-5 h-5 text-orange-400" />
                ) : (
                  <Moon className="w-5 h-5 text-orange-500" />
                )}
              </Button>

              {/* Karma Display */}
              {authLoading && user ? (
                // Loading skeleton for karma
                <Skeleton className="w-20 h-8 rounded-md" />
              ) : user && profile ? (
                // Show karma when loaded
                <div className="flex items-center gap-2 text-sm px-2 py-1 rounded-md bg-orange-500/10 border border-orange-500/20">
                  <Flame className="w-4 h-4 text-orange-500" />
                  <span className="text-orange-500 font-semibold">
                    {profile.karma_points ?? 0}
                  </span>
                  <span className="hidden sm:inline text-xs text-muted-foreground">logs</span>
                </div>
              ) : null}

              {/* Hamburger Menu Button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setMenuOpen(!menuOpen)}
              >
                {menuOpen ? (
                  <X className="w-5 h-5" />
                ) : (
                  <Menu className="w-5 h-5" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Slide-in Menu Panel */}
      {menuOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
            onClick={closeMenu}
          />

          {/* Menu Panel */}
          <div className="fixed top-0 right-0 h-full w-80 bg-card border-l border-border z-50 shadow-2xl">
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-border">
                <h3 className="font-semibold text-lg">Menu</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={closeMenu}
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>

              {/* Menu Content */}
              <div className="flex-1 overflow-y-auto p-4">
                {/* User Profile Section */}
                {authLoading && user ? (
                  // Loading skeleton in menu
                  <div className="mb-6 p-4 rounded-lg bg-gradient-to-br from-orange-500/10 via-red-500/10 to-orange-500/5 border border-orange-500/20">
                    <div className="flex items-center gap-3 mb-3">
                      <Skeleton className="w-10 h-10 rounded-full" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-6 w-20" />
                      </div>
                    </div>
                    <Skeleton className="h-9 w-full rounded-md" />
                  </div>
                ) : user && profile ? (
                  // Show profile when loaded
                  <div className="mb-6 p-4 rounded-lg bg-gradient-to-br from-orange-500/10 via-red-500/10 to-orange-500/5 border border-orange-500/20">
                    <div className="flex items-center gap-3 mb-3">
                      <Avatar className="ring-2 ring-orange-500/50">
                        <AvatarImage src={profile.avatar_url} />
                        <AvatarFallback className="bg-orange-500/20 text-orange-500">
                          {profile.username[0]?.toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="font-medium text-foreground">{profile.username}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-orange-500/20 border border-orange-500/30">
                            <Flame className="w-3.5 h-3.5 text-orange-500" />
                            <span className="text-sm font-semibold text-orange-500">
                              {profile.karma_points ?? 0}
                            </span>
                            <span className="text-xs text-orange-400/80 ml-0.5">logs</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <Link
                      to={`/user/${profile.username}`}
                      onClick={closeMenu}
                      className="block w-full text-center py-2 px-4 rounded-md bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 transition-colors text-sm font-medium text-white"
                    >
                      View Profile
                    </Link>
                  </div>
                ) : (
                  // Show auth buttons when not logged in
                  <div className="mb-6 space-y-2">
                    <Button
                      onClick={() => {
                        setAuthMode("signup");
                        setAuthOpen(true);
                        closeMenu();
                      }}
                      className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
                    >
                      Get Started
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setAuthMode("signin");
                        setAuthOpen(true);
                        closeMenu();
                      }}
                      className="w-full"
                    >
                      Sign In
                    </Button>
                  </div>
                )}

                {/* Menu Items */}
                <nav className="space-y-1">
                  <Link
                    to="/"
                    onClick={closeMenu}
                    className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-muted transition-colors"
                  >
                    <Home className="w-5 h-5 text-muted-foreground" />
                    <span>Home</span>
                  </Link>

                  <button
                    onClick={() => {
                      onSearchOpen?.();
                      closeMenu();
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-md hover:bg-muted transition-colors text-left"
                  >
                    <Search className="w-5 h-5 text-muted-foreground" />
                    <span>Search</span>
                    <kbd className="ml-auto text-xs text-muted-foreground">⌘K</kbd>
                  </button>

                  <Link
                    to="/kits"
                    onClick={closeMenu}
                    className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-muted transition-colors"
                  >
                    <Sparkles className="w-5 h-5 text-orange-500" />
                    <span>Stack Kits</span>
                    <span className="ml-auto text-xs text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded">New</span>
                  </Link>

                  <Link
                    to="/leaderboard"
                    onClick={closeMenu}
                    className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-muted transition-colors"
                  >
                    <TrendingUp className="w-5 h-5 text-muted-foreground" />
                    <span>Leaderboard</span>
                  </Link>

                  {user && (
                    <>
                      <Link
                        to="/saved"
                        onClick={closeMenu}
                        className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-muted transition-colors"
                      >
                        <BookmarkCheck className="w-5 h-5 text-violet-500" />
                        <span>Saved Stacks</span>
                      </Link>
                      <Link
                        to="/dashboard"
                        onClick={closeMenu}
                        className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-muted transition-colors"
                      >
                        <Settings className="w-5 h-5 text-muted-foreground" />
                        <span>Dashboard</span>
                      </Link>
                    </>
                  )}

                  <div className="my-4 border-t border-border" />

                  <Link
                    to="/about"
                    onClick={closeMenu}
                    className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-muted transition-colors"
                  >
                    <Info className="w-5 h-5 text-muted-foreground" />
                    <span>About</span>
                  </Link>

                  <Link
                    to="/contact"
                    onClick={closeMenu}
                    className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-muted transition-colors"
                  >
                    <Mail className="w-5 h-5 text-muted-foreground" />
                    <span>Contact Us</span>
                  </Link>

                  <Link
                    to="/support"
                    onClick={closeMenu}
                    className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-muted transition-colors"
                  >
                    <LifeBuoy className="w-5 h-5 text-muted-foreground" />
                    <span>Raise a Ticket</span>
                  </Link>
                </nav>
              </div>

              {/* Footer - Sign Out */}
              {user && !authLoading && (
                <div className="p-4 border-t border-border">
                  <Button
                    variant="ghost"
                    className="w-full justify-start gap-3 text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={() => {
                      signOut();
                      closeMenu();
                    }}
                  >
                    <LogOut className="w-5 h-5" />
                    Sign Out
                  </Button>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      <AuthDialog
        open={authOpen}
        onOpenChange={setAuthOpen}
        defaultMode={authMode}
      />
    </>
  );
}