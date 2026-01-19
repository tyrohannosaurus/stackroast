import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Flame, Trophy, Send, BookOpen, Settings } from "lucide-react";

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Type a command or search..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Actions">
          <CommandItem onSelect={() => onOpenChange(false)}>
            <Send className="mr-2 h-4 w-4 text-violet-400" />
            <span>Submit Your Stack</span>
          </CommandItem>
          <CommandItem onSelect={() => onOpenChange(false)}>
            <Flame className="mr-2 h-4 w-4 text-orange-400" />
            <span>View Latest Roasts</span>
          </CommandItem>
        </CommandGroup>
        <CommandGroup heading="Navigation">
          <CommandItem onSelect={() => onOpenChange(false)}>
            <Trophy className="mr-2 h-4 w-4 text-yellow-400" />
            <span>Leaderboard</span>
          </CommandItem>
          <CommandItem onSelect={() => onOpenChange(false)}>
            <BookOpen className="mr-2 h-4 w-4 text-blue-400" />
            <span>Documentation</span>
          </CommandItem>
          <CommandItem onSelect={() => onOpenChange(false)}>
            <Settings className="mr-2 h-4 w-4 text-muted-foreground" />
            <span>Settings</span>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
