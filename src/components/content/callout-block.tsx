"use client";

import { cn } from "@/lib/utils";
import { InlineContentRenderer } from "./inline-content-renderer";

export type CalloutVariant = "note" | "warning" | "success";

type VariantConfig = {
  label: string;
  eyebrow: string;
  accent: string;
  marker: string;
  text: string;
};

const variantConfig: Record<CalloutVariant, VariantConfig> = {
  note: {
    label: "Note",
    eyebrow: "text-white/36",
    accent: "from-white/24 via-white/10 to-transparent",
    marker: "border-white/14 text-white/44",
    text: "text-white/74",
  },
  warning: {
    label: "Warning",
    eyebrow: "text-rose-200/64",
    accent: "from-rose-200/45 via-rose-200/14 to-transparent",
    marker: "border-rose-200/18 text-rose-100/54",
    text: "text-white/76",
  },
  success: {
    label: "Success",
    eyebrow: "text-emerald-200/64",
    accent: "from-emerald-200/42 via-emerald-200/12 to-transparent",
    marker: "border-emerald-200/18 text-emerald-100/54",
    text: "text-white/76",
  },
};

export function CalloutBlock({
  variant = "note",
  title,
  text,
}: {
  variant?: CalloutVariant;
  title?: string;
  text: string;
}) {
  const config = variantConfig[variant] ?? variantConfig.note;
  // Title is optional — when empty the variant chip is the only label.
  const heading = (title ?? "").trim();

  return (
    <aside className="group relative overflow-hidden py-2 pl-5 sm:pl-7">
      <div
        className={cn(
          "absolute bottom-2 left-0 top-2 w-px bg-gradient-to-b",
          config.accent,
        )}
      />

      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <span
          className={cn(
            "rounded-full border px-2 py-0.5 text-[0.56rem] uppercase tracking-[0.24em]",
            config.marker,
          )}
        >
          {config.label}
        </span>

        {heading ? (
          <p
            className={cn(
              "text-[0.66rem] font-medium uppercase tracking-[0.3em]",
              config.eyebrow,
            )}
          >
            {heading}
          </p>
        ) : null}
      </div>

      {text ? (
        <p
          className={cn(
            "mt-3 whitespace-pre-line text-base leading-8 sm:text-lg",
            config.text,
          )}
        >
          <InlineContentRenderer text={text} />
        </p>
      ) : null}
    </aside>
  );
}
