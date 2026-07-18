import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

/** A single metadata field tile — shared by the blog and project metadata cards. */
export function MetaTile({
  icon: Icon,
  label,
  className,
  children,
}: {
  icon: LucideIcon;
  label: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-white/8 bg-white/[0.02] p-4 transition-colors hover:bg-white/[0.035]",
        className,
      )}
    >
      <div className="flex items-center gap-2 text-white/32">
        <Icon className="size-3.5" />
        <p className="text-[0.6rem] uppercase tracking-[0.26em]">{label}</p>
      </div>
      <div className="mt-2.5">{children}</div>
    </div>
  );
}
