import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Shield, Lock, Eye, FileText } from "lucide-react";
import { Footer } from "@/components/Footer";

export default function Privacy() {
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
            <div className="flex items-center justify-center gap-3 mb-4">
              <Shield className="w-10 h-10 text-orange-500" />
              <h1 className="text-5xl font-bold bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent">
                Privacy Policy
              </h1>
            </div>
            <p className="text-muted-foreground">
              Last updated: January 23, 2025
            </p>
          </div>

          {/* Content */}
          <div className="space-y-8 prose prose-invert max-w-none">
            <section className="space-y-4">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <Lock className="w-6 h-6 text-orange-500" />
                Your Privacy Matters
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                At StackRoast, we take your privacy seriously. This policy explains how we collect, 
                use, and protect your personal information when you use our platform.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-bold">Information We Collect</h2>
              <div className="space-y-3">
                <div>
                  <h3 className="font-semibold mb-2">Account Information</h3>
                  <p className="text-muted-foreground">
                    When you create an account, we collect your email address, username, and 
                    authentication provider information (Google, GitHub, Twitter). This information 
                    is stored securely using Supabase Auth.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Stack Data</h3>
                  <p className="text-muted-foreground">
                    We store the tech stacks you submit, including tool selections, stack names, 
                    and any descriptions you provide. Public stacks are visible to all users.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Usage Data</h3>
                  <p className="text-muted-foreground">
                    We collect anonymous usage statistics to improve our service, including page 
                    views, feature usage, and error logs. This data is aggregated and cannot identify you.
                  </p>
                </div>
              </div>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <Eye className="w-6 h-6 text-orange-500" />
                How We Use Your Information
              </h2>
              <ul className="space-y-2 text-muted-foreground list-disc list-inside">
                <li>To provide and improve our services</li>
                <li>To generate AI roasts and alternative suggestions</li>
                <li>To display your stacks and profile to other users (if public)</li>
                <li>To send you email reminders for saved stacks (if enabled)</li>
                <li>To prevent abuse and ensure platform security</li>
                <li>To analyze usage patterns and improve user experience</li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-bold">Data Sharing</h2>
              <p className="text-muted-foreground leading-relaxed">
                We do not sell your personal information. We may share data in the following circumstances:
              </p>
              <ul className="space-y-2 text-muted-foreground list-disc list-inside">
                <li><strong>Public Stacks:</strong> Stacks marked as public are visible to all users</li>
                <li><strong>Service Providers:</strong> We use Supabase for hosting and authentication</li>
                <li><strong>Legal Requirements:</strong> If required by law or to protect our rights</li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-bold">Your Rights</h2>
              <p className="text-muted-foreground leading-relaxed">
                You have the right to:
              </p>
              <ul className="space-y-2 text-muted-foreground list-disc list-inside">
                <li>Access your personal data</li>
                <li>Update or correct your information</li>
                <li>Delete your account and data</li>
                <li>Export your data</li>
                <li>Opt out of email notifications</li>
              </ul>
              <p className="text-muted-foreground mt-4">
                To exercise these rights, please contact us at{" "}
                <a href="mailto:privacy@stackroast.com" className="text-orange-400 hover:text-orange-300">
                  privacy@stackroast.com
                </a>
                .
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-bold">Cookies and Tracking</h2>
              <p className="text-muted-foreground leading-relaxed">
                We use essential cookies for authentication and session management. We do not use 
                third-party tracking cookies or advertising trackers. You can disable cookies in 
                your browser, though this may affect functionality.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-bold">Data Security</h2>
              <p className="text-muted-foreground leading-relaxed">
                We use industry-standard security measures to protect your data, including encryption 
                in transit and at rest. Our infrastructure is hosted on Supabase, which maintains 
                SOC 2 Type II compliance.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-bold">Children's Privacy</h2>
              <p className="text-muted-foreground leading-relaxed">
                StackRoast is not intended for users under 13 years of age. We do not knowingly 
                collect personal information from children.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-bold">Changes to This Policy</h2>
              <p className="text-muted-foreground leading-relaxed">
                We may update this privacy policy from time to time. We will notify you of any 
                significant changes by posting the new policy on this page and updating the 
                "Last updated" date.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <FileText className="w-6 h-6 text-orange-500" />
                Contact Us
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                If you have questions about this privacy policy, please contact us at{" "}
                <a href="mailto:privacy@stackroast.com" className="text-orange-400 hover:text-orange-300">
                  privacy@stackroast.com
                </a>
                {" "}or visit our{" "}
                <Link to="/contact" className="text-orange-400 hover:text-orange-300 underline">
                  contact page
                </Link>
                .
              </p>
            </section>
          </div>

          {/* Related Links */}
          <div className="flex gap-4 justify-center pt-8 border-t border-border">
            <Link to="/terms">
              <Button variant="outline">Terms of Service</Button>
            </Link>
            <Link to="/contact">
              <Button variant="outline">Contact Us</Button>
            </Link>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
