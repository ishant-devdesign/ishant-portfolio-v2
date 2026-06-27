export function HeroMediaPreview({
  image,
  title,
  subtitle,
}: {
  image: string;
  title: string;
  subtitle?: string;
}) {
  if (image) {
    return (
      <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-black/20">
        <img src={image} alt={title} className="h-full min-h-[260px] w-full object-cover" />
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-black/20 p-8 text-white/48">
      <p className="text-2xl text-white">{title}</p>
      {subtitle ? <p className="mt-3 text-sm text-white/44">{subtitle}</p> : null}
    </div>
  );
}
