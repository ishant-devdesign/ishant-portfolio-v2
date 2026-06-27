export function QuoteBlock({
  text,
  author,
}: {
  text: string;
  author: string;
}) {
  return (
    <blockquote className="rounded-[1.8rem] border border-white/10 bg-white/[0.03] px-6 py-6">
      <p className="font-quote text-[1.85rem] leading-[1.2] text-white/90 sm:text-[2.35rem]">
        “{text}”
      </p>
      {author ? <footer className="mt-5 text-sm uppercase tracking-[0.2em] text-white/36">— {author}</footer> : null}
    </blockquote>
  );
}
