import { Footer } from "@/components/Footer";

export default function Terms() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <h1 className="text-4xl font-bold mb-8">Terms & Conditions</h1>
        
        <div className="prose prose-invert max-w-none space-y-8">
          {/* Introduction */}
          <section>
            <p className="text-muted-foreground">
              Welcome to StackRoast. By using our platform, you agree to these terms and conditions.
            </p>
          </section>

          {/* Affiliate Disclosure Section */}
          <section id="affiliate">
            <h2 className="text-2xl font-semibold mb-4 text-foreground">Affiliate Relationships</h2>
            
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-medium mb-2 text-foreground">Disclosure</h3>
                <p className="text-muted-foreground">
                  StackRoast participates in affiliate programs with various software and service 
                  providers. When you click on certain links in our platform and subsequently sign 
                  up for or purchase products or services, we may receive a commission from those 
                  providers.
                </p>
              </div>
              
              <div>
                <h3 className="text-xl font-medium mb-2 text-foreground">Independence</h3>
                <p className="text-muted-foreground">
                  Our recommendations and AI-generated stack analysis are made independently based 
                  on technical merit, user needs, and industry best practices. The presence or 
                  amount of affiliate commission does not influence our recommendations. We strive 
                  to provide honest, unbiased assessments of technology stacks.
                </p>
              </div>
              
              <div>
                <h3 className="text-xl font-medium mb-2 text-foreground">No Additional Cost</h3>
                <p className="text-muted-foreground">
                  Affiliate commissions do not increase the cost of any product or service you 
                  purchase. You will pay the same price whether you use our affiliate link or go 
                  directly to the provider's website.
                </p>
              </div>
              
              <div>
                <h3 className="text-xl font-medium mb-2 text-foreground">Our Commitment</h3>
                <p className="text-muted-foreground">
                  We only recommend tools and services that we believe will genuinely benefit your 
                  projects. If a tool is not a good fit for your stack, our AI will indicate this 
                  regardless of any affiliate relationship. Our primary goal is to help you build 
                  better technology stacks.
                </p>
              </div>
              
              <div>
                <h3 className="text-xl font-medium mb-2 text-foreground">Questions</h3>
                <p className="text-muted-foreground">
                  If you have questions about our affiliate relationships or how we evaluate tools, 
                  please contact us at{' '}
                  <a href="mailto:hello@stackroast.com" className="text-orange-400 hover:text-orange-300">
                    hello@stackroast.com
                  </a>
                </p>
              </div>
            </div>
          </section>

          {/* Additional Terms Sections */}
          <section>
            <h2 className="text-2xl font-semibold mb-4 text-foreground">Use of Service</h2>
            <p className="text-muted-foreground">
              StackRoast provides AI-powered technology stack analysis and recommendations. By using 
              our service, you acknowledge that recommendations are for informational purposes only 
              and should be evaluated based on your specific needs.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-foreground">User Content</h2>
            <p className="text-muted-foreground">
              You retain all rights to technology stacks you submit to StackRoast. By submitting a 
              stack, you grant us permission to analyze it and display the results publicly unless 
              you mark it as private.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-foreground">Privacy</h2>
            <p className="text-muted-foreground">
              Your privacy is important to us. Please review our Privacy Policy to understand how 
              we collect, use, and protect your information.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-foreground">Limitation of Liability</h2>
            <p className="text-muted-foreground">
              StackRoast is provided "as is" without warranties of any kind. We are not liable for 
              any damages arising from your use of our service or decisions made based on our 
              recommendations.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-foreground">Changes to Terms</h2>
            <p className="text-muted-foreground">
              We reserve the right to modify these terms at any time. Continued use of StackRoast 
              after changes constitutes acceptance of the modified terms.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-foreground">Contact</h2>
            <p className="text-muted-foreground">
              For questions about these terms, contact us at{' '}
              <a href="mailto:hello@stackroast.com" className="text-orange-400 hover:text-orange-300">
                hello@stackroast.com
              </a>
            </p>
          </section>

          <div className="pt-8 mt-8 border-t border-white/10">
            <p className="text-sm text-muted-foreground">
              Last updated: January 23, 2026
            </p>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}