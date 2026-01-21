import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Flame, Github } from "lucide-react";
import { TypeAnimation } from "react-type-animation";
import { SubmitStackDialog } from "@/components/SubmitStackDialog";
import { RepoRoastDialog } from "@/components/RepoRoastDialog";

export function Hero() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [repoDialogOpen, setRepoDialogOpen] = useState(false);

  const scrollToRoasts = () => {
    const roastsSection = document.getElementById("roasts-feed");
    if (roastsSection) {
      roastsSection.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <div className="space-y-8">
      {/* Badge */}
      <div className="flex justify-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-500/10 border border-orange-500/20">
          <Flame className="w-4 h-4 text-orange-400" />
          <span className="text-sm text-orange-300">Over 10,000 stacks roasted</span>
        </div>
      </div>

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
              "Python Stack",
              2000,
              "SaaS Tools",
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
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
        <div className="flex items-center gap-3">
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
        </div>
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

      {/* Stats */}
      <div className="grid grid-cols-3 gap-8 max-w-2xl mx-auto pt-8">
        <div className="text-center">
          <div className="text-3xl font-bold text-foreground">10K+</div>
          <div className="text-sm text-muted-foreground">Stacks Roasted</div>
        </div>
        <div className="text-center">
          <div className="text-3xl font-bold text-foreground">98%</div>
          <div className="text-sm text-muted-foreground">Burn Rate</div>
        </div>
        <div className="text-center">
          <div className="text-3xl font-bold text-foreground">4.2M</div>
          <div className="text-sm text-muted-foreground">Laughs Generated</div>
        </div>
      </div>

      {/* Submit Stack Dialog */}
      <SubmitStackDialog open={dialogOpen} onOpenChange={setDialogOpen} />
      
      {/* GitHub Import Dialog */}
      <RepoRoastDialog open={repoDialogOpen} onOpenChange={setRepoDialogOpen} />
    </div>
  );
}