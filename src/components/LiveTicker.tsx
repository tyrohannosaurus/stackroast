import { motion } from "framer-motion";
import { Flame } from "lucide-react";

const recentRoasts = [
  { id: 1, user: "dev_sarah", stack: "React + Redux + jQuery", score: 87 },
  { id: 2, user: "code_ninja", stack: "PHP + MySQL + FTP", score: 94 },
  { id: 3, user: "fullstack_fan", stack: "Next.js + Prisma + Supabase", score: 23 },
  { id: 4, user: "rust_lover", stack: "Rust + HTMX + PostgreSQL", score: 45 },
  { id: 5, user: "legacy_king", stack: "Java + Spring + Oracle", score: 76 },
  { id: 6, user: "new_dev", stack: "WordPress + Elementor", score: 99 },
];

export function LiveTicker() {
  return (
    <div className="overflow-hidden py-4">
      <motion.div
        animate={{ x: [0, -1920] }}
        transition={{
          duration: 30,
          repeat: Infinity,
          ease: "linear",
        }}
        className="flex gap-4"
      >
        {[...recentRoasts, ...recentRoasts].map((roast, index) => (
          <div
            key={`${roast.id}-${index}`}
            className="flex-shrink-0 flex items-center gap-3 px-4 py-2 rounded-full bg-surface-glass border border-white/5"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center text-xs font-medium">
              {roast.user.slice(0, 2).toUpperCase()}
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-medium text-foreground">
                @{roast.user}
              </span>
              <span className="text-xs text-muted-foreground font-mono">
                {roast.stack}
              </span>
            </div>
            <div className="flex items-center gap-1 px-2 py-1 rounded bg-orange-500/10 text-orange-400">
              <Flame className="w-3 h-3" />
              <span className="text-xs font-mono font-medium">{roast.score}</span>
            </div>
          </div>
        ))}
      </motion.div>
    </div>
  );
}
