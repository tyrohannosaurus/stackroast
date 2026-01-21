import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DollarSign, Wrench, ChevronRight, Star } from 'lucide-react';
import { type StackKit, DIFFICULTY_INFO, CATEGORY_INFO } from '@/data/stackKits';

interface StackKitCardProps {
  kit: StackKit;
  onClick: () => void;
  featured?: boolean;
  compact?: boolean;
}

export function StackKitCard({ kit, onClick, featured, compact }: StackKitCardProps) {
  const difficultyInfo = DIFFICULTY_INFO[kit.difficulty];
  const categoryInfo = CATEGORY_INFO[kit.category];

  if (compact) {
    return (
      <Card 
        className="p-4 hover:border-orange-500/50 cursor-pointer transition-all group"
        onClick={onClick}
      >
        <div className="flex items-center gap-4">
          {/* Icon */}
          <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center text-2xl shrink-0">
            {kit.icon}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold truncate">{kit.name}</h3>
              {featured && <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />}
            </div>
            <p className="text-sm text-muted-foreground truncate">{kit.tagline}</p>
          </div>

          {/* Meta */}
          <div className="flex items-center gap-4 shrink-0">
            <div className="text-sm text-muted-foreground">
              <Wrench className="w-4 h-4 inline mr-1" />
              {kit.tools.length}
            </div>
            <div className="text-sm">
              {kit.totalMonthlyCost === 0 ? (
                <span className="text-green-500 font-medium">Free</span>
              ) : (
                <span className="text-muted-foreground">${kit.totalMonthlyCost}/mo</span>
              )}
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-orange-500 transition-colors" />
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card 
      className={`overflow-hidden hover:border-orange-500/50 cursor-pointer transition-all group ${
        featured ? 'ring-2 ring-orange-500/30' : ''
      }`}
      onClick={onClick}
    >
      {/* Header */}
      <div className="p-6 pb-4">
        <div className="flex items-start justify-between mb-3">
          <div className="w-14 h-14 rounded-xl bg-muted flex items-center justify-center text-3xl">
            {kit.icon}
          </div>
          <div className="flex items-center gap-2">
            {featured && (
              <Badge className="bg-yellow-500/20 text-yellow-500 border-yellow-500/30">
                <Star className="w-3 h-3 mr-1 fill-current" />
                Featured
              </Badge>
            )}
            <Badge variant="outline" className={difficultyInfo.color}>
              {difficultyInfo.label}
            </Badge>
          </div>
        </div>

        <h3 className="font-bold text-lg mb-1 group-hover:text-orange-400 transition-colors">
          {kit.name}
        </h3>
        <p className="text-sm text-muted-foreground line-clamp-2">
          {kit.tagline}
        </p>
      </div>

      {/* Tools Preview */}
      <div className="px-6 pb-4">
        <div className="flex flex-wrap gap-1.5">
          {kit.tools.slice(0, 5).map((tool, i) => (
            <Badge key={i} variant="secondary" className="text-xs">
              {tool.name}
            </Badge>
          ))}
          {kit.tools.length > 5 && (
            <Badge variant="secondary" className="text-xs bg-orange-500/10 text-orange-400">
              +{kit.tools.length - 5} more
            </Badge>
          )}
        </div>
      </div>

      {/* Highlights */}
      <div className="px-6 pb-4">
        <ul className="space-y-1">
          {kit.highlights.slice(0, 2).map((highlight, i) => (
            <li key={i} className="text-xs text-muted-foreground flex items-center gap-2">
              <span className="w-1 h-1 rounded-full bg-orange-500" />
              {highlight}
            </li>
          ))}
        </ul>
      </div>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-border bg-muted/30 flex items-center justify-between">
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-1 text-muted-foreground">
            <Wrench className="w-4 h-4" />
            <span>{kit.tools.length} tools</span>
          </div>
          <div className="flex items-center gap-1">
            <DollarSign className="w-4 h-4" />
            {kit.totalMonthlyCost === 0 ? (
              <span className="text-green-500 font-medium">Free</span>
            ) : (
              <span className="text-muted-foreground">${kit.totalMonthlyCost}/mo</span>
            )}
          </div>
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          className="text-orange-400 hover:text-orange-300 hover:bg-orange-500/10"
        >
          View Kit
          <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      </div>
    </Card>
  );
}
