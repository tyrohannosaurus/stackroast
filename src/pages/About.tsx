import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Flame, Users, Target, Zap } from "lucide-react";
import { Footer } from "@/components/Footer";

export default function About() {
  return (
    <div className="min-h-screen bg-canvas pt-24 pb-12">
      <div className="container mx-auto px-4 max-w-4xl">
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
              About StackRoast
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Get brutally honest AI-powered critiques of your tech stack. 
              Discover better alternatives and learn from the community.
            </p>
          </div>

          {/* Mission */}
          <section className="space-y-4">
            <h2 className="text-3xl font-bold flex items-center gap-2">
              <Target className="w-8 h-8 text-orange-500" />
              Our Mission
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              StackRoast was born from a simple observation: developers often choose tools 
              based on hype, not actual needs. We believe in honest feedback, better alternatives, 
              and helping developers make informed decisions about their tech stack.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              Whether you're building a startup, side project, or enterprise application, 
              StackRoast helps you identify weaknesses, discover better tools, and save money 
              through smart alternatives.
            </p>
          </section>

          {/* Features */}
          <section className="space-y-6">
            <h2 className="text-3xl font-bold flex items-center gap-2">
              <Zap className="w-8 h-8 text-orange-500" />
              What We Offer
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="p-6 rounded-lg border border-border bg-surface/50">
                <Flame className="w-6 h-6 text-orange-500 mb-3" />
                <h3 className="font-semibold text-lg mb-2">AI-Powered Roasts</h3>
                <p className="text-sm text-muted-foreground">
                  Get humorous, honest critiques of your tech stack powered by Google Gemini AI. 
                  Multiple personas provide different perspectives on your choices.
                </p>
              </div>
              <div className="p-6 rounded-lg border border-border bg-surface/50">
                <Target className="w-6 h-6 text-orange-500 mb-3" />
                <h3 className="font-semibold text-lg mb-2">Alternative Suggestions</h3>
                <p className="text-sm text-muted-foreground">
                  Discover better tools with detailed comparisons, cost savings, and time estimates. 
                  Find alternatives tailored to your specific use case.
                </p>
              </div>
              <div className="p-6 rounded-lg border border-border bg-surface/50">
                <Users className="w-6 h-6 text-orange-500 mb-3" />
                <h3 className="font-semibold text-lg mb-2">Community Driven</h3>
                <p className="text-sm text-muted-foreground">
                  Browse roasts from other developers, vote on stacks, and engage with the community. 
                  Learn from others' experiences and share your own.
                </p>
              </div>
              <div className="p-6 rounded-lg border border-border bg-surface/50">
                <Zap className="w-6 h-6 text-orange-500 mb-3" />
                <h3 className="font-semibold text-lg mb-2">Stack Kits</h3>
                <p className="text-sm text-muted-foreground">
                  Browse curated stack templates for common use cases. From startups to enterprise, 
                  find proven stacks that work.
                </p>
              </div>
            </div>
          </section>

          {/* How It Works */}
          <section className="space-y-6">
            <h2 className="text-3xl font-bold">How It Works</h2>
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-orange-500/20 flex items-center justify-center text-orange-500 font-bold">
                  1
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Submit Your Stack</h3>
                  <p className="text-sm text-muted-foreground">
                    Add your tech stack by selecting tools or importing from GitHub. 
                    You can submit anonymously or create an account.
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-orange-500/20 flex items-center justify-center text-orange-500 font-bold">
                  2
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Get Roasted</h3>
                  <p className="text-sm text-muted-foreground">
                    Our AI analyzes your stack and provides honest feedback. Choose from different 
                    personas for unique roast styles.
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-orange-500/20 flex items-center justify-center text-orange-500 font-bold">
                  3
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Discover Alternatives</h3>
                  <p className="text-sm text-muted-foreground">
                    Get AI-generated alternative suggestions with cost savings and comparisons. 
                    Find better tools for your specific needs.
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-orange-500/20 flex items-center justify-center text-orange-500 font-bold">
                  4
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Share & Learn</h3>
                  <p className="text-sm text-muted-foreground">
                    Share your stack with the community, browse others' roasts, and learn from 
                    the collective wisdom of developers.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* CTA */}
          <section className="text-center p-8 rounded-lg border border-orange-500/20 bg-gradient-to-br from-orange-500/10 via-red-500/10 to-orange-500/5">
            <h2 className="text-2xl font-bold mb-4">Ready to Get Roasted?</h2>
            <p className="text-muted-foreground mb-6">
              Submit your stack and discover what the AI thinks about your tech choices.
            </p>
            <Link to="/">
              <Button className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600">
                Get Started
              </Button>
            </Link>
          </section>
        </div>
      </div>

      <Footer />
    </div>
  );
}
