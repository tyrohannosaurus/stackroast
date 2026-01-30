import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface EmojiPickerProps {
  value: string;
  onChange: (emoji: string) => void;
}

const COMMON_EMOJIS = [
  '🚀', '⚡', '🔥', '💡', '🎯', '🛠️', '📦', '🌟',
  '💻', '🔧', '📱', '🌐', '🎨', '📊', '🔒', '⚙️',
  '🤖', '💾', '📡', '🔌', '🧪', '🎮', '📈', '💎',
  '🏗️', '🔬', '📝', '🎪', '🛡️', '🧰', '📁', '🎓',
];

export function EmojiPicker({ value, onChange }: EmojiPickerProps) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="lg"
          className="h-16 w-16 text-3xl p-0"
        >
          {value || '🚀'}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-2" align="start">
        <div className="grid grid-cols-8 gap-1">
          {COMMON_EMOJIS.map((emoji) => (
            <Button
              key={emoji}
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-lg"
              onClick={() => {
                onChange(emoji);
                setOpen(false);
              }}
            >
              {emoji}
            </Button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
