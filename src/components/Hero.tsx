import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Flame, Github, Users, Eye, Sparkles } from "lucide-react";
import { TypeAnimation } from "react-type-animation";
import { SubmitStackDialog } from "@/components/SubmitStackDialog";
import { RepoRoastDialog } from "@/components/RepoRoastDialog";
import { RoastFriendDialog } from "@/components/RoastFriendDialog";
import { VisualRoastDialog } from "@/components/VisualRoastDialog";

export function Hero() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [repoDialogOpen, setRepoDialogOpen] = useState(false);
  const [roastFriendOpen, setRoastFriendOpen] = useState(false);
  const [visualRoastOpen, setVisualRoastOpen] = useState(false);

  const scrollToRoasts = () => {
    const roastsSection = document.getElementById("roasts-feed");
    if (roastsSection) {
      roastsSection.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <div className="space-y-8">
      {/* Main Heading with Animation */}
      <h1 className="text-6xl md:text-7xl font-bold text-center leading-tight">
        Roast my{" "}
        <span className="hero-typewriter">
          <TypeAnimation
            sequence={[
              "Next.js Stack",
              2000,
              "React Setup",
              2000,
              "Architecture",
              2000,
              "Python Stack",
              2000,
              "SaaS Tools",
              2000,
              "Screenshot",
              2000,
            ]}
            wrapper="span"
            speed={50}
            repeat={Infinity}
            cursor={true}
            className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-500"
          />
        </span>
      </h1>

      {/* Subtitle */}
      <p className="text-xl text-muted-foreground text-center max-w-2xl mx-auto">
        Submit your tech stack. Get brutally honest AI-powered critiques. Join
        the community of developers who embrace the roast.
      </p>

      {/* CTA Buttons */}
      <div className="flex flex-col items-center justify-center gap-4">
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Button size="lg" className="gap-2" onClick={() => setDialogOpen(true)}>
            <Flame className="w-5 h-5" />
            Submit Your Stack
          </Button>
          <Button 
            size="lg" 
            variant="outline" 
            className="gap-2"
            onClick={() => setRepoDialogOpen(true)}
          >
            <Github className="w-5 h-5" />
            Import from GitHub
          </Button>
          <Button 
            size="lg" 
            variant="outline" 
            className="gap-2 border-purple-500/50 text-purple-400 hover:bg-purple-500/10"
            onClick={() => setVisualRoastOpen(true)}
          >
            <Eye className="w-5 h-5" />
            Visual Analysis
          </Button>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Button 
            size="lg" 
            variant="ghost" 
            className="gap-2 text-orange-400 hover:text-orange-300"
            onClick={() => setRoastFriendOpen(true)}
          >
            <Users className="w-5 h-5" />
            Roast a Friend
          </Button>
          <Link to="/kits">
            <Button
              size="lg"
              variant="ghost"
              className="gap-2"
            >
              <Sparkles className="w-5 h-5" />
              Browse Stack Kits
            </Button>
          </Link>
          <Button
            size="lg"
            variant="ghost"
            onClick={scrollToRoasts}
            className="gap-2"
          >
            View Recent Roasts
            <span className="ml-1">→</span>
          </Button>
        </div>
      </div>

      {/* Submit Stack Dialog */}
      <SubmitStackDialog open={dialogOpen} onOpenChange={setDialogOpen} />
      
      {/* GitHub Import Dialog */}
      <RepoRoastDialog open={repoDialogOpen} onOpenChange={setRepoDialogOpen} />

      {/* Roast a Friend Dialog */}
      <RoastFriendDialog open={roastFriendOpen} onOpenChange={setRoastFriendOpen} />

      {/* Visual Analysis Dialog */}
      <VisualRoastDialog open={visualRoastOpen} onOpenChange={setVisualRoastOpen} />
    </div>
  );
}