import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { LoadingFire } from '@/components/LoadingFire';
import { generateStackAlternatives, type StackAlternativesResult } from '@/lib/generateRoast';
import { trackAlternativeClick } from '@/lib/analytics';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { 
  DollarSign, 
  Clock, 
  ExternalLink, 
  Sparkles, 
  AlertTriangle,
  TrendingDown,
  CheckCircle2
} from 'lucide-react';
import { toast } from 'sonner';
import type { Tool } from '@/types';

interface AlternativeSuggestionsProps {
  stackId: string;
  stackName: string;
  tools: Tool[];
  existingAlternatives?: StackAlternativesResult | null;
}

export function AlternativeSuggestions({
  stackId,
  stackName,
  tools,
  existingAlternatives,
}: AlternativeSuggestionsProps) {
  const { user } = useAuth();
  const [alternatives, setAlternatives] = useState<StackAlternativesResult | null>(
    existingAlternatives || null
  );
  const [loading, setLoading] = useState(!existingAlternatives);
  const [error, setError] = useState<string | null>(null);
  const [expandedItems, setExpandedItems] = useState<string[]>([]);

  useEffect(() => {
    async function loadAlternatives() {
      if (existingAlternatives) {
        setAlternatives(existingAlternatives);
        setLoading(false);
        return;
      }

      // Check if alternatives exist in database
      // Note: ai_alternatives column may not exist if migration hasn't been run
      try {
        const { data: stackData, error: selectError } = await supabase
          .from('stacks')
          .select('ai_alternatives')
          .eq('id', stackId)
          .maybeSingle();

        // If column doesn't exist, selectError will have code '42703'
        if (selectError && selectError.code !== '42703') {
          console.error('Error loading alternatives from DB:', selectError);
        }

        if (stackData?.ai_alternatives) {
          setAlternatives(stackData.ai_alternatives as StackAlternativesResult);
          setLoading(false);
          return;
        }
      } catch (err: any) {
        // Column might not exist yet, that's okay
        if (err?.code !== '42703') {
          console.error('Error loading alternatives from DB:', err);
        }
      }

      // Generate new alternatives
      try {
        setLoading(true);
        setError(null);
        
        const result = await generateStackAlternatives(
          stackName,
          tools.map(t => ({
            name: t.name,
            category: t.category,
            base_price: t.base_price,
          }))
        );

        setAlternatives(result);

        // Save to database (if column exists)
        try {
          const { error: updateError } = await supabase
            .from('stacks')
            .update({
              ai_alternatives: result,
              alternatives_generated_at: new Date().toISOString(),
            })
            .eq('id', stackId);

          if (updateError) {
            // Column might not exist yet (code 42703 = undefined column)
            if (updateError.code === '42703') {
              console.log('ai_alternatives column not available yet (run migration to enable persistence)');
            } else {
              console.error('Error saving alternatives to DB:', updateError);
            }
          }
        } catch (dbError: any) {
          // Column might not exist yet, that's okay
          if (dbError?.code !== '42703') {
            console.error('Error saving alternatives to DB:', dbError);
          }
          // Don't fail the whole operation if DB save fails
        }
      } catch (err: any) {
        console.error('Error generating alternatives:', err);
        setError(err.message || 'Failed to generate alternatives');
        toast.error('Failed to generate alternatives. Please try again.');
      } finally {
        setLoading(false);
      }
    }

    loadAlternatives();
  }, [stackId, stackName, tools, existingAlternatives]);

  const handleAlternativeClick = async (
    toolName: string,
    alternativeName: string,
    affiliateUrl?: string | null
  ) => {
    if (affiliateUrl) {
      // Track the click
      await trackAlternativeClick(
        stackId,
        toolName,
        alternativeName,
        affiliateUrl,
        user?.id
      );

      // Open affiliate link
      window.open(affiliateUrl, '_blank', 'noopener,noreferrer');
    } else {
      toast.info('Affiliate link not available for this tool');
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'bg-red-500/20 text-red-400 border-red-500/50';
      case 'medium':
        return 'bg-orange-500/20 text-orange-400 border-orange-500/50';
      case 'low':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/50';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'high':
        return <AlertTriangle className="w-4 h-4" />;
      case 'medium':
        return <TrendingDown className="w-4 h-4" />;
      case 'low':
        return <CheckCircle2 className="w-4 h-4" />;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <Card className="bg-gradient-to-br from-violet-500/10 to-purple-500/10 border-violet-500/30">
        <CardContent className="pt-6">
          <LoadingFire size="md" text="Analyzing your stack for better alternatives..." />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="bg-card border-border">
        <CardContent className="pt-6">
          <div className="text-center text-muted-foreground">
            <AlertTriangle className="w-8 h-8 mx-auto mb-2 text-orange-500" />
            <p>{error}</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-4"
              onClick={() => window.location.reload()}
            >
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!alternatives || alternatives.weak_tools.length === 0) {
    return (
      <Card className="bg-card border-border">
        <CardContent className="pt-6">
          <div className="text-center text-muted-foreground">
            <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-green-500" />
            <p>Your stack looks solid! No major improvements needed. ✨</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Savings Summary Card */}
      <Card className="bg-gradient-to-br from-violet-500/20 via-purple-500/20 to-pink-500/20 border-violet-500/50 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl">
            <Sparkles className="w-6 h-6 text-violet-400" />
            Potential Savings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-3 p-4 rounded-lg bg-background/50 backdrop-blur-sm">
              <div className="p-2 rounded-full bg-green-500/20">
                <DollarSign className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Monthly Savings</p>
                <p className="text-xl font-bold text-foreground">
                  {alternatives.total_savings.monthly_money}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 rounded-lg bg-background/50 backdrop-blur-sm">
              <div className="p-2 rounded-full bg-blue-500/20">
                <DollarSign className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Yearly Savings</p>
                <p className="text-xl font-bold text-foreground">
                  {alternatives.total_savings.yearly_money}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 rounded-lg bg-background/50 backdrop-blur-sm">
              <div className="p-2 rounded-full bg-purple-500/20">
                <Clock className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Time Saved</p>
                <p className="text-xl font-bold text-foreground">
                  {alternatives.total_savings.monthly_hours}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Weak Tools & Alternatives */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-xl">Recommended Alternatives</CardTitle>
          <p className="text-sm text-muted-foreground">
            We found {alternatives.weak_tools.length} tool{alternatives.weak_tools.length !== 1 ? 's' : ''} that could be improved
          </p>
        </CardHeader>
        <CardContent>
          <Accordion type="multiple" value={expandedItems} onValueChange={setExpandedItems}>
            {alternatives.alternatives.map((category, categoryIndex) => {
              const weakTool = alternatives.weak_tools.find(
                wt => wt.tool_name === category.current_tool
              );

              if (!weakTool) return null;

              return (
                <AccordionItem
                  key={`${category.category}-${categoryIndex}`}
                  value={`category-${categoryIndex}`}
                  className="border-b border-border"
                >
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center gap-3 flex-1 text-left">
                      <Badge
                        variant="outline"
                        className={getSeverityColor(weakTool.severity)}
                      >
                        {getSeverityIcon(weakTool.severity)}
                        <span className="ml-1 capitalize">{weakTool.severity}</span>
                      </Badge>
                      <div className="flex-1">
                        <p className="font-semibold text-foreground">{weakTool.tool_name}</p>
                        <p className="text-sm text-muted-foreground">{weakTool.reason}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-muted-foreground">
                          {weakTool.current_cost}
                        </p>
                        <p className="text-xs text-muted-foreground">{weakTool.time_waste}</p>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-3 pt-2">
                      {category.suggestions.map((suggestion, suggestionIndex) => (
                        <Card
                          key={`${suggestion.name}-${suggestionIndex}`}
                          className={`bg-gradient-to-br ${
                            suggestion.is_sponsored
                              ? 'from-violet-500/10 to-purple-500/10 border-violet-500/30'
                              : 'from-card to-card border-border'
                          }`}
                        >
                          <CardContent className="pt-4">
                            <div className="flex items-start gap-4">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <h4 className="font-semibold text-foreground">
                                    {suggestion.name}
                                  </h4>
                                  {suggestion.is_sponsored && (
                                    <Badge
                                      variant="outline"
                                      className="bg-violet-500/20 text-violet-400 border-violet-500/50"
                                    >
                                      ⭐ Recommended
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-sm text-muted-foreground mb-3">
                                  {suggestion.reason}
                                </p>
                                <div className="flex flex-wrap items-center gap-4 text-sm">
                                  <div>
                                    <span className="text-muted-foreground">Cost: </span>
                                    <span className="font-medium text-foreground">
                                      {suggestion.estimated_cost}
                                    </span>
                                  </div>
                                  <div className="text-green-500 font-medium">
                                    💰 {suggestion.savings.money}
                                  </div>
                                  <div className="text-blue-500 font-medium">
                                    ⏱️ {suggestion.savings.time}
                                  </div>
                                </div>
                              </div>
                              <div className="flex flex-col gap-2">
                                <Button
                                  size="sm"
                                  variant={suggestion.is_sponsored ? 'default' : 'outline'}
                                  className={
                                    suggestion.is_sponsored
                                      ? 'bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-600 hover:to-purple-600'
                                      : ''
                                  }
                                  onClick={() =>
                                    handleAlternativeClick(
                                      category.current_tool,
                                      suggestion.name,
                                      suggestion.affiliate_url
                                    )
                                  }
                                >
                                  View Details
                                  <ExternalLink className="w-3 h-3 ml-1" />
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        </CardContent>
      </Card>
    </div>
  );
}
