import { Leaderboards } from "@/components/Leaderboards";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Leaderboard() {
  return (
    <div className="min-h-screen bg-canvas pt-24 pb-12">
      <div className="container mx-auto px-4">
        <div className="mb-8">
          <Link to="/">
            <Button variant="ghost" className="mb-4 gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </Button>
          </Link>
          <h1 className="text-4xl font-bold mb-2">Leaderboards</h1>
          <p className="text-muted-foreground">
            See who's on top - most karma, best roasters, hottest stacks, and more.
          </p>
        </div>
        
        <div className="max-w-4xl mx-auto">
          <Leaderboards />
        </div>
      </div>
    </div>
  );
}
