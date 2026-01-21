import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { AuthDialog } from "@/components/AuthDialog";
import { 
  User, 
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
  Moon
} from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

export function Navbar() {
  const { user, profile, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [authOpen, setAuthOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const closeMenu = () => setMenuOpen(false);

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <Link to="/" className="text-xl font-bold flex items-center gap-2">
              <img src="/logo.svg" alt="StackRoast" className="w-10 h-10" />
              <span className="text-foreground">StackRoast</span>
            </Link>

            {/* Right Side - Theme Toggle + Logs + Hamburger */}
            <div className="flex items-center gap-2">
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

              {/* Logs Display (Desktop) */}
              {user && profile && (
                <div className="hidden md:flex items-center gap-2 text-sm">
                  <span className="text-orange-400 font-semibold">
                    {profile.karma_points} logs
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
          <div className="fixed top-0 right-0 h-full w-80 bg-zinc-950 border-l border-zinc-800 z-50 shadow-2xl">
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-zinc-800">
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
                  <div className="mb-6 p-4 rounded-lg bg-zinc-900 border border-zinc-800">
                    <div className="flex items-center gap-3 mb-3">
                      <Avatar>
                        <AvatarImage src={profile.avatar_url} />
                        <AvatarFallback>
                          {profile.username[0]?.toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{profile.username}</p>
                        <p className="text-sm text-orange-400">
                          {profile.karma_points} logs
                        </p>
                      </div>
                    </div>
                    <Link
                      to="/dashboard"
                      onClick={closeMenu}
                      className="block w-full text-center py-2 px-4 rounded-md bg-orange-500 hover:bg-orange-600 transition-colors text-sm font-medium"
                    >
                      View Dashboard
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
                    className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-zinc-900 transition-colors"
                  >
                    <Home className="w-5 h-5 text-muted-foreground" />
                    <span>Home</span>
                  </Link>

                  <Link
                    to="/leaderboard"
                    onClick={closeMenu}
                    className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-zinc-900 transition-colors"
                  >
                    <TrendingUp className="w-5 h-5 text-muted-foreground" />
                    <span>Leaderboard</span>
                  </Link>

                  {user && (
                    <Link
                      to="/dashboard/settings"
                      onClick={closeMenu}
                      className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-zinc-900 transition-colors"
                    >
                      <Settings className="w-5 h-5 text-muted-foreground" />
                      <span>Settings</span>
                    </Link>
                  )}

                  <div className="my-4 border-t border-zinc-800" />

                  <Link
                    to="/about"
                    onClick={closeMenu}
                    className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-zinc-900 transition-colors"
                  >
                    <Info className="w-5 h-5 text-muted-foreground" />
                    <span>About</span>
                  </Link>

                  <Link
                    to="/contact"
                    onClick={closeMenu}
                    className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-zinc-900 transition-colors"
                  >
                    <Mail className="w-5 h-5 text-muted-foreground" />
                    <span>Contact Us</span>
                  </Link>

                  <Link
                    to="/support"
                    onClick={closeMenu}
                    className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-zinc-900 transition-colors"
                  >
                    <LifeBuoy className="w-5 h-5 text-muted-foreground" />
                    <span>Raise a Ticket</span>
                  </Link>
                </nav>
              </div>

              {/* Footer - Sign Out */}
              {user && (
                <div className="p-4 border-t border-zinc-800">
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
