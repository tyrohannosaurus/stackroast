import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { Navbar } from "@/components/Navbar";
import { GlobalSearch } from "@/components/GlobalSearch";
import { CommandPalette } from "@/components/CommandPalette";
import Index from "./pages/Index";
import Stack from "./pages/Stack";
import Dashboard from "./pages/Dashboard";
import NotFound from "./pages/NotFound";
import UserProfile from "@/pages/UserProfile";
import RoastMe from "./pages/RoastMe";
import StackKits from "./pages/StackKits";
import SavedStacks from "./pages/SavedStacks";
import Terms from "./pages/Terms";
import Leaderboard from "./pages/Leaderboard";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Support from "./pages/Support";
import Pricing from "./pages/Pricing";
import Blog from "./pages/Blog";
import Privacy from "./pages/Privacy";

const queryClient = new QueryClient();

function App() {
  const [searchOpen, setSearchOpen] = useState(false);

  // Debug: Log available routes in development
  if (import.meta.env.DEV) {
    console.log('Available routes:', [
      '/', '/about', '/contact', '/support', '/pricing', 
      '/blog', '/privacy', '/terms', '/leaderboard'
    ]);
  }

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <AuthProvider>
            <BrowserRouter>
              <ErrorBoundary>
                <Navbar onSearchOpen={() => setSearchOpen(true)} />
                <GlobalSearch open={searchOpen} onOpenChange={setSearchOpen} />
                <CommandPalette onOpenSearch={() => setSearchOpen(true)} />
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/user/:username" element={<UserProfile />} />
                  <Route path="/stack/:slug" element={<Stack />} />
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/roast-me/:code" element={<RoastMe />} />
                  <Route path="/kits" element={<StackKits />} />
                  <Route path="/saved" element={<SavedStacks />} />
                  <Route path="/leaderboard" element={<Leaderboard />} />
                  <Route path="/about" element={<About />} />
                  <Route path="/contact" element={<Contact />} />
                  <Route path="/support" element={<Support />} />
                  <Route path="/pricing" element={<Pricing />} />
                  <Route path="/blog" element={<Blog />} />
                  <Route path="/privacy" element={<Privacy />} />
                  <Route path="/terms" element={<Terms />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
                <Toaster />
              </ErrorBoundary>
            </BrowserRouter>
          </AuthProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;