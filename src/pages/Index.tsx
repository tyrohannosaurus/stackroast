import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Hero } from "@/components/Hero";
import { RoastFeed } from "@/components/RoastFeed";
import { Footer } from "@/components/Footer";
import { FloatingSubmitButton } from "@/components/FloatingSubmitButton";
import { SubmitStackDialog } from "@/components/SubmitStackDialog";
import { AuthDialog } from "@/components/AuthDialog";
import { Leaderboards } from "@/components/Leaderboards";
import { RepoRoastDialog } from "@/components/RepoRoastDialog";
import { VisualRoastDialog } from "@/components/VisualRoastDialog";
import { RoastFriendDialog } from "@/components/RoastFriendDialog";
import { FeaturedStacks } from "@/components/FeaturedStacks";
import { StackKitCard } from "@/components/StackKitCard";
import { getFeaturedKitsWithStats } from "@/data/stackKits";
import { supabase } from "@/lib/supabase";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sparkles, ArrowRight } from "lucide-react";
import type { StackKitWithStats } from "@/types/database";
import { stringToUUID } from "@/lib/uuid";

export default function Index() {
  const navigate = useNavigate();
  const [submitDialogOpen, setSubmitDialogOpen] = useState(false);
  const [authDialogOpen, setAuthDialogOpen] = useState(false);
  const [repoDialogOpen, setRepoDialogOpen] = useState(false);
  const [visualRoastOpen, setVisualRoastOpen] = useState(false);
  const [roastFriendOpen, setRoastFriendOpen] = useState(false);
  const [featuredKits, setFeaturedKits] = useState<StackKitWithStats[]>([]);

  // Load featured kits with real stats from database
  useEffect(() => {
    async function loadFeaturedKits() {
      const hardcodedKits = getFeaturedKitsWithStats().slice(0, 3);
      
      // Generate UUIDs for hardcoded kits (same as in StackKitDetailDialog)
      const kitUUIDs = hardcodedKits.map(kit => stringToUUID(`hardcoded-kit-${kit.slug}`));
      
      // Fetch kits from database by ID (using generated UUIDs)
      const { data: dbKits } = await supabase
        .from('stack_kits')
        .select('id, slug, upvote_count, comment_count, view_count, clone_count')
        .in('id', kitUUIDs);

      // Create a map of slug -> database stats
      const dbStatsMap = new Map(
        (dbKits || []).map(kit => [kit.slug, kit])
      );

      // Merge hardcoded kits with database stats
      const enrichedKits = hardcodedKits.map(kit => {
        const dbStats = dbStatsMap.get(kit.slug);
        if (dbStats) {
          // Kit exists in database, use real stats and database ID
          return {
            ...kit,
            id: dbStats.id, // Use database ID (UUID)
            upvote_count: dbStats.upvote_count,
            comment_count: dbStats.comment_count,
            view_count: dbStats.view_count,
            clone_count: dbStats.clone_count,
          };
        }
        // Kit doesn't exist in database yet, use default stats
        return kit;
      });

      setFeaturedKits(enrichedKits);
    }

    loadFeaturedKits();
  }, []);

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
            {featuredKits.map((kit) => (
              <StackKitCard
                key={kit.id}
                kit={kit}
                onClick={() => {
                  // Navigate to kits page with kit selected using React Router
                  navigate(`/kits?kit=${kit.id}`);
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

      {/* Dialogs */}
      <SubmitStackDialog open={submitDialogOpen} onOpenChange={setSubmitDialogOpen} />
      <AuthDialog open={authDialogOpen} onOpenChange={setAuthDialogOpen} />
      <RepoRoastDialog open={repoDialogOpen} onOpenChange={setRepoDialogOpen} />
      <VisualRoastDialog open={visualRoastOpen} onOpenChange={setVisualRoastOpen} />
      <RoastFriendDialog open={roastFriendOpen} onOpenChange={setRoastFriendOpen} />
    </div>
  );
}