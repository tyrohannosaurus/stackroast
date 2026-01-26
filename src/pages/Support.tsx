import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ArrowLeft, LifeBuoy, Search, Send, MessageCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Footer } from "@/components/Footer";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    question: "How does the AI roasting work?",
    answer: "Our AI uses Google Gemini to analyze your tech stack and provide honest, humorous critiques. You can choose from different personas (Cynical Senior, Startup Bro, etc.) for unique roast styles.",
  },
  {
    question: "Can I submit a stack anonymously?",
    answer: "Yes! You can submit stacks without creating an account. However, creating an account lets you save stacks, track your karma, and participate in the community.",
  },
  {
    question: "How are alternative suggestions generated?",
    answer: "Our AI analyzes your stack to identify weak, outdated, or overpriced tools. It then suggests better alternatives with cost savings, time estimates, and detailed comparisons.",
  },
  {
    question: "What are Stack Kits?",
    answer: "Stack Kits are curated templates for common use cases (startups, enterprise, side projects, etc.). They include proven tool combinations that work well together.",
  },
  {
    question: "How do I earn karma points?",
    answer: "You earn karma (logs) by submitting stacks, getting upvotes on your roasts, and engaging with the community. Higher karma unlocks more features!",
  },
  {
    question: "Can I add tools that aren't in the database?",
    answer: "Yes! If you can't find a tool, you can add it directly. We'll verify the website and fetch the logo automatically. Your tool will be available for others to use.",
  },
  {
    question: "Is StackRoast free?",
    answer: "Yes, StackRoast is completely free to use. You can submit stacks, get roasts, and browse the community without any cost.",
  },
  {
    question: "How do I report inappropriate content?",
    answer: "If you see inappropriate content, please contact us at hello@stackroast.com or use the contact form. We take moderation seriously.",
  },
];

export default function Support() {
  const [searchQuery, setSearchQuery] = useState("");
  const [ticketSubject, setTicketSubject] = useState("");
  const [ticketMessage, setTicketMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  const filteredFAQs = faqs.filter(
    (faq) =>
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSubmitTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!ticketSubject || !ticketMessage) {
      toast({
        title: "Missing fields",
        description: "Please fill in both subject and message.",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);

    // In a real app, you'd send this to your support system
    setTimeout(() => {
      toast({
        title: "Ticket submitted!",
        description: "We'll get back to you as soon as possible.",
      });
      setTicketSubject("");
      setTicketMessage("");
      setSubmitting(false);
    }, 1000);
  };

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
              <LifeBuoy className="w-10 h-10 text-orange-500" />
              <h1 className="text-5xl font-bold bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent">
                Support Center
              </h1>
            </div>
            <p className="text-xl text-muted-foreground">
              Find answers to common questions or submit a support ticket.
            </p>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Search FAQs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* FAQs */}
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">Frequently Asked Questions</h2>
            {filteredFAQs.length > 0 ? (
              <Accordion type="single" collapsible className="w-full">
                {filteredFAQs.map((faq, index) => (
                  <AccordionItem key={index} value={`item-${index}`}>
                    <AccordionTrigger className="text-left">
                      {faq.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground">
                      {faq.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <MessageCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No FAQs found matching "{searchQuery}"</p>
                <p className="text-sm mt-2">Try a different search term or submit a ticket below.</p>
              </div>
            )}
          </div>

          {/* Submit Ticket */}
          <div className="p-6 rounded-lg border border-border bg-surface/50">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <Send className="w-6 h-6 text-orange-500" />
              Submit a Support Ticket
            </h2>
            <form onSubmit={handleSubmitTicket} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="ticket-subject">Subject *</Label>
                <Input
                  id="ticket-subject"
                  value={ticketSubject}
                  onChange={(e) => setTicketSubject(e.target.value)}
                  placeholder="Brief description of your issue"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ticket-message">Message *</Label>
                <Textarea
                  id="ticket-message"
                  value={ticketMessage}
                  onChange={(e) => setTicketMessage(e.target.value)}
                  placeholder="Describe your issue in detail..."
                  rows={6}
                  required
                />
              </div>
              <Button
                type="submit"
                disabled={submitting}
                className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
              >
                {submitting ? "Submitting..." : "Submit Ticket"}
              </Button>
            </form>
          </div>

          {/* Contact Alternative */}
          <div className="text-center p-6 rounded-lg border border-border bg-surface/50">
            <p className="text-muted-foreground mb-4">
              Prefer to email us directly?
            </p>
            <Link to="/contact">
              <Button variant="outline">Visit Contact Page</Button>
            </Link>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
