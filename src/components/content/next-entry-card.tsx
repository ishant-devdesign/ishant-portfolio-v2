import Link from "next/link";

export function NextEntryCard({
  href,
  eyebrow,
  title,
  meta,
  image,
  cursorLabel,
  previewType,
}: {
  href: string;
  eyebrow: string;
  title: string;
  meta?: string;
  image?: string;
  cursorLabel: string;
  previewType: "project" | "blog";
}) {
  return (
    <Link
      href={href}
      className="group block overflow-hidden rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] transition-transform duration-300 hover:-translate-y-0.5 hover:bg-white/[0.04]"
      data-cursor={cursorLabel}
      data-cursor-preview={previewType}
      data-cursor-title={title}
      data-cursor-image={image ?? ""}
      data-cursor-position="top"
    >
      <div className="grid gap-5 p-4 sm:p-5 md:grid-cols-[minmax(0,1fr)_260px] md:items-center">
        <div className="min-w-0">
          <p className="text-[0.62rem] uppercase tracking-[0.34em] text-white/30">{eyebrow}</p>
          <h3 className="mt-4 text-2xl leading-tight tracking-[-0.04em] text-white sm:text-[2rem]">
            {title}
          </h3>
          {meta ? <p className="mt-3 max-w-2xl text-sm leading-6 text-white/54">{meta}</p> : null}
          <div className="mt-6 inline-flex items-center gap-2 text-sm text-white/74 transition-transform duration-300 group-hover:translate-x-1">
            <span>Open entry</span>
            <span aria-hidden="true">→</span>
          </div>
        </div>

        <div className="overflow-hidden rounded-[1.5rem] border border-white/10 bg-black/30">
          {image ? (
            <img
              src={image}
              alt={title}
              className="h-[180px] w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            />
          ) : (
            <div className="flex h-[180px] items-end bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.12),transparent_62%),linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.02))] p-5 text-sm text-white/44">
              <p>{eyebrow}</p>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
