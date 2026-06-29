export function QuoteBlock({ text, author }: { text: string; author: string }) {
  return (
    <blockquote className="relative max-w-5xl py-3 pl-5 sm:pl-8">
      <span className="pointer-events-none absolute -left-1 top-0 font-heading text-6xl leading-none text-white/[0.08] sm:-left-2 sm:text-8xl">
        “
      </span>

      <p className="relative whitespace-pre-line font-quote text-[1.9rem] leading-[1.16] tracking-[-0.035em] text-white/90 sm:text-[2.65rem] lg:text-[3rem]">
        {text}
      </p>

      {author ? (
        <footer className="mt-6 flex items-center gap-3">
          <span className="h-px w-10 bg-white/20" />
          <span className="text-[0.65rem] font-medium uppercase tracking-[0.28em] text-white/38">
            {author}
          </span>
        </footer>
      ) : null}
    </blockquote>
  );
}
