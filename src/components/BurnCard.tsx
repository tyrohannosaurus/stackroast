import { useRef, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Download, Share2, Copy, Check } from 'lucide-react';
import { toast } from 'sonner';

interface BurnCardProps {
  stackName: string;
  burnScore: number;
  roastText: string;
  persona: string;
  username: string;
  toolCount: number;
}

interface BurnCardDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  stackName: string;
  burnScore: number;
  roastText: string;
  persona: string;
  username: string;
  toolCount: number;
  stackSlug: string;
}

export function BurnCard({ stackName, burnScore, roastText, persona, username, toolCount }: BurnCardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    drawCard();
  }, [stackName, burnScore, roastText, persona, username]);

  const drawCard = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Card dimensions (1200x630 for OG image standard)
    const width = 1200;
    const height = 630;
    canvas.width = width;
    canvas.height = height;

    // Background gradient
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, '#0a0a0f');
    gradient.addColorStop(0.5, '#1a0a20');
    gradient.addColorStop(1, '#0f0a15');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // Add subtle pattern
    ctx.fillStyle = 'rgba(139, 92, 246, 0.03)';
    for (let i = 0; i < 20; i++) {
      const x = Math.random() * width;
      const y = Math.random() * height;
      ctx.beginPath();
      ctx.arc(x, y, Math.random() * 100 + 50, 0, Math.PI * 2);
      ctx.fill();
    }

    // Border glow
    ctx.strokeStyle = 'rgba(249, 115, 22, 0.5)';
    ctx.lineWidth = 4;
    ctx.strokeRect(20, 20, width - 40, height - 40);

    // Inner border
    ctx.strokeStyle = 'rgba(249, 115, 22, 0.2)';
    ctx.lineWidth = 1;
    ctx.strokeRect(30, 30, width - 60, height - 60);

    // Logo/Brand
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 24px Inter, system-ui, sans-serif';
    ctx.fillText('🔥 StackRoast', 60, 80);

    // Stack Name
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 48px Inter, system-ui, sans-serif';
    const maxNameWidth = width - 300;
    let displayName = stackName;
    if (ctx.measureText(stackName).width > maxNameWidth) {
      while (ctx.measureText(displayName + '...').width > maxNameWidth && displayName.length > 0) {
        displayName = displayName.slice(0, -1);
      }
      displayName += '...';
    }
    ctx.fillText(displayName, 60, 150);

    // Username and tool count
    ctx.fillStyle = '#a1a1aa';
    ctx.font = '20px Inter, system-ui, sans-serif';
    ctx.fillText(`by @${username} • ${toolCount} tools`, 60, 190);

    // Burn Score - large display on the right
    const scoreX = width - 200;
    const scoreY = 130;
    
    // Score background circle
    ctx.beginPath();
    ctx.arc(scoreX, scoreY, 80, 0, Math.PI * 2);
    const scoreGradient = ctx.createRadialGradient(scoreX, scoreY, 0, scoreX, scoreY, 80);
    if (burnScore >= 80) {
      scoreGradient.addColorStop(0, 'rgba(239, 68, 68, 0.3)');
      scoreGradient.addColorStop(1, 'rgba(239, 68, 68, 0.1)');
    } else if (burnScore >= 60) {
      scoreGradient.addColorStop(0, 'rgba(249, 115, 22, 0.3)');
      scoreGradient.addColorStop(1, 'rgba(249, 115, 22, 0.1)');
    } else {
      scoreGradient.addColorStop(0, 'rgba(234, 179, 8, 0.3)');
      scoreGradient.addColorStop(1, 'rgba(234, 179, 8, 0.1)');
    }
    ctx.fillStyle = scoreGradient;
    ctx.fill();
    
    ctx.strokeStyle = burnScore >= 80 ? '#ef4444' : burnScore >= 60 ? '#f97316' : '#eab308';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Score number
    ctx.fillStyle = burnScore >= 80 ? '#ef4444' : burnScore >= 60 ? '#f97316' : '#eab308';
    ctx.font = 'bold 64px Inter, system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(burnScore.toString(), scoreX, scoreY + 15);
    
    ctx.fillStyle = '#71717a';
    ctx.font = '16px Inter, system-ui, sans-serif';
    ctx.fillText('/100', scoreX, scoreY + 45);
    ctx.textAlign = 'left';

    // Roast text box
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.beginPath();
    ctx.roundRect(50, 230, width - 100, 280, 16);
    ctx.fill();

    ctx.strokeStyle = 'rgba(249, 115, 22, 0.3)';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Persona
    ctx.fillStyle = '#f97316';
    ctx.font = '18px Inter, system-ui, sans-serif';
    ctx.fillText(`🤖 ${persona} says:`, 80, 275);

    // Roast text with word wrap
    ctx.fillStyle = '#e4e4e7';
    ctx.font = 'italic 24px Inter, system-ui, sans-serif';
    
    const maxWidth = width - 160;
    const lineHeight = 34;
    const words = roastText.split(' ');
    let line = '"';
    let y = 320;
    const maxLines = 5;
    let lineCount = 0;

    for (let i = 0; i < words.length; i++) {
      const testLine = line + words[i] + ' ';
      const metrics = ctx.measureText(testLine);
      
      if (metrics.width > maxWidth && line !== '"') {
        ctx.fillText(line, 80, y);
        line = words[i] + ' ';
        y += lineHeight;
        lineCount++;
        
        if (lineCount >= maxLines - 1) {
          // Add remaining text with ellipsis
          const remaining = words.slice(i).join(' ');
          if (remaining.length > 50) {
            ctx.fillText(remaining.substring(0, 47) + '..."', 80, y);
          } else {
            ctx.fillText(remaining + '"', 80, y);
          }
          break;
        }
      } else {
        line = testLine;
      }
      
      if (i === words.length - 1 && lineCount < maxLines) {
        ctx.fillText(line.trim() + '"', 80, y);
      }
    }

    // Footer
    ctx.fillStyle = '#71717a';
    ctx.font = '18px Inter, system-ui, sans-serif';
    ctx.fillText('Get your stack roasted at stackroast.dev', 60, height - 50);

    // Burn intensity label
    let intensityLabel = '❄️ MILD';
    let intensityColor = '#22c55e';
    if (burnScore >= 80) {
      intensityLabel = '🔥🔥🔥 SAVAGE';
      intensityColor = '#ef4444';
    } else if (burnScore >= 60) {
      intensityLabel = '🔥🔥 SPICY';
      intensityColor = '#f97316';
    } else if (burnScore >= 40) {
      intensityLabel = '🔥 WARM';
      intensityColor = '#eab308';
    }

    ctx.fillStyle = intensityColor;
    ctx.font = 'bold 20px Inter, system-ui, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(intensityLabel, width - 60, height - 50);
    ctx.textAlign = 'left';
  };

  return (
    <canvas 
      ref={canvasRef} 
      className="w-full h-auto rounded-lg"
      style={{ maxWidth: '600px' }}
    />
  );
}

export function BurnCardDialog({ 
  open, 
  onOpenChange, 
  stackName, 
  burnScore, 
  roastText, 
  persona, 
  username,
  toolCount,
  stackSlug 
}: BurnCardDialogProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (open) {
      // Small delay to ensure canvas is mounted
      setTimeout(() => drawCard(), 100);
    }
  }, [open, stackName, burnScore, roastText, persona, username]);

  const drawCard = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Same drawing logic as BurnCard component
    const width = 1200;
    const height = 630;
    canvas.width = width;
    canvas.height = height;

    // Background gradient
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, '#0a0a0f');
    gradient.addColorStop(0.5, '#1a0a20');
    gradient.addColorStop(1, '#0f0a15');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // Add subtle pattern
    ctx.fillStyle = 'rgba(139, 92, 246, 0.03)';
    for (let i = 0; i < 20; i++) {
      const x = Math.random() * width;
      const y = Math.random() * height;
      ctx.beginPath();
      ctx.arc(x, y, Math.random() * 100 + 50, 0, Math.PI * 2);
      ctx.fill();
    }

    // Border
    ctx.strokeStyle = 'rgba(249, 115, 22, 0.5)';
    ctx.lineWidth = 4;
    ctx.strokeRect(20, 20, width - 40, height - 40);

    // Logo
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 24px Inter, system-ui, sans-serif';
    ctx.fillText('🔥 StackRoast', 60, 80);

    // Stack Name
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 48px Inter, system-ui, sans-serif';
    ctx.fillText(stackName.length > 30 ? stackName.substring(0, 27) + '...' : stackName, 60, 150);

    // Username
    ctx.fillStyle = '#a1a1aa';
    ctx.font = '20px Inter, system-ui, sans-serif';
    ctx.fillText(`by @${username} • ${toolCount} tools`, 60, 190);

    // Burn Score
    const scoreX = width - 200;
    const scoreY = 130;
    
    ctx.beginPath();
    ctx.arc(scoreX, scoreY, 80, 0, Math.PI * 2);
    ctx.fillStyle = burnScore >= 80 ? 'rgba(239, 68, 68, 0.2)' : burnScore >= 60 ? 'rgba(249, 115, 22, 0.2)' : 'rgba(234, 179, 8, 0.2)';
    ctx.fill();
    ctx.strokeStyle = burnScore >= 80 ? '#ef4444' : burnScore >= 60 ? '#f97316' : '#eab308';
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.fillStyle = burnScore >= 80 ? '#ef4444' : burnScore >= 60 ? '#f97316' : '#eab308';
    ctx.font = 'bold 64px Inter, system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(burnScore.toString(), scoreX, scoreY + 15);
    ctx.fillStyle = '#71717a';
    ctx.font = '16px Inter, system-ui, sans-serif';
    ctx.fillText('/100', scoreX, scoreY + 45);
    ctx.textAlign = 'left';

    // Roast box
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.beginPath();
    ctx.roundRect(50, 230, width - 100, 280, 16);
    ctx.fill();
    ctx.strokeStyle = 'rgba(249, 115, 22, 0.3)';
    ctx.stroke();

    // Persona
    ctx.fillStyle = '#f97316';
    ctx.font = '18px Inter, system-ui, sans-serif';
    ctx.fillText(`🤖 ${persona} says:`, 80, 275);

    // Roast text
    ctx.fillStyle = '#e4e4e7';
    ctx.font = 'italic 24px Inter, system-ui, sans-serif';
    const shortRoast = roastText.length > 200 ? roastText.substring(0, 197) + '...' : roastText;
    const words = shortRoast.split(' ');
    let line = '"';
    let y = 320;
    const maxWidth = width - 160;
    const lineHeight = 34;

    for (let i = 0; i < words.length; i++) {
      const testLine = line + words[i] + ' ';
      if (ctx.measureText(testLine).width > maxWidth && line !== '"') {
        ctx.fillText(line, 80, y);
        line = words[i] + ' ';
        y += lineHeight;
        if (y > 470) {
          ctx.fillText(line.trim() + '..."', 80, y);
          break;
        }
      } else {
        line = testLine;
      }
      if (i === words.length - 1) {
        ctx.fillText(line.trim() + '"', 80, y);
      }
    }

    // Footer
    ctx.fillStyle = '#71717a';
    ctx.font = '18px Inter, system-ui, sans-serif';
    ctx.fillText('Get your stack roasted at stackroast.dev', 60, height - 50);
  };

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const link = document.createElement('a');
    link.download = `${stackSlug}-burn-card.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
    toast.success('Burn card downloaded!');
  };

  const handleCopyLink = () => {
    const url = `${window.location.origin}/stack/${stackSlug}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    toast.success('Link copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const url = `${window.location.origin}/stack/${stackSlug}`;
    const text = `🔥 My stack "${stackName}" got a ${burnScore}/100 burn score on StackRoast!\n\n"${roastText.substring(0, 100)}..."\n\nGet your stack roasted:`;

    if (navigator.share) {
      try {
        // Try to share with image
        canvas.toBlob(async (blob) => {
          if (blob) {
            const file = new File([blob], 'burn-card.png', { type: 'image/png' });
            try {
              await navigator.share({
                title: `${stackName} - StackRoast`,
                text,
                url,
                files: [file],
              });
            } catch {
              // Fallback without file
              await navigator.share({ title: `${stackName} - StackRoast`, text, url });
            }
          }
        });
      } catch {
        handleCopyLink();
      }
    } else {
      handleCopyLink();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Share Your Burn Card</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <canvas 
            ref={canvasRef} 
            className="w-full h-auto rounded-lg border border-zinc-800"
            style={{ maxWidth: '100%' }}
          />

          <div className="flex items-center gap-3">
            <Button onClick={handleDownload} className="flex-1">
              <Download className="w-4 h-4 mr-2" />
              Download PNG
            </Button>
            <Button onClick={handleShare} variant="outline" className="flex-1">
              <Share2 className="w-4 h-4 mr-2" />
              Share
            </Button>
            <Button onClick={handleCopyLink} variant="outline">
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </Button>
          </div>

          <p className="text-xs text-muted-foreground text-center">
            Share your burn card on Twitter, LinkedIn, or anywhere else!
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
