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
    <div className="space-y-12">
      {/* Greeting Badge */}
      <div className="flex justify-center">
        <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent border-2 border-border shadow-brutal text-accent-foreground font-semibold">
          Hi there! 👋
        </span>
      </div>

      {/* Main Heading with Animation */}
      <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold text-center leading-tight tracking-tight text-foreground">
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

      {/* CTA Buttons */}
      <div className="flex flex-col items-center justify-center gap-6">
        <div className="flex flex-wrap items-center justify-center gap-4">
          <Button 
            size="lg" 
            className="gap-2" 
            onClick={() => setDialogOpen(true)}
          >
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
            variant="accent" 
            className="gap-2"
            onClick={() => setVisualRoastOpen(true)}
          >
            <Eye className="w-5 h-5" />
            Visual Analysis
          </Button>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-4">
          <Button 
            size="lg" 
            variant="ghost" 
            className="gap-2 text-primary"
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

      {/* Tech Pills - Like in the reference */}
      <div className="flex flex-wrap items-center justify-center gap-3 pt-8">
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
