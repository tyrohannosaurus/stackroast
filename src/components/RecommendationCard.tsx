import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ExternalLink, AlertTriangle, Zap, TrendingUp, Users, Flame } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { RecommendationType } from './AlternativeSuggestions';
import { UrgencyBadge, getUrgencyType } from './UrgencyBadge';
import { ToolLogo } from '@/components/ToolLogo';

interface RecommendationCardProps {
  rec: {
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
  };
  onAlternativeClick: (currentTool: string, alternativeName: string, affiliateUrl?: string | null) => void;
  getSeverityColor: (severity: string) => string;
  getSeverityIcon: (severity: string) => React.ReactNode;
}

export function RecommendationCard({
  rec,
  onAlternativeClick,
  getSeverityColor,
  getSeverityIcon,
}: RecommendationCardProps) {
  const [toolData, setToolData] = useState<any>(null);

  useEffect(() => {
    supabase
      .from('tools')
      .select('id, name, logo_url, affiliate_link, website_url')
      .ilike('name', `%${rec.toolName}%`)
      .eq('status', 'approved')
      .limit(1)
      .maybeSingle()
      .then(({ data }) => setToolData(data));
  }, [rec.toolName]);

  const getTypeStyles = () => {
    switch (rec.type) {
      case 'budget':
        return 'bg-gum-green-light border border-gum-green/20';
      case 'missing':
        return 'bg-gum-blue-light border border-gum-blue/20';
      case 'replacement':
        return rec.isSponsored
          ? 'bg-gum-pink-light border border-primary/20'
          : 'bg-card border border-border';
    }
  };

  return (
    <div className={`p-4 rounded-lg hover:shadow-md transition-all ${getTypeStyles()}`}>
      <div className="flex items-start gap-4">
          <ToolLogo
            src={toolData?.logo_url}
            alt={rec.toolName}
            size="lg"
          />
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <h4 className="font-bold text-foreground">{rec.toolName}</h4>
              {rec.currentTool && (
                <>
                  <span className="text-muted-foreground">→</span>
                  <span className="text-sm text-muted-foreground">
                    replaces {rec.currentTool}
                  </span>
                </>
              )}
              {rec.severity && (
                <Badge variant="outline" className={`${getSeverityColor(rec.severity)} rounded-full`}>
                  {getSeverityIcon(rec.severity)}
                  <span className="ml-1 capitalize">{rec.severity}</span>
                </Badge>
              )}
              {rec.contextScore && (
                <Badge variant="outline" className="bg-primary/10 text-primary text-xs rounded-full font-semibold">
                  Fit: {rec.contextScore}/100
                </Badge>
              )}
              {/* Urgency badges for conversion */}
              {getUrgencyType({ name: rec.toolName }) && (
                <UrgencyBadge type={getUrgencyType({ name: rec.toolName })!} />
              )}
            </div>
            <p className="text-sm text-muted-foreground mb-3 leading-relaxed">{rec.reason}</p>
            {rec.tradeoffs && rec.tradeoffs.length > 0 && (
              <div className="mb-3 p-3 bg-muted/50 rounded-xl">
                <div className="flex items-center gap-2 mb-1">
                  <AlertTriangle className="w-3 h-3 text-destructive" />
                  <span className="text-xs font-bold text-foreground">Consider before switching:</span>
                </div>
                <ul className="list-disc list-inside space-y-0.5 text-xs text-muted-foreground ml-4">
                  {rec.tradeoffs.slice(0, 2).map((tradeoff, i) => (
                    <li key={i}>{tradeoff}</li>
                  ))}
                </ul>
              </div>
            )}
            <div className="flex flex-wrap items-center gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Cost: </span>
                <span className="font-bold text-foreground">{rec.estimatedCost}</span>
              </div>
              {rec.savings?.money && (
                <div className="text-primary font-bold">💰 {rec.savings.money}</div>
              )}
              {rec.savings?.time && (
                <div className="text-primary font-bold">⏱️ {rec.savings.time}</div>
              )}
            </div>
          </div>
          <div className="flex flex-col gap-2 shrink-0">
            <Button
              size="default"
              className="rounded-full"
              onClick={() =>
                onAlternativeClick(
                  rec.currentTool || '',
                  rec.toolName,
                  rec.affiliateUrl || toolData?.affiliate_link || toolData?.website_url
                )
              }
            >
              {/* Benefit-first CTA text */}
              {rec.savings?.money ? (
                <>Save {rec.savings.money}</>
              ) : rec.type === 'missing' ? (
                <>Get {rec.toolName}</>
              ) : rec.severity === 'high' ? (
                <>Switch Now</>
              ) : (
                <>Try Free</>
              )}
              <ExternalLink className="w-3.5 h-3.5 ml-1.5" />
            </Button>
            {/* Social proof micro-copy */}
            {rec.contextScore && rec.contextScore >= 80 && (
              <div className="flex items-center justify-center gap-1 text-xs text-primary font-bold">
                <Zap className="w-3 h-3" />
                <span>{rec.contextScore}% match</span>
              </div>
            )}
            {!rec.contextScore && rec.isSponsored && (
              <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground font-medium">
                <Users className="w-3 h-3" />
                <span>Popular choice</span>
              </div>
            )}
          </div>
        </div>
      </div>
  );
}
