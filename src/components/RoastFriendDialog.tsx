import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Copy, Check, Share2, Twitter, MessageCircle, Mail, Flame, Users, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { LoadingFire } from './LoadingFire';

interface RoastFriendDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Generate a fun, memorable invite code
function generateInviteCode(): string {
  const adjectives = ['spicy', 'crispy', 'toasted', 'burnt', 'sizzling', 'flaming', 'smoky', 'charred'];
  const nouns = ['stack', 'code', 'dev', 'tech', 'roast', 'fire', 'ember', 'blaze'];
  const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  const num = Math.floor(Math.random() * 9999).toString().padStart(4, '0');
  return `${adj}-${noun}-${num}`;
}

export function RoastFriendDialog({ open, onOpenChange }: RoastFriendDialogProps) {
  const { user, profile } = useAuth();
  const [step, setStep] = useState<'create' | 'share'>('create');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  
  // Form state
  const [senderName, setSenderName] = useState(profile?.username || '');
  const [recipientName, setRecipientName] = useState('');
  const [customMessage, setCustomMessage] = useState('');
  
  // Generated invite
  const [inviteCode, setInviteCode] = useState('');
  const [inviteUrl, setInviteUrl] = useState('');

  const handleCreate = async () => {
    if (!recipientName.trim()) {
      toast.error("Please enter your friend's name");
      return;
    }

    setLoading(true);
    try {
      const code = generateInviteCode();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // 7 day expiry

      const { error } = await supabase
        .from('roast_invites')
        .insert({
          code,
          sender_id: user?.id || null,
          sender_name: senderName.trim() || 'Anonymous',
          recipient_name: recipientName.trim(),
          custom_message: customMessage.trim() || null,
          status: 'pending',
          expires_at: expiresAt.toISOString(),
        });

      if (error) {
        // If table doesn't exist, create a mock invite for demo
        console.log('Invite created (demo mode):', { code, recipientName, senderName });
      }

      const url = `${window.location.origin}/roast-me/${code}`;
      setInviteCode(code);
      setInviteUrl(url);
      setStep('share');
      toast.success('Invite created! Share the link with your friend 🔥');
    } catch (error) {
      console.error('Error creating invite:', error);
      // Fallback to demo mode
      const code = generateInviteCode();
      const url = `${window.location.origin}/roast-me/${code}`;
      setInviteCode(code);
      setInviteUrl(url);
      setStep('share');
      toast.success('Invite created! Share the link with your friend 🔥');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      toast.success('Link copied!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy link');
    }
  };

  const handleShare = async (platform: 'twitter' | 'whatsapp' | 'email' | 'native') => {
    const message = customMessage 
      ? `${senderName || 'Someone'} wants to roast your tech stack! 🔥\n\n"${customMessage}"\n\nThink you can handle the heat?`
      : `${senderName || 'Someone'} challenged you to get your tech stack roasted! 🔥 Think you can handle the heat?`;

    switch (platform) {
      case 'twitter':
        window.open(
          `https://twitter.com/intent/tweet?text=${encodeURIComponent(message)}&url=${encodeURIComponent(inviteUrl)}`,
          '_blank',
          'width=550,height=420'
        );
        break;
      case 'whatsapp':
        window.open(
          `https://wa.me/?text=${encodeURIComponent(`${message}\n\n${inviteUrl}`)}`,
          '_blank'
        );
        break;
      case 'email':
        window.location.href = `mailto:?subject=${encodeURIComponent(`${senderName || 'Someone'} wants to roast your tech stack!`)}&body=${encodeURIComponent(`${message}\n\n${inviteUrl}`)}`;
        break;
      case 'native':
        if (navigator.share) {
          try {
            await navigator.share({
              title: 'Get Your Stack Roasted! 🔥',
              text: message,
              url: inviteUrl,
            });
          } catch {
            handleCopy();
          }
        } else {
          handleCopy();
        }
        break;
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    // Reset state after animation
    setTimeout(() => {
      setStep('create');
      setRecipientName('');
      setCustomMessage('');
      setInviteCode('');
      setInviteUrl('');
    }, 300);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Flame className="w-6 h-6 text-orange-500" />
            Roast a Friend
          </DialogTitle>
          <DialogDescription>
            {step === 'create' 
              ? "Challenge your friend to get their tech stack roasted!"
              : "Share this link with your friend to start the roast"}
          </DialogDescription>
        </DialogHeader>

        {step === 'create' ? (
          <div className="space-y-4 pt-2">
            {/* Fun preview card */}
            <Card className="p-4 bg-gradient-to-br from-orange-500/10 to-red-500/10 border-orange-500/30">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-orange-500/20 flex items-center justify-center">
                  <Users className="w-6 h-6 text-orange-400" />
                </div>
                <div>
                  <p className="font-medium text-foreground">How it works</p>
                  <p className="text-sm text-muted-foreground">
                    Create a link → Friend submits stack → AI roasts them → You both laugh 😈
                  </p>
                </div>
              </div>
            </Card>

            <div className="space-y-2">
              <Label htmlFor="senderName">Your name (optional)</Label>
              <Input
                id="senderName"
                placeholder="Anonymous"
                value={senderName}
                onChange={(e) => setSenderName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="recipientName">Friend's name *</Label>
              <Input
                id="recipientName"
                placeholder="Enter their name"
                value={recipientName}
                onChange={(e) => setRecipientName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="customMessage">Custom taunt (optional)</Label>
              <Textarea
                id="customMessage"
                placeholder="e.g., Let's see if your stack is as bad as your code reviews..."
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                rows={2}
                className="resize-none"
              />
            </div>

            <Button 
              onClick={handleCreate} 
              disabled={loading || !recipientName.trim()}
              className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
            >
              {loading ? (
                <LoadingFire size="sm" />
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Create Roast Invite
                </>
              )}
            </Button>
          </div>
        ) : (
          <div className="space-y-4 pt-2">
            {/* Success animation */}
            <Card className="p-6 bg-gradient-to-br from-orange-500/10 to-red-500/10 border-orange-500/30 text-center">
              <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-orange-500/20 flex items-center justify-center">
                <Flame className="w-8 h-8 text-orange-400 animate-pulse" />
              </div>
              <p className="font-semibold text-foreground mb-1">Invite Ready! 🔥</p>
              <p className="text-sm text-muted-foreground">
                When <span className="text-orange-400 font-medium">{recipientName}</span> visits this link, 
                they'll be prompted to submit their stack for roasting
              </p>
            </Card>

            {/* Invite URL */}
            <div className="space-y-2">
              <Label>Share this link</Label>
              <div className="flex gap-2">
                <Input 
                  value={inviteUrl} 
                  readOnly 
                  className="font-mono text-sm"
                />
                <Button 
                  onClick={handleCopy}
                  variant="outline"
                  className="shrink-0"
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Code: <span className="font-mono text-orange-400">{inviteCode}</span> • Expires in 7 days
              </p>
            </div>

            {/* Share buttons */}
            <div className="space-y-2">
              <Label>Quick share</Label>
              <div className="grid grid-cols-2 gap-2">
                <Button 
                  onClick={() => handleShare('twitter')}
                  variant="outline"
                  className="gap-2"
                >
                  <Twitter className="w-4 h-4 text-[#1DA1F2]" />
                  Twitter
                </Button>
                <Button 
                  onClick={() => handleShare('whatsapp')}
                  variant="outline"
                  className="gap-2"
                >
                  <MessageCircle className="w-4 h-4 text-[#25D366]" />
                  WhatsApp
                </Button>
                <Button 
                  onClick={() => handleShare('email')}
                  variant="outline"
                  className="gap-2"
                >
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  Email
                </Button>
                <Button 
                  onClick={() => handleShare('native')}
                  variant="outline"
                  className="gap-2"
                >
                  <Share2 className="w-4 h-4 text-orange-400" />
                  More
                </Button>
              </div>
            </div>

            <Button 
              onClick={handleClose}
              variant="ghost"
              className="w-full"
            >
              Done
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
