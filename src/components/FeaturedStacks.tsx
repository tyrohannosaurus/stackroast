import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import { Sparkles, ExternalLink, ArrowRight } from 'lucide-react';
import { trackFeaturedStackClick } from '@/lib/analytics';
// Autoplay plugin - optional, carousel works fine without it
// To enable autoplay, install: npm install embla-carousel-autoplay

interface FeaturedStack {
  id: string;
  stack_id: string;
  sponsor_name: string;
  sponsor_logo_url?: string;
  cta_text: string;
  priority: number;
  stack: {
    id: string;
    name: string;
    slug: string;
    burn_score?: number;
    total_cost?: number;
    ai_roast_summary?: string;
  };
}

interface FeaturedStacksProps {
  limit?: number;
  showCarousel?: boolean;
  className?: string;
}

export function FeaturedStacks({
  limit = 3,
  showCarousel = true,
  className = '',
}: FeaturedStacksProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [featuredStacks, setFeaturedStacks] = useState<FeaturedStack[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadFeaturedStacks() {
      try {
        const { data, error } = await supabase
          .from('featured_stacks')
          .select(`
            id,
            stack_id,
            sponsor_name,
            sponsor_logo_url,
            cta_text,
            priority,
            stack:stacks (
              id,
              name,
              slug,
              burn_score,
              total_cost,
              ai_roast_summary
            )
          `)
          .eq('active', true)
          .gte('end_date', new Date().toISOString().split('T')[0])
          .lte('start_date', new Date().toISOString().split('T')[0])
          .order('priority', { ascending: false })
          .order('created_at', { ascending: false })
          .limit(limit);

        if (error) throw error;

        setFeaturedStacks((data || []) as FeaturedStack[]);
      } catch (error) {
        console.error('Error loading featured stacks:', error);
      } finally {
        setLoading(false);
      }
    }

    loadFeaturedStacks();
  }, [limit]);

  const handleClick = async (featuredStack: FeaturedStack) => {
    // Track click
    await trackFeaturedStackClick(
      featuredStack.stack_id,
      featuredStack.sponsor_name,
      user?.id,
      featuredStack.id
    );

    // Navigate to stack
    navigate(`/stack/${featuredStack.stack.slug}`);
  };

  if (loading) {
    return null; // Don't show loading state, just don't render
  }

  if (featuredStacks.length === 0) {
    return null; // Don't render if no featured stacks
  }

  // Single featured stack (no carousel needed)
  if (featuredStacks.length === 1 || !showCarousel) {
    const stack = featuredStacks[0];
    return (
      <Card
        className={`bg-gradient-to-br from-violet-500/20 via-purple-500/20 to-pink-500/20 border-violet-500/50 shadow-lg ${className}`}
      >
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            {stack.sponsor_logo_url && (
              <img
                src={stack.sponsor_logo_url}
                alt={stack.sponsor_name}
                className="w-16 h-16 object-contain rounded-lg bg-white/10 p-2"
              />
            )}
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Badge
                  variant="outline"
                  className="bg-violet-500/20 text-violet-400 border-violet-500/50"
                >
                  <Sparkles className="w-3 h-3 mr-1" />
                  Featured This Week
                </Badge>
                <Badge variant="outline" className="text-xs">
                  Sponsored
                </Badge>
              </div>
              <h3 className="text-xl font-bold mb-2 text-foreground">
                {stack.stack.name}
              </h3>
              <p className="text-sm text-muted-foreground mb-1">
                Sponsored by {stack.sponsor_name}
              </p>
              {stack.stack.ai_roast_summary && (
                <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                  {stack.stack.ai_roast_summary}
                </p>
              )}
              <Button
                onClick={() => handleClick(stack)}
                className="bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-600 hover:to-purple-600"
              >
                {stack.cta_text || 'View Stack'}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Multiple featured stacks - use carousel
  // Note: Autoplay can be added by installing embla-carousel-autoplay
  // For now, carousel works without autoplay (users can manually navigate)

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center gap-2">
        <Sparkles className="w-5 h-5 text-violet-500" />
        <h2 className="text-xl font-bold text-foreground">Featured This Week</h2>
      </div>
      <Carousel
        opts={{
          align: 'start',
          loop: true,
        }}
        className="w-full"
      >
        <CarouselContent>
          {featuredStacks.map((stack) => (
            <CarouselItem key={stack.id}>
              <Card className="bg-gradient-to-br from-violet-500/20 via-purple-500/20 to-pink-500/20 border-violet-500/50 shadow-lg">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    {stack.sponsor_logo_url && (
                      <img
                        src={stack.sponsor_logo_url}
                        alt={stack.sponsor_name}
                        className="w-16 h-16 object-contain rounded-lg bg-white/10 p-2 flex-shrink-0"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <Badge
                          variant="outline"
                          className="bg-violet-500/20 text-violet-400 border-violet-500/50"
                        >
                          <Sparkles className="w-3 h-3 mr-1" />
                          Featured
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          Sponsored
                        </Badge>
                      </div>
                      <h3 className="text-xl font-bold mb-2 text-foreground">
                        {stack.stack.name}
                      </h3>
                      <p className="text-sm text-muted-foreground mb-1">
                        Sponsored by {stack.sponsor_name}
                      </p>
                      {stack.stack.ai_roast_summary && (
                        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                          {stack.stack.ai_roast_summary}
                        </p>
                      )}
                      {stack.stack.burn_score !== undefined && (
                        <div className="flex items-center gap-4 mb-4 text-sm">
                          <div className="flex items-center gap-1">
                            <span className="text-orange-500 font-bold">
                              {stack.stack.burn_score}
                            </span>
                            <span className="text-muted-foreground">burn score</span>
                          </div>
                          {stack.stack.total_cost !== undefined &&
                            stack.stack.total_cost > 0 && (
                              <div className="text-muted-foreground">
                                ${stack.stack.total_cost.toFixed(0)}/mo
                              </div>
                            )}
                        </div>
                      )}
                      <Button
                        onClick={() => handleClick(stack)}
                        className="bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-600 hover:to-purple-600"
                      >
                        {stack.cta_text || 'View Stack'}
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className="left-0" />
        <CarouselNext className="right-0" />
      </Carousel>
    </div>
  );
}
