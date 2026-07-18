"use client";

import { motion } from "framer-motion";
import { useId } from "react";
import { cn } from "@/lib/utils";

export type SegmentedOption<T extends string> = {
  value: T;
  label: React.ReactNode;
  icon?: React.ReactNode;
};

/**
 * The one segmented toggle for the whole editor — animated sliding pill,
 * single sizing (px-4 py-1.5 text-xs), single container treatment.
 * Pass a stable `layoutId` only if multiple instances mount per row;
 * otherwise a per-instance id is generated automatically.
 */
export function SegmentedControl<T extends string>({
  value,
  onChange,
  options,
  layoutId,
  ariaLabel,
  className,
}: {
  value: T;
  onChange: (value: T) => void;
  options: ReadonlyArray<SegmentedOption<T>>;
  layoutId?: string;
  ariaLabel?: string;
  className?: string;
}) {
  const autoId = useId();
  const pillId = layoutId ?? `segmented-${autoId}`;

  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className={cn(
        "relative flex w-fit items-center rounded-full border border-white/[0.06] bg-white/[0.04] p-1 shadow-inner",
        className,
      )}
    >
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            aria-pressed={active}
            className={cn(
              "relative z-10 inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-semibold select-none transition-colors",
              active ? "text-black" : "text-white/60 hover:text-white",
            )}
          >
            {active ? (
              <motion.span
                layoutId={pillId}
                className="absolute inset-0 z-[-1] rounded-full bg-white shadow-md"
                transition={{ type: "spring", stiffness: 450, damping: 30 }}
              />
            ) : null}
            {option.icon}
            <span>{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}
