/**
 * AI-powered budget alternatives generator
 * Uses context-aware AI to suggest budget-friendly alternatives with honest tradeoffs
 */

import { callAIWithFallback } from './aiProvider';
import { supabase } from './supabase';
import { getAffiliateLink } from '@/data/affiliateLinks';

export interface Tool {
  id: string;
  name: string;
  slug: string;
  category: string;
  website_url?: string;
  base_price?: number | null;
  logo_url?: string;
}

export interface BudgetContext {
  expectedUsers?: number;
  budget?: 'low' | 'medium' | 'high' | 'enterprise';
  useCase?: 'side-project' | 'startup' | 'production' | 'enterprise';
  complexity?: 'low' | 'medium' | 'high';
  currentMonthlyCost?: number;
}

export interface BudgetAlternative {
  currentTool: Tool;
  alternativeTool: Tool;
  monthlySavings: number;
  tradeoffs: string[];
  reason: string;
  contextAppropriate: boolean; // Whether this alternative fits the user's context
  aiScore: number; // 0-100, how good this alternative is for the context
}

export interface BudgetAlternativesResult {
  alternatives: BudgetAlternative[];
  totalSavings: number;
  contextAnalysis: string;
  recommendations: string[];
}

/**
 * Build prompt for AI to generate budget alternatives
 */
function buildBudgetPrompt(
  tools: Tool[],
  context?: BudgetContext
): string {
  const toolsList = tools
    .map(t => {
      const cost = t.base_price ? `$${t.base_price}/month` : 'Free';
      return `- ${t.name}${t.category ? ` (${t.category})` : ''} - ${cost}`;
    })
    .join('\n');

  // Provide default context if none given - assume it's a general use case
  const effectiveContext = context || {
    expectedUsers: 1000, // Default: medium scale
    budget: 'medium',
    useCase: 'startup',
    complexity: 'medium',
  };

  const contextInfo = `\nUser Context:
- Expected Users: ${effectiveContext.expectedUsers || 1000}
- Budget Level: ${effectiveContext.budget || 'medium'}
- Use Case: ${effectiveContext.useCase || 'startup'}
- Complexity: ${effectiveContext.complexity || 'medium'}
- Current Monthly Cost: ${effectiveContext.currentMonthlyCost ? `$${effectiveContext.currentMonthlyCost}` : 'Not specified'}`;

  return `You are an honest tech stack consultant focused on helping users optimize costs WITHOUT compromising on what they actually need.

Your task: Analyze these tools and suggest budget-friendly alternatives that are CONTEXT-APPROPRIATE.

Current Stack:
${toolsList}${contextInfo}

IMPORTANT: You MUST provide recommendations. Even if context is not fully specified, you should still provide recommendations based on common use cases. Assume reasonable defaults:
- If no user count specified → Assume 100-1000 users (small to medium scale)
- If no use case specified → Assume startup/side project
- If no budget specified → Assume medium budget

DO NOT return skip_reason unless ALL of the following are true:
1. Every single tool in the stack is completely free (base_price = 0)
2. There are NO paid alternatives that could provide better value
3. The stack is already perfectly optimized for cost

If even ONE tool has a cost > $0, you MUST provide at least 1 alternative.

CRITICAL RULES:
1. **Context is King**: Only suggest alternatives that are ACTUALLY appropriate for the user's context
   - If they have 10K+ users → Don't suggest Hostinger for AWS (that's wrong)
   - If they have 50 users/day → Don't suggest AWS for Hostinger (that's overkill)
   - Match the recommendation to the ACTUAL use case
   - BUT: If context is unclear, provide alternatives with clear "when to use" guidance

2. **Be Honest About Tradeoffs**: Every budget alternative has tradeoffs. List them clearly:
   - What features/capabilities they'll lose
   - What migration effort is required
   - What scaling limitations exist
   - Be specific, not generic

3. **Calculate Real Savings**: Only suggest alternatives if there's meaningful savings ($5+/month)

4. **Context-Appropriate Scoring**: Rate each alternative 0-100 based on:
   - Technical fit for their use case (70%)
   - Cost savings (20%)
   - Migration effort (10%)

5. **Always Provide Value**: Even if the stack seems optimized, look for:
   - Tools that might be overkill for the use case
   - Free/open-source alternatives to paid tools
   - Tools with better free tiers
   - Consolidation opportunities (one tool replacing multiple)

Return ONLY valid JSON in this exact format (no markdown, no code blocks):
{
  "context_analysis": "Brief analysis of whether budget optimization makes sense for this stack and context",
  "alternatives": [
    {
      "current_tool_name": "Current Tool Name",
      "alternative_tool_name": "Alternative Tool Name",
      "monthly_savings": 25.00,
      "reason": "Why this alternative is good for their specific context (be specific, reference their use case)",
      "tradeoffs": [
        "Specific tradeoff 1 (be detailed)",
        "Specific tradeoff 2 (be detailed)",
        "Specific tradeoff 3 (be detailed)"
      ],
      "context_appropriate": true,
      "ai_score": 85,
      "migration_effort": "low|medium|high",
      "when_to_consider": "When this alternative makes sense (e.g., 'If you have < 1000 users and don't need autoscaling')"
    }
  ],
  "total_savings": 50.00,
  "recommendations": [
    "Overall recommendation 1",
    "Overall recommendation 2"
  ],
  "skip_reason": null
}

IMPORTANT: You MUST provide at least 1-2 alternatives if there are any tools with costs > $0. Even if context is limited, provide alternatives with clear guidance on when they're appropriate.

Only set skip_reason if ALL tools are free/open-source AND there are no better free alternatives available.

Be brutally honest. Your credibility matters more than any commission.

CRITICAL: If you return skip_reason, you MUST have a very good reason (all tools are free AND no better alternatives exist). Otherwise, provide at least 1-2 alternatives even if context is limited.`;
}

/**
 * Generate budget alternatives using AI
 */
export async function generateBudgetAlternatives(
  tools: Tool[],
  context?: BudgetContext
): Promise<BudgetAlternativesResult> {
  const prompt = buildBudgetPrompt(tools, context);

  try {
    console.log('🤖 [AI] Generating budget alternatives...');
    const { text, provider } = await callAIWithFallback(prompt, {
      model: 'gemini-2.0-flash-exp',
      temperature: 0.7,
      maxTokens: 2048,
    });

    console.log(`✅ [AI] Budget alternatives received from ${provider}`);

    // Parse JSON from response
    let jsonText = text.trim();
    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    } else if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/```\n?/g, '');
    }

    const aiResult = JSON.parse(jsonText);

    // If AI says to skip, check if it's a valid reason
    // Only skip if ALL tools are free AND no alternatives exist
    const hasPaidTools = tools.some(t => (t.base_price || 0) > 0);
    if (aiResult.skip_reason && !hasPaidTools) {
      return {
        alternatives: [],
        totalSavings: 0,
        contextAnalysis: aiResult.skip_reason || 'All tools are free - no budget optimization needed.',
        recommendations: [],
      };
    }

    // If AI says to skip but there are paid tools, ignore skip_reason and continue
    if (aiResult.skip_reason && hasPaidTools) {
      console.warn('AI suggested skipping but paid tools exist. Continuing anyway.');
    }

    // Fetch actual tool data from database for alternatives
    const alternatives: BudgetAlternative[] = [];

    for (const alt of aiResult.alternatives || []) {
      // Find current tool
      const currentTool = tools.find(t => 
        t.name.toLowerCase() === alt.current_tool_name.toLowerCase()
      );

      if (!currentTool) continue;

      // Search for alternative tool in database
      const { data: altTools } = await supabase
        .from('tools')
        .select('id, name, slug, category, website_url, base_price, logo_url')
        .ilike('name', `%${alt.alternative_tool_name}%`)
        .eq('status', 'approved')
        .limit(1);

      if (altTools && altTools.length > 0) {
        const altTool = altTools[0];
        const currentPrice = currentTool.base_price || 0;
        const altPrice = altTool.base_price || 0;
        const savings = currentPrice - altPrice;

        // Only include if there's actual savings
        if (savings > 0) {
          alternatives.push({
            currentTool,
            alternativeTool: altTool,
            monthlySavings: savings,
            tradeoffs: alt.tradeoffs || [],
            reason: alt.reason || `Save $${savings.toFixed(2)}/month with ${altTool.name}`,
            contextAppropriate: alt.context_appropriate !== false,
            aiScore: alt.ai_score || 50,
          });
        }
      }
    }

    return {
      alternatives,
      totalSavings: aiResult.total_savings || alternatives.reduce((sum, alt) => sum + alt.monthlySavings, 0),
      contextAnalysis: aiResult.context_analysis || '',
      recommendations: aiResult.recommendations || [],
    };
  } catch (error: any) {
    console.error('❌ [AI] Error generating budget alternatives:', error);
    
    // Try to extract JSON from error response
    if (error.message?.includes('JSON') || error.message?.includes('parse')) {
      const text = error.response?.text() || error.message || '';
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          const aiResult = JSON.parse(jsonMatch[0]);
          // Process same as above
          return {
            alternatives: [],
            totalSavings: 0,
            contextAnalysis: aiResult.skip_reason || 'Error parsing AI response',
            recommendations: [],
          };
        } catch (e) {
          console.error('Failed to parse extracted JSON:', e);
        }
      }
    }
    
    throw new Error(`Failed to generate budget alternatives: ${error.message}`);
  }
}
