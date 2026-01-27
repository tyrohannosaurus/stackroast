import { Card } from "@/components/ui/card";
import { CommunityRoastsTab } from "./CommunityRoastsTab";
import { DiscussionSection } from "./DiscussionSection";
import { ScrollArea } from "@/components/ui/scroll-area";

interface StackThreeColumnLayoutProps {
  stackId: string;
  stackSlug?: string;
}

export function StackThreeColumnLayout({ stackId, stackSlug }: StackThreeColumnLayoutProps) {
  return (
    <div className="w-full space-y-8">
      {/* Community Roasts & Discussion - Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Column 1: Community Roasts */}
        <div className="lg:sticky lg:top-24 lg:self-start">
          <div className="mb-4">
            <h2 className="text-2xl font-bold text-foreground">Community Roasts</h2>
            <p className="text-sm text-muted-foreground mt-1">
              What the community thinks about this stack
            </p>
          </div>
          <Card className="p-6 bg-card border-border h-full lg:h-[calc(100vh-12rem)] flex flex-col shadow-lg">
            <ScrollArea className="flex-1 -mx-6 px-6">
              <div className="pr-4">
                <CommunityRoastsTab stackId={stackId} />
              </div>
            </ScrollArea>
          </Card>
        </div>

        {/* Column 2: Discussion */}
        <div className="lg:sticky lg:top-24 lg:self-start">
          <div className="mb-4">
            <h2 className="text-2xl font-bold text-foreground">Discussion</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Join the conversation about this stack
            </p>
          </div>
          <Card className="p-6 bg-card border-border h-full lg:h-[calc(100vh-12rem)] flex flex-col shadow-lg">
            <ScrollArea className="flex-1 -mx-6 px-6">
              <div className="pr-4">
                <DiscussionSection stackId={stackId} />
              </div>
            </ScrollArea>
          </Card>
        </div>
      </div>
    </div>
  );
}
