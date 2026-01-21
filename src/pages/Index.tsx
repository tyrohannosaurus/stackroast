import { useState } from "react";
import { Hero } from "@/components/Hero";
import { RoastFeed } from "@/components/RoastFeed";
import { Footer } from "@/components/Footer";
import { FloatingSubmitButton } from "@/components/FloatingSubmitButton";
import { CommandPalette } from "@/components/CommandPalette";
import { SubmitStackDialog } from "@/components/SubmitStackDialog";
import { AuthDialog } from "@/components/AuthDialog";
import { Leaderboards } from "@/components/Leaderboards";
import { RepoRoastDialog } from "@/components/RepoRoastDialog";
import { VisualRoastDialog } from "@/components/VisualRoastDialog";
import { RoastFriendDialog } from "@/components/RoastFriendDialog";
import { GlobalSearch } from "@/components/GlobalSearch";
import { FeaturedStacks } from "@/components/FeaturedStacks";
import { StackKitCard } from "@/components/StackKitCard";
import { getFeaturedKits, enhanceKitsWithCommissions } from "@/data/stackKits";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sparkles, ArrowRight } from "lucide-react";

export default function Index() {
  const [submitDialogOpen, setSubmitDialogOpen] = useState(false);
  const [authDialogOpen, setAuthDialogOpen] = useState(false);
  const [repoDialogOpen, setRepoDialogOpen] = useState(false);
  const [visualRoastOpen, setVisualRoastOpen] = useState(false);
  const [roastFriendOpen, setRoastFriendOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <div className="min-h-screen bg-canvas">
      
      
      {/* Hero Section */}
      <section className="container mx-auto px-4 pt-32 pb-16">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <Hero />
        </div>
      </section>

      {/* Featured Stacks Section */}
      <section className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          <FeaturedStacks limit={3} showCarousel={true} />
        </div>
      </section>

      {/* Stack Kits Section */}
      <section className="container mx-auto px-4 py-12">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-3xl font-bold flex items-center gap-3 mb-2">
                <Sparkles className="w-8 h-8 text-violet-500" />
                Browse Stack Kits
              </h2>
              <p className="text-muted-foreground">
                Curated tech stack templates for every use case. Clone and customize.
              </p>
            </div>
            <Link to="/kits">
              <Button variant="outline" className="gap-2">
                View All Kits
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {enhanceKitsWithCommissions(getFeaturedKits()).slice(0, 3).map((kit) => (
              <StackKitCard
                key={kit.id}
                kit={kit}
                onClick={() => {
                  // Navigate to kits page with kit selected
                  window.location.href = `/kits?kit=${kit.id}`;
                }}
                featured
              />
            ))}
          </div>
        </div>
      </section>

      {/* Main Content - Feed with Sidebar */}
      <section id="roasts-feed" className="container mx-auto px-4 py-12">
        <div className="flex gap-8 max-w-7xl mx-auto">
          {/* Main Feed */}
          <div className="flex-1 max-w-4xl">
            <RoastFeed />
          </div>

          {/* Sidebar - Leaderboards */}
          <aside className="hidden lg:block w-80 flex-shrink-0">
            <div className="sticky top-24">
              <Leaderboards />
            </div>
          </aside>
        </div>
      </section>

      {/* Footer */}
      <Footer />

      {/* Floating Submit Button */}
      <FloatingSubmitButton />

      {/* Command Palette (Cmd+K) */}
      <CommandPalette 
        onSubmitStack={() => setSubmitDialogOpen(true)}
        onImportGithub={() => setRepoDialogOpen(true)}
        onVisualRoast={() => setVisualRoastOpen(true)}
        onRoastFriend={() => setRoastFriendOpen(true)}
        onSignIn={() => setAuthDialogOpen(true)}
        onOpenSearch={() => setSearchOpen(true)}
      />

      {/* Global Search (from Command Palette) */}
      <GlobalSearch open={searchOpen} onOpenChange={setSearchOpen} />

      {/* Dialogs triggered by Command Palette */}
      <SubmitStackDialog open={submitDialogOpen} onOpenChange={setSubmitDialogOpen} />
      <AuthDialog open={authDialogOpen} onOpenChange={setAuthDialogOpen} />
      <RepoRoastDialog open={repoDialogOpen} onOpenChange={setRepoDialogOpen} />
      <VisualRoastDialog open={visualRoastOpen} onOpenChange={setVisualRoastOpen} />
      <RoastFriendDialog open={roastFriendOpen} onOpenChange={setRoastFriendOpen} />
    </div>
  );
}