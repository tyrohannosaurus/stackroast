import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Search,
  ArrowLeft,
  Flame,
  Plus,
  Filter,
  LayoutGrid,
  List,
  Loader2
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { useSearchParams } from 'react-router-dom';
import type { StackKitWithStats, StackKitCategory } from '@/types/database';
import { StackKitCard } from '@/components/StackKitCard';
import { StackKitDetailDialog } from '@/components/StackKitDetailDialog';
import { SubmitKitDialog } from '@/components/SubmitKitDialog';
import { getKitByIdWithStats, getAllKitsWithStats } from '@/data/stackKits';

type CategoryFilter = 'all' | StackKitCategory;
type ViewMode = 'grid' | 'list';
type SortBy = 'newest' | 'popular' | 'views';

const CATEGORY_INFO: Record<StackKitCategory, { icon: string; label: string; description: string }> = {
  'Full Stack Development': {
    icon: '🌐',
    label: 'Full Stack',
    description: 'Complete development environments covering frontend, backend, and database'
  },
  'Frontend Development': {
    icon: '🎨',
    label: 'Frontend',
    description: 'Tools for building beautiful and interactive user interfaces'
  },
  'Backend Development': {
    icon: '⚙️',
    label: 'Backend',
    description: 'Server-side frameworks, APIs, and database management'
  },
  'Mobile Development': {
    icon: '📱',
    label: 'Mobile',
    description: 'Cross-platform and native mobile app development tools'
  },
  'DevOps & Infrastructure': {
    icon: '🔧',
    label: 'DevOps',
    description: 'Deployment, monitoring, and infrastructure management'
  },
  'Data & Analytics': {
    icon: '📊',
    label: 'Data',
    description: 'Data processing, analysis, and visualization tools'
  },
  'AI & Machine Learning': {
    icon: '🤖',
    label: 'AI/ML',
    description: 'Machine learning frameworks and AI development platforms'
  },
  'Design & Prototyping': {
    icon: '✨',
    label: 'Design',
    description: 'Design tools, prototyping, and collaboration platforms'
  },
  'Testing & QA': {
    icon: '🧪',
    label: 'Testing',
    description: 'Testing frameworks and quality assurance tools'
  },
  'Security & Monitoring': {
    icon: '🔒',
    label: 'Security',
    description: 'Security tools, authentication, and application monitoring'
  },
  'Content & Marketing': {
    icon: '📝',
    label: 'Content',
    description: 'Content management, marketing automation, and analytics'
  },
  'Productivity & Collaboration': {
    icon: '👥',
    label: 'Productivity',
    description: 'Team collaboration and productivity tools'
  },
  'Other': {
    icon: '📦',
    label: 'Other',
    description: 'Miscellaneous tools and utilities'
  },
};

export default function StackKits() {
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all');
  const [sortBy, setSortBy] = useState<SortBy>('popular');
  const [selectedKit, setSelectedKit] = useState<StackKitWithStats | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [kits, setKits] = useState<StackKitWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitDialogOpen, setSubmitDialogOpen] = useState(false);

  // Load kits from database
  useEffect(() => {
    loadKits();
  }, [categoryFilter, sortBy]);

  // Handle kit query parameter (from homepage click) and search query
  useEffect(() => {
    const kitId = searchParams.get('kit');
    const searchQuery = searchParams.get('search');
    
    if (searchQuery) {
      setSearch(searchQuery);
    }
    
    if (kitId) {
      // First check if it's a hardcoded kit
      const hardcodedKit = getKitByIdWithStats(kitId);
      if (hardcodedKit) {
        setSelectedKit(hardcodedKit);
        // Remove query parameter after setting
        setSearchParams({}, { replace: true });
        return;
      }

      // Otherwise, wait for database kits to load and find it there
      if (!loading && kits.length > 0) {
        const dbKit = kits.find(k => k.id === kitId);
        if (dbKit) {
          setSelectedKit(dbKit);
          setSearchParams({}, { replace: true });
        } else {
          // Kit not found, show error
          toast({
            title: "Kit not found",
            description: "The requested kit could not be found.",
            variant: "destructive",
          });
          setSearchParams({}, { replace: true });
        }
      }
    }
  }, [searchParams, kits, loading, toast, setSearchParams]);

  const loadKits = async () => {
    setLoading(true);
    try {
      // Load database kits
      const { data: dbKits, error } = await supabase.rpc('get_kits_with_stats', {
        p_category: categoryFilter === 'all' ? null : categoryFilter,
        p_tags: null,
        p_limit: 100,
        p_offset: 0,
        p_sort_by: sortBy,
      });

      if (error) throw error;

      // Get all hardcoded kits
      const hardcodedKits = getAllKitsWithStats();
      console.log('📦 Hardcoded kits:', hardcodedKits.length);
      console.log('📦 Database kits:', (dbKits || []).length);

      // Merge database kits with hardcoded kits
      // Use a Map to avoid duplicates (by id, not slug, since hardcoded kits use id as slug)
      const kitsMap = new Map<string, StackKitWithStats>();

      // Add hardcoded kits first
      hardcodedKits.forEach(kit => {
        kitsMap.set(kit.id, kit); // Use id as key to avoid conflicts
      });

      // Add database kits (they'll override hardcoded if id matches)
      (dbKits || []).forEach(kit => {
        kitsMap.set(kit.id, kit);
      });

      // Convert map to array
      let allKits = Array.from(kitsMap.values());
      console.log('📦 Total merged kits:', allKits.length);

      // Apply category filter if needed
      if (categoryFilter !== 'all') {
        allKits = allKits.filter(kit => kit.category === categoryFilter);
      }

      // Apply sorting
      if (sortBy === 'popular') {
        allKits.sort((a, b) => b.upvote_count - a.upvote_count);
      } else if (sortBy === 'views') {
        allKits.sort((a, b) => b.view_count - a.view_count);
      } else if (sortBy === 'newest') {
        allKits.sort((a, b) => {
          const dateA = new Date(a.created_at).getTime();
          const dateB = new Date(b.created_at).getTime();
          return dateB - dateA;
        });
      }

      setKits(allKits);
    } catch (error: any) {
      console.error('Error loading kits:', error);
      // Fallback to hardcoded kits only if database fails
      const hardcodedKits = getAllKitsWithStats();
      let filteredKits = hardcodedKits;
      
      if (categoryFilter !== 'all') {
        filteredKits = hardcodedKits.filter(kit => kit.category === categoryFilter);
      }
      
      setKits(filteredKits);
      
      toast({
        title: "Error loading kits",
        description: "Showing hardcoded kits only. " + error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Filter kits by search query (client-side for responsiveness)
  const filteredKits = kits.filter(kit => {
    if (!search) return true;

    const searchLower = search.toLowerCase();
    return (
      kit.name.toLowerCase().includes(searchLower) ||
      kit.tagline.toLowerCase().includes(searchLower) ||
      kit.description.toLowerCase().includes(searchLower) ||
      kit.tags.some(tag => tag.toLowerCase().includes(searchLower))
    );
  });

  const featuredKits = kits.filter(kit => kit.featured);

  const categories = Object.entries(CATEGORY_INFO).map(([key, info]) => ({
    id: key as StackKitCategory,
    ...info,
    count: kits.filter(k => k.category === key).length,
  }));

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-surface/50">
        <div className="container mx-auto px-4 pt-8 pb-4">
          <div className="flex items-center justify-between mb-6">
            <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground">
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </Link>
            <Button onClick={() => setSubmitDialogOpen(true)} size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Submit Your Kit
            </Button>
          </div>

          <div className="flex items-center justify-between gap-4">
            <p className="text-muted-foreground max-w-2xl">
              Curated tech stack templates for every use case. Browse, preview, and clone
              complete setups to kickstart your next project.
            </p>
            <Badge variant="secondary" className="text-lg px-4 py-2 flex-shrink-0">
              {kits.length} Kits
            </Badge>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Loading State */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
          </div>
        ) : (
          <>
            {/* Featured Kits */}
            {categoryFilter === 'all' && !search && featuredKits.length > 0 && (
              <div className="mb-12">
                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                  <Flame className="w-6 h-6 text-orange-500" />
                  Featured Kits
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {featuredKits.map(kit => (
                    <StackKitCard
                      key={kit.id}
                      kit={kit}
                      onClick={() => setSelectedKit(kit)}
                      featured
                    />
                  ))}
                </div>
              </div>
            )}

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search kits or tools..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Category Tabs */}
          <div className="overflow-x-auto -mx-4 px-4">
            <Tabs value={categoryFilter} onValueChange={(v) => setCategoryFilter(v as CategoryFilter)}>
              <TabsList className="h-10 inline-flex min-w-max">
                <TabsTrigger value="all" className="px-4 flex-shrink-0">
                  All
                </TabsTrigger>
                {categories.map(cat => (
                  <TabsTrigger key={cat.id} value={cat.id} className="px-4 gap-1 flex-shrink-0 whitespace-nowrap">
                    <span>{cat.icon}</span>
                    <span className="hidden sm:inline">{cat.label}</span>
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-1 border rounded-lg p-1">
            <Button
              variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('grid')}
            >
              <LayoutGrid className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
            >
              <List className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Category Info */}
        {categoryFilter !== 'all' && (
          <Card className="p-4 mb-6 bg-muted/30 border-muted">
            <div className="flex items-center gap-3">
              <span className="text-3xl">{CATEGORY_INFO[categoryFilter].icon}</span>
              <div>
                <h3 className="font-semibold text-lg">{CATEGORY_INFO[categoryFilter].label}</h3>
                <p className="text-sm text-muted-foreground">{CATEGORY_INFO[categoryFilter].description}</p>
              </div>
            </div>
          </Card>
        )}

            {/* Results */}
            {filteredKits.length === 0 ? (
              <Card className="p-12 text-center">
                <Filter className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-lg font-medium mb-2">No kits found</p>
                <p className="text-muted-foreground mb-4">
                  {kits.length === 0
                    ? 'Be the first to submit a kit!'
                    : 'Try adjusting your search or filters'}
                </p>
                {kits.length === 0 ? (
                  <Button onClick={() => setSubmitDialogOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Submit Your Kit
                  </Button>
                ) : (
                  <Button variant="outline" onClick={() => { setSearch(''); setCategoryFilter('all'); }}>
                    Clear Filters
                  </Button>
                )}
              </Card>
            ) : (
              <div className={
                viewMode === 'grid'
                  ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
                  : 'space-y-4'
              }>
                {filteredKits.map(kit => (
                  <StackKitCard
                    key={kit.id}
                    kit={kit}
                    onClick={() => setSelectedKit(kit)}
                    compact={viewMode === 'list'}
                  />
                ))}
              </div>
            )}

            {/* Stats */}
            {kits.length > 0 && (
              <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="p-4 text-center bg-surface/50">
                  <div className="text-3xl font-bold text-orange-500">{kits.length}</div>
                  <div className="text-sm text-muted-foreground">Total Kits</div>
                </Card>
                <Card className="p-4 text-center bg-surface/50">
                  <div className="text-3xl font-bold text-green-500">
                    {kits.reduce((sum, k) => sum + (k.tool_count || 0), 0)}
                  </div>
                  <div className="text-sm text-muted-foreground">Tools Covered</div>
                </Card>
                <Card className="p-4 text-center bg-surface/50">
                  <div className="text-3xl font-bold text-blue-500">
                    {kits.reduce((sum, k) => sum + k.upvote_count, 0)}
                  </div>
                  <div className="text-sm text-muted-foreground">Total Upvotes</div>
                </Card>
                <Card className="p-4 text-center bg-surface/50">
                  <div className="text-3xl font-bold text-purple-500">{categories.length}</div>
                  <div className="text-sm text-muted-foreground">Categories</div>
                </Card>
              </div>
            )}
          </>
        )}
      </div>

      {/* Dialogs */}
      <StackKitDetailDialog
        kit={selectedKit}
        open={!!selectedKit}
        onOpenChange={(open) => !open && setSelectedKit(null)}
      />

      <SubmitKitDialog
        open={submitDialogOpen}
        onOpenChange={setSubmitDialogOpen}
      />
    </div>
  );
}
