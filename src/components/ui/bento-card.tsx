import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { ReactNode } from "react";

interface BentoCardProps {
  children: ReactNode;
  className?: string;
  colSpan?: 1 | 2 | 3 | 4;
  rowSpan?: 1 | 2;
  glowOnHover?: boolean;
}

export function BentoCard({
  children,
  className,
  colSpan = 1,
  rowSpan = 1,
  glowOnHover = false,
}: BentoCardProps) {
  const colSpanClass = {
    1: "col-span-1",
    2: "col-span-1 md:col-span-2",
    3: "col-span-1 md:col-span-2 lg:col-span-3",
    4: "col-span-1 md:col-span-2 lg:col-span-4",
  }[colSpan];

  const rowSpanClass = {
    1: "row-span-1",
    2: "row-span-2",
  }[rowSpan];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ 
        x: 2, 
        y: 2,
        boxShadow: "2px 2px 0px hsl(var(--border))"
      }}
      transition={{ duration: 0.15, ease: "easeOut" }}
      className={cn(
        "relative overflow-hidden rounded-2xl",
        "bg-card border-2 border-border shadow-brutal",
        colSpanClass,
        rowSpanClass,
        className
      )}
    >
      {children}
    </motion.div>
  );
}

export function BentoGrid({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4",
        "auto-rows-[minmax(180px,auto)]",
        "gap-4 lg:gap-6",
        className
      )}
    >
      {children}
    </div>
  );
}
