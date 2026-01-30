import { useState, useEffect, useCallback, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  AlertCircle, 
  CheckCircle2, 
  Loader2, 
  ExternalLink,
  Image as ImageIcon,
  Sparkles
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import {
  generateSlug,
  normalizeToolName,
  fetchToolLogo,
  validateWebsiteUrl,
  checkWebsiteReachability,
  checkDuplicateTool,
  ensureUniqueSlug,
} from "@/lib/toolUtils";
import { findSimilarTools } from "@/lib/fuzzySearch";
import { checkRateLimit, recordToolAddition } from "@/lib/rateLimiting";
import { CreateToolSchema, type CreateToolInput } from "@/lib/validation";
import type { Tool } from "@/types/database";

// Extend Tool type for component usage
type ToolForDialog = Tool & {
  logo_url?: string | null;
  category?: string | null;
};

const TOOL_CATEGORIES = [
  'Frontend',
  'Backend',
  'Database',
  'Framework',
  'UI Library',
  'Styling',
  'State Management',
  'Project Management',
  'Productivity',
  'Design',
  'Communication',
  'Payment',
  'Monitoring',
  'Analytics',
  'DevOps',
  'Testing',
  'Authentication',
  'Other',
] as const;

interface AddToolDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onToolAdded: (tool: ToolForDialog) => void;
  existingTools?: ToolForDialog[]; // For fuzzy search
  initialName?: string; // Pre-fill name from search
}

export function AddToolDialog({
  open,
  onOpenChange,
  onToolAdded,
  existingTools = [],
  initialName = "",
}: AddToolDialogProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  
  // Form state
  const [name, setName] = useState(initialName);
  const [category, setCategory] = useState<string>("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [description, setDescription] = useState("");
  const [slug, setSlug] = useState("");
  
  // Validation state
  const [nameError, setNameError] = useState<string | null>(null);
  const [websiteError, setWebsiteError] = useState<string | null>(null);
  const [similarTools, setSimilarTools] = useState<Array<{ id: string; name: string; slug: string; similarity: number }>>([]);
  const [duplicateTool, setDuplicateTool] = useState<{ id: string; name: string; slug: string } | null>(null);
  
  // Logo and website state
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [logoLoading, setLogoLoading] = useState(false);
  const [websiteStatus, setWebsiteStatus] = useState<'idle' | 'validating' | 'valid' | 'warning' | 'blocked'>('idle');
  const [websiteMessage, setWebsiteMessage] = useState("");
  const [officialName, setOfficialName] = useState<string | null>(null);
  
  // Rate limiting
  const [rateLimit, setRateLimit] = useState<{ allowed: boolean; remaining: number; limit: number; message: string } | null>(null);
  
  // Loading state
  const [submitting, setSubmitting] = useState(false);
  const [checkingRateLimit, setCheckingRateLimit] = useState(false);
  const rateLimitCheckedRef = useRef(false);

  // Check rate limit on mount - memoized to prevent infinite loops
  const checkRateLimitStatus = useCallback(async () => {
    if (rateLimitCheckedRef.current) return; // Already checked, prevent infinite loops
    rateLimitCheckedRef.current = true;
    setCheckingRateLimit(true);
    try {
      const result = await checkRateLimit(user?.id || null);
      setRateLimit(result);
      if (!result.allowed) {
        toast({
          title: "Rate limit reached",
          description: result.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error checking rate limit:", error);
    } finally {
      setCheckingRateLimit(false);
    }
  }, [user?.id, toast]);

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (open) {
      setName(initialName);
      setCategory("");
      setWebsiteUrl("");
      setDescription("");
      setSlug("");
      setLogoUrl(null);
      setWebsiteStatus('idle');
      setWebsiteMessage("");
      setOfficialName(null);
      setSimilarTools([]);
      setDuplicateTool(null);
      setNameError(null);
      setWebsiteError(null);
      rateLimitCheckedRef.current = false; // Reset flag when dialog opens
      checkRateLimitStatus();
    } else {
      rateLimitCheckedRef.current = false; // Reset when dialog closes
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]); // Only depend on open - checkRateLimitStatus is memoized and stable

  // Normalize name and generate slug when name changes
  useEffect(() => {
    if (name) {
      const normalized = normalizeToolName(name);
      if (normalized !== name) {
        // Auto-normalize if different
        setName(normalized);
      }
      const generatedSlug = generateSlug(normalized);
      setSlug(generatedSlug);
      
      // Check for duplicates
      checkForDuplicates(normalized);
    } else {
      setSlug("");
      setSimilarTools([]);
      setDuplicateTool(null);
    }
  }, [name, existingTools]);

  // Check for similar tools (fuzzy search)
  const checkForDuplicates = useCallback(async (toolName: string) => {
    if (!toolName || toolName.length < 2) {
      setSimilarTools([]);
      setDuplicateTool(null);
      return;
    }

    // Client-side fuzzy search
    if (existingTools.length > 0) {
      const similar = findSimilarTools(toolName, existingTools, 0.6);
      setSimilarTools(similar);
      
      // Check exact duplicate (case-insensitive)
      const exactMatch = existingTools.find(
        t => t.name.toLowerCase() === toolName.toLowerCase()
      );
      if (exactMatch) {
        setDuplicateTool(exactMatch);
      } else {
        setDuplicateTool(null);
      }
    }

    // Also check database for exact duplicate
    const { isDuplicate, existingTool } = await checkDuplicateTool(toolName);
    if (isDuplicate && existingTool) {
      setDuplicateTool(existingTool);
    }
  }, [existingTools]);

  // Validate website URL when it changes
  useEffect(() => {
    if (!websiteUrl) {
      setWebsiteStatus('idle');
      setWebsiteMessage("");
      setLogoUrl(null);
      return;
    }

    const formatValidation = validateWebsiteUrl(websiteUrl);
    setWebsiteError(formatValidation.isValid ? null : formatValidation.message);

    if (!formatValidation.isValid) {
      setWebsiteStatus('blocked');
      setWebsiteMessage(formatValidation.message);
      return;
    }

    // Async validation
    setWebsiteStatus('validating');
    checkWebsiteReachability(websiteUrl).then((result) => {
      setWebsiteStatus(result.status);
      setWebsiteMessage(result.message);
      
      // Fetch logo if website is valid
      if (result.status === 'valid' || result.status === 'warning') {
        fetchLogo(websiteUrl);
      }
    });
  }, [websiteUrl, name]);

  // Fetch logo from website
  const fetchLogo = async (url: string) => {
    setLogoLoading(true);
    try {
      const result = await fetchToolLogo(url, name || "Tool");
      setLogoUrl(result.logo);
      
      if (result.officialName && result.officialName !== name) {
        setOfficialName(result.officialName);
      } else {
        setOfficialName(null);
      }
    } catch (error) {
      console.error("Error fetching logo:", error);
    } finally {
      setLogoLoading(false);
    }
  };

  // Handle form submission
  const handleSubmit = async () => {
    // Validate rate limit
    if (!rateLimit?.allowed) {
      toast({
        title: "Rate limit reached",
        description: rateLimit?.message || "You've reached your daily limit for adding tools.",
        variant: "destructive",
      });
      return;
    }

    // Validate form
    try {
      const formData: CreateToolInput = {
        name: name.trim(),
        category: category as any,
        websiteUrl: websiteUrl.trim(),
        logoUrl: logoUrl || undefined,
        description: description.trim() || undefined,
        slug: slug.trim(),
      };

      CreateToolSchema.parse(formData);
    } catch (error: any) {
      if (error.errors) {
        const firstError = error.errors[0];
        toast({
          title: "Validation error",
          description: firstError.message,
          variant: "destructive",
        });
      }
      return;
    }

    // Check for duplicate
    if (duplicateTool) {
      toast({
        title: "Tool already exists",
        description: `"${duplicateTool.name}" already exists. Please select it instead.`,
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);

    try {
      // Ensure slug is unique
      const uniqueSlug = await ensureUniqueSlug(slug);

      // Create tool
      const { data: newTool, error: insertError } = await supabase
        .from("tools")
        .insert({
          name: name.trim(),
          slug: uniqueSlug,
          category: category,
          website_url: websiteUrl.trim(),
          logo_url: logoUrl || null,
          description: description.trim() || null,
          status: websiteStatus === 'valid' ? 'approved' : 'pending',
          created_by: user?.id || null,
          verified_website: websiteStatus === 'valid',
          logo_fetched: !!logoUrl,
          flagged_reason: websiteStatus === 'warning' ? 'website_unreachable' : null,
          priority_score: 0, // New tools start at bottom
        })
        .select()
        .single();

      if (insertError) {
        throw insertError;
      }

      // Record tool addition for rate limiting
      if (newTool) {
        await recordToolAddition(user?.id || null, newTool.id);
      }

      toast({
        title: "Tool added successfully!",
        description: websiteStatus === 'valid' 
          ? `"${newTool.name}" has been added and selected.`
          : `"${newTool.name}" has been added and is pending review.`,
      });

      // Call callback with new tool
      onToolAdded(newTool as Tool);

      // Close dialog
      onOpenChange(false);
    } catch (error: any) {
      console.error("Error creating tool:", error);
      toast({
        title: "Failed to add tool",
        description: error.message || "An error occurred while adding the tool.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Handle selecting existing similar tool
  const handleSelectExistingTool = (tool: ToolForDialog) => {
    onToolAdded(tool);
    onOpenChange(false);
  };

  // Use official name suggestion
  const handleUseOfficialName = () => {
    if (officialName) {
      setName(officialName);
      setOfficialName(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-orange-500" />
            Add New Tool
          </DialogTitle>
          <DialogDescription>
            Add a tool that's not in our database. We'll verify the website and fetch the logo automatically.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Rate Limit Info */}
          {rateLimit && (
            <Alert variant={rateLimit.allowed ? "default" : "destructive"}>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{rateLimit.message}</AlertDescription>
            </Alert>
          )}

          {/* Duplicate Warning */}
          {duplicateTool && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="space-y-2">
                <p>This tool already exists: <strong>{duplicateTool.name}</strong></p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleSelectExistingTool(duplicateTool as Tool)}
                >
                  Use Existing Tool
                </Button>
              </AlertDescription>
            </Alert>
          )}

          {/* Similar Tools Warning */}
          {similarTools.length > 0 && !duplicateTool && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="space-y-2">
                <p className="font-medium">Similar tools found:</p>
                <div className="space-y-1">
                  {similarTools.slice(0, 3).map((tool) => (
                    <Button
                      key={tool.id}
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start"
                      onClick={() => handleSelectExistingTool(tool as unknown as Tool)}
                    >
                      {tool.name} ({Math.round(tool.similarity * 100)}% match)
                    </Button>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  If none of these match, you can still add your tool below.
                </p>
              </AlertDescription>
            </Alert>
          )}

          {/* Tool Name */}
          <div className="space-y-2">
            <Label htmlFor="tool-name">Tool Name *</Label>
            <Input
              id="tool-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., React, Next.js, Vercel"
              className={nameError ? "border-red-500" : ""}
            />
            {nameError && (
              <p className="text-sm text-red-500">{nameError}</p>
            )}
            {officialName && officialName !== name && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="flex items-center justify-between">
                  <span>Website says this tool is called "{officialName}".</span>
                  <Button variant="outline" size="sm" onClick={handleUseOfficialName}>
                    Use This Name
                  </Button>
                </AlertDescription>
              </Alert>
            )}
          </div>

          {/* Website URL */}
          <div className="space-y-2">
            <Label htmlFor="website-url">Website URL *</Label>
            <div className="flex gap-2">
              <Input
                id="website-url"
                type="url"
                value={websiteUrl}
                onChange={(e) => setWebsiteUrl(e.target.value)}
                placeholder="https://example.com"
                className={websiteError ? "border-red-500" : ""}
              />
              {websiteUrl && (
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => window.open(websiteUrl, '_blank')}
                  title="Open website"
                >
                  <ExternalLink className="w-4 h-4" />
                </Button>
              )}
            </div>
            {websiteError && (
              <p className="text-sm text-red-500">{websiteError}</p>
            )}
            {websiteStatus === 'validating' && (
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Verifying website...
              </p>
            )}
            {websiteStatus === 'valid' && (
              <p className="text-sm text-green-500 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                Website verified
              </p>
            )}
            {websiteStatus === 'warning' && (
              <Alert variant="default">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{websiteMessage}</AlertDescription>
              </Alert>
            )}
            {websiteStatus === 'blocked' && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{websiteMessage}</AlertDescription>
              </Alert>
            )}
          </div>

          {/* Logo Preview */}
          <div className="space-y-2">
            <Label>Logo</Label>
            <div className="flex items-center gap-4">
              {logoLoading ? (
                <Skeleton className="w-16 h-16 rounded" />
              ) : logoUrl ? (
                <img
                  src={logoUrl}
                  alt={`${name} logo`}
                  className="w-16 h-16 rounded border border-border object-contain"
                  onError={() => setLogoUrl(null)}
                />
              ) : (
                <div className="w-16 h-16 rounded border border-border flex items-center justify-center bg-muted">
                  <ImageIcon className="w-8 h-8 text-muted-foreground" />
                </div>
              )}
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">
                  {logoLoading
                    ? "Fetching logo..."
                    : logoUrl
                    ? "Logo fetched automatically"
                    : "Logo will be fetched from the website"}
                </p>
              </div>
            </div>
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label htmlFor="category">Category *</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger id="category">
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {TOOL_CATEGORIES.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description (optional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of the tool..."
              rows={3}
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground">
              {description.length}/500 characters
            </p>
          </div>

          {/* Preview */}
          {(name || logoUrl) && (
            <div className="space-y-2">
              <Label>Preview</Label>
              <div className="p-4 border border-border rounded-lg bg-muted/50">
                <div className="flex items-center gap-3">
                  {logoUrl ? (
                    <img
                      src={logoUrl}
                      alt={name}
                      className="w-12 h-12 rounded object-contain"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded bg-orange-500/20 flex items-center justify-center">
                      <span className="text-orange-500 font-bold">
                        {name?.[0]?.toUpperCase() || '?'}
                      </span>
                    </div>
                  )}
                  <div>
                    <p className="font-medium">{name || "Tool Name"}</p>
                    <p className="text-sm text-muted-foreground">
                      {category || "Category"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={
                submitting ||
                !name ||
                !category ||
                !websiteUrl ||
                !!duplicateTool ||
                websiteStatus === 'blocked' ||
                !rateLimit?.allowed ||
                checkingRateLimit
              }
              className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Adding...
                </>
              ) : (
                "Add Tool"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
