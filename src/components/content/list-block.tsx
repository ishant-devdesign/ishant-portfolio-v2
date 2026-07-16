import { InlineContentRenderer } from "./inline-content-renderer";

type ListStyle = "ordered" | "unordered" | "numbered" | "bullet" | string;

export function ListBlock({
  items,
  style = "unordered",
}: {
  items: string[];
  style?: ListStyle;
}) {
  const normalizedStyle =
    style === "ordered" || style === "numbered" ? "ordered" : "unordered";

  if (!items.length) return null;

  if (normalizedStyle === "ordered") {
    return (
      <ol className="divide-y divide-white/8 border-y border-white/8">
        {items.map((item, index) => (
          <li
            key={`${item}-${index}`}
            className="grid grid-cols-[2.25rem_minmax(0,1fr)] gap-4 py-4 sm:grid-cols-[2.75rem_minmax(0,1fr)] sm:gap-5"
          >
            <span className="pt-1 text-[0.62rem] font-medium uppercase tracking-[0.24em] text-white/30 ml-3">
              {String(index + 1).padStart(2, "0")}
            </span>
            <p className="text-base leading-8 text-white/64 sm:text-lg">
              <InlineContentRenderer text={item} />
            </p>
          </li>
        ))}
      </ol>
    );
  }

  return (
    <ul className="divide-y divide-white/8 border-y border-white/8">
      {items.map((item, index) => (
        <li
          key={`${item}-${index}`}
          className="grid grid-cols-[0.75rem_minmax(0,1fr)] gap-4 py-4 sm:grid-cols-[1rem_minmax(0,1fr)] sm:gap-5"
        >
          <span
            className="mt-[0.82rem] size-1.5 rounded-full bg-white/34 ml-3"
            aria-hidden="true"
          />
          <p className="text-base leading-8 text-white/64 sm:text-lg">
            <InlineContentRenderer text={item} />
          </p>
        </li>
      ))}
    </ul>
  );
}
