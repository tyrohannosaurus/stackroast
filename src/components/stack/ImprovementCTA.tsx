import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { StackScore } from '@/lib/scoring/stack-scorer';
import { useNavigate } from 'react-router-dom';
import { Sparkles } from 'lucide-react';

interface ImprovementCTAProps {
  currentScore: number;
  improvementPotential: {
    technical: number;
    budget: number;
  };
  breakdown: StackScore['breakdown'];
  stackId: string;
  stackSlug: string;
}

export function ImprovementCTA({ 
  currentScore, 
  improvementPotential, 
  breakdown,
  stackId,
  stackSlug
}: ImprovementCTAProps) {
  const navigate = useNavigate();
  const technicalGain = improvementPotential.technical - currentScore;
  const budgetGain = improvementPotential.budget - currentScore;

  const handleSelectPath = (path: 'technical' | 'budget') => {
    // Scroll to recommendations section and highlight the selected path
    const recommendationsSection = document.getElementById('recommendations-section');
    if (recommendationsSection) {
      recommendationsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      // Store preference in sessionStorage for AlternativeSuggestions component
      sessionStorage.setItem('recommendationPath', path);
      // Trigger a small delay then scroll to show the section
      setTimeout(() => {
        recommendationsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  };

  return (
    <Card className="my-8 p-6 bg-gradient-to-br from-orange-500/10 to-red-500/10 border-orange-500/30">
      <div className="flex gap-4 items-start">
        <div className="text-4xl">😬</div>
        <div className="flex-1">
          <h3 className="text-xl font-bold mb-2 text-foreground">
            Want to improve your score to {improvementPotential.technical}/100?
          </h3>
          
          <div className="mb-4 space-y-1 text-sm text-muted-foreground">
            <div>💡 Fix these issues to gain +{technicalGain} points:</div>
            {breakdown.issues.slice(0, 3).map((issue, idx) => (
              <div key={idx}>
                • {issue.reason}
              </div>
            ))}
          </div>
          
          <Card className="bg-background p-5 border-2 border-orange-500/30">
            <div className="text-sm font-medium mb-4 text-center text-foreground">
              🎯 Get AI-Powered Recommendations
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
              {/* Technical Path */}
              <Button
                onClick={() => handleSelectPath('technical')}
                size="lg"
                className="w-full gap-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white border-0 shadow-lg hover:shadow-blue-500/50 transition-all font-semibold"
              >
                <Sparkles className="w-4 h-4" />
                Best Score
              </Button>

              {/* Budget Path */}
              <Button
                onClick={() => handleSelectPath('budget')}
                size="lg"
                className="w-full gap-2 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white border-0 shadow-lg hover:shadow-green-500/50 transition-all font-semibold"
              >
                <Sparkles className="w-4 h-4" />
                Best Value
              </Button>
            </div>
            
            <div className="text-xs text-center text-muted-foreground">
              or scroll down to see all recommendations
            </div>
          </Card>

          {/* After-improvement preview */}
          <div className="mt-4 text-sm text-muted-foreground text-center">
            After fixes: <span className="font-semibold text-foreground">YourStack ⭐ ({improvementPotential.technical}/100)</span>
          </div>
        </div>
      </div>
    </Card>
  );
}
