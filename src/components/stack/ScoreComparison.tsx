import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { StackScore } from '@/lib/scoring/stack-scorer';
import { ArrowRight, TrendingUp } from 'lucide-react';

interface ScoreComparisonProps {
  originalScore: StackScore;
  recommendedScore?: StackScore; // Optional - calculated when recommendations are selected
  recommendations?: Array<{
    currentTool: string;
    recommendedTool: string;
    category: string;
  }>;
}

export function ScoreComparison({ 
  originalScore, 
  recommendedScore,
  recommendations = []
}: ScoreComparisonProps) {
  // If no recommended score provided, show placeholder
  const hasRecommendations = recommendedScore !== undefined;
  const scoreImprovement = hasRecommendations 
    ? recommendedScore.overall - originalScore.overall 
    : originalScore.improvementPotential.technical - originalScore.overall;

  return (
    <div className="mb-8 space-y-6">
      <h2 className="text-xl font-semibold mb-4 text-foreground flex items-center gap-2">
        <TrendingUp className="w-5 h-5" />
        Score Comparison
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Original Score */}
        <Card className="p-6 bg-card border-border">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-foreground">Current Stack</h3>
            <Badge variant="outline" className="text-lg font-bold">
              {originalScore.overall}/100
            </Badge>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Good Choices</span>
              <span className="font-medium text-green-600">
                +{originalScore.breakdown.goodChoices.reduce((sum, item) => sum + item.points, 0)} pts
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Issues Found</span>
              <span className="font-medium text-red-600">
                -{originalScore.breakdown.issues.reduce((sum, item) => sum + item.points, 0)} pts
              </span>
            </div>
            <div className="pt-2 border-t border-border">
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 ${
                    originalScore.overall >= 80 ? 'bg-green-500' :
                    originalScore.overall >= 60 ? 'bg-blue-500' :
                    originalScore.overall >= 40 ? 'bg-yellow-500' :
                    'bg-red-500'
                  }`}
                  style={{ width: `${originalScore.overall}%` }}
                />
              </div>
            </div>
          </div>
        </Card>

        {/* Recommended Score */}
        <Card className={`p-6 border-2 ${hasRecommendations ? 'bg-green-500/5 border-green-500/50' : 'bg-muted/30 border-border'}`}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-foreground">
              {hasRecommendations ? 'Recommended Stack' : 'Potential Score'}
            </h3>
            <Badge 
              variant={hasRecommendations ? 'default' : 'outline'} 
              className={`text-lg font-bold ${hasRecommendations ? 'bg-green-500 text-white' : ''}`}
            >
              {hasRecommendations ? recommendedScore.overall : originalScore.improvementPotential.technical}/100
            </Badge>
          </div>
          
          <div className="space-y-3">
            {hasRecommendations ? (
              <>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Good Choices</span>
                  <span className="font-medium text-green-600">
                    +{recommendedScore.breakdown.goodChoices.reduce((sum, item) => sum + item.points, 0)} pts
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Issues Found</span>
                  <span className="font-medium text-red-600">
                    -{recommendedScore.breakdown.issues.reduce((sum, item) => sum + item.points, 0)} pts
                  </span>
                </div>
              </>
            ) : (
              <div className="text-sm text-muted-foreground">
                Apply recommendations above to see projected score
              </div>
            )}
            
            <div className="pt-2 border-t border-border">
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 ${
                    (hasRecommendations ? recommendedScore.overall : originalScore.improvementPotential.technical) >= 80 ? 'bg-green-500' :
                    (hasRecommendations ? recommendedScore.overall : originalScore.improvementPotential.technical) >= 60 ? 'bg-blue-500' :
                    (hasRecommendations ? recommendedScore.overall : originalScore.improvementPotential.technical) >= 40 ? 'bg-yellow-500' :
                    'bg-red-500'
                  }`}
                  style={{ width: `${hasRecommendations ? recommendedScore.overall : originalScore.improvementPotential.technical}%` }}
                />
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Improvement Summary */}
      <Card className="p-6 bg-gradient-to-r from-green-500/10 to-emerald-500/10 border-green-500/30">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-foreground mb-2">Score Improvement</h3>
            <p className="text-sm text-muted-foreground">
              {hasRecommendations 
                ? `By applying the recommended changes, your stack score improves by ${scoreImprovement} points.`
                : `Your stack can be improved by up to ${scoreImprovement} points with the right recommendations.`
              }
            </p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-green-600 flex items-center gap-2">
              <ArrowRight className="w-6 h-6" />
              +{scoreImprovement}
            </div>
            <p className="text-xs text-muted-foreground mt-1">points</p>
          </div>
        </div>

        {/* Changes Summary */}
        {recommendations.length > 0 && (
          <div className="mt-4 pt-4 border-t border-green-500/20">
            <h4 className="text-sm font-semibold text-foreground mb-2">Key Changes:</h4>
            <ul className="space-y-1">
              {recommendations.slice(0, 5).map((rec, idx) => (
                <li key={idx} className="text-sm text-muted-foreground flex items-center gap-2">
                  <ArrowRight className="w-3 h-3 text-green-500" />
                  <span className="font-medium">{rec.currentTool}</span>
                  <span className="text-muted-foreground">→</span>
                  <span className="font-medium text-green-600">{rec.recommendedTool}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </Card>
    </div>
  );
}
