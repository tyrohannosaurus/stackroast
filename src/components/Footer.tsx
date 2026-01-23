import { Link } from 'react-router-dom';
import { Github, Twitter, Mail } from 'lucide-react';

export function Footer() {
  return (
    <footer className="border-t border-white/10 bg-canvas mt-20">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Column */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <img src="/logo.svg" alt="StackRoast" className="w-10 h-10" />
              <h3 className="text-xl font-bold text-white">StackRoast</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Get brutally honest AI-powered critiques of your tech stack.
            </p>
            <div className="flex items-center gap-4">
              <a 
                href="https://twitter.com/stackroast" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-orange-400 transition-colors"
              >
                <Twitter className="w-5 h-5" />
              </a>
              <a 
                href="https://github.com/stackroast" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-orange-400 transition-colors"
              >
                <Github className="w-5 h-5" />
              </a>
              <a 
                href="mailto:hello@stackroast.com"
                className="text-muted-foreground hover:text-orange-400 transition-colors"
              >
                <Mail className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Product Column */}
          <div className="space-y-4">
            <h4 className="font-semibold text-foreground">Product</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/" className="text-muted-foreground hover:text-orange-400 transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/leaderboard" className="text-muted-foreground hover:text-orange-400 transition-colors">
                  Leaderboard
                </Link>
              </li>
              <li>
                <Link to="/pricing" className="text-muted-foreground hover:text-orange-400 transition-colors">
                  Pricing
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources Column */}
          <div className="space-y-4">
            <h4 className="font-semibold text-foreground">Resources</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/about" className="text-muted-foreground hover:text-orange-400 transition-colors">
                  About
                </Link>
              </li>
              <li>
                <Link to="/blog" className="text-muted-foreground hover:text-orange-400 transition-colors">
                  Blog
                </Link>
              </li>
              <li>
                <Link to="/docs" className="text-muted-foreground hover:text-orange-400 transition-colors">
                  Documentation
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal Column */}
          <div className="space-y-4">
            <h4 className="font-semibold text-foreground">Legal</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/privacy" className="text-muted-foreground hover:text-orange-400 transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/terms" className="text-muted-foreground hover:text-orange-400 transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-muted-foreground hover:text-orange-400 transition-colors">
                  Contact Us
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-white/10">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-4">
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} StackRoast. All rights reserved.
            </p>
            <p className="text-sm text-muted-foreground">
              Built with 🔥 by developers, for developers
            </p>
          </div>
          
          {/* Affiliate Disclosure */}
          <p className="text-xs text-muted-foreground/80 text-center mt-4">
            We may earn affiliate commissions from tool signups.{' '}
            <Link to="/terms#affiliate" className="underline hover:text-foreground transition-colors">
              Learn more
            </Link>
          </p>
        </div>
      </div>
    </footer>
  );
}