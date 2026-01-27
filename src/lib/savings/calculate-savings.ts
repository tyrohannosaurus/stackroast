/**
 * Savings calculation logic for budget optimization
 * Calculates monetary savings, time savings, migration costs, and ROI
 */

import type { BudgetAlternative } from '../generateBudgetAlternatives';

export interface ToolChange {
  from: {
    name: string;
    slug: string;
    price: number; // monthly
    setupTime?: number; // hours
    maintenanceTime?: number; // hours/month
    complexityScore?: number; // 1-10
  };
  to: {
    name: string;
    slug: string;
    price: number;
    setupTime?: number;
    maintenanceTime?: number;
    complexityScore?: number;
    isAffiliate?: boolean;
    affiliateUrl?: string;
  };
  reasoning: string;
  category: string;
}

export interface SavingsBreakdown {
  monetary: {
    monthly: number;
    annual: number;
  };
  time: {
    monthly: number; // hours saved per month
    annual: number; // hours saved per year
  };
  migration: {
    timeRequired: number; // hours
    complexity: 'easy' | 'moderate' | 'hard';
    steps: string[];
  };
  changes: ToolChange[];
  roi: {
    breakEvenMonths: number;
    annualValueAtRate: (hourlyRate: number) => number;
  };
}

/**
 * Convert BudgetAlternatives to ToolChanges and calculate savings
 */
export function calculateSavingsFromAlternatives(
  alternatives: BudgetAlternative[]
): SavingsBreakdown {
  const changes: ToolChange[] = alternatives.map(alt => {
    // Use tool metadata if available, otherwise estimate
    const fromSetupTime = (alt.currentTool as any).setup_time ?? estimateSetupTime(alt.currentTool.category);
    const fromMaintenanceTime = (alt.currentTool as any).maintenance_time ?? estimateMaintenanceTime(alt.currentTool.category);
    const fromComplexityScore = (alt.currentTool as any).complexity_score ?? estimateComplexityScore(alt.currentTool.category);
    
    const toSetupTime = (alt.alternativeTool as any).setup_time ?? estimateSetupTime(alt.alternativeTool.category);
    const toMaintenanceTime = (alt.alternativeTool as any).maintenance_time ?? estimateMaintenanceTime(alt.alternativeTool.category);
    const toComplexityScore = (alt.alternativeTool as any).complexity_score ?? estimateComplexityScore(alt.alternativeTool.category);

    return {
      from: {
        name: alt.currentTool.name,
        slug: alt.currentTool.slug,
        price: alt.currentTool.base_price || 0,
        setupTime: fromSetupTime,
        maintenanceTime: fromMaintenanceTime,
        complexityScore: fromComplexityScore,
      },
      to: {
        name: alt.alternativeTool.name,
        slug: alt.alternativeTool.slug,
        price: alt.alternativeTool.base_price || 0,
        setupTime: toSetupTime,
        maintenanceTime: toMaintenanceTime,
        complexityScore: toComplexityScore,
        isAffiliate: !!alt.alternativeTool.website_url, // Simplified - check affiliate links
        affiliateUrl: alt.alternativeTool.website_url,
      },
      reasoning: alt.reason,
      category: alt.currentTool.category || 'other',
    };
  });

  return calculateSavings(changes);
}

/**
 * Calculate savings breakdown from tool changes
 */
export function calculateSavings(changes: ToolChange[]): SavingsBreakdown {
  let monetaryMonthlySavings = 0;
  let timeMonthlySavings = 0;
  let migrationTime = 0;
  let migrationSteps: string[] = [];

  changes.forEach(change => {
    // Calculate monetary savings
    const priceDiff = change.from.price - change.to.price;
    monetaryMonthlySavings += priceDiff;

    // Calculate time savings (if data available)
    const timeSaved = calculateTimeSavingsForChange(change);
    timeMonthlySavings += timeSaved;

    // Calculate migration effort
    const migration = estimateMigrationEffort(change);
    migrationTime += migration.hours;
    migrationSteps.push(...migration.steps);
  });

  // Calculate break-even point
  const breakEvenMonths = timeMonthlySavings > 0 
    ? migrationTime / timeMonthlySavings 
    : Infinity;

  return {
    monetary: {
      monthly: monetaryMonthlySavings,
      annual: monetaryMonthlySavings * 12
    },
    time: {
      monthly: timeMonthlySavings,
      annual: timeMonthlySavings * 12
    },
    migration: {
      timeRequired: migrationTime,
      complexity: estimateComplexity(migrationTime, changes),
      steps: migrationSteps
    },
    changes,
    roi: {
      breakEvenMonths,
      annualValueAtRate: (hourlyRate: number) => {
        const monetaryValue = monetaryMonthlySavings * 12;
        const timeValue = (timeMonthlySavings * 12) * hourlyRate;
        const migrationCost = migrationTime * hourlyRate;
        return monetaryValue + timeValue - migrationCost;
      }
    }
  };
}

/**
 * Calculate time savings for a single tool change
 */
function calculateTimeSavingsForChange(change: ToolChange): number {
  let timeSaved = 0;

  // Setup time difference (amortized over 12 months)
  if (change.from.setupTime && change.to.setupTime) {
    const setupDiff = change.from.setupTime - change.to.setupTime;
    timeSaved += setupDiff / 12; // Amortize over a year
  }

  // Ongoing maintenance time difference
  if (change.from.maintenanceTime && change.to.maintenanceTime) {
    const maintenanceDiff = change.from.maintenanceTime - change.to.maintenanceTime;
    timeSaved += maintenanceDiff;
  }

  // Complexity reduction (estimate)
  if (change.from.complexityScore && change.to.complexityScore) {
    const complexityDiff = change.from.complexityScore - change.to.complexityScore;
    // Assume 0.5 hours per complexity point per month
    timeSaved += complexityDiff * 0.5;
  }

  return Math.max(0, timeSaved); // Don't show negative time savings
}

/**
 * Estimate migration effort for a tool change
 */
function estimateMigrationEffort(change: ToolChange): { hours: number; steps: string[] } {
  const category = change.category.toLowerCase();
  
  const migrationEstimates: Record<string, { hours: number; steps: string[] }> = {
    'design': {
      hours: 3,
      steps: [
        `Export designs from ${change.from.name}`,
        `Set up ${change.to.name} account`,
        'Recreate key templates',
        'Train team on new tool'
      ]
    },
    'hosting': {
      hours: 4,
      steps: [
        'Set up new hosting account',
        'Configure deployment pipeline',
        'Migrate DNS settings',
        'Test deployment',
        'Update team documentation'
      ]
    },
    'analytics': {
      hours: 1,
      steps: [
        'Add tracking code',
        'Configure events',
        'Set up dashboard',
        'Verify data collection'
      ]
    },
    'database': {
      hours: 6,
      steps: [
        'Backup existing data',
        'Set up new database',
        'Migrate data',
        'Update connection strings',
        'Test queries',
        'Monitor performance'
      ]
    },
    'monitoring': {
      hours: 2,
      steps: [
        'Set up monitoring account',
        'Configure alerts',
        'Integrate with existing tools',
        'Test alerting'
      ]
    },
    'cicd': {
      hours: 3,
      steps: [
        'Set up CI/CD pipeline',
        'Configure build scripts',
        'Set up deployment workflows',
        'Test pipeline'
      ]
    },
    'default': {
      hours: 2,
      steps: [
        `Set up ${change.to.name}`,
        'Migrate configuration',
        'Test functionality'
      ]
    }
  };

  return migrationEstimates[category] || migrationEstimates['default'];
}

/**
 * Estimate overall migration complexity
 */
function estimateComplexity(
  totalMigrationHours: number,
  changes: ToolChange[]
): 'easy' | 'moderate' | 'hard' {
  if (totalMigrationHours <= 3) return 'easy';
  if (totalMigrationHours <= 8) return 'moderate';
  return 'hard';
}

/**
 * Estimate setup time based on category (fallback when not in DB)
 */
function estimateSetupTime(category: string): number {
  const estimates: Record<string, number> = {
    'design': 2,
    'hosting': 3,
    'analytics': 1,
    'database': 4,
    'monitoring': 2,
    'cicd': 3,
  };
  return estimates[category.toLowerCase()] || 2;
}

/**
 * Estimate maintenance time based on category (fallback when not in DB)
 */
function estimateMaintenanceTime(category: string): number {
  const estimates: Record<string, number> = {
    'design': 0.5,
    'hosting': 1,
    'analytics': 0.25,
    'database': 2,
    'monitoring': 0.5,
    'cicd': 1,
  };
  return estimates[category.toLowerCase()] || 0.5;
}

/**
 * Estimate complexity score based on category (fallback when not in DB)
 */
function estimateComplexityScore(category: string): number {
  const estimates: Record<string, number> = {
    'design': 3,
    'hosting': 5,
    'analytics': 2,
    'database': 7,
    'monitoring': 4,
    'cicd': 6,
  };
  return estimates[category.toLowerCase()] || 5;
}
