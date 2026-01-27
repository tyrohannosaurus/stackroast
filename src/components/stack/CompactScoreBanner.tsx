import { Badge } from '@/components/ui/badge';
import type { StackScore } from '@/lib/scoring/stack-scorer';

interface CompactScoreBannerProps {
  score: StackScore;
}

const badgeConfig = {
  'needs-work': { color: 'red', icon: '🔴', label: 'Needs Work', bgColor: 'bg-red-500/10', borderColor: 'border-red-500/30', textColor: 'text-red-600' },
  'below-average': { color: 'yellow', icon: '🟡', label: 'Below Average', bgColor: 'bg-yellow-500/10', borderColor: 'border-yellow-500/30', textColor: 'text-yellow-600' },
  'good': { color: 'green', icon: '🟢', label: 'Good', bgColor: 'bg-green-500/10', borderColor: 'border-green-500/30', textColor: 'text-green-600' },
  'great': { color: 'blue', icon: '🔵', label: 'Great', bgColor: 'bg-blue-500/10', borderColor: 'border-blue-500/30', textColor: 'text-blue-600' },
  'excellent': { color: 'purple', icon: '🟣', label: 'Excellent', bgColor: 'bg-purple-500/10', borderColor: 'border-purple-500/30', textColor: 'text-purple-600' },
  'perfect': { color: 'gold', icon: '⭐', label: 'Perfect', bgColor: 'bg-yellow-500/10', borderColor: 'border-yellow-500/30', textColor: 'text-yellow-600' }
};

export function CompactScoreBanner({ score }: CompactScoreBannerProps) {
  const config = badgeConfig[score.badge];

  return (
    <div className={`mb-6 p-4 rounded-lg border-2 ${config.borderColor} ${config.bgColor}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🎯</span>
          <div>
            <div className="text-sm text-muted-foreground">Stack Health Score</div>
            <div className="text-2xl font-bold text-foreground">{score.overall}/100</div>
          </div>
          <Badge className={`${config.bgColor} ${config.textColor} ${config.borderColor} border`}>
            {config.icon} {config.label}
          </Badge>
          {score.improvementPotential.technical > score.overall && (
            <span className="text-sm text-muted-foreground">
              • Improvable to {score.improvementPotential.technical}/100
            </span>
          )}
        </div>
        
        <div className="text-sm text-muted-foreground">
          Better than {score.percentile}% of stacks
        </div>
      </div>
      
      {/* Compact Score Bar */}
      <div className="mt-3">
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-500 ${
              score.overall >= 80 ? 'bg-green-500' :
              score.overall >= 60 ? 'bg-blue-500' :
              score.overall >= 40 ? 'bg-yellow-500' :
              'bg-red-500'
            }`}
            style={{ width: `${score.overall}%` }}
          />
        </div>
      </div>
    </div>
  );
}
