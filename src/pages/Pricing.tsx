import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Check, Zap, Flame, Rocket } from "lucide-react";
import { Footer } from "@/components/Footer";

export default function Pricing() {
  return (
    <div className="min-h-screen bg-canvas pt-24 pb-12">
      <div className="container mx-auto px-4 max-w-6xl">
        <Link to="/">
          <Button variant="ghost" className="mb-6 gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Button>
        </Link>

        <div className="space-y-12">
          {/* Header */}
          <div className="text-center space-y-4">
            <h1 className="text-5xl font-bold bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent">
              Pricing
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              StackRoast is completely free. Always has been, always will be.
            </p>
          </div>

          {/* Free Tier */}
          <div className="max-w-2xl mx-auto">
            <div className="p-8 rounded-lg border-2 border-orange-500/50 bg-gradient-to-br from-orange-500/10 via-red-500/10 to-orange-500/5 relative overflow-hidden">
              <div className="absolute top-4 right-4">
                <span className="px-3 py-1 rounded-full bg-orange-500 text-white text-sm font-semibold">
                  FREE
                </span>
              </div>
              
              <div className="text-center mb-8">
                <div className="flex items-center justify-center gap-2 mb-4">
                  <Flame className="w-8 h-8 text-orange-500" />
                  <h2 className="text-3xl font-bold">Free Forever</h2>
                </div>
                <div className="text-5xl font-bold mb-2">$0</div>
                <p className="text-muted-foreground">No credit card required</p>
              </div>

              <ul className="space-y-4 mb-8">
                {[
                  "Unlimited stack submissions",
                  "AI-powered roasts with multiple personas",
                  "Alternative tool suggestions",
                  "Save unlimited stacks",
                  "Browse community roasts",
                  "Vote and comment on stacks",
                  "Access to all Stack Kits",
                  "Leaderboard participation",
                  "GitHub repository import",
                  "Visual roast from architecture diagrams",
                  "Roast a friend feature",
                  "Email reminders for saved stacks",
                ].map((feature, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <Link to="/">
                <Button className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-lg py-6">
                  Get Started Free
                </Button>
              </Link>
            </div>
          </div>

          {/* Why Free */}
          <div className="grid md:grid-cols-3 gap-6">
            <div className="p-6 rounded-lg border border-border bg-surface/50 text-center">
              <Zap className="w-8 h-8 text-orange-500 mx-auto mb-4" />
              <h3 className="font-semibold text-lg mb-2">No Hidden Costs</h3>
              <p className="text-sm text-muted-foreground">
                Everything is free. No premium features, no paywalls, no surprises.
              </p>
            </div>
            <div className="p-6 rounded-lg border border-border bg-surface/50 text-center">
              <Rocket className="w-8 h-8 text-orange-500 mx-auto mb-4" />
              <h3 className="font-semibold text-lg mb-2">Community First</h3>
              <p className="text-sm text-muted-foreground">
                We believe in open access. Great tools should be available to everyone.
              </p>
            </div>
            <div className="p-6 rounded-lg border border-border bg-surface/50 text-center">
              <Flame className="w-8 h-8 text-orange-500 mx-auto mb-4" />
              <h3 className="font-semibold text-lg mb-2">Always Free</h3>
              <p className="text-sm text-muted-foreground">
                This isn't a trial. StackRoast will always be free to use.
              </p>
            </div>
          </div>

          {/* How We Keep It Free */}
          <div className="p-8 rounded-lg border border-border bg-surface/50">
            <h2 className="text-2xl font-bold mb-4">How We Keep It Free</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              StackRoast is supported through affiliate partnerships with the tools we recommend. 
              When you sign up for a tool through our links, we may earn a small commission at no 
              extra cost to you. This helps us keep the platform free for everyone.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              We're transparent about this - you can read more in our{" "}
              <Link to="/terms" className="text-orange-400 hover:text-orange-300 underline">
                Terms of Service
              </Link>
              . Your trust is important to us, and we only recommend tools we genuinely believe in.
            </p>
          </div>

          {/* CTA */}
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">Ready to Get Started?</h2>
            <p className="text-muted-foreground mb-6">
              Join thousands of developers getting honest feedback on their tech stacks.
            </p>
            <Link to="/">
              <Button className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600">
                Start Roasting Your Stack
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
