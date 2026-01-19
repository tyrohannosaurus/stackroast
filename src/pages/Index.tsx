import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/Hero";
import { LiveTicker } from "@/components/LiveTicker";
import { RoastBentoGrid } from "@/components/RoastBentoGrid";

const Index = () => {
  return (
    <div className="min-h-screen bg-canvas">
      <Navbar />
      <Hero />
      
      {/* Live Ticker */}
      <div className="relative z-10 -mt-16 border-y border-white/5 bg-surface-glass backdrop-blur-md">
        <div className="container mx-auto">
          <LiveTicker />
        </div>
      </div>
      
      <RoastBentoGrid />
      
      {/* Footer */}
      <footer className="py-12 border-t border-white/5">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm text-muted-foreground">
            Built with 🔥 by developers who love a good roast
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
