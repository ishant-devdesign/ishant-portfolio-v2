import { ArrowUpRight } from "lucide-react";

function getLinkLabel(url: string) {
  try {
    const parsed = new URL(url);
    return parsed.hostname.replace(/^www\./, "");
  } catch {
    return url.replace(/^https?:\/\//, "").replace(/^www\./, "");
  }
}

export function LinkBlock({
  url,
  title,
  description,
}: {
  url: string;
  title?: string;
  description?: string;
}) {
  if (!url) return null;

  const linkLabel = getLinkLabel(url);

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="group block border-y border-white/8 py-5 transition-colors hover:border-white/16"
    >
      <div className="flex items-start justify-between gap-5">
        <div className="min-w-0 flex-1">
          <p className="text-[0.62rem] font-medium uppercase tracking-[0.28em] text-white/32 transition-colors group-hover:text-white/46">
            {linkLabel}
          </p>

          <h3 className="mt-3 font-heading text-2xl leading-tight tracking-[-0.04em] text-white/90 transition-colors group-hover:text-white sm:text-3xl">
            {title || url}
          </h3>

          {description ? (
            <p className="mt-3 text-base leading-7 text-white/54 sm:text-lg sm:leading-8">
              {description}
            </p>
          ) : null}
        </div>

        <span className="mt-1 flex size-10 shrink-0 items-center justify-center rounded-full border border-white/10 text-white/42 transition-all duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:border-white/18 group-hover:text-white/78">
          <ArrowUpRight className="size-4" />
        </span>
      </div>
    </a>
  );
}
