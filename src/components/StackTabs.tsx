import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Flame, Users, MessageSquare } from "lucide-react";
import { AIRoastTab } from "./AIRoastTab";
import { CommunityRoastsTab } from "./CommunityRoastsTab";
import { DiscussionSection } from "./DiscussionSection";

interface StackTabsProps {
  stackId: string;
  stackSlug?: string;
}

export function StackTabs({ stackId, stackSlug }: StackTabsProps) {
  return (
    <Tabs defaultValue="ai-roast" className="w-full">
      <TabsList className="w-full justify-start bg-zinc-900/50 p-1">
        <TabsTrigger value="ai-roast" className="flex items-center gap-2 data-[state=active]:bg-orange-500/20 data-[state=active]:text-orange-400">
          <Flame className="w-4 h-4" />
          AI Roast
        </TabsTrigger>
        <TabsTrigger value="community" className="flex items-center gap-2 data-[state=active]:bg-orange-500/20 data-[state=active]:text-orange-400">
          <Users className="w-4 h-4" />
          Community Roasts
        </TabsTrigger>
        <TabsTrigger value="discussion" className="flex items-center gap-2 data-[state=active]:bg-blue-500/20 data-[state=active]:text-blue-400">
          <MessageSquare className="w-4 h-4" />
          Discussion
        </TabsTrigger>
      </TabsList>

      <TabsContent value="ai-roast" className="mt-6">
        <AIRoastTab stackId={stackId} stackSlug={stackSlug} />
      </TabsContent>

      <TabsContent value="community" className="mt-6">
        <CommunityRoastsTab stackId={stackId} />
      </TabsContent>

      <TabsContent value="discussion" className="mt-6">
        <DiscussionSection stackId={stackId} />
      </TabsContent>
    </Tabs>
  );
}