import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Lightbulb, ExternalLink } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Stack } from '@/types';

interface FixMyStackButtonProps {
  stack: Stack;
}

interface Suggestion {
  issue: string;
  suggestion: string;
  tool: {
    id: string;
    name: string;
    description: string;
    logo_url: string;
    affiliate_url: string;
    base_price: number;
  };
}

export function FixMyStackButton({ stack }: FixMyStackButtonProps) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const generateSuggestions = async () => {
    setLoading(true);
    try {
      const weaknesses = analyzeStack(stack);
      
      const toolSuggestions = await Promise.all(
        weaknesses.map(async (weakness) => {
          const { data: tool } = await supabase
            .from('tools')
            .select('id, name, description, logo_url, affiliate_url, base_price')
            .eq('category', weakness.category)
            .gt('priority_score', 80)
            .limit(1)
            .maybeSingle();

          if (!tool) return null;

          return {
            issue: weakness.issue,
            suggestion: weakness.suggestion,
            tool,
          };
        })
      );

      const validSuggestions = toolSuggestions.filter((s): s is Suggestion => s !== null);
      setSuggestions(validSuggestions);
      setShowSuggestions(true);
    } catch (error) {
      console.error('Error generating suggestions:', error);
    } finally {
      setLoading(false);
    }
  };

  const trackClick = async (toolId: string, url: string) => {
    try {
      await supabase.from('affiliate_clicks').insert({
        tool_id: toolId,
        stack_id: stack.id,
        user_id: stack.user_id,
        referrer: window.location.href,
      });
    } catch (error) {
      console.error('Error tracking click:', error);
    }
    window.open(url, '_blank');
  };

  if (!showSuggestions) {
    return (
      <Button
        onClick={generateSuggestions}
        disabled={loading}
        className="w-full gap-2 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white border-0 shadow-lg hover:shadow-orange-500/50 transition-all font-semibold"
      >
        <Lightbulb className="w-4 h-4" />
        {loading ? 'Analyzing Stack...' : 'Fix My Stack'}
      </Button>
    );
  }

  return (
    <Card className="p-6 bg-gradient-to-br from-orange-500/10 to-amber-500/10 border-orange-500/30">
      <div className="flex items-start gap-3 mb-4">
        <Lightbulb className="w-5 h-5 text-orange-500 mt-1" />
        <div>
          <h3 className="font-semibold text-lg text-foreground">Stack Improvements</h3>
          <p className="text-sm text-muted-foreground">
            Upgrade opportunities based on your current stack
          </p>
        </div>
      </div>

      {suggestions.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Your stack looks solid! No major improvements needed. ✨
        </p>
      ) : (
        <div className="space-y-4">
          {suggestions.map((suggestion, index) => (
            <div
              key={index}
              className="p-4 rounded-lg bg-card border border-orange-500/20 hover:border-orange-500/40 transition-colors"
            >
              <div className="flex items-start gap-3">
                <img
                  src={suggestion.tool.logo_url}
                  alt={suggestion.tool.name}
                  className="w-10 h-10 rounded"
                  onError={(e) => {
                    e.currentTarget.src = 'https://via.placeholder.com/40';
                  }}
                />
                <div className="flex-1">
                  <p className="text-sm text-orange-500 mb-1 font-medium">
                    ⚠️ {suggestion.issue}
                  </p>
                  <h4 className="font-medium mb-1 text-foreground">{suggestion.tool.name}</h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    {suggestion.suggestion}
                  </p>
                  <div className="flex items-center gap-4">
                    {suggestion.tool.base_price > 0 && (
                      <span className="text-sm text-orange-500 font-medium">
                        Starting at ${suggestion.tool.base_price}/mo
                      </span>
                    )}
                    <Button
                      variant="link"
                      size="sm"
                      className="text-orange-500 hover:text-orange-600 p-0 h-auto"
                      onClick={() => trackClick(suggestion.tool.id, suggestion.tool.affiliate_url)}
                    >
                      Learn More <ExternalLink className="w-3 h-3 ml-1" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Button
        onClick={() => setShowSuggestions(false)}
        variant="ghost"
        size="sm"
        className="w-full mt-4"
      >
        Hide Suggestions
      </Button>
    </Card>
  );
}

function analyzeStack(stack: Stack) {
  const weaknesses = [];
  const toolSlugs = stack.tools.map(t => t.slug?.toLowerCase() || '');

  const authTools = ['clerk', 'auth0', 'supabase', 'firebase'];
  const hasAuth = toolSlugs.some(slug => authTools.includes(slug));
  if (!hasAuth) {
    weaknesses.push({
      issue: 'No authentication service detected',
      suggestion: 'Add secure user authentication and management',
      category: 'Authentication',
    });
  }

  const monitoringTools = ['sentry', 'datadog', 'bugsnag'];
  const hasMonitoring = toolSlugs.some(slug => monitoringTools.includes(slug));
  if (!hasMonitoring) {
    weaknesses.push({
      issue: 'No error monitoring',
      suggestion: 'Track and fix errors before users complain',
      category: 'Monitoring',
    });
  }

  const analyticsTools = ['mixpanel', 'google-analytics', 'amplitude', 'plausible'];
  const hasAnalytics = toolSlugs.some(slug => analyticsTools.includes(slug));
  if (!hasAnalytics) {
    weaknesses.push({
      issue: 'No analytics tracking',
      suggestion: 'Understand user behavior and improve your product',
      category: 'Analytics',
    });
  }

  const paymentTools = ['stripe', 'paddle', 'lemonsqueezy'];
  const hasPayments = toolSlugs.some(slug => paymentTools.includes(slug));
  if (!hasPayments) {
    weaknesses.push({
      issue: 'No payment processing',
      suggestion: 'Start accepting payments and generating revenue',
      category: 'Payments',
    });
  }

  const emailTools = ['resend', 'sendgrid', 'postmark', 'mailgun'];
  const hasEmail = toolSlugs.some(slug => emailTools.includes(slug));
  if (!hasEmail) {
    weaknesses.push({
      issue: 'No email service',
      suggestion: 'Send transactional emails and notifications',
      category: 'Email Service',
    });
  }

  return weaknesses;
}