import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Calendar, ArrowRight } from "lucide-react";
import { Footer } from "@/components/Footer";

// Placeholder blog posts - in a real app, these would come from a CMS or database
const blogPosts = [
  {
    id: 1,
    title: "10 Most Roasted Tech Stacks of 2025",
    excerpt: "We analyzed thousands of stacks to find the most commonly roasted combinations. You might be surprised!",
    date: "January 15, 2025",
    category: "Analysis",
  },
  {
    id: 2,
    title: "Why Your React + Express + MongoDB Stack Gets Roasted",
    excerpt: "The classic MERN stack isn't always the best choice. Here's what our AI roasters have to say about it.",
    date: "January 10, 2025",
    category: "Insights",
  },
  {
    id: 3,
    title: "The Hidden Costs of Over-Engineering Your Stack",
    excerpt: "Sometimes less is more. Learn how to avoid the trap of adding too many tools to your stack.",
    date: "January 5, 2025",
    category: "Best Practices",
  },
  {
    id: 4,
    title: "How to Choose the Right Database for Your Project",
    excerpt: "PostgreSQL, MongoDB, or something else? Our AI roasters break down when to use what.",
    date: "December 28, 2024",
    category: "Guides",
  },
];

export default function Blog() {
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
              Blog
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Insights, analysis, and hot takes on tech stacks, tools, and developer culture.
            </p>
          </div>

          {/* Blog Posts Grid */}
          <div className="grid md:grid-cols-2 gap-6">
            {blogPosts.map((post) => (
              <article
                key={post.id}
                className="p-6 rounded-lg border border-border bg-surface/50 hover:border-orange-500/50 transition-colors"
              >
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                  <span className="px-2 py-1 rounded bg-orange-500/10 text-orange-400 text-xs font-medium">
                    {post.category}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {post.date}
                  </span>
                </div>
                <h2 className="text-2xl font-bold mb-3 hover:text-orange-400 transition-colors">
                  {post.title}
                </h2>
                <p className="text-muted-foreground mb-4 leading-relaxed">
                  {post.excerpt}
                </p>
                <Button variant="ghost" className="gap-2 group">
                  Read More
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </article>
            ))}
          </div>

          {/* Coming Soon */}
          <div className="text-center p-12 rounded-lg border border-dashed border-border bg-surface/50">
            <h2 className="text-2xl font-bold mb-4">More Content Coming Soon</h2>
            <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
              We're working on bringing you regular insights, tutorials, and analysis. 
              Want to contribute?{" "}
              <Link to="/contact" className="text-orange-400 hover:text-orange-300 underline">
                Get in touch
              </Link>
              .
            </p>
            <Link to="/">
              <Button variant="outline">Back to Home</Button>
            </Link>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
