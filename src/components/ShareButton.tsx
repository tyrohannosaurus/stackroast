import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Share2, Twitter, Linkedin, Facebook, Link as LinkIcon, Check, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { generateOGImageDataUrl } from "@/lib/ogImage";

interface ShareButtonProps {
  stackName: string;
  stackSlug: string;
  burnScore: number;
  roastPreview?: string;
  persona?: string;
  username?: string;
  toolCount?: number;
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
  showLabel?: boolean;
}

export function ShareButton({
  stackName,
  stackSlug,
  burnScore,
  roastPreview,
  persona = "AI",
  username = "anonymous",
  toolCount = 0,
  variant = "ghost",
  size = "sm",
  showLabel = true,
}: ShareButtonProps) {
  const [copied, setCopied] = useState(false);

  const stackUrl = `${window.location.origin}/stack/${stackSlug}`;
  
  // Create shareable text with hashtags
  const shareText = roastPreview 
    ? `My "${stackName}" stack got roasted with a ${burnScore}/100 burn score! 🔥\n\n"${roastPreview.substring(0, 80)}..."\n\n#StackRoast #TechStack #DevLife`
    : `Check out my "${stackName}" tech stack on StackRoast! Got a ${burnScore}/100 burn score 🔥\n\n#StackRoast #TechStack`;

  const handleTwitterShare = () => {
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(stackUrl)}`;
    window.open(twitterUrl, "_blank", "width=550,height=420");
  };

  const handleLinkedInShare = () => {
    const linkedInUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(stackUrl)}`;
    window.open(linkedInUrl, "_blank", "width=550,height=420");
  };

  const handleFacebookShare = () => {
    const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(stackUrl)}`;
    window.open(facebookUrl, "_blank", "width=550,height=420");
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(stackUrl);
      setCopied(true);
      toast.success("Link copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error("Failed to copy link");
    }
  };

  const handleDownloadImage = () => {
    if (!roastPreview) {
      toast.error("No roast available to create image");
      return;
    }

    const dataUrl = generateOGImageDataUrl({
      stackName,
      stackSlug,
      burnScore,
      roastText: roastPreview,
      persona,
      username,
      toolCount,
    });

    if (dataUrl) {
      const link = document.createElement('a');
      link.download = `${stackSlug}-roast.png`;
      link.href = dataUrl;
      link.click();
      toast.success("Share image downloaded!");
    } else {
      toast.error("Failed to generate image");
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        // Try to share with image if available
        if (roastPreview) {
          const dataUrl = generateOGImageDataUrl({
            stackName,
            stackSlug,
            burnScore,
            roastText: roastPreview,
            persona,
            username,
            toolCount,
          });

          if (dataUrl) {
            // Convert data URL to blob
            const response = await fetch(dataUrl);
            const blob = await response.blob();
            const file = new File([blob], `${stackSlug}-roast.png`, { type: 'image/png' });

            try {
              await navigator.share({
                title: `${stackName} - StackRoast`,
                text: shareText,
                url: stackUrl,
                files: [file],
              });
              return;
            } catch {
              // Fall back to sharing without image
            }
          }
        }

        // Share without image
        await navigator.share({
          title: `${stackName} - StackRoast`,
          text: shareText,
          url: stackUrl,
        });
      } catch (err) {
        // User cancelled or share failed
        if ((err as Error).name !== 'AbortError') {
          handleCopyLink();
        }
      }
    } else {
      handleCopyLink();
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant={variant} size={size} className="gap-2">
          <Share2 className="w-4 h-4" />
          {showLabel && <span>Share</span>}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onClick={handleTwitterShare} className="cursor-pointer">
          <Twitter className="w-4 h-4 mr-2 text-[#1DA1F2]" />
          Share on Twitter
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleLinkedInShare} className="cursor-pointer">
          <Linkedin className="w-4 h-4 mr-2 text-[#0A66C2]" />
          Share on LinkedIn
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleFacebookShare} className="cursor-pointer">
          <Facebook className="w-4 h-4 mr-2 text-[#1877F2]" />
          Share on Facebook
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleCopyLink} className="cursor-pointer">
          {copied ? (
            <>
              <Check className="w-4 h-4 mr-2 text-green-500" />
              Link Copied!
            </>
          ) : (
            <>
              <LinkIcon className="w-4 h-4 mr-2" />
              Copy Link
            </>
          )}
        </DropdownMenuItem>
        
        {roastPreview && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleDownloadImage} className="cursor-pointer">
              <ImageIcon className="w-4 h-4 mr-2 text-orange-500" />
              Download Share Image
            </DropdownMenuItem>
            {typeof navigator !== 'undefined' && navigator.share && (
              <DropdownMenuItem onClick={handleNativeShare} className="cursor-pointer">
                <Share2 className="w-4 h-4 mr-2 text-orange-500" />
                Share with Image
              </DropdownMenuItem>
            )}
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}