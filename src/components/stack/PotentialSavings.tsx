import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DollarSign, Clock, AlertTriangle, TrendingUp, ChevronDown, ChevronUp } from 'lucide-react';
import type { SavingsBreakdown, ToolChange } from '@/lib/savings/calculate-savings';

interface PotentialSavingsProps {
  savings: SavingsBreakdown;
  onApplyChanges?: () => void;
}

export function PotentialSavings({ savings, onApplyChanges }: PotentialSavingsProps) {
  const [hourlyRate, setHourlyRate] = useState(50);
  const [expanded, setExpanded] = useState(false);

  const totalAnnualValue = savings.roi.annualValueAtRate(hourlyRate);
  const hasTimeSavings = savings.time.annual > 0;
  const hasMonetarySavings = savings.monetary.annual !== 0;

  return (
    <Card className="my-8 p-6 bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-500/30">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="w-6 h-6 text-green-600" />
        <h3 className="text-xl font-bold text-foreground">
          Potential Savings with Budget Path
        </h3>
      </div>

      {/* Quick Summary */}
      <div className="flex items-center justify-center gap-6 mb-6">
        {/* Monetary Savings */}
        {hasMonetarySavings && (
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <DollarSign className="w-5 h-5 text-green-600" />
              <span className="text-3xl font-bold text-green-700">
                ${Math.abs(savings.monetary.annual).toLocaleString()}
              </span>
            </div>
            <div className="text-sm text-muted-foreground">
              {savings.monetary.annual >= 0 ? 'saved' : 'added cost'} per year
            </div>
          </div>
        )}

        {/* Plus sign if both exist */}
        {hasMonetarySavings && hasTimeSavings && (
          <div className="text-3xl font-bold text-muted-foreground">+</div>
        )}

        {/* Time Savings */}
        {hasTimeSavings && (
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <Clock className="w-5 h-5 text-blue-600" />
              <span className="text-3xl font-bold text-blue-700">
                {Math.round(savings.time.annual)}h
              </span>
            </div>
            <div className="text-sm text-muted-foreground">saved per year</div>
          </div>
        )}
      </div>

      {/* Detailed Breakdown */}
      <div className="mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setExpanded(!expanded)}
          className="text-sm text-blue-600 hover:text-blue-700 mb-3"
        >
          {expanded ? (
            <>
              <ChevronUp className="w-4 h-4 mr-1" />
              Hide detailed breakdown
            </>
          ) : (
            <>
              <ChevronDown className="w-4 h-4 mr-1" />
              Show detailed breakdown
            </>
          )}
        </Button>

        {expanded && (
          <div className="space-y-3">
            {savings.changes.map((change, idx) => (
              <Card
                key={idx}
                className="p-3 bg-background border-border"
              >
                {/* From → To */}
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-medium text-foreground">{change.from.name}</span>
                  <span className="text-muted-foreground">→</span>
                  <span className="font-medium text-green-700">
                    {change.to.name}
                    {change.to.isAffiliate && <span className="text-blue-600 ml-1">*</span>}
                  </span>
                </div>

                {/* Benefits */}
                <div className="flex flex-wrap gap-2 mb-2">
                  {change.from.price !== change.to.price && (
                    <span className={`text-xs px-2 py-1 rounded ${
                      change.from.price > change.to.price
                        ? 'bg-green-100 text-green-700'
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {change.from.price > change.to.price ? '-' : '+'}$
                      {Math.abs((change.from.price - change.to.price) * 12).toLocaleString()}/year
                    </span>
                  )}
                  
                  {hasTimeSavings && (
                    <span className="text-xs px-2 py-1 rounded bg-blue-100 text-blue-700">
                      ~{Math.round(calculateTimeSavingsForChange(change) * 12)}h/year
                    </span>
                  )}
                </div>

                {/* Reasoning */}
                <div className="text-sm text-muted-foreground mb-2">
                  {change.reasoning}
                </div>

                {/* Affiliate link */}
                {change.to.isAffiliate && change.to.affiliateUrl && (
                  <a
                    href={change.to.affiliateUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:underline inline-block"
                  >
                    Try {change.to.name} →
                  </a>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Migration Warning */}
      {savings.migration.timeRequired > 0 && (
        <Card className="mb-6 p-4 bg-yellow-500/10 border-yellow-500/30">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <div className="font-semibold text-foreground mb-2">
                One-Time Migration Cost
              </div>
              <div className="text-sm text-muted-foreground mb-2">
                Estimated time: ~{savings.migration.timeRequired} hours
                ({savings.migration.complexity} complexity)
              </div>
              
              {expanded && (
                <div className="text-sm text-muted-foreground">
                  <div className="font-medium mb-1">Steps involved:</div>
                  <ul className="list-disc list-inside space-y-1">
                    {savings.migration.steps.map((step, idx) => (
                      <li key={idx}>{step}</li>
                    ))}
                  </ul>
                </div>
              )}

              {savings.roi.breakEvenMonths < Infinity && (
                <div className="mt-2 text-sm font-medium text-green-700">
                  ✅ Break-even point: {Math.ceil(savings.roi.breakEvenMonths)} months
                </div>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* ROI Calculator */}
      <Card className="p-4 bg-blue-500/10 border-blue-500/30">
        <div className="font-semibold text-foreground mb-3">
          💡 Calculate Your Total Value
        </div>
        
        <div className="flex items-center gap-3 mb-3">
          <label className="text-sm text-muted-foreground">
            Your hourly rate:
          </label>
          <div className="flex items-center">
            <span className="text-muted-foreground">$</span>
            <input
              type="number"
              value={hourlyRate}
              onChange={(e) => setHourlyRate(Number(e.target.value))}
              className="w-20 px-2 py-1 border border-border rounded ml-1 bg-background text-foreground"
              min="0"
              step="5"
            />
            <span className="text-muted-foreground ml-1">/hour</span>
          </div>
        </div>

        <div className="space-y-2 text-sm">
          {hasMonetarySavings && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Money saved:</span>
              <span className="font-medium text-green-700">
                ${savings.monetary.annual.toLocaleString()}
              </span>
            </div>
          )}
          
          {hasTimeSavings && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">
                Time saved ({Math.round(savings.time.annual)}h):
              </span>
              <span className="font-medium text-green-700">
                ${Math.round(savings.time.annual * hourlyRate).toLocaleString()}
              </span>
            </div>
          )}
          
          <div className="flex justify-between text-red-700">
            <span>Migration cost ({savings.migration.timeRequired}h):</span>
            <span className="font-medium">
              -${Math.round(savings.migration.timeRequired * hourlyRate).toLocaleString()}
            </span>
          </div>
          
          <div className="pt-2 border-t border-border">
            <div className="flex justify-between items-center">
              <span className="font-semibold text-foreground">
                Net Annual Value:
              </span>
              <span className={`text-2xl font-bold ${
                totalAnnualValue >= 0 ? 'text-green-700' : 'text-red-700'
              }`}>
                ${Math.round(totalAnnualValue).toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {totalAnnualValue >= 0 ? (
          <div className="mt-3 text-sm text-green-700 font-medium">
            🎉 This optimization is worth it!
          </div>
        ) : (
          <div className="mt-3 text-sm text-red-700 font-medium">
            ⚠️ At your hourly rate, this might not be worth the migration effort
          </div>
        )}
      </Card>

      {/* Apply Changes Button */}
      {onApplyChanges && (
        <Button
          onClick={onApplyChanges}
          className="w-full mt-4 bg-green-600 text-white hover:bg-green-700"
        >
          Apply These Changes
        </Button>
      )}

      {/* Affiliate Disclosure */}
      <div className="mt-4 text-xs text-muted-foreground">
        * We earn a commission if you sign up through our links.
        This doesn't affect the savings calculations.
      </div>
    </Card>
  );
}

// Helper function - same as in calculate-savings.ts
function calculateTimeSavingsForChange(change: ToolChange): number {
  let timeSaved = 0;
  
  if (change.from.setupTime && change.to.setupTime) {
    timeSaved += (change.from.setupTime - change.to.setupTime) / 12;
  }
  
  if (change.from.maintenanceTime && change.to.maintenanceTime) {
    timeSaved += change.from.maintenanceTime - change.to.maintenanceTime;
  }
  
  if (change.from.complexityScore && change.to.complexityScore) {
    timeSaved += (change.from.complexityScore - change.to.complexityScore) * 0.5;
  }
  
  return Math.max(0, timeSaved);
}
