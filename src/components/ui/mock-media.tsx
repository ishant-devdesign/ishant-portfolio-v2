import { cn } from "@/lib/utils";

const tones = {
  ink: "from-zinc-900 via-zinc-800 to-zinc-950",
  blue: "from-slate-900 via-blue-950 to-zinc-950",
  gold: "from-amber-950 via-stone-900 to-zinc-950",
  plum: "from-fuchsia-950 via-zinc-900 to-zinc-950",
  black: "from-black via-zinc-900 to-zinc-950",
} as const;

export function MockMedia({
  title,
  subtitle,
  tone = "ink",
  aspect = "video",
  className,
}: {
  title: string;
  subtitle?: string;
  tone?: keyof typeof tones;
  aspect?: "video" | "portrait" | "square" | "banner" | "fill";
  className?: string;
}) {
  const aspectClass =
    aspect === "portrait"
      ? "aspect-[4/5]"
      : aspect === "square"
        ? "aspect-square"
        : aspect === "banner"
          ? "aspect-[16/5]"
          : aspect === "fill"
            ? "h-full"
            : "aspect-[16/10]";

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br p-6",
        tones[tone],
        aspectClass,
        className,
      )}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.18),transparent_30%),radial-gradient(circle_at_80%_80%,rgba(255,255,255,0.06),transparent_28%)]" />
      <div className="absolute inset-0 opacity-40 [background-image:linear-gradient(rgba(255,255,255,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.08)_1px,transparent_1px)] [background-size:48px_48px]" />
      <div className="relative flex h-full flex-col justify-end">
        <h3 className="max-w-[22rem] text-2xl leading-tight tracking-[-0.04em] text-white sm:text-3xl">
          {title}
        </h3>
        {subtitle ? (
          <p className="mt-3 max-w-md text-sm leading-6 text-white/58">
            {subtitle}
          </p>
        ) : null}
      </div>
    </div>
  );
}
