import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { DollarSign, ExternalLink, AlertTriangle, TrendingDown, CheckCircle2, Sparkles } from 'lucide-react';
import type { ToolInKit } from '@/types/database';
import { supabase } from '@/lib/supabase';
import { getAffiliateLink } from '@/data/affiliateLinks';
import { generateBudgetAlternatives, type BudgetContext, type BudgetAlternative } from '@/lib/generateBudgetAlternatives';
import { ToolLogo } from '@/components/ToolLogo';

interface FixMyBudgetProps {
  tools: ToolInKit[];
  currentMonthlyCost?: number;
  context?: BudgetContext;
}

export function FixMyBudget({ tools, currentMonthlyCost, context }: FixMyBudgetProps) {
  const [loading, setLoading] = useState(false);
  const [alternatives, setAlternatives] = useState<BudgetAlternative[]>([]);
  const [showAlternatives, setShowAlternatives] = useState(false);
  const [contextAnalysis, setContextAnalysis] = useState<string>('');
  const [recommendations, setRecommendations] = useState<string[]>([]);

  const findBudgetAlternatives = async () => {
    setLoading(true);
    setShowAlternatives(true);

    try {
      // Convert ToolInKit to Tool format for AI
      // First, fetch base_price from database if not available
      const toolsForAI = await Promise.all(
        tools.map(async (tool) => {
          // If base_price is not on the tool, fetch it from database
          let basePrice = (tool as any).base_price;
          if (!basePrice) {
            const { data } = await supabase
              .from('tools')
              .select('base_price')
              .eq('id', tool.id)
              .single();
            basePrice = data?.base_price || 0;
          }

          return {
            id: tool.id,
            name: tool.name,
            slug: tool.slug,
            category: tool.category,
            website_url: tool.website_url,
            base_price: basePrice,
            logo_url: tool.logo_url,
          };
        })
      );

      // Build context from props
      const budgetContext: BudgetContext = {
        ...context,
        currentMonthlyCost,
      };

      // Call AI to generate budget alternatives
      const result = await generateBudgetAlternatives(toolsForAI, budgetContext);

      setAlternatives(result.alternatives);
      setContextAnalysis(result.contextAnalysis);
      setRecommendations(result.recommendations);
    } catch (error: any) {
      console.error('Error finding budget alternatives:', error);
      // Show error to user
      setContextAnalysis(`Error: ${error.message}. Please try again.`);
    } finally {
      setLoading(false);
    }
  };

  const totalSavings = alternatives.reduce((sum, alt) => sum + alt.monthlySavings, 0);
  const newTotalCost = (currentMonthlyCost || 0) - totalSavings;

  return (
    <div className="space-y-4">
      {!showAlternatives ? (
        <Button
          onClick={findBudgetAlternatives}
          size="lg"
          className="w-full gap-2 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white border-0 shadow-lg hover:shadow-orange-500/50 transition-all font-semibold"
          disabled={loading}
        >
          {loading ? (
            <>
              <Sparkles className="w-4 h-4 animate-pulse" />
              Analyzing...
            </>
          ) : (
            <>
              <TrendingDown className="w-4 h-4" />
              Fix My Budget
              <Sparkles className="w-4 h-4" />
            </>
          )}
        </Button>
      ) : (
        <Card className="p-6 bg-surface border-border">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-foreground">Budget Optimization</h3>
              <p className="text-sm text-muted-foreground">
                Cost-saving alternatives for your stack
              </p>
            </div>
            {totalSavings > 0 && (
              <Badge className="bg-green-500/20 text-green-600 border-green-500/30">
                Save ${totalSavings.toFixed(2)}/mo
              </Badge>
            )}
          </div>

          {loading ? (
            <div className="text-center py-8">
              <Sparkles className="w-12 h-12 mx-auto mb-3 text-orange-500 animate-pulse" />
              <p className="text-sm text-muted-foreground mb-2">
                AI is analyzing your stack for budget alternatives...
              </p>
              <p className="text-xs text-muted-foreground">
                Considering context, use case, and cost optimization opportunities
              </p>
            </div>
          ) : alternatives.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle2 className="w-12 h-12 mx-auto mb-3 text-green-500" />
              <p className="text-sm text-muted-foreground mb-2">
                {contextAnalysis || 'Your stack is already optimized for cost!'}
              </p>
              {recommendations.length > 0 && (
                <div className="mt-4 space-y-2">
                  {recommendations.map((rec, i) => (
                    <p key={i} className="text-xs text-muted-foreground">
                      • {rec}
                    </p>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <>
              {/* Context Analysis */}
              {contextAnalysis && (
                <div className="mb-4 p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
                  <p className="text-sm text-foreground">{contextAnalysis}</p>
                </div>
              )}

              {/* Recommendations */}
              {recommendations.length > 0 && (
                <div className="mb-4 p-3 bg-muted/50 rounded-lg">
                  <p className="text-xs font-medium text-foreground mb-2">AI Recommendations:</p>
                  <ul className="list-disc list-inside space-y-1 text-xs text-muted-foreground">
                    {recommendations.map((rec, i) => (
                      <li key={i}>{rec}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Summary */}
              <div className="mb-6 p-4 bg-orange-500/10 rounded-lg border border-orange-500/20">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-foreground">Current Monthly Cost</span>
                  <span className="text-lg font-semibold text-foreground">
                    ${(currentMonthlyCost || 0).toFixed(2)}
                  </span>
                </div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-green-600">Potential Savings</span>
                  <span className="text-lg font-semibold text-green-600">
                    -${totalSavings.toFixed(2)}
                  </span>
                </div>
                <Separator className="my-2" />
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-foreground">New Monthly Cost</span>
                  <span className="text-xl font-bold text-orange-500">
                    ${newTotalCost.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Alternatives List */}
              <div className="space-y-4">
                {alternatives.map((alt, index) => (
                  <Card key={index} className="p-4 bg-surface/50 border-border">
                    <div className="flex items-start gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <span className="font-medium text-foreground">{alt.currentTool.name}</span>
                          <span className="text-muted-foreground">→</span>
                          <span className="font-medium text-green-600">{alt.alternativeTool.name}</span>
                          <Badge variant="outline" className="text-xs bg-green-500/10 text-green-600 border-green-500/30">
                            Save ${alt.monthlySavings.toFixed(2)}/mo
                          </Badge>
                          {alt.contextAppropriate && (
                            <Badge variant="outline" className="text-xs bg-blue-500/10 text-blue-600 border-blue-500/30">
                              Context Fit: {alt.aiScore}/100
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mb-3">{alt.reason}</p>
                        
                        {/* Tradeoffs */}
                        <div className="mt-3">
                          <div className="flex items-center gap-2 mb-2">
                            <AlertTriangle className="w-4 h-4 text-amber-500" />
                            <span className="text-xs font-medium text-foreground">Trade-offs:</span>
                          </div>
                          <ul className="list-disc list-inside space-y-1 text-xs text-muted-foreground ml-6">
                            {alt.tradeoffs.map((tradeoff, i) => (
                              <li key={i}>{tradeoff}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2 shrink-0">
                        {alt.alternativeTool.logo_url && (
                          <img
                            src={alt.alternativeTool.logo_url}
                            alt={alt.alternativeTool.name}
                            className="w-10 h-10 rounded"
                          />
                        )}
                        {alt.alternativeTool.website_url && (
                          <a
                            href={getAffiliateLink(alt.alternativeTool.name)?.url || alt.alternativeTool.website_url}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <Button variant="outline" size="sm">
                              <ExternalLink className="w-4 h-4 mr-2" />
                              Learn More
                            </Button>
                          </a>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>

              {/* Disclosure */}
              <div className="mt-6 p-3 bg-muted/50 rounded-lg border border-border">
                <p className="text-xs text-muted-foreground">
                  <strong className="text-foreground">Transparency Note:</strong> We earn commissions from some tools we recommend. 
                  We NEVER let this change our technical advice - if AWS is right for your use case, we'll say so, 
                  even if Hostinger pays us more. Your trust matters more than any commission.
                </p>
              </div>
            </>
          )}
        </Card>
      )}
    </div>
  );
}
