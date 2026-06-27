export function CalloutBlock({
  title,
  text,
}: {
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-[1.8rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] px-5 py-5">
      {title ? (
        <p className="text-[0.62rem] uppercase tracking-[0.28em] text-white/34">{title}</p>
      ) : null}
      {text ? <p className="mt-3 text-base leading-7 text-white/68">{text}</p> : null}
    </div>
  );
}
