import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Flame, ArrowLeft, Search, X, Check, Sparkles, AlertCircle, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { LoadingFire } from '@/components/LoadingFire';
import { generateRoast } from '@/lib/generateRoast';
import { getRandomPersona, ROAST_PERSONAS, PersonaKey } from '@/lib/roastPersonas';
import { sendFriendRoastCompleteEmail } from '@/lib/emailService';
import { RoastInvite } from '@/types';

interface Tool {
  id: string;
  name: string;
  slug: string;
  logo_url: string;
  category: string;
}

export default function RoastMe() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  
  // Invite state
  const [invite, setInvite] = useState<RoastInvite | null>(null);
  const [inviteLoading, setInviteLoading] = useState(true);
  const [inviteError, setInviteError] = useState<string | null>(null);
  
  // Stack building state
  const [step, setStep] = useState<'loading' | 'intro' | 'build' | 'roasting' | 'result'>('loading');
  const [stackName, setStackName] = useState('');
  const [selectedTools, setSelectedTools] = useState<Tool[]>([]);
  const [tools, setTools] = useState<Tool[]>([]);
  const [toolSearch, setToolSearch] = useState('');
  const [toolsLoading, setToolsLoading] = useState(false);
  
  // Roast state
  const [roastText, setRoastText] = useState('');
  const [burnScore, setBurnScore] = useState(0);
  const [persona, setPersona] = useState<PersonaKey>(getRandomPersona());
  const [stackSlug, setStackSlug] = useState('');

  // Fetch invite details
  useEffect(() => {
    async function fetchInvite() {
      if (!code) {
        setInviteError('Invalid invite link');
        setStep('loading');
        setInviteLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('roast_invites')
          .select('*')
          .eq('code', code)
          .single();

        if (error || !data) {
          // Demo mode - create mock invite
          const mockInvite: RoastInvite = {
            id: 'mock-id',
            code: code,
            sender_id: null,
            sender_name: 'A mysterious friend',
            recipient_name: 'Friend',
            custom_message: 'Think your stack can handle the heat? 🔥',
            status: 'pending',
            created_at: new Date().toISOString(),
            expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          };
          setInvite(mockInvite);
          setStep('intro');
        } else {
          // Check if expired
          if (new Date(data.expires_at) < new Date()) {
            setInviteError('This invite has expired');
            setStep('loading');
          } else if (data.status === 'completed') {
            setInviteError('This invite has already been used');
            setStep('loading');
          } else {
            setInvite(data);
            setStep('intro');
          }
        }
      } catch (err) {
        // Fallback to demo mode
        const mockInvite: RoastInvite = {
          id: 'mock-id',
          code: code,
          sender_id: null,
          sender_name: 'A mysterious friend',
          recipient_name: 'Friend',
          custom_message: 'Think your stack can handle the heat? 🔥',
          status: 'pending',
          created_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        };
        setInvite(mockInvite);
        setStep('intro');
      } finally {
        setInviteLoading(false);
      }
    }

    fetchInvite();
  }, [code]);

  // Fetch tools
  useEffect(() => {
    async function fetchTools() {
      setToolsLoading(true);
      try {
        const { data, error } = await supabase
          .from('tools')
          .select('id, name, slug, logo_url, category')
          .order('priority_score', { ascending: false });

        if (!error && data) {
          setTools(data);
        }
      } catch (err) {
        console.error('Error fetching tools:', err);
      } finally {
        setToolsLoading(false);
      }
    }

    if (step === 'build') {
      fetchTools();
    }
  }, [step]);

  const filteredTools = tools.filter(tool => 
    tool.name.toLowerCase().includes(toolSearch.toLowerCase()) ||
    tool.category?.toLowerCase().includes(toolSearch.toLowerCase())
  );

  const handleAddTool = (tool: Tool) => {
    if (!selectedTools.find(t => t.id === tool.id)) {
      setSelectedTools([...selectedTools, tool]);
    }
  };

  const handleRemoveTool = (toolId: string) => {
    setSelectedTools(selectedTools.filter(t => t.id !== toolId));
  };

  const handleSubmitStack = async () => {
    if (!stackName.trim()) {
      toast.error('Please enter a name for your stack');
      return;
    }
    if (selectedTools.length < 2) {
      toast.error('Please select at least 2 tools');
      return;
    }

    setStep('roasting');

    try {
      // Generate slug
      const slug = stackName.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Date.now().toString(36);

      // Create stack
      const { data: stackData, error: stackError } = await supabase
        .from('stacks')
        .insert({
          name: stackName,
          slug,
          is_public: true,
          profile_id: null, // Anonymous submission
        })
        .select()
        .single();

      if (stackError) throw stackError;

      // Add stack items
      const stackItems = selectedTools.map((tool, index) => ({
        stack_id: stackData.id,
        tool_id: tool.id,
        sort_order: index,
      }));

      await supabase.from('stack_items').insert(stackItems);

      // Generate AI roast
      const toolNames = selectedTools.map(t => t.name);
      const roastResult = await generateRoast(toolNames, stackName, persona);

      if (roastResult) {
        setRoastText(roastResult.roast);
        setBurnScore(roastResult.burnScore);

        // Save roast to database
        await supabase.from('ai_roasts').insert({
          stack_id: stackData.id,
          roast_text: roastResult.roast,
          burn_score: roastResult.burnScore,
          persona: ROAST_PERSONAS[persona].name,
        });

        // Update invite status
        if (invite?.id && invite.id !== 'mock-id') {
          await supabase
            .from('roast_invites')
            .update({ 
              status: 'completed',
              stack_id: stackData.id,
              completed_at: new Date().toISOString(),
            })
            .eq('id', invite.id);

          // Send email notification to the sender if they have an account
          if (invite.sender_id) {
            const { data: senderProfile } = await supabase
              .from('profiles')
              .select('username')
              .eq('id', invite.sender_id)
              .single();

            const { data: senderUser } = await supabase.auth.admin?.getUserById?.(invite.sender_id) || { data: null };
            
            // Try to get sender email from auth (this may require admin access)
            // For now, log the completion - in production you'd use a webhook or edge function
            console.log('Friend roast completed - would notify sender:', {
              senderId: invite.sender_id,
              senderName: invite.sender_name,
              recipientName: invite.recipient_name,
              stackName,
              burnScore: roastResult.burnScore
            });
          }
        }
      }

      setStackSlug(slug);
      setStep('result');
    } catch (error) {
      console.error('Error:', error);
      toast.error('Something went wrong. Please try again.');
      setStep('build');
    }
  };

  // Loading state
  if (inviteLoading || step === 'loading') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        {inviteLoading ? (
          <LoadingFire text="Loading invite..." />
        ) : inviteError ? (
          <Card className="p-8 max-w-md text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">{inviteError}</h2>
            <p className="text-muted-foreground mb-4">
              This roast invite is no longer valid.
            </p>
            <Button onClick={() => navigate('/')}>
              Go to StackRoast
            </Button>
          </Card>
        ) : null}
      </div>
    );
  }

  // Intro step - show the challenge
  if (step === 'intro' && invite) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-2xl mx-auto px-4 py-16">
          <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8">
            <ArrowLeft className="w-4 h-4" />
            Back to StackRoast
          </Link>

          <Card className="p-8 bg-gradient-to-br from-orange-500/10 to-red-500/10 border-orange-500/30">
            <div className="text-center">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-orange-500/20 flex items-center justify-center">
                <Flame className="w-10 h-10 text-orange-400 animate-pulse" />
              </div>
              
              <Badge className="mb-4 bg-orange-500/20 text-orange-400 border-orange-500/30">
                🔥 You've Been Challenged!
              </Badge>
              
              <h1 className="text-3xl font-bold mb-4 text-foreground">
                {invite.sender_name} wants to roast your stack!
              </h1>
              
              {invite.custom_message && (
                <Card className="p-4 mb-6 bg-black/20 border-white/10">
                  <p className="text-lg italic text-muted-foreground">
                    "{invite.custom_message}"
                  </p>
                </Card>
              )}

              <p className="text-muted-foreground mb-8">
                Submit your tech stack and let our AI roast it. Think you can handle the heat?
              </p>

              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mb-8">
                <Clock className="w-4 h-4" />
                <span>Invite code: <span className="font-mono text-orange-400">{invite.code}</span></span>
              </div>

              <Button 
                onClick={() => setStep('build')}
                size="lg"
                className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
              >
                <Sparkles className="w-5 h-5 mr-2" />
                Accept the Challenge
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  // Build stack step
  if (step === 'build') {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-3xl mx-auto px-4 py-8">
          <button 
            onClick={() => setStep('intro')}
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>

          <div className="mb-8">
            <h1 className="text-2xl font-bold mb-2 flex items-center gap-2">
              <Flame className="w-6 h-6 text-orange-500" />
              Build Your Stack
            </h1>
            <p className="text-muted-foreground">
              Select the tools you use and prepare for the roast 🔥
            </p>
          </div>

          {/* Stack name */}
          <div className="mb-6">
            <Label htmlFor="stackName" className="text-base font-medium">Stack Name</Label>
            <Input
              id="stackName"
              placeholder="My Awesome Stack"
              value={stackName}
              onChange={(e) => setStackName(e.target.value)}
              className="mt-2"
            />
          </div>

          {/* Selected tools */}
          {selectedTools.length > 0 && (
            <div className="mb-6">
              <Label className="text-base font-medium">Selected Tools ({selectedTools.length})</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {selectedTools.map(tool => (
                  <Badge 
                    key={tool.id}
                    variant="secondary"
                    className="pl-2 pr-1 py-1 flex items-center gap-2"
                  >
                    {tool.logo_url && (
                      <img src={tool.logo_url} alt={tool.name} className="w-4 h-4 rounded" />
                    )}
                    <span>{tool.name}</span>
                    <button
                      onClick={() => handleRemoveTool(tool.id)}
                      className="ml-1 hover:bg-destructive/20 rounded-full p-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Tool search */}
          <div className="mb-4">
            <Label className="text-base font-medium">Add Tools</Label>
            <div className="relative mt-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search tools..."
                value={toolSearch}
                onChange={(e) => setToolSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Tool grid */}
          <Card className="p-4 max-h-64 overflow-y-auto mb-6">
            {toolsLoading ? (
              <div className="flex justify-center py-8">
                <LoadingFire size="sm" />
              </div>
            ) : filteredTools.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">No tools found</p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {filteredTools.slice(0, 30).map(tool => {
                  const isSelected = selectedTools.some(t => t.id === tool.id);
                  return (
                    <button
                      key={tool.id}
                      onClick={() => isSelected ? handleRemoveTool(tool.id) : handleAddTool(tool)}
                      className={`flex items-center gap-2 p-2 rounded-lg border text-left transition-colors ${
                        isSelected 
                          ? 'bg-orange-500/20 border-orange-500/50' 
                          : 'bg-surface/50 border-border hover:bg-surface hover:border-orange-500/30'
                      }`}
                    >
                      {tool.logo_url ? (
                        <img src={tool.logo_url} alt={tool.name} className="w-6 h-6 rounded" />
                      ) : (
                        <div className="w-6 h-6 rounded bg-muted flex items-center justify-center text-xs">
                          {tool.name[0]}
                        </div>
                      )}
                      <span className="text-sm truncate flex-1">{tool.name}</span>
                      {isSelected && <Check className="w-4 h-4 text-orange-500" />}
                    </button>
                  );
                })}
              </div>
            )}
          </Card>

          {/* Submit button */}
          <Button 
            onClick={handleSubmitStack}
            disabled={selectedTools.length < 2 || !stackName.trim()}
            className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
            size="lg"
          >
            <Flame className="w-5 h-5 mr-2" />
            Get Roasted ({selectedTools.length} tools)
          </Button>
        </div>
      </div>
    );
  }

  // Roasting step
  if (step === 'roasting') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <LoadingFire size="lg" text="Preparing your roast..." />
          <p className="text-muted-foreground mt-4">
            Our AI is analyzing your stack...
          </p>
        </div>
      </div>
    );
  }

  // Result step
  if (step === 'result') {
    const intensityLabel = burnScore >= 80 ? '🔥🔥🔥 SAVAGE' : burnScore >= 60 ? '🔥🔥 SPICY' : burnScore >= 40 ? '🔥 WARM' : '❄️ MILD';
    const intensityColor = burnScore >= 80 ? 'text-red-500' : burnScore >= 60 ? 'text-orange-500' : burnScore >= 40 ? 'text-yellow-500' : 'text-green-500';

    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-2xl mx-auto px-4 py-8">
          <div className="text-center mb-8">
            <Badge className="mb-4 bg-orange-500/20 text-orange-400 border-orange-500/30">
              Roast Complete! 🔥
            </Badge>
            <h1 className="text-3xl font-bold mb-2">{stackName}</h1>
            <p className="text-muted-foreground">
              Challenged by {invite?.sender_name}
            </p>
          </div>

          {/* Burn Score */}
          <Card className="p-6 mb-6 text-center bg-gradient-to-br from-orange-500/10 to-red-500/10 border-orange-500/30">
            <div className="text-6xl font-bold mb-2" style={{ color: burnScore >= 80 ? '#ef4444' : burnScore >= 60 ? '#f97316' : '#eab308' }}>
              {burnScore}
            </div>
            <p className="text-muted-foreground">/100 Burn Score</p>
            <Badge className={`mt-2 ${intensityColor}`}>{intensityLabel}</Badge>
          </Card>

          {/* Roast text */}
          <Card className="p-6 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <Badge variant="secondary">{ROAST_PERSONAS[persona].name}</Badge>
              <span className="text-muted-foreground">says:</span>
            </div>
            <p className="text-lg italic text-foreground leading-relaxed">
              "{roastText}"
            </p>
          </Card>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button 
              onClick={() => navigate(`/stack/${stackSlug}`)}
              className="flex-1"
            >
              View Full Stack
            </Button>
            <Button 
              onClick={() => navigate('/')}
              variant="outline"
              className="flex-1"
            >
              Back to StackRoast
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
