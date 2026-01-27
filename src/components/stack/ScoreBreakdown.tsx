import { Card } from '@/components/ui/card';
import type { StackScore } from '@/lib/scoring/stack-scorer';

interface ScoreBreakdownProps {
  breakdown: StackScore['breakdown'];
}

export function ScoreBreakdown({ breakdown }: ScoreBreakdownProps) {
  const goodPoints = breakdown.goodChoices.reduce((sum, item) => sum + item.points, 0);
  const issuePoints = breakdown.issues.reduce((sum, item) => sum + item.points, 0);

  return (
    <div className="mb-8 space-y-4">
      <h2 className="text-xl font-semibold mb-4 text-foreground">📊 Score Breakdown</h2>

      {/* Good Choices */}
      {breakdown.goodChoices.length > 0 && (
        <Card className="p-4 bg-green-500/10 border-green-500/30">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xl">✅</span>
            <h3 className="font-semibold text-foreground">
              Good Choices (+{goodPoints} points)
            </h3>
          </div>
          <ul className="space-y-2">
            {breakdown.goodChoices.map((item, idx) => (
              <li key={idx} className="text-sm text-foreground">
                • {item.tool && <span className="font-medium">{item.tool}: </span>}
                {item.reason}
              </li>
            ))}
          </ul>
        </Card>
      )}

      {/* Issues Found */}
      {breakdown.issues.length > 0 && (
        <Card className="p-4 bg-red-500/10 border-red-500/30">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xl">⚠️</span>
            <h3 className="font-semibold text-foreground">
              Issues Found ({issuePoints} points)
            </h3>
          </div>
          <ul className="space-y-3">
            {breakdown.issues.map((item, idx) => (
              <li key={idx} className="text-sm">
                <div className="flex items-start gap-2">
                  <span className={`
                    ${item.severity === 'high' ? 'text-red-600' : 'text-yellow-600'}
                    text-lg
                  `}>
                    {item.severity === 'high' ? '🔴' : '🟡'}
                  </span>
                  <div className="flex-1">
                    <div className="font-medium text-foreground">{item.reason}</div>
                    {item.tool && (
                      <div className="text-muted-foreground text-xs mt-1">{item.tool}</div>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {/* How is this calculated? */}
      <button className="text-sm text-blue-600 hover:underline">
        How is this score calculated? →
      </button>
    </div>
  );
}
