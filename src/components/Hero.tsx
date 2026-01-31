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
    <div className="space-y-8 max-w-3xl mx-auto text-center">
      {/* Main Heading */}
      <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight tracking-tight text-foreground">
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
      <p className="text-lg text-muted-foreground max-w-xl mx-auto">
        Submit your tech stack. Get brutally honest AI-powered critiques. 
        Join the community of developers who embrace the roast.
      </p>

      {/* CTA Buttons */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
        <Button 
          size="lg" 
          className="gap-2 w-full sm:w-auto" 
          onClick={() => setDialogOpen(true)}
        >
          <Flame className="w-4 h-4" />
          Submit Your Stack
        </Button>
        <Button 
          size="lg" 
          variant="outline"
          className="gap-2 w-full sm:w-auto"
          onClick={() => setRepoDialogOpen(true)}
        >
          <Github className="w-4 h-4" />
          Import from GitHub
        </Button>
      </div>
      
      {/* Secondary Actions */}
      <div className="flex flex-wrap items-center justify-center gap-2 text-sm">
        <Button 
          variant="ghost" 
          size="sm"
          className="gap-1.5"
          onClick={() => setVisualRoastOpen(true)}
        >
          <Eye className="w-4 h-4" />
          Visual Analysis
        </Button>
        <Button 
          variant="ghost" 
          size="sm"
          className="gap-1.5"
          onClick={() => setRoastFriendOpen(true)}
        >
          <Users className="w-4 h-4" />
          Roast a Friend
        </Button>
        <Link to="/kits">
          <Button variant="ghost" size="sm" className="gap-1.5">
            <Sparkles className="w-4 h-4" />
            Stack Kits
          </Button>
        </Link>
      </div>

      {/* Tech Tags */}
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
