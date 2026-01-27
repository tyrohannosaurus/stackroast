/**
 * Stack Health Scoring System
 * Calculates a 0-100 score for tech stacks based on:
 * - Tool quality and context fit
 * - Cost optimization
 * - Best practices
 * - Missing critical tools
 */

import type { StackContext } from '../contextRecommendations';
import { scoreRecommendation } from '../contextRecommendations';

export interface StackScore {
  overall: number; // 0-100
  breakdown: {
    goodChoices: ScoringItem[];
    issues: ScoringItem[];
    optimizations: ScoringItem[];
  };
  improvementPotential: {
    technical: number; // What score they can reach with best tools
    budget: number; // What score they can reach with budget tools
  };
  badge: ScoreBadge;
  percentile: number; // 0-100, where they rank vs all stacks
}

export interface ScoringItem {
  tool?: string;
  category?: string;
  reason: string;
  points: number;
  severity?: 'high' | 'medium' | 'low';
}

export type ScoreBadge = 
  | 'needs-work'    // 0-40
  | 'below-average' // 41-60
  | 'good'          // 61-75
  | 'great'         // 76-85
  | 'excellent'     // 86-95
  | 'perfect';      // 96-100

export interface Tool {
  id: string;
  name: string;
  category: string;
  base_price?: number | null;
  website_url?: string;
  logo_url?: string;
}

export interface Stack {
  id: string;
  name: string;
  tools: Tool[];
}

interface ToolScore {
  technicalFit: number;
  contextFit: number;
}

/**
 * Calculate stack health score
 */
export function calculateStackScore(
  stack: Stack,
  context: StackContext
): StackScore {
  let score = 50; // Base score for having a functional stack
  const breakdown = {
    goodChoices: [] as ScoringItem[],
    issues: [] as ScoringItem[],
    optimizations: [] as ScoringItem[]
  };

  // Normalize context
  const normalizedContext: StackContext = {
    expectedUsers: context.expectedUsers || 100,
    budget: context.budget || 'medium',
    complexity: context.complexity || 'medium',
    useCase: context.useCase || 'startup',
    scalingNeeds: context.scalingNeeds || false,
  };

  // 1. GOOD CHOICES: +5 points each (max +30)
  stack.tools.forEach(tool => {
    const toolScore = scoreToolForContext(tool, normalizedContext);
    if (toolScore.technicalFit >= 80) {
      score += 5;
      breakdown.goodChoices.push({
        tool: tool.name,
        reason: `Perfect match for ${normalizedContext.useCase} stage`,
        points: 5
      });
    }
  });

  // 2. OVERPRICED TOOLS: -20 points
  const overpricedTools = stack.tools.filter(tool => {
    const toolScore = scoreToolForContext(tool, normalizedContext);
    const price = tool.base_price || 0;
    return (
      price > 0 &&
      normalizedContext.budget === 'low' &&
      toolScore.contextFit < 60 // Not appropriate for their budget
    );
  });
  if (overpricedTools.length > 0) {
    score -= 20;
    breakdown.issues.push({
      category: 'cost',
      reason: `Overpriced tools for ${normalizedContext.budget} budget`,
      points: -20,
      severity: 'high',
      tool: overpricedTools.map(t => t.name).join(', ')
    });
  }

  // 3. MISSING CRITICAL TOOLS: -10 points each
  const missingTools = [];
  if (!hasToolInCategory(stack, 'analytics')) {
    missingTools.push('Analytics');
    score -= 10;
  }
  if (!hasToolInCategory(stack, 'monitoring')) {
    missingTools.push('Error Monitoring');
    score -= 10;
  }
  if (normalizedContext.useCase === 'production' && !hasToolInCategory(stack, 'cicd')) {
    missingTools.push('CI/CD');
    score -= 10;
  }
  if (missingTools.length > 0) {
    breakdown.issues.push({
      category: 'missing',
      reason: `Missing critical tools: ${missingTools.join(', ')}`,
      points: -10 * missingTools.length,
      severity: 'high'
    });
  }

  // 4. SUBOPTIMAL CHOICES: -15 points
  const suboptimalTools = stack.tools.filter(tool => {
    const toolScore = scoreToolForContext(tool, normalizedContext);
    return toolScore.technicalFit >= 40 && toolScore.technicalFit < 70;
  });
  if (suboptimalTools.length > 0) {
    score -= 15;
    breakdown.issues.push({
      category: 'suboptimal',
      reason: 'Some tools not ideal for your context',
      points: -15,
      severity: 'medium',
      tool: suboptimalTools.map(t => t.name).join(', ')
    });
  }

  // 5. BEST PRACTICES BONUS: +3-4 points each
  if (hasToolInCategory(stack, 'typescript')) {
    score += 3;
    breakdown.goodChoices.push({
      category: 'best-practice',
      reason: 'Using TypeScript for type safety',
      points: 3
    });
  }
  if (hasToolInCategory(stack, 'testing')) {
    score += 3;
    breakdown.goodChoices.push({
      category: 'best-practice',
      reason: 'Has testing framework',
      points: 3
    });
  }
  if (hasToolInCategory(stack, 'cicd')) {
    score += 4;
    breakdown.goodChoices.push({
      category: 'best-practice',
      reason: 'CI/CD pipeline configured',
      points: 4
    });
  }

  // Cap score between 0-100
  score = Math.min(100, Math.max(0, Math.round(score)));

  // Calculate improvement potential
  const improvementPotential = calculateImprovementPotential(
    breakdown,
    stack,
    normalizedContext
  );

  // Determine badge
  const badge = getScoreBadge(score);

  // Calculate percentile (mock for now, will be real from DB later)
  const percentile = calculatePercentile(score);

  return {
    overall: score,
    breakdown,
    improvementPotential,
    badge,
    percentile
  };
}

/**
 * Score a tool for context fit
 */
function scoreToolForContext(tool: Tool, context: StackContext): ToolScore {
  const technicalFit = scoreRecommendation(tool.name, context);
  
  // Context fit considers budget appropriateness
  let contextFit = technicalFit;
  const price = tool.base_price || 0;
  
  if (context.budget === 'low' && price > 20) {
    contextFit -= 30; // Penalize expensive tools for low budget
  } else if (context.budget === 'enterprise' && price < 10) {
    contextFit -= 20; // Penalize cheap tools for enterprise
  }
  
  return {
    technicalFit,
    contextFit: Math.max(0, Math.min(100, contextFit))
  };
}

/**
 * Get score badge based on score
 */
function getScoreBadge(score: number): ScoreBadge {
  if (score <= 40) return 'needs-work';
  if (score <= 60) return 'below-average';
  if (score <= 75) return 'good';
  if (score <= 85) return 'great';
  if (score <= 95) return 'excellent';
  return 'perfect';
}

/**
 * Calculate percentile (estimated implementation)
 * Note: This uses an estimated distribution. For accurate percentiles,
 * query the database: SELECT COUNT(*) FROM stacks WHERE score_overall <= $score / (SELECT COUNT(*) FROM stacks WHERE score_overall IS NOT NULL)
 */
function calculatePercentile(score: number): number {
  // Estimated implementation based on typical score distribution
  // For accurate percentiles, implement a database query that compares
  // this stack's score against all other stacks with scores
  if (score <= 40) return 20;
  if (score <= 50) return 35;
  if (score <= 60) return 50;
  if (score <= 70) return 65;
  if (score <= 80) return 80;
  if (score <= 90) return 90;
  return 95;
}

/**
 * Calculate improvement potential
 */
function calculateImprovementPotential(
  breakdown: StackScore['breakdown'],
  stack: Stack,
  context: StackContext
): { technical: number; budget: number } {
  let technicalGain = 0;
  let budgetGain = 0;

  // Calculate how many points they can gain
  breakdown.issues.forEach(issue => {
    // Technical path: fix everything optimally
    technicalGain += Math.abs(issue.points);
    
    // Budget path: fix cost issues, add critical tools only
    if (issue.severity === 'high') {
      budgetGain += Math.abs(issue.points) * 0.7; // Partial fix
    }
  });

  // Get current score estimate
  const currentScore = 50 + 
    breakdown.goodChoices.reduce((sum, item) => sum + item.points, 0) +
    breakdown.issues.reduce((sum, item) => sum + item.points, 0);

  return {
    technical: Math.min(100, Math.round(currentScore + technicalGain)),
    budget: Math.min(100, Math.round(currentScore + budgetGain))
  };
}

/**
 * Check if stack has a tool in a specific category
 */
function hasToolInCategory(stack: Stack, category: string): boolean {
  return stack.tools.some(tool => {
    const toolCategory = tool.category?.toLowerCase() || '';
    return toolCategory.includes(category.toLowerCase());
  });
}

/**
 * Analyze stack context from tools
 * This is a helper to infer context when not explicitly provided
 */
export function analyzeStackContext(stack: Stack): StackContext {
  const totalCost = stack.tools.reduce((sum, tool) => sum + (tool.base_price || 0), 0);
  const hasEnterpriseTools = stack.tools.some(tool => 
    ['AWS', 'Google Cloud', 'Azure', 'GCP'].includes(tool.name)
  );
  const hasSimpleHosting = stack.tools.some(tool =>
    ['Hostinger', 'Bluehost', 'Vercel', 'Netlify'].includes(tool.name)
  );

  let budget: StackContext['budget'] = 'medium';
  if (totalCost > 200) budget = 'enterprise';
  else if (totalCost < 20) budget = 'low';

  let useCase: StackContext['useCase'] = 'startup';
  if (hasEnterpriseTools) useCase = 'production';
  else if (hasSimpleHosting && totalCost < 20) useCase = 'side-project';

  let complexity: StackContext['complexity'] = 'medium';
  if (hasEnterpriseTools) complexity = 'high';
  else if (hasSimpleHosting && stack.tools.length < 5) complexity = 'low';

  return {
    expectedUsers: 1000, // Default assumption
    budget,
    complexity,
    useCase,
    scalingNeeds: hasEnterpriseTools
  };
}
