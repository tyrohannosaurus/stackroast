import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Github, Loader2, Flame, Check, X, AlertCircle } from "lucide-react";
import { fetchGitHubRepo, parseRepoFiles } from "@/lib/githubParser";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { generateRoast } from "@/lib/generateRoast";
import { toast } from "sonner";
import confetti from "canvas-confetti";

interface ParsedDependency {
  name: string;
  version?: string;
  category: string;
}

interface RepoRoastDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type Step = 'input' | 'parsing' | 'review' | 'submitting' | 'success';

export function RepoRoastDialog({ open, onOpenChange }: RepoRoastDialogProps) {
  const { user } = useAuth();
  const [step, setStep] = useState<Step>('input');
  const [repoUrl, setRepoUrl] = useState('');
  const [stackName, setStackName] = useState('');
  const [parsedDeps, setParsedDeps] = useState<ParsedDependency[]>([]);
  const [selectedDeps, setSelectedDeps] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);

  const resetDialog = () => {
    setStep('input');
    setRepoUrl('');
    setStackName('');
    setParsedDeps([]);
    setSelectedDeps(new Set());
    setError(null);
  };

  const handleClose = () => {
    resetDialog();
    onOpenChange(false);
  };

  const handleParseRepo = async () => {
    if (!repoUrl.trim()) {
      setError('Please enter a GitHub repository URL');
      return;
    }

    setError(null);
    setStep('parsing');

    try {
      const result = await fetchGitHubRepo(repoUrl);
      
      if (!result) {
        throw new Error('Could not fetch repository');
      }

      const deps = parseRepoFiles(result.files);

      if (deps.length === 0) {
        throw new Error('No recognized dependencies found in this repository. Make sure it has package.json, requirements.txt, or similar files.');
      }

      setParsedDeps(deps);
      setSelectedDeps(new Set(deps.map(d => d.name)));
      setStackName(result.repoName);
      setStep('review');
    } catch (error: any) {
      setError(error.message || 'Failed to parse repository');
      setStep('input');
    }
  };

  const toggleDep = (name: string) => {
    const newSelected = new Set(selectedDeps);
    if (newSelected.has(name)) {
      newSelected.delete(name);
    } else {
      newSelected.add(name);
    }
    setSelectedDeps(newSelected);
  };

  const handleSubmit = async () => {
    if (!user) {
      toast.error('Please sign in to submit a stack');
      return;
    }

    if (selectedDeps.size === 0) {
      toast.error('Please select at least one dependency');
      return;
    }

    if (!stackName.trim()) {
      toast.error('Please enter a stack name');
      return;
    }

    setStep('submitting');

    try {
      const slug = stackName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');

      // Create stack
      const { data: stack, error: stackError } = await supabase
        .from('stacks')
        .insert({
          name: stackName,
          slug,
          profile_id: user.id,
          is_public: true,
          github_url: repoUrl,
        })
        .select()
        .single();

      if (stackError) throw stackError;

      // Find matching tools in database
      const selectedDepsArray = parsedDeps.filter(d => selectedDeps.has(d.name));
      
      for (const dep of selectedDepsArray) {
        // Try to find the tool in the database
        const { data: tool } = await supabase
          .from('tools')
          .select('id')
          .ilike('name', dep.name)
          .maybeSingle();

        if (tool) {
          await supabase.from('stack_items').insert({
            stack_id: stack.id,
            tool_id: tool.id,
            sort_order: 0,
          });
        }
      }

      // Generate AI roast
      try {
        const { roastText, burnScore, persona } = await generateRoast(
          stackName,
          selectedDepsArray.map(d => ({ name: d.name, category: d.category }))
        );

        await supabase.from('ai_roasts').insert({
          stack_id: stack.id,
          roast_text: roastText,
          burn_score: burnScore,
          persona,
        });
      } catch (roastError) {
        console.error('Error generating roast:', roastError);
        // Continue anyway
      }

      // Success!
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });

      setStep('success');

      toast.success('Stack submitted from GitHub! 🎉');

      // Navigate after a delay
      setTimeout(() => {
        handleClose();
        window.location.href = `/stack/${slug}`;
      }, 2000);
    } catch (error: any) {
      console.error('Error submitting stack:', error);
      toast.error(error.message || 'Failed to submit stack');
      setStep('review');
    }
  };

  const groupedDeps = parsedDeps.reduce((acc, dep) => {
    if (!acc[dep.category]) {
      acc[dep.category] = [];
    }
    acc[dep.category].push(dep);
    return acc;
  }, {} as Record<string, ParsedDependency[]>);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Github className="w-5 h-5" />
            Roast from GitHub
          </DialogTitle>
          <DialogDescription>
            Import your tech stack directly from a GitHub repository
          </DialogDescription>
        </DialogHeader>

        {/* Step 1: Input URL */}
        {step === 'input' && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="repo-url">GitHub Repository URL</Label>
              <Input
                id="repo-url"
                placeholder="https://github.com/username/repo"
                value={repoUrl}
                onChange={(e) => setRepoUrl(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleParseRepo()}
              />
              <p className="text-xs text-muted-foreground">
                We'll analyze package.json, requirements.txt, and other dependency files
              </p>
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <p className="text-sm">{error}</p>
              </div>
            )}

            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button onClick={handleParseRepo}>
                <Github className="w-4 h-4 mr-2" />
                Analyze Repository
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Parsing */}
        {step === 'parsing' && (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="w-12 h-12 animate-spin text-orange-500 mb-4" />
            <p className="text-lg font-medium">Analyzing repository...</p>
            <p className="text-sm text-muted-foreground">
              Scanning dependency files
            </p>
          </div>
        )}

        {/* Step 3: Review */}
        {step === 'review' && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="stack-name">Stack Name</Label>
              <Input
                id="stack-name"
                value={stackName}
                onChange={(e) => setStackName(e.target.value)}
                placeholder="My Awesome Stack"
              />
            </div>

            <div className="space-y-2">
              <Label>Detected Dependencies ({selectedDeps.size} selected)</Label>
              <div className="max-h-64 overflow-y-auto border border-zinc-800 rounded-lg p-4 space-y-4">
                {Object.entries(groupedDeps).map(([category, deps]) => (
                  <div key={category}>
                    <p className="text-sm font-medium text-zinc-500 mb-2">{category}</p>
                    <div className="flex flex-wrap gap-2">
                      {deps.map((dep) => (
                        <Badge
                          key={dep.name}
                          variant={selectedDeps.has(dep.name) ? "default" : "outline"}
                          className={`cursor-pointer transition-colors ${
                            selectedDeps.has(dep.name)
                              ? 'bg-orange-500/20 text-orange-400 border-orange-500/30'
                              : 'opacity-50'
                          }`}
                          onClick={() => toggleDep(dep.name)}
                        >
                          {selectedDeps.has(dep.name) ? (
                            <Check className="w-3 h-3 mr-1" />
                          ) : (
                            <X className="w-3 h-3 mr-1" />
                          )}
                          {dep.name}
                          {dep.version && (
                            <span className="ml-1 opacity-50">v{dep.version}</span>
                          )}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setStep('input')}>
                Back
              </Button>
              <Button onClick={handleSubmit} disabled={selectedDeps.size === 0}>
                <Flame className="w-4 h-4 mr-2" />
                Submit for Roasting
              </Button>
            </div>
          </div>
        )}

        {/* Step 4: Submitting */}
        {step === 'submitting' && (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="w-12 h-12 animate-spin text-orange-500 mb-4" />
            <p className="text-lg font-medium">Submitting stack...</p>
            <p className="text-sm text-muted-foreground">
              Generating AI roast 🔥
            </p>
          </div>
        )}

        {/* Step 5: Success */}
        {step === 'success' && (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mb-4">
              <Check className="w-8 h-8 text-green-500" />
            </div>
            <p className="text-lg font-medium">Stack submitted!</p>
            <p className="text-sm text-muted-foreground">
              Redirecting to your roast...
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
