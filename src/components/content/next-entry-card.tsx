import { ArrowRight } from "lucide-react";
import Link from "next/link";

const smoothEase = "ease-[cubic-bezier(0.16,1,0.3,1)]";

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
      className="group relative block overflow-hidden rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] outline-none transform-gpu transition-[transform,border-color,background-color] duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] [backface-visibility:hidden] [will-change:transform] hover:-translate-y-0.5 hover:border-white/18 hover:bg-white/[0.045] focus-visible:border-white/28 focus-visible:ring-2 focus-visible:ring-white/16 motion-reduce:transform-none motion-reduce:transition-none"
      data-cursor={cursorLabel}
      data-cursor-preview={previewType}
      data-cursor-title={title}
      data-cursor-image={image ?? ""}
      data-cursor-position="top"
    >
      <div className="pointer-events-none absolute inset-0 rounded-[2rem] opacity-0 shadow-[0_24px_90px_rgba(0,0,0,0.28)] transition-opacity duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:opacity-100" />

      <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:opacity-100">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_82%_0%,rgba(255,255,255,0.08),transparent_36%)]" />
        <div className="absolute -left-24 top-0 h-full w-24 -skew-x-12 bg-gradient-to-r from-transparent via-white/[0.06] to-transparent opacity-0 transition-[transform,opacity] duration-[1200ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-x-[38rem] group-hover:opacity-100" />
      </div>

      <div className="relative grid gap-5 p-4 sm:p-5 md:grid-cols-[minmax(0,1fr)_260px] md:items-center">
        <div className="min-w-0">
          <p className="text-[0.62rem] uppercase tracking-[0.34em] text-white/30 transition-colors duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:text-white/44">
            {eyebrow}
          </p>

          <h3 className="mt-4 overflow-hidden text-2xl leading-tight tracking-[-0.04em] text-white sm:text-[2rem]">
            <span className="block transform-gpu transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] [will-change:transform] group-hover:translate-x-1 motion-reduce:transform-none">
              {title}
            </span>
          </h3>

          {meta ? (
            <p className="mt-3 max-w-2xl text-sm leading-6 text-white/54 transition-colors duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:text-white/66">
              {meta}
            </p>
          ) : null}

          <div className="mt-6 inline-flex items-center gap-2 text-sm text-white/74">
            <span className="relative inline-block overflow-hidden leading-6">
              <span className="block transform-gpu transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] [will-change:transform] group-hover:-translate-y-[110%] motion-reduce:transform-none">
                Open entry
              </span>
              <span className="absolute inset-0 translate-y-[110%] transform-gpu text-white transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] [will-change:transform] group-hover:translate-y-0 motion-reduce:hidden">
                Open entry
              </span>
            </span>

            <span
              aria-hidden="true"
              className="inline-flex size-7 transform-gpu items-center justify-center rounded-full border border-white/10 text-white/64 transition-[transform,border-color,background-color,color] duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] [will-change:transform] group-hover:translate-x-1 group-hover:border-white/18 group-hover:bg-white/[0.06] group-hover:text-white motion-reduce:transform-none"
            >
              <ArrowRight size={12} />
            </span>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-[1.5rem] border border-white/10 bg-black/30 transform-gpu transition-[transform,border-color] duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] [backface-visibility:hidden] [will-change:transform] group-hover:border-white/16 md:group-hover:translate-x-0.5 motion-reduce:transform-none">
          <div className="pointer-events-none absolute inset-0 z-[1] bg-gradient-to-tr from-black/20 via-transparent to-white/[0.08] opacity-0 transition-opacity duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:opacity-100" />

          {image ? (
            <img
              src={image}
              alt={title}
              className="h-[180px] w-full transform-gpu object-cover transition-transform duration-[900ms] ease-[cubic-bezier(0.16,1,0.3,1)] [backface-visibility:hidden] [will-change:transform] group-hover:scale-[1.045] motion-reduce:transform-none"
            />
          ) : (
            <div className="flex h-[180px] transform-gpu items-end bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.12),transparent_62%),linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.02))] p-5 text-sm text-white/44 transition-transform duration-[900ms] ease-[cubic-bezier(0.16,1,0.3,1)] [will-change:transform] group-hover:scale-[1.02] motion-reduce:transform-none">
              <p className="transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-x-1 motion-reduce:transform-none">
                {eyebrow}
              </p>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
