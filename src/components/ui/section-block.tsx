import { cn } from "@/lib/utils";

export function SectionBlock({
  index,
  label,
  title,
  className,
  children,
}: {
  index: string;
  label: string;
  title: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section id={label.toLowerCase().replace(/[^a-z0-9]+/g, "-")} className={cn("scroll-mt-28 py-16 sm:py-20", className)}>
      <div className="grid gap-8 lg:grid-cols-[120px_minmax(0,1fr)] lg:gap-12">
        <div className="space-y-2 pt-2 text-[0.62rem] uppercase tracking-[0.36em] text-white/28">
          <p>{index}</p>
          <p>{label}</p>
        </div>
        <div>
          <h2 className="max-w-4xl text-4xl leading-none tracking-[-0.04em] text-white sm:text-5xl">
            {title}
          </h2>
          <div className="mt-8">{children}</div>
        </div>
      </div>
    </section>
  );
}
