import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X, Filter, ChevronDown, ChevronUp } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface Tool {
  id: string;
  name: string;
  logo_url: string;
  category: string;
}

interface ToolFilterProps {
  selectedTools: string[];
  onToolsChange: (tools: string[]) => void;
}

export function ToolFilter({ selectedTools, onToolsChange }: ToolFilterProps) {
  const [tools, setTools] = useState<Tool[]>([]);
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTools();
  }, []);

  const loadTools = async () => {
    const { data, error } = await supabase
      .from('tools')
      .select('id, name, logo_url, category')
      .order('priority_score', { ascending: false })
      .limit(50);

    if (error) {
      console.error('Error loading tools:', error);
      return;
    }

    setTools(data || []);
    setLoading(false);
  };

  const toggleTool = (toolId: string) => {
    if (selectedTools.includes(toolId)) {
      onToolsChange(selectedTools.filter(id => id !== toolId));
    } else {
      onToolsChange([...selectedTools, toolId]);
    }
  };

  const clearFilters = () => {
    onToolsChange([]);
  };

  const selectedToolObjects = tools.filter(t => selectedTools.includes(t.id));

  return (
    <div className="space-y-3">
      {/* Filter Header */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setExpanded(!expanded)}
          className="gap-2 text-muted-foreground hover:text-foreground"
        >
          <Filter className="w-4 h-4" />
          Filter by Tools
          {selectedTools.length > 0 && (
            <Badge variant="secondary" className="ml-1">
              {selectedTools.length}
            </Badge>
          )}
          {expanded ? (
            <ChevronUp className="w-4 h-4 ml-1" />
          ) : (
            <ChevronDown className="w-4 h-4 ml-1" />
          )}
        </Button>

        {selectedTools.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="text-muted-foreground hover:text-foreground"
          >
            Clear all
            <X className="w-4 h-4 ml-1" />
          </Button>
        )}
      </div>

      {/* Selected Tools */}
      {selectedTools.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedToolObjects.map(tool => (
            <Badge
              key={tool.id}
              variant="secondary"
              className="gap-2 pr-1 bg-orange-500/20 border-orange-500/30 hover:bg-orange-500/30 cursor-pointer"
              onClick={() => toggleTool(tool.id)}
            >
              <img src={tool.logo_url} alt={tool.name} className="w-4 h-4 rounded" />
              {tool.name}
              <X className="w-3 h-3 ml-1" />
            </Badge>
          ))}
        </div>
      )}

      {/* Expanded Tool Selection */}
      {expanded && (
        <div className="bg-surface/50 border border-white/10 rounded-lg p-4 mt-2">
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading tools...</p>
          ) : (
            <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
              {tools.map(tool => {
                const isSelected = selectedTools.includes(tool.id);
                return (
                  <button
                    key={tool.id}
                    onClick={() => toggleTool(tool.id)}
                    className={`flex flex-col items-center gap-1 p-2 rounded-lg border transition-all ${
                      isSelected
                        ? 'border-orange-500 bg-orange-500/20'
                        : 'border-white/10 hover:border-white/20 bg-transparent'
                    }`}
                    title={tool.name}
                  >
                    <img
                      src={tool.logo_url}
                      alt={tool.name}
                      className="w-8 h-8 rounded"
                    />
                    <span className="text-xs truncate w-full text-center">
                      {tool.name}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
