import { useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Smile } from "lucide-react";

interface EmojiPickerProps {
  value: string;
  onChange: (emoji: string) => void;
}

const EMOJI_CATEGORIES = {
  "Tech & Development": ["💻", "⚡", "🚀", "🔧", "⚙️", "🛠️", "📦", "🎯", "✨", "🔥", "💡", "🌟"],
  "Business & Productivity": ["📊", "📈", "💼", "📝", "✅", "📋", "🎯", "💪", "⚡", "🚀", "💎", "🎨"],
  "Communication": ["💬", "📱", "📧", "🔔", "👥", "🤝", "💭", "📢", "🎤", "📺", "🌐", "🔗"],
  "Creative & Design": ["🎨", "🖼️", "✏️", "🎭", "🎬", "📸", "🎵", "🎪", "🌈", "✨", "🎯", "💫"],
  "Data & Analytics": ["📊", "📈", "📉", "🔍", "📑", "📋", "💾", "🗄️", "🔬", "📐", "📏", "🎯"],
  "Security & DevOps": ["🔒", "🛡️", "🔐", "⚡", "🚀", "☁️", "🌐", "🔧", "⚙️", "🔄", "📦", "🎯"],
  "AI & Machine Learning": ["🤖", "🧠", "🔮", "⚡", "💡", "🎯", "🔍", "📊", "🚀", "✨", "🌟", "💫"],
  "Mobile & Apps": ["📱", "💻", "⌚", "🎮", "📲", "🔔", "⚡", "🚀", "✨", "🎯", "💡", "🌟"],
};

export function EmojiPicker({ value, onChange }: EmojiPickerProps) {
  const [open, setOpen] = useState(false);

  const handleEmojiSelect = (emoji: string) => {
    onChange(emoji);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className="w-20 h-10 text-2xl flex items-center justify-center"
        >
          {value || <Smile className="w-4 h-4 text-muted-foreground" />}
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-80 p-0" 
        align="start"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <div className="p-3 border-b">
          <h4 className="text-sm font-semibold">Select an Emoji</h4>
        </div>
        <div 
          className="h-[400px] overflow-y-auto overflow-x-hidden"
          onWheel={(e) => {
            const target = e.currentTarget;
            const { scrollTop, scrollHeight, clientHeight } = target;
            const isScrollingUp = e.deltaY < 0;
            const isScrollingDown = e.deltaY > 0;
            
            // Prevent scroll if at boundaries
            if ((scrollTop === 0 && isScrollingUp) || 
                (scrollTop + clientHeight >= scrollHeight - 1 && isScrollingDown)) {
              e.stopPropagation();
            }
          }}
        >
          <div className="p-3">
            {Object.entries(EMOJI_CATEGORIES).map(([category, emojis]) => (
              <div key={category} className="mb-4">
                <h5 className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">
                  {category}
                </h5>
                <div className="grid grid-cols-6 gap-2">
                  {emojis.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => handleEmojiSelect(emoji)}
                      className="text-2xl hover:bg-muted rounded-lg p-2 transition-colors hover:scale-110"
                      title={emoji}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
