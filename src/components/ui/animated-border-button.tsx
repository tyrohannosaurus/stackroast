import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { ReactNode } from "react";

interface AnimatedBorderButtonProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}

export function AnimatedBorderButton({
  children,
  className,
  onClick,
}: AnimatedBorderButtonProps) {
  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={cn(
        "relative inline-flex items-center justify-center px-8 py-3",
        "rounded-lg font-medium text-sm",
        "bg-surface text-foreground",
        "overflow-hidden",
        "group",
        className
      )}
    >
      {/* Animated gradient border */}
      <span className="absolute inset-0 rounded-lg">
        <span
          className={cn(
            "absolute inset-[-2px] rounded-lg",
            "bg-gradient-to-r from-violet-500 via-blue-500 to-violet-500",
            "animate-gradient bg-[length:200%_100%]",
            "opacity-75 group-hover:opacity-100 transition-opacity"
          )}
        />
        <span className="absolute inset-[1px] rounded-lg bg-surface" />
      </span>
      
      {/* Content */}
      <span className="relative z-10 flex items-center gap-2">
        {children}
      </span>
    </motion.button>
  );
}
