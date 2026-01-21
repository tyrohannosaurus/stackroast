import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { AuthDialog } from "@/components/AuthDialog";
import { SearchTrigger } from "@/components/SearchTrigger";
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
  Sparkles
} from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

interface NavbarProps {
  onSearchOpen?: () => void;
}

export function Navbar({ onSearchOpen }: NavbarProps) {
  const { user, profile, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [authOpen, setAuthOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const closeMenu = () => setMenuOpen(false);

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

            {/* Right Side - Search Bar + Theme Toggle + Karma + Hamburger */}
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

              {/* Karma Display (Desktop) */}
              {user && profile && (
                <div className="hidden md:flex items-center gap-2 text-sm">
                  <Flame className="w-4 h-4 text-orange-500" />
                  <span className="text-orange-500 font-semibold">
                    {profile.karma_points}
                  </span>
                </div>
              )}

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
                {user && profile ? (
                  <div className="mb-6 p-4 rounded-lg bg-muted border border-border">
                    <div className="flex items-center gap-3 mb-3">
                      <Avatar>
                        <AvatarImage src={profile.avatar_url} />
                        <AvatarFallback>
                          {profile.username[0]?.toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{profile.username}</p>
                        <p className="text-sm text-orange-500 flex items-center gap-1">
                          <Flame className="w-3 h-3" />
                          {profile.karma_points} karma
                        </p>
                      </div>
                    </div>
                    <Link
                      to={`/user/${profile.username}`}
                      onClick={closeMenu}
                      className="block w-full text-center py-2 px-4 rounded-md bg-orange-500 hover:bg-orange-600 transition-colors text-sm font-medium"
                    >
                      View Profile
                    </Link>
                  </div>
                ) : (
                  <div className="mb-6">
                    <Button
                      onClick={() => {
                        setAuthOpen(true);
                        closeMenu();
                      }}
                      className="w-full"
                    >
                      Get Started
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
                    <Link
                      to="/dashboard"
                      onClick={closeMenu}
                      className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-muted transition-colors"
                    >
                      <Settings className="w-5 h-5 text-muted-foreground" />
                      <span>Dashboard</span>
                    </Link>
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
              {user && (
                <div className="p-4 border-t border-border">
                  <Button
                    variant="ghost"
                    className="w-full justify-start gap-3"
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
        defaultMode="signup"
      />
    </>
  );
}