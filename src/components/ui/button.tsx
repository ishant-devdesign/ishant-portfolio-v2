import { cn } from "@/lib/utils";

export type ButtonTone =
  | "primary"
  | "secondary"
  | "ghost"
  | "muted"
  | "danger"
  | "selected"
  | "inverted";

export type ButtonSize = "xs" | "sm" | "md" | "icon";

const toneClasses: Record<ButtonTone, string> = {
  primary: "border-zinc-600/40 bg-zinc-800 text-zinc-50 hover:bg-zinc-700",
  secondary: "border-white/12 text-white/82 hover:bg-white/[0.04]",
  ghost: "border-white/10 text-white/78 hover:bg-white/[0.04]",
  muted:
    "border-white/10 text-white/64 hover:bg-white/[0.04] hover:text-white/82",
  danger:
    "border-white/10 text-white/72 hover:bg-white/[0.04] hover:text-rose-300",
  selected: "border-white/10 bg-white/[0.06] text-white/86",
  inverted:
    "border-white/10 bg-white text-black hover:bg-white/[0.22] hover:text-white",
};

const sizeClasses: Record<ButtonSize, string> = {
  xs: "px-3 py-1.5 text-xs uppercase tracking-[0.24em]",
  sm: "px-4 py-2.5 text-sm",
  md: "px-5 py-3 text-sm",
  icon: "h-9 w-9 text-sm",
};

export function buttonClasses({
  tone = "ghost",
  size = "sm",
  iconOnly = false,
  className,
}: {
  tone?: ButtonTone;
  size?: ButtonSize;
  iconOnly?: boolean;
  className?: string;
} = {}) {
  return cn(
    "inline-flex items-center justify-center gap-2 rounded-full border transition-colors duration-200 whitespace-nowrap disabled:cursor-not-allowed disabled:opacity-45",
    toneClasses[tone],
    sizeClasses[iconOnly ? "icon" : size],
    className,
  );
}
