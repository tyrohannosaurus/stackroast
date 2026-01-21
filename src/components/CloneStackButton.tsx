import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Copy, ExternalLink, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";

interface Tool {
  id: string;
  name: string;
  affiliate_url?: string;
  logo_url?: string;
}

interface CloneStackButtonProps {
  tools: Tool[];
  stackName: string;
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg";
  className?: string;
}

export default function CloneStackButton({
  tools,
  stackName,
  variant = "default",
  size = "default",
  className = "",
}: CloneStackButtonProps) {
  const [showDialog, setShowDialog] = useState(false);
  const [isCloning, setIsCloning] = useState(false);

  const toolsWithAffiliateLinks = tools.filter((tool) => tool.affiliate_url);

  const handleCloneStack = async () => {
    setIsCloning(true);

    // Open affiliate links with a small delay to avoid popup blockers
    toolsWithAffiliateLinks.forEach((tool, index) => {
      setTimeout(() => {
        window.open(tool.affiliate_url, "_blank", "noopener,noreferrer");
      }, index * 300); // 300ms delay between each link
    });

    // Show success toast
    setTimeout(() => {
      setIsCloning(false);
      setShowDialog(false);
      toast({
        title: "🎉 Stack Cloned!",
        description: `Opening ${toolsWithAffiliateLinks.length} tools in new tabs...`,
        duration: 4000,
      });
    }, toolsWithAffiliateLinks.length * 300 + 500);
  };

  if (toolsWithAffiliateLinks.length === 0) {
    return null; // Don't show button if no affiliate links
  }

  return (
    <>
      <Button
        variant={variant}
        size={size}
        className={`gap-2 ${className}`}
        onClick={() => setShowDialog(true)}
      >
        <Copy className="w-4 h-4" />
        Clone This Stack
      </Button>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Copy className="w-5 h-5 text-violet-400" />
              Clone "{stackName}"
            </DialogTitle>
            <DialogDescription>
              This will open {toolsWithAffiliateLinks.length} tool
              {toolsWithAffiliateLinks.length > 1 ? "s" : ""} in new tabs so you
              can sign up for the entire stack.
            </DialogDescription>
          </DialogHeader>

          {/* Tool List Preview */}
          <div className="space-y-2 my-4">
            <p className="text-sm font-medium">Tools included:</p>
            <div className="space-y-1 max-h-60 overflow-y-auto">
              {toolsWithAffiliateLinks.map((tool) => (
                <div
                  key={tool.id}
                  className="flex items-center gap-2 p-2 rounded bg-white/5 border border-white/10"
                >
                  {tool.logo_url && (
                    <img
                      src={tool.logo_url}
                      alt={tool.name}
                      className="w-6 h-6 rounded"
                    />
                  )}
                  <span className="text-sm">{tool.name}</span>
                  <ExternalLink className="w-3 h-3 ml-auto text-muted-foreground" />
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setShowDialog(false)}
              disabled={isCloning}
            >
              Cancel
            </Button>
            <Button
              className="flex-1 gap-2"
              onClick={handleCloneStack}
              disabled={isCloning}
            >
              {isCloning ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Opening Links...
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  Clone Stack
                </>
              )}
            </Button>
          </div>

          {/* Info Note */}
          <p className="text-xs text-muted-foreground text-center">
            💡 Make sure your browser allows pop-ups for this site
          </p>
        </DialogContent>
      </Dialog>
    </>
  );
}