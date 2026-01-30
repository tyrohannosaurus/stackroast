import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Lightbulb, ExternalLink, Sparkles } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { trackAffiliateClick } from '@/lib/analytics';
import { generateStackImprovements } from '@/lib/generateRoast';
import { useToast } from '@/hooks/use-toast';
import type { Stack } from '@/types';

interface FixMyStackButtonProps {
  stack: Stack;
}

interface Suggestion {
  issue: string;
  suggestion: string;
  severity: 'high' | 'medium' | 'low';
  category: string;
  tool?: {
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
  const { toast } = useToast();

  const generateSuggestions = async () => {
    setLoading(true);
    try {
      console.log('🤖 Starting AI-powered stack analysis...');
      
      // Use AI to analyze the stack and identify improvements
      const stackName = stack.name || stack.title || 'Unknown Stack';
      const improvements = await generateStackImprovements(
        stackName,
        stack.tools.map(t => ({
          name: t.name,
          category: t.category || '',
          base_price: t.base_price || 0,
        }))
      );

      console.log('✅ AI analysis complete:', improvements);

      // Enrich suggestions with tool data from database
      const enrichedSuggestions = await Promise.all(
        improvements.suggestions.map(async (suggestion) => {
          // Try to find a matching tool in the database
          const { data: tool } = await supabase
            .from('tools')
            .select('id, name, description, logo_url, affiliate_url, base_price')
            .ilike('name', `%${suggestion.tool_name}%`)
            .limit(1)
            .maybeSingle();

          return {
            issue: suggestion.issue,
            suggestion: suggestion.recommendation,
            severity: suggestion.severity as 'high' | 'medium' | 'low',
            category: suggestion.category,
            tool: tool ? {
              id: tool.id,
              name: tool.name,
              description: tool.description || '',
              logo_url: tool.logo_url || '',
              affiliate_url: tool.affiliate_url || '',
              base_price: tool.base_price || 0,
            } : undefined,
          };
        })
      );

      setSuggestions(enrichedSuggestions);
      setShowSuggestions(true);
      
      if (enrichedSuggestions.length === 0) {
        toast({
          title: "Stack Analysis Complete",
          description: "Your stack looks solid! No major improvements needed.",
        });
      }
    } catch (error: any) {
      console.error('❌ Error generating AI suggestions:', error);
      toast({
        title: "Analysis Error",
        description: error.message || "Failed to analyze stack. Falling back to basic analysis.",
        variant: "destructive",
      });
      
      // Fallback to basic analysis if AI fails
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
            severity: 'medium' as const,
            category: weakness.category,
            tool: {
              id: tool.id,
              name: tool.name,
              description: tool.description || '',
              logo_url: tool.logo_url || '',
              affiliate_url: tool.affiliate_url || '',
              base_price: tool.base_price || 0,
            },
          };
        })
      );

      const validSuggestions = toolSuggestions.filter((s) => s !== null) as Suggestion[];
      setSuggestions(validSuggestions);
      setShowSuggestions(true);
    } finally {
      setLoading(false);
    }
  };

  const trackClick = async (tool: { id: string; name: string; affiliate_url: string }) => {
    await trackAffiliateClick({
      toolId: tool.id,
      toolName: tool.name,
      affiliateUrl: tool.affiliate_url,
      stackId: stack.id,
      source: "fix_my_stack",
      userId: (stack as any).user_id || (stack as any).profile_id || null,
    });
    window.open(tool.affiliate_url, "_blank");
  };

  if (!showSuggestions) {
    return (
      <Button
        onClick={generateSuggestions}
        disabled={loading}
        size="lg"
        className="w-full gap-2 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white border-0 shadow-lg hover:shadow-orange-500/50 transition-all font-semibold"
      >
        {loading ? (
          <>
            <Sparkles className="w-4 h-4 animate-pulse" />
            Analyzing Stack...
          </>
        ) : (
          <>
            <Lightbulb className="w-4 h-4" />
            Fix My Stack
            <Sparkles className="w-4 h-4" />
          </>
        )}
      </Button>
    );
  }

  return (
    <Card className="p-6 bg-gradient-to-br from-orange-500/10 to-amber-500/10 border-orange-500/30">
      <div className="flex items-start gap-3 mb-4">
        <Sparkles className="w-5 h-5 text-orange-500 mt-1" />
        <div>
          <h3 className="font-semibold text-lg text-foreground">AI-Powered Stack Improvements</h3>
          <p className="text-sm text-muted-foreground">
            Intelligent recommendations to optimize your stack
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
                {suggestion.tool?.logo_url && (
                  <img
                    src={suggestion.tool.logo_url}
                    alt={suggestion.tool.name}
                    className="w-10 h-10 rounded"
                    onError={(e) => {
                      e.currentTarget.src = 'https://via.placeholder.com/40';
                    }}
                  />
                )}
                {!suggestion.tool?.logo_url && (
                  <div className="w-10 h-10 rounded bg-orange-500/20 flex items-center justify-center">
                    <Lightbulb className="w-5 h-5 text-orange-500" />
                  </div>
                )}
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm text-orange-500 font-medium">
                      ⚠️ {suggestion.issue}
                    </p>
                    {suggestion.severity === 'high' && (
                      <span className="text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded">High Priority</span>
                    )}
                    {suggestion.severity === 'medium' && (
                      <span className="text-xs bg-orange-500/20 text-orange-400 px-2 py-0.5 rounded">Medium</span>
                    )}
                    {suggestion.severity === 'low' && (
                      <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded">Low</span>
                    )}
                  </div>
                  {suggestion.tool ? (
                    <>
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
                        {suggestion.tool.affiliate_url && (
                          <Button
                            variant="link"
                            size="sm"
                            className="text-orange-500 hover:text-orange-600 p-0 h-auto"
                            onClick={() => trackClick(suggestion.tool!)}
                          >
                            Learn More <ExternalLink className="w-3 h-3 ml-1" />
                          </Button>
                        )}
                      </div>
                    </>
                  ) : (
                    <>
                      <h4 className="font-medium mb-1 text-foreground">{suggestion.category}</h4>
                      <p className="text-sm text-muted-foreground mb-2">
                        {suggestion.suggestion}
                      </p>
                      <p className="text-xs text-muted-foreground italic">
                        AI Recommendation: Consider adding tools in the {suggestion.category} category
                      </p>
                    </>
                  )}
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