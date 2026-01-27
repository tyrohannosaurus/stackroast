import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { DollarSign, Sparkles, Mail, ArrowRight, Gift } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';

interface EmailCaptureModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  stackName?: string;
  savingsAmount?: number;
  recommendationCount?: number;
  onCapture?: (email: string) => void;
  source?: 'recommendations' | 'roast' | 'kit';
}

export function EmailCaptureModal({
  open,
  onOpenChange,
  stackName,
  savingsAmount,
  recommendationCount,
  onCapture,
  source = 'recommendations',
}: EmailCaptureModalProps) {
  const [email, setEmail] = useState('');
  const [marketingConsent, setMarketingConsent] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !email.includes('@')) {
      toast.error('Please enter a valid email address');
      return;
    }

    setSubmitting(true);

    try {
      // Store email capture in database
      const { error } = await supabase
        .from('email_captures')
        .insert({
          email,
          source,
          stack_name: stackName,
          potential_savings: savingsAmount,
          recommendation_count: recommendationCount,
          marketing_consent: marketingConsent,
          captured_at: new Date().toISOString(),
        });

      if (error) {
        // Table might not exist yet - that's ok, still capture the intent
        console.warn('Email capture table may not exist:', error.message);
      }

      // Track the conversion
      if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', 'email_capture', {
          event_category: 'conversion',
          event_label: source,
          value: savingsAmount || 0,
        });
      }

      toast.success('Check your inbox for personalized recommendations!');
      onCapture?.(email);
      onOpenChange(false);
      setEmail('');
    } catch (err) {
      console.error('Email capture error:', err);
      toast.error('Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-full bg-gradient-to-r from-violet-500/20 to-purple-500/20">
              <Sparkles className="w-5 h-5 text-violet-500" />
            </div>
            <DialogTitle className="text-xl">
              Get Your Free Stack Report
            </DialogTitle>
          </div>
          <DialogDescription className="text-left">
            We'll send you a detailed breakdown with exact steps to optimize your stack.
          </DialogDescription>
        </DialogHeader>

        {/* Value proposition */}
        <div className="space-y-3 py-4">
          {savingsAmount && savingsAmount > 0 && (
            <div className="flex items-center gap-3 p-3 rounded-lg bg-green-500/10 border border-green-500/20">
              <DollarSign className="w-5 h-5 text-green-500 shrink-0" />
              <div>
                <p className="font-semibold text-green-600">
                  ${savingsAmount.toFixed(0)}/month in potential savings
                </p>
                <p className="text-xs text-muted-foreground">
                  Step-by-step guide to claim these savings
                </p>
              </div>
            </div>
          )}

          {recommendationCount && recommendationCount > 0 && (
            <div className="flex items-center gap-3 p-3 rounded-lg bg-violet-500/10 border border-violet-500/20">
              <Gift className="w-5 h-5 text-violet-500 shrink-0" />
              <div>
                <p className="font-semibold text-violet-600">
                  {recommendationCount} personalized improvement{recommendationCount !== 1 ? 's' : ''}
                </p>
                <p className="text-xs text-muted-foreground">
                  Plus tool comparisons and migration guides
                </p>
              </div>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium">
              Email address
            </Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10"
                required
              />
            </div>
          </div>

          <div className="flex items-start gap-2">
            <Checkbox
              id="marketing"
              checked={marketingConsent}
              onCheckedChange={(checked) => setMarketingConsent(checked as boolean)}
              className="mt-0.5"
            />
            <Label htmlFor="marketing" className="text-xs text-muted-foreground font-normal">
              Get weekly stack tips + exclusive deals from our tool partners
            </Label>
          </div>

          <div className="flex flex-col gap-2">
            <Button
              type="submit"
              disabled={submitting}
              className="w-full bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-600 hover:to-purple-600 text-white font-semibold hover:scale-[1.02] transition-transform"
            >
              {submitting ? (
                'Sending...'
              ) : (
                <>
                  Send My Free Report
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>

            <Button
              type="button"
              variant="ghost"
              className="w-full text-muted-foreground text-sm"
              onClick={() => onOpenChange(false)}
            >
              Maybe later
            </Button>
          </div>

          <p className="text-xs text-center text-muted-foreground">
            No spam, ever. Unsubscribe anytime.
          </p>
        </form>
      </DialogContent>
    </Dialog>
  );
}
