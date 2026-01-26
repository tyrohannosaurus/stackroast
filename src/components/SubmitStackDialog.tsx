import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Flame, Search, X, Plus } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { AuthDialog } from "@/components/AuthDialog";
import { AddToolDialog } from "@/components/AddToolDialog";
import { generateRoast } from '@/lib/generateRoast';
import { PersonaSelector } from "@/components/PersonaSelector";
import { getRandomPersona, type PersonaKey } from "@/lib/roastPersonas";
import confetti from "canvas-confetti";
import { CreateStackSchema, generateSlug, isXssSafe, formatZodError } from "@/lib/validation";

interface Tool {
  id: string;
  name: string;
  slug: string;
  logo_url: string;
  category: string;
}

interface SubmitStackDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SubmitStackDialog({ open, onOpenChange }: SubmitStackDialogProps) {
  const navigate = useNavigate();
  const [authOpen, setAuthOpen] = useState(false);
  const [stackName, setStackName] = useState("");
  const [selectedTools, setSelectedTools] = useState<Tool[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [tools, setTools] = useState<Tool[]>([]);
  const [loading, setLoading] = useState(false);
  const [pendingSubmission, setPendingSubmission] = useState<{
    stackName: string;
    tools: Tool[];
  } | null>(null);
  const [selectedPersona, setSelectedPersona] = useState<PersonaKey | 'random'>('random');
  const [addToolOpen, setAddToolOpen] = useState(false);
  
  const { toast } = useToast();
  const { user, profile, refreshProfile } = useAuth();

  // Load tools when dialog opens
  useEffect(() => {
    if (open) {
      loadTools();
    } else {
      // Reset form when closing
      setStackName("");
      setSelectedTools([]);
      setSearchQuery("");
      setPendingSubmission(null);
    }
  }, [open]);

  const loadTools = async () => {
    console.log('🔧 Loading tools...');
    // RLS policies automatically filter: approved tools for everyone, pending/rejected for creator
    const { data, error } = await supabase
      .from("tools")
      .select("id, name, slug, logo_url, category")
      .order("priority_score", { ascending: false });

    if (error) {
      console.error("❌ Error loading tools:", error);
      toast({
        title: "Error loading tools",
        description: error.message || "Could not load tools. Please refresh the page.",
        variant: "destructive",
      });
      return;
    }

    console.log(`✅ Loaded ${data?.length || 0} tools`);
    if (data && data.length > 0) {
      console.log('Sample tool:', data[0]);
    } else {
      console.warn('⚠️ No tools found in database. Run SEED_TOOLS_SIMPLE.sql in Supabase.');
    }
    setTools(data || []);
  };

  const toggleTool = (tool: Tool) => {
    console.log('🛠️ Toggling tool:', tool.name, tool.id);
    setSelectedTools((prev) => {
      const isSelected = prev.find((t) => t.id === tool.id);
      const newSelection = isSelected
        ? prev.filter((t) => t.id !== tool.id)
        : [...prev, tool];
      console.log(`✅ Tool ${isSelected ? 'removed' : 'added'}. Total selected: ${newSelection.length}`);
      return newSelection;
    });
  };

  const handleSubmit = async () => {
    try {
      console.log('🔘 Submit button clicked!', {
        stackName,
        selectedToolsCount: selectedTools.length,
        user: user?.id,
        loading,
        selectedPersona
      });

      // Comprehensive validation using Zod schema
      const validationResult = CreateStackSchema.safeParse({
        name: stackName,
        description: "", // Optional description, can be added to UI later
        selectedTools: selectedTools.map(t => ({
          id: t.id,
          name: t.name,
          category: t.category
        })),
        isPublic: true,
      });

      if (!validationResult.success) {
        const errorMessage = formatZodError(validationResult.error);
        console.warn('⚠️ Validation failed:', errorMessage);
        toast({
          title: "Validation Error",
          description: errorMessage,
          variant: "destructive",
        });
        return;
      }

      // Additional XSS safety check
      if (!isXssSafe(stackName)) {
        console.warn('⚠️ XSS attempt detected in stack name');
        toast({
          title: "Invalid Input",
          description: "Stack name contains invalid characters or tags.",
          variant: "destructive",
        });
        return;
      }

      // Check if user is logged in
      if (!user) {
        console.log('👤 User not logged in, opening auth dialog');
        // Store the submission data and show auth dialog
        setPendingSubmission({
          stackName: stackName,
          tools: selectedTools,
        });
        onOpenChange(false); // Close stack dialog
        setAuthOpen(true); // Open auth dialog
        return;
      }

      console.log('✅ All validations passed, proceeding with submission');
      
      // Show immediate feedback
      toast({
        title: "Submitting...",
        description: "Creating your stack...",
        duration: 2000,
      });
      
      // User is logged in, proceed with submission
      console.log('📞 Calling submitStack function...');
      await submitStack(stackName, selectedTools);
      console.log('✅ submitStack function completed');
    } catch (error: any) {
      console.error('❌ Error in handleSubmit:', error);
      toast({
        title: "Submission Error",
        description: error.message || "An unexpected error occurred. Please check the console.",
        variant: "destructive",
      });
    }
  };

  // Helper function to ensure profile exists
  const ensureProfileExists = async (userId: string): Promise<string> => {
    // Get the current authenticated user to ensure we use auth.uid()
    const { data: userData, error: authError } = await supabase.auth.getUser();
    
    if (authError || !userData.user) {
      throw new Error("User not authenticated");
    }
    
    const currentUser = userData.user;
    const authUid = currentUser.id;
    
    // Ensure the userId parameter matches auth.uid() for RLS policy
    if (userId !== authUid) {
      console.warn('⚠️ userId parameter does not match auth.uid(), using auth.uid() instead');
    }
    
    // Use auth.uid() to ensure RLS policy works
    const profileId = authUid;
    
    // First, check if profile exists
    const { data: existingProfile, error: checkError } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", profileId)
      .maybeSingle();

    if (existingProfile) {
      console.log('✅ Profile exists:', profileId);
      return profileId;
    }

    // Profile doesn't exist, create it
    console.log('⚠️ Profile does not exist, creating...');

    // Generate username from email or metadata
    const username = 
      currentUser.user_metadata?.username ||
      currentUser.user_metadata?.name?.toLowerCase().replace(/\s+/g, '_') ||
      currentUser.email?.split('@')[0] ||
      `user_${profileId.slice(0, 8)}`;

    console.log('📝 Attempting to create profile with:', {
      id: profileId,
      username: username,
      auth_uid: authUid,
      matches: profileId === authUid
    });

    const { data: newProfile, error: createError } = await supabase
      .from("profiles")
      .insert({
        id: profileId, // Must match auth.uid() for RLS policy
        username: username,
        karma_points: 0,
        avatar_url: currentUser.user_metadata?.avatar_url || null,
      })
      .select()
      .single();

    if (createError) {
      // If it's a duplicate key error, profile was created by another process
      if (createError.code === '23505' || createError.message?.includes('duplicate')) {
        console.log('✅ Profile was created by another process');
        return profileId;
      }
      
      // If it's an RLS error, provide detailed debugging
      if (createError.code === '42501') {
        console.error('❌ RLS Policy Error - Profile INSERT policy violation');
        console.error('Error details:', {
          code: createError.code,
          message: createError.message,
          profileId: profileId,
          authUid: authUid,
          matches: profileId === authUid,
          policyCheck: `id = auth.uid() should be: ${profileId} = ${authUid}`
        });
        throw new Error(`RLS policy error: Cannot create profile. Profile ID (${profileId}) must match auth.uid() (${authUid}).`);
      }
      
      console.error('❌ Error creating profile:', createError);
      throw new Error(`Failed to create profile: ${createError.message}`);
    }

    console.log('✅ Profile created successfully:', newProfile.username);
    return profileId;
  };

  const submitStack = async (name: string, tools: Tool[]) => {
    setLoading(true);

    try {
      console.log('🚀 Starting stack submission:', { name, toolCount: tools.length });
      
      if (!user?.id) {
        throw new Error("User not authenticated");
      }

      // Ensure profile exists before creating stack
      console.log('🔍 Ensuring profile exists...');
      const profileId = await ensureProfileExists(user.id);
      console.log('✅ Profile ID confirmed:', profileId);

      // Use validated slug generation
      const slug = generateSlug(name);

      console.log('📝 Generated slug:', slug);

      // Create stack with confirmed profile_id
      const { data: stack, error: stackError } = await supabase
        .from("stacks")
        .insert({
          name: name,
          slug: slug,
          profile_id: profileId,
          is_public: true,
        })
        .select()
        .single();

      if (stackError) {
        console.error('❌ Error creating stack:', stackError);
        throw new Error(`Failed to create stack: ${stackError.message}`);
      }

      console.log('✅ Stack created:', stack.id);

      // Create stack_items
      const stackItems = tools.map((tool, index) => ({
        stack_id: stack.id,
        tool_id: tool.id,
        sort_order: index,
      }));

      console.log('📦 Creating stack items:', stackItems.length);

      const { error: itemsError } = await supabase
        .from("stack_items")
        .insert(stackItems);

      if (itemsError) {
        console.error('❌ Error creating stack items:', itemsError);
        throw new Error(`Failed to add tools: ${itemsError.message}`);
      }

      console.log('✅ Stack items created successfully');

      // Generate AI roast ASYNCHRONOUSLY (don't block submission)
      // This runs in the background so rate limits don't block stack creation
      // Wrap in setTimeout to ensure it doesn't block the main flow
      setTimeout(() => {
        (async () => {
          try {
            console.log('🔥 Starting AI roast generation in background for stack:', name);
            console.log('Tools:', tools.map(t => t.name));
            
            // Determine which persona to use
            let personaToUse: PersonaKey;
            try {
              personaToUse = selectedPersona === 'random' ? getRandomPersona() : selectedPersona;
              console.log('🎭 Using persona:', personaToUse);
            } catch (personaError: any) {
              console.error('❌ Error getting persona, using random:', personaError);
              personaToUse = getRandomPersona();
            }
            
            // Add timeout to prevent hanging (30 seconds max)
            const roastPromise = generateRoast(
              name,
              tools.map(t => ({ name: t.name, category: t.category })),
              personaToUse
            );
            
            const timeoutPromise = new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Roast generation timeout (30s)')), 30000)
            );
            
            const roastResult = await Promise.race([
              roastPromise,
              timeoutPromise
            ]) as { roastText: string; burnScore: number; persona: string; personaKey: string };
            
            const { roastText, burnScore, persona } = roastResult;

            console.log('✅ Roast generated successfully:', { roastText: roastText.substring(0, 100), burnScore, persona });

            // Save roast to database
            const { error: roastError } = await supabase
              .from('ai_roasts')
              .insert({
                stack_id: stack.id,
                roast_text: roastText,
                burn_score: burnScore,
                persona: persona,
              });

            if (roastError) {
              console.error('❌ Error saving roast to database:', roastError);
            } else {
              console.log('✅ Roast saved to database successfully');
            }
          } catch (roastError: any) {
            console.error('❌ Error generating roast (non-blocking):', roastError);
            // Don't show toast here - stack was already created successfully
            // User can regenerate roast later if needed
          }
        })();
      }, 100); // Small delay to ensure stack creation completes first

      // Award karma for stack submission (+5 points)
      if (profile && user) {
        try {
          await supabase.rpc("award_karma", {
            user_uuid: user.id,
            points: 5,
          });
          // Refresh profile to update karma display
          await refreshProfile();
        } catch (karmaError: any) {
          // Don't fail the whole submission if karma award fails
          console.error('Error awarding karma:', karmaError);
        }
      }

      // Success!
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });

      toast({
        title: "🎉 Stack Submitted Successfully!",
        description: `You earned 5 logs! Your "${name}" stack is being roasted by AI in the background...`,
        duration: 5000, // Show for 5 seconds
      });

      // Navigate to the stack page
      setTimeout(() => {
        navigate(`/stack/${slug}`);
      }, 1000);

      onOpenChange(false);
      setPendingSubmission(null);
    } catch (error: any) {
      console.error("❌ Error submitting stack:", error);
      console.error("Error details:", {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      });
      
      toast({
        title: "Error Submitting Stack",
        description: error.message || "Failed to submit stack. Please check the console for details.",
        variant: "destructive",
        duration: 5000,
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle successful auth when there's a pending submission
  const handleAuthSuccess = () => {
    if (pendingSubmission) {
      setAuthOpen(false);
      submitStack(pendingSubmission.stackName, pendingSubmission.tools);
    }
  };

  // Handle tool added from AddToolDialog
  const handleToolAdded = (tool: Tool) => {
    // Add new tool to tools list if not already present
    setTools((prev) => {
      if (prev.find((t) => t.id === tool.id)) {
        return prev;
      }
      return [...prev, tool];
    });
    // Select the new tool
    toggleTool(tool);
    // Reload tools to get updated list
    loadTools();
  };

  const filteredTools = tools.filter((tool) =>
    tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (tool.category && tool.category.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Submit Your Stack for Roasting</DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Stack Name */}
            <div className="space-y-2">
              <Label htmlFor="stack-name">Stack Name</Label>
              <Input
                id="stack-name"
                placeholder="My Awesome SaaS Stack"
                value={stackName}
                onChange={(e) => setStackName(e.target.value)}
              />
            </div>

            {/* Tool Search */}
            <div className="space-y-2">
              <Label>Select Tools</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                <Input
                  placeholder="Search tools..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Selected Tools */}
            {selectedTools.length > 0 && (
              <div className="space-y-2">
                <Label>Selected Tools ({selectedTools.length})</Label>
                <div className="flex flex-wrap gap-2">
                  {selectedTools.map((tool) => (
                    <div
                      key={tool.id}
                      className="flex items-center gap-2 px-3 py-1.5 bg-zinc-800 rounded-full border border-zinc-700"
                    >
                      <img
                        src={tool.logo_url}
                        alt={tool.name}
                        className="w-4 h-4 rounded"
                      />
                      <span className="text-sm">{tool.name}</span>
                      <button
                        onClick={() => toggleTool(tool)}
                        className="hover:text-red-400"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Available Tools Grid */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Available Tools</Label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setAddToolOpen(true)}
                  className="gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add Tool
                </Button>
              </div>
              {filteredTools.length === 0 && searchQuery ? (
                <div className="flex flex-col items-center justify-center py-8 px-4 border border-dashed border-zinc-800 rounded-lg">
                  <p className="text-sm text-muted-foreground mb-4">
                    No tools found matching "{searchQuery}"
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => setAddToolOpen(true)}
                    className="gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Add "{searchQuery}" as a new tool
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-4 gap-3 max-h-96 overflow-y-auto p-1">
                  {filteredTools.map((tool) => {
                    const isSelected = selectedTools.find((t) => t.id === tool.id);
                    return (
                      <button
                        key={tool.id}
                        onClick={() => toggleTool(tool)}
                        className={`flex flex-col items-center gap-2 p-3 rounded-lg border transition-all ${
                          isSelected
                            ? "border-orange-500 bg-orange-500/10"
                            : "border-zinc-800 bg-zinc-900 hover:border-zinc-700"
                        }`}
                      >
                        <img
                          src={tool.logo_url}
                          alt={tool.name}
                          className="w-12 h-12 rounded"
                        />
                        <div className="text-center">
                          <div className="text-sm font-medium">{tool.name}</div>
                          <div className="text-xs text-zinc-500">{tool.category}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Persona Selection */}
            <div className="space-y-2 pt-4 border-t border-zinc-800">
              <Label className="flex items-center gap-2">
                <Flame className="w-4 h-4 text-orange-500" />
                Choose Your Roaster
              </Label>
              <p className="text-xs text-muted-foreground mb-2">
                Select who will roast your stack. Each persona has a unique style!
              </p>
              <PersonaSelector
                selectedPersona={selectedPersona}
                onSelect={setSelectedPersona}
                disabled={loading}
              />
            </div>

            {/* Submit Button */}
            <div className="flex justify-end gap-3 pt-4">
              <Button
                variant="outline"
                type="button"
                onClick={() => {
                  console.log('❌ Cancel clicked');
                  onOpenChange(false);
                }}
              >
                Cancel
              </Button>
              <button
                type="button"
                onClick={async (e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  
                  console.log('🔘🔘🔘 SUBMIT BUTTON CLICKED! 🔘🔘🔘');
                  console.log('Button click event:', e);
                  console.log('Current state:', {
                    stackName: stackName?.trim(),
                    stackNameLength: stackName?.trim().length,
                    selectedToolsCount: selectedTools.length,
                    selectedTools: selectedTools.map(t => ({ id: t.id, name: t.name })),
                    user: user?.id,
                    loading,
                    disabled: loading || !stackName.trim() || selectedTools.length === 0,
                    selectedPersona
                  });
                  
                  // Double-check button isn't disabled
                  if (loading) {
                    console.warn('⚠️ Button is disabled: loading');
                    toast({
                      title: "Please wait",
                      description: "Submission in progress...",
                      variant: "default",
                    });
                    return;
                  }
                  if (!stackName.trim()) {
                    console.warn('⚠️ Button is disabled: no stack name');
                    toast({
                      title: "Missing stack name",
                      description: "Please enter a name for your stack.",
                      variant: "destructive",
                    });
                    return;
                  }
                  if (selectedTools.length === 0) {
                    console.warn('⚠️ Button is disabled: no tools selected');
                    toast({
                      title: "No tools selected",
                      description: "Please select at least one tool.",
                      variant: "destructive",
                    });
                    return;
                  }
                  
                  console.log('✅ All checks passed, calling handleSubmit...');
                  
                  try {
                    await handleSubmit();
                    console.log('✅ handleSubmit completed');
                  } catch (err: any) {
                    console.error('❌❌❌ ERROR in button onClick:', err);
                    console.error('Error stack:', err?.stack);
                    toast({
                      title: "Submission Error",
                      description: err?.message || "An error occurred. Check console for details.",
                      variant: "destructive",
                      duration: 10000,
                    });
                  }
                }}
                disabled={loading || !stackName.trim() || selectedTools.length === 0}
                className="inline-flex items-center justify-center gap-2 rounded-md bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-medium px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Flame className="w-4 h-4" />
                {loading ? "Roasting..." : user ? "Submit & Roast" : "Sign In & Submit"}
              </button>
            </div>
            
            {/* Debug Info (remove in production) */}
            {import.meta.env.DEV && (
              <div className="text-xs text-muted-foreground pt-2 border-t space-y-1">
                <div>Debug: Stack Name: "{stackName}" ({stackName.trim().length} chars)</div>
                <div>Tools: {selectedTools.length} selected</div>
                <div>User: {user ? `Yes (${user.id.substring(0, 8)}...)` : 'No'}</div>
                <div>Loading: {loading ? 'Yes' : 'No'}</div>
                <div>Persona: {selectedPersona}</div>
                <div>Button Disabled: {loading || !stackName.trim() || selectedTools.length === 0 ? 'Yes' : 'No'}</div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Auth Dialog */}
      <AuthDialog
        open={authOpen}
        onOpenChange={setAuthOpen}
        onSuccess={handleAuthSuccess}
      />

      {/* Add Tool Dialog */}
      <AddToolDialog
        open={addToolOpen}
        onOpenChange={setAddToolOpen}
        onToolAdded={handleToolAdded}
        existingTools={tools}
        initialName={searchQuery}
      />
    </>
  );
}