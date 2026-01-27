import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { LoadingFire } from '@/components/LoadingFire';
import { generateStackAlternatives, generateStackImprovements, type StackAlternativesResult } from '@/lib/generateRoast';
import { generateBudgetAlternatives, type BudgetAlternative } from '@/lib/generateBudgetAlternatives';
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
  CheckCircle2,
  Plus,
  Lightbulb
} from 'lucide-react';
import { toast } from 'sonner';
import type { Tool } from '@/types';
import { RecommendationCard } from './RecommendationCard';
import { PotentialSavings } from '@/components/stack/PotentialSavings';
import { calculateSavingsFromAlternatives } from '@/lib/savings/calculate-savings';
import type { BudgetAlternativesResult } from '@/lib/generateBudgetAlternatives';

interface AlternativeSuggestionsProps {
  stackId: string;
  stackName: string;
  tools: Tool[];
  existingAlternatives?: StackAlternativesResult | null;
  currentMonthlyCost?: number;
}

// Unified recommendation type
export type RecommendationType = 'missing' | 'budget' | 'replacement';

interface UnifiedRecommendation {
  type: RecommendationType;
  category: string;
  currentTool?: string;
  toolName: string;
  reason: string;
  estimatedCost: string;
  savings?: {
    money: string;
    time?: string;
  };
  severity?: 'high' | 'medium' | 'low';
  priority: number;
  affiliateUrl?: string | null;
  isSponsored?: boolean;
  tradeoffs?: string[];
  contextScore?: number;
}

export function AlternativeSuggestions({
  stackId,
  stackName,
  tools,
  existingAlternatives,
  currentMonthlyCost,
}: AlternativeSuggestionsProps) {
  const { user } = useAuth();
  const [alternatives, setAlternatives] = useState<StackAlternativesResult | null>(
    existingAlternatives || null
  );
  const [unifiedRecommendations, setUnifiedRecommendations] = useState<UnifiedRecommendation[]>([]);
  const [loading, setLoading] = useState(!existingAlternatives);
  const [error, setError] = useState<string | null>(null);
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const [totalSavings, setTotalSavings] = useState({ monthly: 0, yearly: 0, hours: 0 });
  const [budgetAlternativesData, setBudgetAlternativesData] = useState<BudgetAlternativesResult | null>(null);
  const [selectedPath, setSelectedPath] = useState<'technical' | 'budget' | null>(null);

  // Check if user selected budget path from ImprovementCTA
  useEffect(() => {
    const path = sessionStorage.getItem('recommendationPath') as 'technical' | 'budget' | null;
    if (path) {
      setSelectedPath(path);
      sessionStorage.removeItem('recommendationPath'); // Clear after reading
    }
  }, []);

  useEffect(() => {
    async function loadAlternatives() {
      // Check if we have tools to analyze
      if (!tools || tools.length === 0) {
        console.warn('⚠️ No tools provided for alternatives analysis');
        setError('No tools in this stack to analyze');
        setLoading(false);
        return;
      }
      
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

      // Generate unified recommendations from all three sources
      try {
        setLoading(true);
        setError(null);
        
        console.log('🔄 Generating unified recommendations for stack:', stackName);
        console.log('🔧 Tools:', tools.map(t => t.name));
        
        // Call all three AI functions in parallel
        const [replacements, missingTools, budgetAlternatives] = await Promise.all([
          // 1. Better Alternatives (replace weak tools)
          generateStackAlternatives(
            stackName,
            tools.map(t => ({
              name: t.name,
              category: t.category,
              base_price: t.base_price,
            }))
          ).catch(err => {
            console.warn('⚠️ Failed to generate replacements:', err);
            return null;
          }),
          
          // 2. Fix My Stack (missing tools)
          generateStackImprovements(
            stackName,
            tools.map(t => ({
              name: t.name,
              category: t.category || '',
              base_price: t.base_price || 0,
            }))
          ).catch(err => {
            console.warn('⚠️ Failed to generate missing tools:', err);
            return null;
          }),
          
          // 3. Fix My Budget (cheaper alternatives)
          generateBudgetAlternatives(
            tools.map(t => ({
              id: t.id || '',
              name: t.name,
              slug: t.slug || '',
              category: t.category || '',
              website_url: t.website_url,
              base_price: t.base_price || 0,
              logo_url: t.logo_url,
            })),
            { currentMonthlyCost }
          ).catch(err => {
            console.warn('⚠️ Failed to generate budget alternatives:', err);
            return null;
          }),
        ]);

        // All recommendations generated successfully

        // Combine all recommendations into unified format
        const unified: UnifiedRecommendation[] = [];

        // 1. Add replacement recommendations (from Better Alternatives)
        if (replacements) {
          setAlternatives(replacements); // Keep for backward compatibility
          
          replacements.alternatives.forEach(category => {
            category.suggestions.forEach(suggestion => {
              unified.push({
                type: 'replacement',
                category: category.category,
                currentTool: category.current_tool,
                toolName: suggestion.name,
                reason: suggestion.reason,
                estimatedCost: suggestion.estimated_cost,
                savings: suggestion.savings,
                priority: suggestion.priority || 1,
                affiliateUrl: suggestion.affiliate_url,
                isSponsored: suggestion.is_sponsored,
              });
            });
          });
        }

        // 2. Add missing tool recommendations (from Fix My Stack)
        if (missingTools?.suggestions) {
          for (const suggestion of missingTools.suggestions) {
            // Try to find tool in database
            const { data: tool } = await supabase
              .from('tools')
              .select('id, name, slug, category, website_url, base_price, logo_url, affiliate_link')
              .ilike('name', `%${suggestion.tool_name}%`)
              .eq('status', 'approved')
              .limit(1)
              .maybeSingle();

            unified.push({
              type: 'missing',
              category: suggestion.category,
              toolName: suggestion.tool_name,
              reason: suggestion.recommendation,
              estimatedCost: tool?.base_price ? `$${tool.base_price}/month` : 'Free tier available',
              severity: suggestion.severity as 'high' | 'medium' | 'low',
              priority: suggestion.severity === 'high' ? 1 : suggestion.severity === 'medium' ? 2 : 3,
              affiliateUrl: tool?.affiliate_link || tool?.website_url,
            });
          }
        }

        // 3. Add budget alternatives (from Fix My Budget)
        if (budgetAlternatives?.alternatives) {
          // Store budget alternatives for PotentialSavings component
          // Budget alternatives found - will be used for PotentialSavings component
          setBudgetAlternativesData(budgetAlternatives);
          
          budgetAlternatives.alternatives.forEach(alt => {
            unified.push({
              type: 'budget',
              category: alt.currentTool.category,
              currentTool: alt.currentTool.name,
              toolName: alt.alternativeTool.name,
              reason: alt.reason,
              estimatedCost: alt.alternativeTool.base_price ? `$${alt.alternativeTool.base_price}/month` : 'Free',
              savings: {
                money: `$${alt.monthlySavings.toFixed(2)}/month`,
              },
              priority: alt.contextAppropriate ? 1 : 2,
              affiliateUrl: alt.alternativeTool.website_url,
              tradeoffs: alt.tradeoffs,
              contextScore: alt.aiScore,
            });
          });
        }

        // Sort by priority (high severity first, then by priority)
        unified.sort((a, b) => {
          const severityOrder = { high: 1, medium: 2, low: 3 };
          const aSeverity = severityOrder[a.severity || 'low'];
          const bSeverity = severityOrder[b.severity || 'low'];
          if (aSeverity !== bSeverity) return aSeverity - bSeverity;
          return a.priority - b.priority;
        });

        setUnifiedRecommendations(unified);

        // Calculate total savings
        let monthlySavings = 0;
        let yearlySavings = 0;
        let hoursSaved = 0;

        if (replacements?.total_savings) {
          const monthly = parseFloat(replacements.total_savings.monthly_money.replace(/[^0-9.]/g, '')) || 0;
          const yearly = parseFloat(replacements.total_savings.yearly_money.replace(/[^0-9.]/g, '')) || 0;
          const hours = parseFloat(replacements.total_savings.monthly_hours.replace(/[^0-9.]/g, '')) || 0;
          monthlySavings += monthly;
          yearlySavings += yearly;
          hoursSaved += hours;
        }

        if (budgetAlternatives) {
          monthlySavings += budgetAlternatives.totalSavings;
          yearlySavings += budgetAlternatives.totalSavings * 12;
        }

        setTotalSavings({
          monthly: monthlySavings,
          yearly: yearlySavings,
          hours: hoursSaved,
        });

        // Save to database (if column exists)
        if (replacements) {
          try {
            const { error: updateError } = await supabase
              .from('stacks')
              .update({
                ai_alternatives: replacements,
                alternatives_generated_at: new Date().toISOString(),
              })
              .eq('id', stackId);

            if (updateError && updateError.code !== '42703') {
              console.error('Error saving alternatives to DB:', updateError);
            }
          } catch (dbError: any) {
            if (dbError?.code !== '42703') {
              console.error('Error saving alternatives to DB:', dbError);
            }
          }
        }

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
        console.error('❌ Error generating alternatives:', err);
        console.error('Error details:', {
          message: err.message,
          name: err.name,
          stack: err.stack,
        });
        
        // Provide more specific error messages
        let errorMessage = 'Failed to generate alternatives';
        if (err.message?.includes('API key')) {
          errorMessage = 'AI API key is not configured. Please contact the administrator.';
        } else if (err.message?.includes('Rate limit') || err.message?.includes('quota')) {
          errorMessage = 'Rate limit reached. Please try again in a few moments.';
        } else if (err.message?.includes('network') || err.message?.includes('fetch')) {
          errorMessage = 'Network error. Please check your connection and try again.';
        } else if (err.message) {
          errorMessage = err.message;
        }
        
        setError(errorMessage);
        toast.error(errorMessage);
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

  const getRecommendationTypeLabel = (type: RecommendationType) => {
    switch (type) {
      case 'missing':
        return { label: 'Missing Tool', icon: Plus, color: 'bg-blue-500/20 text-blue-400 border-blue-500/50' };
      case 'budget':
        return { label: 'Budget Alternative', icon: DollarSign, color: 'bg-green-500/20 text-green-400 border-green-500/50' };
      case 'replacement':
        return { label: 'Better Replacement', icon: TrendingDown, color: 'bg-orange-500/20 text-orange-400 border-orange-500/50' };
    }
  };

  if (loading) {
    return (
      <Card className="bg-gradient-to-br from-violet-500/10 to-purple-500/10 border-violet-500/30">
        <CardContent className="pt-6">
          <LoadingFire size="md" text="Analyzing your stack with AI (Fix My Stack + Fix My Budget + Better Alternatives)..." />
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

  if (unifiedRecommendations.length === 0 && (!alternatives || alternatives.weak_tools.length === 0)) {
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

  // Group recommendations by category
  const recommendationsByCategory = unifiedRecommendations.reduce((acc, rec) => {
    if (!acc[rec.category]) {
      acc[rec.category] = [];
    }
    acc[rec.category].push(rec);
    return acc;
  }, {} as Record<string, UnifiedRecommendation[]>);

  // Check if there are budget-type recommendations
  const hasBudgetRecommendations = unifiedRecommendations.some(rec => rec.type === 'budget');

  // Get all categories
  const categories = Object.keys(recommendationsByCategory).sort();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Filter recommendations by selected category (for backward compatibility)
  const filteredRecommendations = selectedCategory === 'all' 
    ? recommendationsByCategory 
    : { [selectedCategory]: recommendationsByCategory[selectedCategory] || [] };

  // For each category, organize recommendations: Primary (highest score), Budget (cheapest), Keep Current (if applicable)
  const organizeRecommendationsByCategory = (recs: UnifiedRecommendation[]) => {
    // Sort by priority/score
    const sorted = [...recs].sort((a, b) => {
      // Primary: highest context score or priority
      const aScore = a.contextScore || (a.severity === 'high' ? 100 : a.severity === 'medium' ? 50 : 25);
      const bScore = b.contextScore || (b.severity === 'high' ? 100 : b.severity === 'medium' ? 50 : 25);
      return bScore - aScore;
    });

    const primary = sorted[0]; // Best match
    const budget = sorted.find(r => r.type === 'budget') || sorted.find(r => r.savings?.money); // Budget option
    const others = sorted.filter(r => r !== primary && r !== budget);

    return { primary, budget, others };
  };

  // Helper function to render recommendations for a category
  const renderCategoryRecommendations = (category: string, recs: UnifiedRecommendation[]) => {
    if (recs.length === 0) return null;
    
    const organized = organizeRecommendationsByCategory(recs);
    const currentTool = recs[0].currentTool;
    
    return (
      <div className="space-y-4">
        {/* Category Header */}
        <div className="flex items-center justify-between pb-2 border-b">
          <div>
            <h3 className="text-lg font-bold text-foreground">{category}</h3>
            {currentTool && (
              <p className="text-sm text-muted-foreground">
                Current: <span className="font-medium">{currentTool}</span>
              </p>
            )}
          </div>
          <Badge variant="outline" className="text-xs">
            {recs.length} option{recs.length !== 1 ? 's' : ''}
          </Badge>
        </div>

        {/* Primary Recommendation */}
        {organized.primary && (
          <div className="bg-gradient-to-br from-violet-500/10 to-purple-500/10 border-2 border-violet-500/30 rounded-lg p-1 shadow-lg">
            <div className="bg-background rounded-lg">
              <div className="p-4 pb-2">
                <div className="flex items-start gap-3 mb-3">
                  <Badge className="bg-violet-500 text-white text-sm font-semibold px-3 py-1">⭐ Best Match</Badge>
                  {organized.primary.contextScore && (
                    <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/30 text-sm font-semibold">
                      {organized.primary.contextScore}/100 Fit
                    </Badge>
                  )}
                  {organized.primary.severity && (
                    <Badge variant="outline" className={`${getSeverityColor(organized.primary.severity)} text-sm`}>
                      {getSeverityIcon(organized.primary.severity)}
                      <span className="ml-1 capitalize">{organized.primary.severity}</span>
                    </Badge>
                  )}
                </div>
              </div>
              <div className="px-4 pb-4">
                <RecommendationCard
                  rec={organized.primary}
                  onAlternativeClick={handleAlternativeClick}
                  getSeverityColor={getSeverityColor}
                  getSeverityIcon={getSeverityIcon}
                />
              </div>
            </div>
          </div>
        )}

        {/* Budget Alternative */}
        {organized.budget && organized.budget !== organized.primary && (
          <div className="bg-gradient-to-br from-green-500/5 to-emerald-500/5 border-2 border-green-500/20 rounded-lg p-1 shadow-md">
            <div className="bg-background rounded-lg">
              <div className="p-4 pb-2">
                <div className="flex items-start gap-3 mb-3">
                  <Badge className="bg-green-500 text-white text-sm font-semibold px-3 py-1">
                    💰 Budget Option
                  </Badge>
                  {organized.budget.savings?.money && (
                    <Badge variant="outline" className="bg-green-500/10 text-green-400 border-green-500/30 text-sm font-semibold">
                      {organized.budget.savings.money}
                    </Badge>
                  )}
                  {organized.budget.contextScore && (
                    <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/30 text-xs">
                      {organized.budget.contextScore}/100 Fit
                    </Badge>
                  )}
                </div>
              </div>
              <div className="px-4 pb-4">
                <RecommendationCard
                  rec={organized.budget}
                  onAlternativeClick={handleAlternativeClick}
                  getSeverityColor={getSeverityColor}
                  getSeverityIcon={getSeverityIcon}
                />
              </div>
            </div>
          </div>
        )}

        {/* Other Options */}
        {organized.others.length > 0 && (
          <Accordion type="single" collapsible>
            <AccordionItem value="more-options" className="border-none">
              <AccordionTrigger className="text-sm text-muted-foreground hover:no-underline py-2">
                {organized.others.length} more option{organized.others.length !== 1 ? 's' : ''}
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-3 pt-2">
                  {organized.others.map((rec, recIndex) => (
                    <RecommendationCard
                      key={`${rec.toolName}-${recIndex}`}
                      rec={rec}
                      onAlternativeClick={handleAlternativeClick}
                      getSeverityColor={getSeverityColor}
                      getSeverityIcon={getSeverityIcon}
                    />
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        )}

        {/* Keep Current Option (if score is low) */}
        {currentTool && organized.primary && organized.primary.contextScore && organized.primary.contextScore < 50 && (
          <Card className="bg-muted/30 border-border">
            <CardContent className="pt-4">
              <div className="flex items-start gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="font-semibold text-foreground">Keep {currentTool}</h4>
                    <Badge variant="outline" className="bg-amber-500/10 text-amber-400 border-amber-500/30">
                      {organized.primary.contextScore}/100 Fit
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                    Only recommended if you have specific requirements that {currentTool} uniquely provides.
                    {organized.primary.tradeoffs && organized.primary.tradeoffs.length > 0 && (
                      <> Consider switching if: {organized.primary.tradeoffs[0]}</>
                    )}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  };

  const hasSavings = totalSavings.monthly > 0 || (alternatives?.total_savings && parseFloat(alternatives.total_savings.monthly_money.replace(/[^0-9.]/g, '')) > 0);

  return (
    <div className="space-y-6">
      {/* Unified Recommendations with Category Tabs + Savings Banner Merged */}
      <Card className={`bg-card border-border shadow-lg ${hasSavings ? 'border-2 border-green-500/50' : ''}`}>
        <CardHeader className={hasSavings ? 'bg-gradient-to-r from-green-500/10 via-emerald-500/5 to-teal-500/10 pb-6' : ''}>
          <div className="flex flex-col gap-4">
            {/* Header with Title and Savings Stats */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex-1">
                <CardTitle className="text-2xl flex items-center gap-2 mb-2">
                  <Sparkles className="w-6 h-6 text-violet-400" />
                  Your Stack, Upgraded
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  AI-analyzed alternatives that fit your exact use case
                  {unifiedRecommendations.length > 0 && (
                    <> — {unifiedRecommendations.length} improvement{unifiedRecommendations.length !== 1 ? 's' : ''} ready</>
                  )}
                </p>
              </div>
              
              {/* Savings Stats - Integrated into Header */}
              {hasSavings && (
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  <div className="text-center px-4 py-2 bg-background/80 rounded-lg backdrop-blur-sm border border-green-500/30">
                    <p className="text-2xl font-bold text-green-500">
                      ${totalSavings.monthly > 0 ? totalSavings.monthly.toFixed(0) : alternatives?.total_savings?.monthly_money || '0'}
                    </p>
                    <p className="text-xs text-muted-foreground font-medium">per month</p>
                  </div>
                  <div className="text-center px-4 py-2 bg-background/80 rounded-lg backdrop-blur-sm border border-emerald-500/30">
                    <p className="text-2xl font-bold text-emerald-500">
                      ${totalSavings.yearly > 0 ? totalSavings.yearly.toFixed(0) : (alternatives?.total_savings?.yearly_money || '0')}
                    </p>
                    <p className="text-xs text-muted-foreground font-medium">per year</p>
                  </div>
                  {totalSavings.hours > 0 && (
                    <div className="text-center px-4 py-2 bg-background/80 rounded-lg backdrop-blur-sm border border-blue-500/30">
                      <p className="text-2xl font-bold text-blue-500">
                        {totalSavings.hours}h
                      </p>
                      <p className="text-xs text-muted-foreground font-medium">saved/month</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Savings Call-to-Action Banner */}
            {hasSavings && (
              <div className="pt-4 border-t border-green-500/20">
                <div className="flex items-center justify-between text-sm mb-2">
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-green-500" />
                    <span className="text-muted-foreground">Click any recommendation below to start saving</span>
                  </div>
                  <span className="text-green-500 font-semibold">Ready to claim</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full w-full bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500" />
                </div>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {/* Category Tabs */}
          {categories.length > 1 ? (
            <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="w-full">
              <TabsList className="inline-flex h-10 items-center justify-start rounded-md bg-muted p-1 text-muted-foreground overflow-x-auto w-full mb-6">
                <TabsTrigger value="all" className="text-xs whitespace-nowrap">
                  All ({unifiedRecommendations.length})
                </TabsTrigger>
                {categories.map(cat => (
                  <TabsTrigger key={cat} value={cat} className="text-xs whitespace-nowrap">
                    {cat} ({recommendationsByCategory[cat].length})
                  </TabsTrigger>
                ))}
              </TabsList>
              
              {unifiedRecommendations.length === 0 && alternatives ? (
            // Fallback to old format if unified is empty but alternatives exist
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
                        <Badge variant="outline" className={getSeverityColor(weakTool.severity)}>
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
              ) : (
                // New unified format with organized recommendations
                <>
                  <TabsContent value="all" className="mt-0">
                    <div className="space-y-6">
                      {Object.entries(recommendationsByCategory).map(([category, recs], categoryIndex) => (
                        <div key={`${category}-${categoryIndex}`}>
                          {renderCategoryRecommendations(category, recs)}
                        </div>
                      ))}
                    </div>
                  </TabsContent>
                  
                  {categories.map(cat => (
                    <TabsContent key={cat} value={cat} className="mt-0">
                      <div className="space-y-6">
                        {recommendationsByCategory[cat] && recommendationsByCategory[cat].length > 0 && (
                          renderCategoryRecommendations(cat, recommendationsByCategory[cat])
                        )}
                      </div>
                    </TabsContent>
                  ))}
                </>
              )}
            </Tabs>
          ) : (
            // No tabs - show all recommendations
            unifiedRecommendations.length === 0 && alternatives ? (
              // Fallback to old format if unified is empty but alternatives exist
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
                          <Badge variant="outline" className={getSeverityColor(weakTool.severity)}>
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
            ) : (
              // New unified format with organized recommendations (no tabs)
              <div className="space-y-6">
                {Object.entries(recommendationsByCategory).map(([category, recs], categoryIndex) => (
                  <div key={`${category}-${categoryIndex}`}>
                    {renderCategoryRecommendations(category, recs)}
                  </div>
                ))}
              </div>
            )
          )}
        </CardContent>
      </Card>

      {/* Potential Savings Section - Show when budget alternatives exist */}
      {(budgetAlternativesData && budgetAlternativesData.alternatives.length > 0) && (() => {
        try {
          const savings = calculateSavingsFromAlternatives(budgetAlternativesData.alternatives);
          return (
            <div className="mb-8">
              <PotentialSavings
                savings={savings}
                onApplyChanges={() => {
                  // Handle applying changes - could open affiliate links or track conversion
                  budgetAlternativesData.alternatives.forEach(alt => {
                    if (alt.alternativeTool.website_url) {
                      // Track the click
                      trackAlternativeClick(
                        stackId,
                        alt.currentTool.name,
                        alt.alternativeTool.name,
                        alt.alternativeTool.website_url,
                        user?.id
                      );
                    }
                  });
                  toast.success('Opening recommended tools...');
                }}
              />
            </div>
          );
        } catch (error) {
          console.error('❌ Error calculating savings:', error);
          console.error('Error details:', error);
          return (
            <Card className="my-8 p-6 bg-red-500/10 border-red-500/30">
              <p className="text-red-700">Error calculating savings. Please check console for details.</p>
            </Card>
          );
        }
      })()}

    </div>
  );
}
