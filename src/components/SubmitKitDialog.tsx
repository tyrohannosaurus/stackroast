import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Package, Search, X, Plus, AlertCircle, Sparkles } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { AuthDialog } from "@/components/AuthDialog";
import { AddToolDialog } from "@/components/AddToolDialog";
import { EmojiPicker } from "@/components/EmojiPicker";
import { ToolLogo } from "@/components/ToolLogo";
import { generateSlug, isXssSafe } from "@/lib/validation";
import type { Tool, StackKitCategory, StackKitDifficulty, CreateKitToolInput } from "@/types/database";

interface ToolWithReason extends Tool {
  reason_text: string;
  sort_order: number;
}

interface SubmitKitDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CATEGORIES: StackKitCategory[] = [
  // Original technical categories
  'Full Stack Development',
  'Frontend Development',
  'Backend Development',
  'Mobile Development',
  'DevOps & Infrastructure',
  'Data & Analytics',
  'AI & Machine Learning',
  'Design & Prototyping',
  'Testing & QA',
  'Security & Monitoring',
  'Content & Marketing',
  'Productivity & Collaboration',
  'Other',
  // New use-case specific categories
  'E-commerce Stack',
  'Marketing Stack',
  'Content Creator Stack',
  'Freelancer Stack',
  'Web Hosting',
  'Security Stack',
  'SEO Stack',
  'No-Code Stack',
];

const DIFFICULTIES: StackKitDifficulty[] = ['Beginner', 'Intermediate', 'Advanced', 'Expert'];

export function SubmitKitDialog({ open, onOpenChange }: SubmitKitDialogProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, profile } = useAuth();

  // Form state
  const [kitName, setKitName] = useState("");
  const [tagline, setTagline] = useState("");
  const [description, setDescription] = useState("");
  const [icon, setIcon] = useState("📦");
  const [category, setCategory] = useState<StackKitCategory>('Full Stack Development');
  const [difficulty, setDifficulty] = useState<StackKitDifficulty>('Intermediate');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");

  // Tool selection state
  const [selectedTools, setSelectedTools] = useState<ToolWithReason[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [tools, setTools] = useState<Tool[]>([]);
  const [activeToolId, setActiveToolId] = useState<string | null>(null);
  const [toolReason, setToolReason] = useState("");

  // UI state
  const [loading, setLoading] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [addToolOpen, setAddToolOpen] = useState(false);
  const [pendingSubmission, setPendingSubmission] = useState(false);

  // Load tools when dialog opens
  useEffect(() => {
    if (open) {
      loadTools();
    } else {
      resetForm();
    }
  }, [open]);

  const resetForm = () => {
    setKitName("");
    setTagline("");
    setDescription("");
    setIcon("📦");
    setCategory('Full Stack Development');
    setDifficulty('Intermediate');
    setTags([]);
    setTagInput("");
    setSelectedTools([]);
    setSearchQuery("");
    setActiveToolId(null);
    setToolReason("");
    setPendingSubmission(false);
  };

  const loadTools = async () => {
    const { data, error } = await supabase
      .from("tools")
      .select("id, name, slug, logo_url, category, website_url")
      .order("priority_score", { ascending: false });

    if (error) {
      toast({
        title: "Error loading tools",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    setTools(data || []);
  };

  const addTag = () => {
    const trimmedTag = tagInput.trim();
    if (trimmedTag && !tags.includes(trimmedTag) && tags.length < 5) {
      setTags([...tags, trimmedTag]);
      setTagInput("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const toggleTool = (tool: Tool) => {
    const isSelected = selectedTools.find(t => t.id === tool.id);

    if (isSelected) {
      // Remove tool
      setSelectedTools(prev => prev.filter(t => t.id !== tool.id));
      if (activeToolId === tool.id) {
        setActiveToolId(null);
        setToolReason("");
      }
    } else {
      // Show reason input for this tool
      setActiveToolId(tool.id);
      setToolReason("");
    }
  };

  const addToolWithReason = () => {
    if (!activeToolId || !toolReason.trim()) {
      toast({
        title: "Missing information",
        description: "Please provide a reason for including this tool (10-500 characters).",
        variant: "destructive",
      });
      return;
    }

    if (toolReason.trim().length < 10 || toolReason.trim().length > 500) {
      toast({
        title: "Invalid reason length",
        description: "Reason must be between 10 and 500 characters.",
        variant: "destructive",
      });
      return;
    }

    const tool = tools.find(t => t.id === activeToolId);
    if (!tool) return;

    const toolWithReason: ToolWithReason = {
      ...tool,
      reason_text: toolReason.trim(),
      sort_order: selectedTools.length,
    };

    setSelectedTools([...selectedTools, toolWithReason]);
    setActiveToolId(null);
    setToolReason("");
  };

  const validateForm = (): { valid: boolean; error?: string } => {
    if (!kitName.trim() || kitName.trim().length < 3 || kitName.trim().length > 100) {
      return { valid: false, error: "Kit name must be between 3 and 100 characters." };
    }

    if (!tagline.trim() || tagline.trim().length < 10 || tagline.trim().length > 150) {
      return { valid: false, error: "Tagline must be between 10 and 150 characters." };
    }

    if (!description.trim() || description.trim().length < 50 || description.trim().length > 2000) {
      return { valid: false, error: "Description must be between 50 and 2000 characters." };
    }

    if (selectedTools.length < 3) {
      return { valid: false, error: "Please select at least 3 tools for your kit." };
    }

    if (!isXssSafe(kitName) || !isXssSafe(tagline) || !isXssSafe(description)) {
      return { valid: false, error: "Input contains invalid characters." };
    }

    return { valid: true };
  };

  const handleSubmit = async () => {
    try {
      // Validate form
      const validation = validateForm();
      if (!validation.valid) {
        toast({
          title: "Validation Error",
          description: validation.error,
          variant: "destructive",
        });
        return;
      }

      // Check authentication
      if (!user) {
        setPendingSubmission(true);
        onOpenChange(false);
        setAuthOpen(true);
        return;
      }

      await submitKit();
    } catch (error: any) {
      console.error('Error in handleSubmit:', error);
      toast({
        title: "Submission Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const submitKit = async () => {
    setLoading(true);

    try {
      if (!user?.id) {
        throw new Error("User not authenticated");
      }

      // Ensure profile exists
      const { data: profileData } = await supabase
        .from("profiles")
        .select("id")
        .eq("id", user.id)
        .single();

      if (!profileData) {
        throw new Error("Profile not found. Please complete your profile first.");
      }

      // Generate slug
      const slug = generateSlug(kitName);

      // Check for duplicate slug
      const { data: existingKit } = await supabase
        .from("stack_kits")
        .select("id")
        .eq("slug", slug)
        .maybeSingle();

      if (existingKit) {
        throw new Error("A kit with this name already exists. Please choose a different name.");
      }

      // Create the kit
      const { data: kit, error: kitError } = await supabase
        .from("stack_kits")
        .insert({
          creator_id: user.id,
          name: kitName.trim(),
          slug,
          tagline: tagline.trim(),
          description: description.trim(),
          icon: icon || '📦',
          category,
          tags,
          difficulty,
          published: true,
        })
        .select()
        .single();

      if (kitError) throw kitError;

      // Add tools to the kit
      const kitTools: CreateKitToolInput[] = selectedTools.map((tool, index) => ({
        tool_id: tool.id,
        reason_text: tool.reason_text,
        sort_order: index,
      }));

      const { error: toolsError } = await supabase
        .from("kit_tools")
        .insert(
          kitTools.map(t => ({
            kit_id: kit.id,
            tool_id: t.tool_id,
            reason_text: t.reason_text,
            sort_order: t.sort_order,
          }))
        );

      if (toolsError) throw toolsError;

      // Success!
      toast({
        title: "Kit submitted successfully!",
        description: "Your kit is now live and ready for upvotes.",
      });

      onOpenChange(false);
      resetForm();

      // Navigate to kits page or kit detail page
      navigate(`/kits`);
    } catch (error: any) {
      console.error('Error submitting kit:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Handle auth completion
  useEffect(() => {
    if (pendingSubmission && user) {
      setPendingSubmission(false);
      onOpenChange(true);
      submitKit();
    }
  }, [user, pendingSubmission]);

  const filteredTools = tools.filter(tool =>
    tool.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
    !selectedTools.find(t => t.id === tool.id)
  );

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="w-5 h-5 text-orange-500" />
              Submit Your Stack Kit
            </DialogTitle>
            <DialogDescription>
              Create a curated collection of tools for a specific use case. Help others discover the perfect tool combination.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Basic Information */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="kitName">Kit Name *</Label>
                <Input
                  id="kitName"
                  placeholder="e.g., Modern React Development Kit"
                  value={kitName}
                  onChange={(e) => setKitName(e.target.value)}
                  maxLength={100}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {kitName.length}/100 characters
                </p>
              </div>

              <div>
                <Label htmlFor="tagline">Tagline *</Label>
                <Input
                  id="tagline"
                  placeholder="A one-liner describing your kit (10-150 characters)"
                  value={tagline}
                  onChange={(e) => setTagline(e.target.value)}
                  maxLength={150}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {tagline.length}/150 characters
                </p>
              </div>

              <div>
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  placeholder="Describe what this kit is for, who should use it, and why you chose these tools... (50-2000 characters)"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  maxLength={2000}
                  rows={4}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {description.length}/2000 characters
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="category">Category *</Label>
                  <Select value={category} onValueChange={(val) => setCategory(val as StackKitCategory)}>
                    <SelectTrigger id="category">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="difficulty">Difficulty Level</Label>
                  <Select value={difficulty} onValueChange={(val) => setDifficulty(val as StackKitDifficulty)}>
                    <SelectTrigger id="difficulty">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DIFFICULTIES.map((diff) => (
                        <SelectItem key={diff} value={diff}>
                          {diff}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="icon">Icon (Emoji)</Label>
                <EmojiPicker value={icon} onChange={setIcon} />
                <p className="text-xs text-muted-foreground mt-1">
                  Choose an emoji that represents your stack kit
                </p>
              </div>

              <div>
                <Label htmlFor="tags">Tags (up to 5)</Label>
                <div className="flex gap-2">
                  <Input
                    id="tags"
                    placeholder="Add a tag..."
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                    disabled={tags.length >= 5}
                  />
                  <Button
                    type="button"
                    onClick={addTag}
                    disabled={!tagInput.trim() || tags.length >= 5}
                    size="sm"
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="gap-1">
                      {tag}
                      <X
                        className="w-3 h-3 cursor-pointer"
                        onClick={() => removeTag(tag)}
                      />
                    </Badge>
                  ))}
                </div>
              </div>
            </div>

            {/* Tool Selection */}
            <div className="space-y-4 border-t pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">Select Tools (minimum 3)</h3>
                  <p className="text-sm text-muted-foreground">
                    Choose tools and explain why each one is essential for this kit
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setAddToolOpen(true)}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add New Tool
                </Button>
              </div>

              {/* Selected Tools */}
              {selectedTools.length > 0 && (
                <div className="space-y-2">
                  <Label>Selected Tools ({selectedTools.length})</Label>
                  <div className="space-y-2">
                    {selectedTools.map((tool) => (
                      <div
                        key={tool.id}
                        className="flex items-start gap-3 p-3 border rounded-lg bg-muted/50"
                      >
                        <ToolLogo
                          src={tool.logo_url}
                          alt={tool.name}
                          size="md"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="font-medium">{tool.name}</div>
                          <p className="text-sm text-muted-foreground">
                            {tool.reason_text}
                          </p>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleTool(tool)}
                          className="text-muted-foreground hover:text-destructive"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tool Search */}
              <div>
                <Label htmlFor="toolSearch">Add Tools</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    id="toolSearch"
                    placeholder="Search tools..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>

              {/* Tool Reason Input */}
              {activeToolId && (
                <div className="p-4 border rounded-lg bg-orange-50 dark:bg-orange-950/20 space-y-3">
                  <div className="flex items-start gap-2">
                    <Sparkles className="w-5 h-5 text-orange-500 mt-0.5" />
                    <div className="flex-1">
                      <Label htmlFor="toolReason">
                        Why is {tools.find(t => t.id === activeToolId)?.name} essential for this kit?
                      </Label>
                      <Textarea
                        id="toolReason"
                        placeholder="Explain why this tool is important for this use case... (10-500 characters)"
                        value={toolReason}
                        onChange={(e) => setToolReason(e.target.value)}
                        maxLength={500}
                        rows={2}
                        className="mt-2"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        {toolReason.length}/500 characters
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      onClick={addToolWithReason}
                      disabled={toolReason.trim().length < 10}
                      size="sm"
                    >
                      Add Tool
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => {
                        setActiveToolId(null);
                        setToolReason("");
                      }}
                      size="sm"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}

              {/* Available Tools */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 max-h-60 overflow-y-auto">
                {filteredTools.slice(0, 20).map((tool) => (
                  <button
                    key={tool.id}
                    type="button"
                    onClick={() => toggleTool(tool)}
                    className="flex flex-col items-center gap-2 p-3 border rounded-lg hover:bg-muted transition-colors"
                  >
                    <ToolLogo
                      src={tool.logo_url}
                      alt={tool.name}
                      size="lg"
                    />
                    <span className="text-xs text-center font-medium truncate w-full">
                      {tool.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Validation Warning */}
            {selectedTools.length < 3 && (
              <div className="flex items-start gap-2 p-3 border border-orange-200 dark:border-orange-800 rounded-lg bg-orange-50 dark:bg-orange-950/20">
                <AlertCircle className="w-5 h-5 text-orange-500 mt-0.5" />
                <p className="text-sm text-orange-900 dark:text-orange-100">
                  Please select at least 3 tools for your kit. Each tool needs a reason explaining why it's included.
                </p>
              </div>
            )}
          </div>

          {/* Submit Button */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={loading || selectedTools.length < 3}
            >
              {loading ? "Submitting..." : "Submit Kit"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <AuthDialog open={authOpen} onOpenChange={setAuthOpen} />
      <AddToolDialog open={addToolOpen} onOpenChange={setAddToolOpen} />
    </>
  );
}
