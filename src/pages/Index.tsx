import { useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/Hero";
import { RoastFeed } from "@/components/RoastFeed";
import { Footer } from "@/components/Footer";
import { FloatingSubmitButton } from "@/components/FloatingSubmitButton";
import { CommandPalette } from "@/components/CommandPalette";
import { SubmitStackDialog } from "@/components/SubmitStackDialog";
import { AuthDialog } from "@/components/AuthDialog";
import { Leaderboards } from "@/components/Leaderboards";

export default function Index() {
  const [submitDialogOpen, setSubmitDialogOpen] = useState(false);
  const [authDialogOpen, setAuthDialogOpen] = useState(false);

  return (
    <div className="min-h-screen bg-canvas">
      <Navbar />
      
      {/* Hero Section */}
      <section className="container mx-auto px-4 pt-32 pb-16">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <Hero />
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
        onSignIn={() => setAuthDialogOpen(true)}
      />

      {/* Dialogs triggered by Command Palette */}
      <SubmitStackDialog open={submitDialogOpen} onOpenChange={setSubmitDialogOpen} />
      <AuthDialog open={authDialogOpen} onOpenChange={setAuthDialogOpen} />
    </div>
  );
}