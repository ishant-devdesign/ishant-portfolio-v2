"use client";

import { Info, AlertTriangle, CheckCircle2 } from "lucide-react";

export type CalloutVariant = "note" | "warning" | "success";

const variantConfig: Record<
  CalloutVariant,
  { icon: React.ReactNode; label: string; colors: { border: string; bg: string; icon: string; text: string } }
> = {
  note: {
    icon: <Info className="size-5" />,
    label: "Note",
    colors: {
      border: "border-blue-400/20",
      bg: "bg-blue-400/[0.03]",
      icon: "text-blue-300/80",
      text: "text-blue-300",
    },
  },
  warning: {
    icon: <AlertTriangle className="size-5" />,
    label: "Warning",
    colors: {
      border: "border-amber-400/20",
      bg: "bg-amber-400/[0.03]",
      icon: "text-amber-300/80",
      text: "text-amber-300",
    },
  },
  success: {
    icon: <CheckCircle2 className="size-5" />,
    label: "Success",
    colors: {
      border: "border-emerald-400/20",
      bg: "bg-emerald-400/[0.03]",
      icon: "text-emerald-300/80",
      text: "text-emerald-300",
    },
  },
};

export function CalloutBlock({
  variant = "note",
  title,
  text,
}: {
  variant?: CalloutVariant;
  title: string;
  text: string;
}) {
  const config = variantConfig[variant] ?? variantConfig.note;

  return (
    <div
      className={`rounded-[1.8rem] border ${config.colors.border} ${config.colors.bg} p-5`}
    >
      <div className="flex items-start gap-3">
        <span className={config.colors.icon}>{config.icon}</span>
        <div className="flex-1 min-w-0">
          {title ? (
            <p className={`text-[0.62rem] uppercase tracking-[0.28em] ${config.colors.text}`}>
              {title}
            </p>
          ) : null}
          {text ? (
            <p className="mt-2 text-base leading-7 text-white/82">{text}</p>
          ) : null}
        </div>
      </div>
    </div>
  );
}