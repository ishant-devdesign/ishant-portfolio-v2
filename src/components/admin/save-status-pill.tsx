"use client";

import { Check, Loader2, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";

export type SaveState = "idle" | "saving" | "saved" | "error";

const stateConfig: Record<SaveState, { label: string; icon: React.ReactNode; className: string }> = {
  idle: { label: "", icon: null, className: "" },
  saving: {
    label: "Saving...",
    icon: <Loader2 className="size-3 animate-spin" />,
    className: "border-blue-500/20 bg-blue-500/10 text-blue-300",
  },
  saved: {
    label: "Saved",
    icon: <Check className="size-3" />,
    className: "border-emerald-500/20 bg-emerald-500/10 text-emerald-300",
  },
  error: {
    label: "Error",
    icon: <X className="size-3" />,
    className: "border-rose-500/20 bg-rose-500/10 text-rose-300",
  },
};

export function SaveStatusPill({ state, className }: { state: SaveState; className?: string }) {
  const config = stateConfig[state];

  if (!config.icon) return null;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        initial={{ opacity: 0, y: -4, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 4, scale: 0.96 }}
        transition={{ duration: 0.18 }}
        className={cn(
          "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium",
          config.className,
          className,
        )}
      >
        {config.icon}
        <span>{config.label}</span>
      </motion.div>
    </AnimatePresence>
  );
}