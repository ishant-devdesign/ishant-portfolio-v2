import { ArrowRight, ArrowUpRight } from "lucide-react";
import Link from "next/link";

/** End-of-article "continue" panel — shares the metadata/featured-card chrome. */
export function NextEntryCard({
  href,
  eyebrow,
  title,
  meta,
  image,
  cursorLabel,
  previewType,
  ctaLabel,
}: {
  href: string;
  eyebrow: string;
  title: string;
  meta?: string;
  image?: string;
  cursorLabel: string;
  previewType: "project" | "blog";
  ctaLabel?: string;
}) {
  const cta =
    ctaLabel ??
    (previewType === "blog" ? "Continue reading" : "Open case study");

  return (
    <Link
      href={href}
      className="group relative block overflow-hidden rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.045),rgba(255,255,255,0.02))] outline-none transition-[border-color,background-color] duration-500 ease-out hover:border-white/18 hover:bg-white/[0.03] focus-visible:border-white/28 focus-visible:ring-2 focus-visible:ring-white/16"
      data-cursor={cursorLabel}
      data-cursor-preview={previewType}
      data-cursor-title={title}
      data-cursor-image={image ?? ""}
      data-cursor-position="top"
    >
      <div className="grid gap-4 p-3.5 sm:gap-5 sm:p-4 md:grid-cols-[minmax(0,1fr)_260px] md:items-stretch">
        {/* Copy */}
        <div className="flex min-w-0 flex-col p-2 sm:p-3">
          <p className="flex items-center gap-2 text-[0.62rem] uppercase tracking-[0.34em] text-white/30 transition-colors duration-500 group-hover:text-white/44">
            <span className="inline-block size-1.5 rounded-full bg-amber-200/70 transition-transform duration-500 group-hover:scale-125" />
            {eyebrow}
          </p>

          <h3 className="font-heading mt-4 line-clamp-2 text-2xl leading-tight tracking-[-0.02em] text-white sm:text-[1.75rem]">
            {title}
          </h3>

          {meta ? (
            <p className="mt-2 text-sm leading-6 text-white/45">{meta}</p>
          ) : null}

          <div className="mt-auto pt-6">
            <span className="inline-flex items-center gap-2 text-sm text-white/60 transition-colors duration-500 group-hover:text-white">
              <span className="relative">
                {cta}
                <span className="absolute -bottom-0.5 left-0 h-px w-0 bg-amber-200/70 transition-all duration-500 ease-out group-hover:w-full" />
              </span>
              <ArrowRight
                size={14}
                className="transform-gpu transition-transform duration-500 ease-out group-hover:translate-x-1 motion-reduce:transform-none"
              />
            </span>
          </div>
        </div>

        {/* Media */}
        <div className="relative min-h-[11rem] overflow-hidden rounded-[1.4rem] border border-white/10 bg-black/30 md:min-h-0">
          {image ? (
            <img
              src={image}
              alt={title}
              className="absolute inset-0 h-full w-full transform-gpu object-cover transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.045] motion-reduce:transform-none"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.10),transparent_62%)]">
              <ArrowUpRight className="size-10 text-white/12 transition-colors duration-500 group-hover:text-white/24" />
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
