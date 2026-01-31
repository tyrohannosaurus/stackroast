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
    <div className="space-y-10 max-w-4xl mx-auto">
      {/* Main Heading with Animation */}
      <h1 className="text-5xl md:text-6xl lg:text-7xl font-black text-center leading-[1.1] tracking-tight text-foreground">
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
          />
        </span>
      </h1>

      {/* Subtitle */}
      <p className="text-lg md:text-xl text-muted-foreground text-center max-w-2xl mx-auto leading-relaxed">
        Submit your tech stack. Get brutally honest AI-powered critiques. Join
        the community of developers who embrace the roast.
      </p>

      {/* CTA Buttons - Gumroad style */}
      <div className="flex flex-col items-center justify-center gap-5">
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Button 
            size="lg" 
            className="gap-2" 
            onClick={() => setDialogOpen(true)}
          >
            <Flame className="w-5 h-5" />
            Submit Your Stack
          </Button>
          
          {/* Search Input - Gumroad style */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search stacks..."
              className="gum-input w-64 pr-12"
              onClick={() => {
                const roastsSection = document.getElementById("roasts-feed");
                if (roastsSection) {
                  roastsSection.scrollIntoView({ behavior: "smooth", block: "start" });
                }
              }}
              readOnly
            />
            <button className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-muted rounded-full hover:bg-secondary transition-colors">
              <Eye className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
        </div>
        
        <div className="flex flex-wrap items-center justify-center gap-3 text-sm">
          <Button 
            variant="ghost" 
            className="gap-2"
            onClick={() => setRepoDialogOpen(true)}
          >
            <Github className="w-4 h-4" />
            Import from GitHub
          </Button>
          <Button 
            variant="ghost" 
            className="gap-2"
            onClick={() => setVisualRoastOpen(true)}
          >
            <Eye className="w-4 h-4" />
            Visual Analysis
          </Button>
          <Button 
            variant="ghost" 
            className="gap-2"
            onClick={() => setRoastFriendOpen(true)}
          >
            <Users className="w-4 h-4" />
            Roast a Friend
          </Button>
        </div>
      </div>

      {/* Tech Pills - Clean style */}
      <div className="flex flex-wrap items-center justify-center gap-2 pt-4">
        {["React", "Next.js", "TypeScript", "Python", "Node.js", "Tailwind", "Supabase", "Vercel"].map((tech) => (
          <span 
            key={tech}
            className="tech-pill"
          >
            {tech}
          </span>
        ))}
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
