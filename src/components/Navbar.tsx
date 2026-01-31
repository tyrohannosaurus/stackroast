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
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background border-b border-border/10">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between gap-4">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">SR</span>
              </div>
              <span className="text-foreground font-bold text-lg hidden sm:inline tracking-tight">StackRoast</span>
            </Link>

            {/* Center Nav Links - Desktop */}
            <div className="hidden md:flex items-center gap-1">
              <Link to="/">
                <Button variant="ghost" size="sm" className="font-medium">Discover</Button>
              </Link>
              <Link to="/about">
                <Button variant="ghost" size="sm" className="font-medium">Blog</Button>
              </Link>
              <Link to="/leaderboard">
                <Button variant="ghost" size="sm" className="font-medium">Pricing</Button>
              </Link>
              <Link to="/kits">
                <Button variant="ghost" size="sm" className="font-medium">Features</Button>
              </Link>
              <Link to="/about">
                <Button variant="outline" size="sm" className="font-medium">About</Button>
              </Link>
            </div>

            {/* Right Side */}
            <div className="flex items-center gap-2">
              {/* Theme Toggle */}
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleTheme}
              >
                {theme === "dark" ? (
                  <Sun className="w-5 h-5" />
                ) : (
                  <Moon className="w-5 h-5" />
                )}
              </Button>

              {/* Login / CTA */}
              {!user && (
                <>
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setAuthMode("signin");
                      setAuthOpen(true);
                    }}
                    className="hidden sm:flex"
                  >
                    Log in
                  </Button>
                  <Button
                    onClick={() => {
                      setAuthMode("signup");
                      setAuthOpen(true);
                    }}
                    className="hidden sm:flex"
                  >
                    Start roasting
                  </Button>
                </>
              )}

              {/* User Avatar / Karma */}
              {authLoading && user ? (
                <Skeleton className="w-9 h-9 rounded-full" />
              ) : user && profile ? (
                <Link to={`/user/${profile.username}`} className="flex items-center gap-2">
                  <Avatar className="w-9 h-9">
                    <AvatarImage src={profile.avatar_url} />
                    <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                      {profile.username[0]?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </Link>
              ) : null}

              {/* Hamburger Menu Button */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setMenuOpen(!menuOpen)}
                className="md:hidden"
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
            className="fixed inset-0 bg-foreground/10 backdrop-blur-sm z-40"
            onClick={closeMenu}
          />

          {/* Menu Panel */}
          <div className="fixed top-0 right-0 h-full w-80 bg-card z-50 border-l border-border/10 shadow-elevated">
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-border/10">
                <h3 className="font-bold text-lg">Menu</h3>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={closeMenu}
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>

              {/* Menu Content */}
              <div className="flex-1 overflow-y-auto p-4">
                {/* User Profile Section */}
                {authLoading && user ? (
                  <div className="mb-6 p-4 rounded-2xl bg-muted border-2 border-border">
                    <div className="flex items-center gap-3 mb-3">
                      <Skeleton className="w-10 h-10 rounded-full" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-6 w-20" />
                      </div>
                    </div>
                    <Skeleton className="h-9 w-full rounded-full" />
                  </div>
                ) : user && profile ? (
                  <div className="mb-6 p-4 rounded-2xl bg-muted border-2 border-border">
                    <div className="flex items-center gap-3 mb-3">
                      <Avatar className="ring-2 ring-border">
                        <AvatarImage src={profile.avatar_url} />
                        <AvatarFallback className="bg-primary text-primary-foreground">
                          {profile.username[0]?.toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="font-bold text-foreground">{profile.username}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-card border-2 border-border">
                            <Flame className="w-3.5 h-3.5 text-coral" />
                            <span className="text-sm font-semibold">
                              {profile.karma_points ?? 0}
                            </span>
                            <span className="text-xs text-muted-foreground ml-0.5">logs</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <Link
                      to={`/user/${profile.username}`}
                      onClick={closeMenu}
                      className="block w-full text-center py-2.5 px-4 rounded-full bg-primary text-primary-foreground border-2 border-border shadow-brutal hover:shadow-brutal-sm hover:translate-x-0.5 hover:translate-y-0.5 transition-all text-sm font-semibold"
                    >
                      View Profile
                    </Link>
                  </div>
                ) : (
                  <div className="mb-6 space-y-2">
                    <Button
                      onClick={() => {
                        setAuthMode("signup");
                        setAuthOpen(true);
                        closeMenu();
                      }}
                      className="w-full"
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
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-muted transition-colors font-medium"
                  >
                    <Home className="w-5 h-5 text-muted-foreground" />
                    <span>Home</span>
                  </Link>

                  <button
                    onClick={() => {
                      onSearchOpen?.();
                      closeMenu();
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-muted transition-colors text-left font-medium"
                  >
                    <Search className="w-5 h-5 text-muted-foreground" />
                    <span>Search</span>
                    <kbd className="ml-auto text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded border border-border">⌘K</kbd>
                  </button>

                  <Link
                    to="/kits"
                    onClick={closeMenu}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-muted transition-colors font-medium"
                  >
                    <Sparkles className="w-5 h-5 text-primary" />
                    <span>Stack Kits</span>
                    <span className="ml-auto text-xs text-primary bg-primary/10 px-2 py-0.5 rounded-full border border-primary/20">New</span>
                  </Link>

                  <Link
                    to="/leaderboard"
                    onClick={closeMenu}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-muted transition-colors font-medium"
                  >
                    <TrendingUp className="w-5 h-5 text-muted-foreground" />
                    <span>Leaderboard</span>
                  </Link>

                  {user && (
                    <>
                      <Link
                        to="/saved"
                        onClick={closeMenu}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-muted transition-colors font-medium"
                      >
                        <BookmarkCheck className="w-5 h-5 text-lavender" />
                        <span>Saved Stacks</span>
                      </Link>
                      <Link
                        to="/dashboard"
                        onClick={closeMenu}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-muted transition-colors font-medium"
                      >
                        <Settings className="w-5 h-5 text-muted-foreground" />
                        <span>Dashboard</span>
                      </Link>
                    </>
                  )}

                  <div className="my-4 border-t-2 border-border" />

                  <Link
                    to="/about"
                    onClick={closeMenu}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-muted transition-colors font-medium"
                  >
                    <Info className="w-5 h-5 text-muted-foreground" />
                    <span>About</span>
                  </Link>

                  <Link
                    to="/contact"
                    onClick={closeMenu}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-muted transition-colors font-medium"
                  >
                    <Mail className="w-5 h-5 text-muted-foreground" />
                    <span>Contact Us</span>
                  </Link>

                  <Link
                    to="/support"
                    onClick={closeMenu}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-muted transition-colors font-medium"
                  >
                    <LifeBuoy className="w-5 h-5 text-muted-foreground" />
                    <span>Raise a Ticket</span>
                  </Link>
                </nav>
              </div>

              {/* Footer - Sign Out */}
              {user && !authLoading && (
                <div className="p-4 border-t-2 border-border">
                  <Button
                    variant="ghost"
                    className="w-full justify-start gap-3 text-destructive hover:text-destructive hover:bg-destructive/10 rounded-xl"
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
