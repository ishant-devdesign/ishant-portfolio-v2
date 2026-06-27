import type { ContentBlock } from "@/lib/site-config";
import { AccordionBlock } from "@/components/content/accordion-block";
import { CalloutBlock } from "@/components/content/callout-block";
import { QuoteBlock } from "@/components/content/quote-block";

function decodeHtml(input: string) {
  return input
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function getParagraphText(block: ContentBlock) {
  const text = String(block.data?.text ?? "").trim();
  if (text) return text;
  const html = decodeHtml(String(block.data?.html ?? ""));
  return html.replace(/<[^>]+>/g, "").trim();
}

export function BlockRenderer({ blocks }: { blocks: ContentBlock[] }) {
  return (
    <div className="space-y-10">
      {blocks.map((block) => {
        switch (block.type) {
          case "heading": {
            const level = Number(block.data?.level ?? 2);
            const text = String(block.data?.text ?? "");
            const Tag = level <= 2 ? "h2" : level === 3 ? "h3" : level === 4 ? "h4" : "h5";
            return (
              <Tag
                key={block.id}
                className={
                  level <= 2
                    ? "font-heading text-3xl text-white sm:text-4xl"
                    : level === 3
                      ? "font-heading text-2xl text-white"
                      : level === 4
                        ? "font-heading text-xl text-white"
                        : "font-heading text-lg text-white/92"
                }
              >
                {text}
              </Tag>
            );
          }
          case "paragraph": {
            const text = getParagraphText(block);
            return (
              <p key={block.id} className="max-w-4xl text-base leading-8 text-white/60 sm:text-lg">
                {text}
              </p>
            );
          }
          case "list": {
            const items = Array.isArray(block.data?.items)
              ? (block.data.items as unknown[]).map((item) => String(item))
              : [];
            return (
              <ul key={block.id} className="grid gap-3">
                {items.map((item) => (
                  <li
                    key={`${block.id}-${item}`}
                    className="rounded-[1.4rem] border border-white/10 bg-white/[0.03] px-4 py-4 text-sm text-white/66"
                  >
                    {item}
                  </li>
                ))}
              </ul>
            );
          }
          case "image": {
            const url = String(block.data?.url ?? "");
            const alt = String(block.data?.alt ?? "");
            const caption = String(block.data?.caption ?? "");
            return url ? (
              <figure key={block.id} className="space-y-3">
                <img src={url} alt={alt} className="w-full rounded-[1.8rem] border border-white/10 object-cover" />
                {caption ? <figcaption className="text-sm text-white/44">{caption}</figcaption> : null}
              </figure>
            ) : null;
          }
          case "video": {
            const url = String(block.data?.url ?? "");
            const caption = String(block.data?.caption ?? "");
            return url ? (
              <figure key={block.id} className="space-y-3">
                <video src={url} controls className="w-full rounded-[1.8rem] border border-white/10 object-cover" />
                {caption ? <figcaption className="text-sm text-white/44">{caption}</figcaption> : null}
              </figure>
            ) : null;
          }
          case "quote": {
            const text = String(block.data?.text ?? "");
            const author = String(block.data?.author ?? "");
            return <QuoteBlock key={block.id} text={text} author={author} />;
          }
          case "callout": {
            const title = String(block.data?.title ?? "");
            const text = String(block.data?.text ?? "");
            return <CalloutBlock key={block.id} title={title} text={text} />;
          }
          case "divider": {
            return <div key={block.id} className="h-px w-full bg-white/8" />;
          }
          case "table": {
            const headers = Array.isArray(block.data?.headers)
              ? (block.data.headers as unknown[]).map((item) => String(item))
              : [];
            const rows = Array.isArray(block.data?.rows)
              ? (block.data.rows as unknown[][]).map((row) => row.map((cell) => String(cell)))
              : [];
            return (
              <div key={block.id} className="overflow-x-auto rounded-[1.6rem] border border-white/10 bg-white/[0.03]">
                <table className="min-w-full border-collapse text-left text-sm text-white/68">
                  <thead>
                    <tr>
                      {headers.map((header) => (
                        <th key={`${block.id}-${header}`} className="border-b border-white/10 px-4 py-3 text-white/82">
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row, rowIndex) => (
                      <tr key={`${block.id}-row-${rowIndex}`}>
                        {row.map((cell, cellIndex) => (
                          <td key={`${block.id}-cell-${rowIndex}-${cellIndex}`} className="border-t border-white/8 px-4 py-3">
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          }
          case "accordion": {
            const items = Array.isArray(block.data?.items)
              ? (block.data.items as Array<{ title?: string; content?: string }>)
              : [];
            return <AccordionBlock key={block.id} items={items} />;
          }
          default:
            return null;
        }
      })}
    </div>
  );
}
