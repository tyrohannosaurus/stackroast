import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { GlobalSearch } from "@/components/GlobalSearch";
import { Navbar } from "@/components/Navbar";
import Index from "./pages/Index";
import Stack from "./pages/Stack";
import Dashboard from "./pages/Dashboard";
import NotFound from "./pages/NotFound";
import UserProfile from "@/pages/UserProfile";
import RoastMe from "./pages/RoastMe";
import StackKits from "./pages/StackKits";

const queryClient = new QueryClient();

function App() {
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <BrowserRouter>
            <Navbar onSearchOpen={() => setSearchOpen(true)} />
            <GlobalSearch open={searchOpen} onOpenChange={setSearchOpen} />
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/user/:username" element={<UserProfile />} />
              <Route path="/stack/:slug" element={<Stack />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/roast-me/:code" element={<RoastMe />} />
              <Route path="/kits" element={<StackKits />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
            <Toaster />
          </BrowserRouter>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;