import { useState } from 'react';
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
  DollarSign, 
  Sparkles,
  Filter,
  LayoutGrid,
  List
} from 'lucide-react';
import { 
  STACK_KITS, 
  CATEGORY_INFO, 
  DIFFICULTY_INFO,
  getFeaturedKits,
  type StackKit 
} from '@/data/stackKits';
import { StackKitCard } from '@/components/StackKitCard';
import { StackKitDetailDialog } from '@/components/StackKitDetailDialog';

type CategoryFilter = 'all' | StackKit['category'];
type ViewMode = 'grid' | 'list';

export default function StackKits() {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all');
  const [selectedKit, setSelectedKit] = useState<StackKit | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');

  const featuredKits = getFeaturedKits();

  const filteredKits = STACK_KITS.filter(kit => {
    // Search filter
    const searchLower = search.toLowerCase();
    const matchesSearch = 
      kit.name.toLowerCase().includes(searchLower) ||
      kit.tagline.toLowerCase().includes(searchLower) ||
      kit.tools.some(t => t.name.toLowerCase().includes(searchLower));

    // Category filter
    const matchesCategory = categoryFilter === 'all' || kit.category === categoryFilter;

    return matchesSearch && matchesCategory;
  });

  const categories = Object.entries(CATEGORY_INFO).map(([key, info]) => ({
    id: key as StackKit['category'],
    ...info,
    count: STACK_KITS.filter(k => k.category === key).length,
  }));

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-surface/50">
        <div className="container mx-auto px-4 py-6">
          <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4">
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
          
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-4xl font-bold flex items-center gap-3">
                <Sparkles className="w-10 h-10 text-orange-500" />
                Stack Kits
              </h1>
              <p className="text-muted-foreground mt-2 max-w-2xl">
                Curated tech stack templates for every use case. Browse, preview, and clone 
                complete setups to kickstart your next project.
              </p>
            </div>
            <Badge variant="secondary" className="text-lg px-4 py-2">
              {STACK_KITS.length} Kits
            </Badge>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Featured Kits */}
        {categoryFilter === 'all' && !search && (
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
          <Tabs value={categoryFilter} onValueChange={(v) => setCategoryFilter(v as CategoryFilter)}>
            <TabsList className="h-10">
              <TabsTrigger value="all" className="px-4">
                All
              </TabsTrigger>
              {categories.map(cat => (
                <TabsTrigger key={cat.id} value={cat.id} className="px-4 gap-1">
                  <span>{cat.icon}</span>
                  <span className="hidden sm:inline">{cat.label}</span>
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

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
              Try adjusting your search or filters
            </p>
            <Button variant="outline" onClick={() => { setSearch(''); setCategoryFilter('all'); }}>
              Clear Filters
            </Button>
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
        <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="p-4 text-center bg-surface/50">
            <div className="text-3xl font-bold text-orange-500">{STACK_KITS.length}</div>
            <div className="text-sm text-muted-foreground">Total Kits</div>
          </Card>
          <Card className="p-4 text-center bg-surface/50">
            <div className="text-3xl font-bold text-green-500">
              {STACK_KITS.reduce((sum, k) => sum + k.tools.length, 0)}
            </div>
            <div className="text-sm text-muted-foreground">Tools Covered</div>
          </Card>
          <Card className="p-4 text-center bg-surface/50">
            <div className="text-3xl font-bold text-blue-500">
              {STACK_KITS.filter(k => k.totalMonthlyCost === 0).length}
            </div>
            <div className="text-sm text-muted-foreground">Free Stacks</div>
          </Card>
          <Card className="p-4 text-center bg-surface/50">
            <div className="text-3xl font-bold text-purple-500">{categories.length}</div>
            <div className="text-sm text-muted-foreground">Categories</div>
          </Card>
        </div>
      </div>

      {/* Detail Dialog */}
      <StackKitDetailDialog
        kit={selectedKit}
        open={!!selectedKit}
        onOpenChange={(open) => !open && setSelectedKit(null)}
      />
    </div>
  );
}
