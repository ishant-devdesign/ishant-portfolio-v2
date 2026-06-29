import { ArrowRight } from "lucide-react";
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
      className="group relative block overflow-hidden rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] outline-none transition-[transform,border-color,background-color,box-shadow] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-1 hover:border-white/18 hover:bg-white/[0.045] hover:shadow-[0_24px_90px_rgba(0,0,0,0.28)] focus-visible:border-white/28 focus-visible:ring-2 focus-visible:ring-white/16"
      data-cursor={cursorLabel}
      data-cursor-preview={previewType}
      data-cursor-title={title}
      data-cursor-image={image ?? ""}
      data-cursor-position="top"
    >
      <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-700 group-hover:opacity-100">
        <div className="absolute -left-1/3 top-0 h-full w-1/2 rotate-12 bg-gradient-to-r from-transparent via-white/[0.065] to-transparent blur-sm transition-transform duration-1000 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:translate-x-[260%]" />
        <div className="absolute -right-20 -top-24 size-56 rounded-full bg-white/[0.055] blur-3xl" />
      </div>

      <div className="relative grid gap-5 p-4 sm:p-5 md:grid-cols-[minmax(0,1fr)_260px] md:items-center">
        <div className="min-w-0">
          <p className="text-[0.62rem] uppercase tracking-[0.34em] text-white/30 transition-colors duration-500 group-hover:text-white/44">
            {eyebrow}
          </p>

          <h3 className="mt-4 overflow-hidden text-2xl leading-tight tracking-[-0.04em] text-white sm:text-[2rem]">
            <span className="block transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:translate-x-1">
              {title}
            </span>
          </h3>

          {meta ? (
            <p className="mt-3 max-w-2xl text-sm leading-6 text-white/54 transition-colors duration-500 group-hover:text-white/66">
              {meta}
            </p>
          ) : null}

          <div className="mt-6 inline-flex items-center gap-2 text-sm text-white/74">
            <span className="relative overflow-hidden">
              <span className="block transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:-translate-y-full">
                Open entry
              </span>
              <span className="absolute inset-0 translate-y-full text-white transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:translate-y-0">
                Open entry
              </span>
            </span>

            <span
              aria-hidden="true"
              className="inline-flex size-7 items-center justify-center rounded-full border border-white/10 text-white/64 transition-[transform,border-color,background-color,color] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:translate-x-1 group-hover:border-white/18 group-hover:bg-white/[0.06] group-hover:text-white"
            >
              <ArrowRight size={12} />
            </span>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-[1.5rem] border border-white/10 bg-black/30 transition-[transform,border-color] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[0.985] group-hover:border-white/16">
          <div className="pointer-events-none absolute inset-0 z-[1] bg-gradient-to-tr from-black/20 via-transparent to-white/[0.08] opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

          {image ? (
            <img
              src={image}
              alt={title}
              className="h-[180px] w-full object-cover transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.065]"
            />
          ) : (
            <div className="flex h-[180px] items-end bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.12),transparent_62%),linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.02))] p-5 text-sm text-white/44 transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.03]">
              <p className="transition-transform duration-500 group-hover:translate-x-1">
                {eyebrow}
              </p>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
