import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Flame, Search, X } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { AuthDialog } from "@/components/AuthDialog";
import { generateRoast } from '@/lib/generateRoast';
import { PersonaSelector } from "@/components/PersonaSelector";
import { getRandomPersona, type PersonaKey } from "@/lib/roastPersonas";
import confetti from "canvas-confetti";

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
  
  const { toast } = useToast();
  const { user, profile } = useAuth();

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
    const { data, error } = await supabase
      .from("tools")
      .select("id, name, slug, logo_url, category")
      .order("priority_score", { ascending: false });

    if (error) {
      console.error("Error loading tools:", error);
      return;
    }

    setTools(data || []);
  };

  const toggleTool = (tool: Tool) => {
    setSelectedTools((prev) =>
      prev.find((t) => t.id === tool.id)
        ? prev.filter((t) => t.id !== tool.id)
        : [...prev, tool]
    );
  };

  const handleSubmit = async () => {
    // Validation
    if (!stackName.trim()) {
      toast({
        title: "Missing stack name",
        description: "Please enter a name for your stack.",
        variant: "destructive",
      });
      return;
    }

    if (selectedTools.length === 0) {
      toast({
        title: "No tools selected",
        description: "Please select at least one tool.",
        variant: "destructive",
      });
      return;
    }

    // Check if user is logged in
    if (!user) {
      // Store the submission data and show auth dialog
      setPendingSubmission({
        stackName: stackName,
        tools: selectedTools,
      });
      onOpenChange(false); // Close stack dialog
      setAuthOpen(true); // Open auth dialog
      return;
    }

    // User is logged in, proceed with submission
    await submitStack(stackName, selectedTools);
  };

  const submitStack = async (name: string, tools: Tool[]) => {
    setLoading(true);

    try {
      const slug = name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");

      // Create stack
      const { data: stack, error: stackError } = await supabase
        .from("stacks")
        .insert({
          name: name,
          slug: slug,
          profile_id: user?.id,
          is_public: true,
        })
        .select()
        .single();

      if (stackError) throw stackError;

      // Create stack_items
      const stackItems = tools.map((tool, index) => ({
        stack_id: stack.id,
        tool_id: tool.id,
        sort_order: index,
      }));

      const { error: itemsError } = await supabase
        .from("stack_items")
        .insert(stackItems);

      if (itemsError) throw itemsError;

      // Generate AI roast
      try {
        console.log('Starting AI roast generation for stack:', name);
        console.log('Tools:', tools.map(t => t.name));
        
        // Determine which persona to use
        const personaToUse = selectedPersona === 'random' ? getRandomPersona() : selectedPersona;
        
        const { roastText, burnScore, persona } = await generateRoast(
          name,
          tools.map(t => ({ name: t.name, category: t.category })),
          personaToUse
        );

        console.log('Roast generated successfully:', { roastText: roastText.substring(0, 100), burnScore, persona });

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
          console.error('Error saving roast to database:', roastError);
          toast({
            title: "Roast generation issue",
            description: "Stack created but AI roast couldn't be saved. You can regenerate it later.",
            variant: "destructive",
          });
        } else {
          console.log('Roast saved to database successfully');
        }
      } catch (roastError: any) {
        console.error('Error generating roast:', roastError);
        toast({
          title: "AI Roast Failed",
          description: roastError?.message || "Couldn't generate AI roast. Check if API key is configured.",
          variant: "destructive",
        });
        // Don't throw - we still want the stack to be created
      }

      // Award karma for stack submission (+5 points)
      if (profile) {
        await supabase.rpc("award_karma", {
          p_user_id: user!.id,
          p_points: 5,
          p_action_type: "stack_submit",
          p_reference_id: stack.id,
        });
      }

      // Success!
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });

      toast({
        title: "🎉 Stack Submitted Successfully!",
        description: `You earned 5 logs! Your "${name}" stack is being roasted by AI...`,
        duration: 5000, // Show for 5 seconds
      });

      // Navigate to the stack page
      setTimeout(() => {
        window.location.href = `/stack/${slug}`;
      }, 1000);

      onOpenChange(false);
      setPendingSubmission(null);
    } catch (error: any) {
      console.error("Error submitting stack:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to submit stack. Please try again.",
        variant: "destructive",
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

  const filteredTools = tools.filter((tool) =>
    tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    tool.category.toLowerCase().includes(searchQuery.toLowerCase())
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
              <Label>Available Tools</Label>
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
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={loading || !stackName.trim() || selectedTools.length === 0}
                className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
              >
                <Flame className="w-4 h-4 mr-2" />
                {loading ? "Roasting..." : user ? "Submit & Roast" : "Sign In & Submit"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Auth Dialog */}
      <AuthDialog
        open={authOpen}
        onOpenChange={setAuthOpen}
        onSuccess={handleAuthSuccess}
      />
    </>
  );
}