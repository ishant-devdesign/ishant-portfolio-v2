import type { ContentBlock } from "@/lib/site-config";
import type { CalloutVariant } from "@/components/content/callout-block";
import { AccordionBlock } from "@/components/content/accordion-block";
import { CalloutBlock } from "@/components/content/callout-block";
import { QuoteBlock } from "@/components/content/quote-block";
import { CodeBlock } from "@/components/content/code-block";
import { DiagramBlock } from "@/components/content/diagram-block";

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
              <ul key={block.id} className="list-decimal space-y-2 pl-5 text-sm leading-7 text-white/66">
                {items.map((item, index) => (
                  <li key={`${block.id}-${index}`} className="marker:text-white/34">
                    {item}
                  </li>
                ))}
              </ul>
            );
          }
          case "stepper": {
            const steps = Array.isArray(block.data?.steps)
              ? (block.data.steps as Array<{ title?: string; description?: string }>)
              : [];
            return (
              <div key={block.id} className="space-y-6">
                {steps.map((step, index) => (
                  <div key={`${block.id}-step-${index}`} className="flex gap-4">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-white/20 text-sm font-medium text-white/82">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      {step.title ? (
                        <p className="text-sm font-medium uppercase tracking-[0.24em] text-white/82">{step.title}</p>
                      ) : null}
                      {step.description ? (
                        <p className="mt-1 text-sm leading-7 text-white/60">{step.description}</p>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
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
            const variant = (block.data?.variant as CalloutVariant) ?? "note";
            const title = String(block.data?.title ?? "");
            const text = String(block.data?.text ?? "");
            return <CalloutBlock key={block.id} variant={variant} title={title} text={text} />;
          }
          case "divider": {
            return <div key={block.id} className="h-px w-full bg-white/8" />;
          }
          case "gallery": {
            const images = Array.isArray(block.data?.images)
              ? (block.data.images as Array<{ url?: string; alt?: string; caption?: string }>)
              : [];
            return (
              <div key={block.id} className="grid gap-4 sm:grid-cols-2">
                {images.map((img, idx) => (
                  img.url ? (
                    <figure key={`${block.id}-img-${idx}`} className="space-y-2">
                      <img src={img.url} alt={img.alt ?? ""} className="w-full rounded-[1.4rem] border border-white/10 object-cover" />
                      {img.caption ? <figcaption className="text-sm text-white/44">{img.caption}</figcaption> : null}
                    </figure>
                  ) : null
                ))}
              </div>
            );
          }
          case "link": {
            const url = String(block.data?.url ?? "");
            const title = String(block.data?.title ?? "");
            const description = String(block.data?.description ?? "");
            return url ? (
              <a
                key={block.id}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="block rounded-[1.4rem] border border-white/10 bg-white/[0.03] p-4 transition-colors hover:bg-white/[0.06]"
              >
                <p className="text-sm font-medium text-white/90">{title || url}</p>
                {description ? <p className="mt-1 text-sm text-white/44">{description}</p> : null}
              </a>
            ) : null;
          }
          case "metric": {
            const label = String(block.data?.label ?? "");
            const value = String(block.data?.value ?? "");
            const description = String(block.data?.description ?? "");
            return (
              <div key={block.id} className="rounded-[1.4rem] border border-white/10 bg-white/[0.03] p-5">
                <p className="text-[0.62rem] uppercase tracking-[0.28em] text-white/34">{label}</p>
                <p className="mt-2 font-heading text-3xl text-white">{value}</p>
                {description ? <p className="mt-1 text-sm text-white/44">{description}</p> : null}
              </div>
            );
          }
          case "timeline": {
            const items = Array.isArray(block.data?.items)
              ? (block.data.items as Array<{ date?: string; title?: string; description?: string }>)
              : [];
            return (
              <div key={block.id} className="space-y-6">
                {items.map((item, index) => (
                  <div key={`${block.id}-tl-${index}`} className="flex gap-4">
                    <div className="w-20 shrink-0">
                      <p className="text-[0.62rem] uppercase tracking-[0.2em] text-white/34">{item.date}</p>
                    </div>
                    <div className="flex-1 border-l-2 border-white/8 pl-4">
                      <p className="text-sm font-medium text-white/90">{item.title}</p>
                      {item.description ? <p className="mt-1 text-sm text-white/60">{item.description}</p> : null}
                    </div>
                  </div>
                ))}
              </div>
            );
          }
          case "columns-2": {
            const leftBlocks = Array.isArray(block.data?.left)
              ? (block.data.left as ContentBlock[])
              : [];
            const rightBlocks = Array.isArray(block.data?.right)
              ? (block.data.right as ContentBlock[])
              : [];
            return (
              <div key={block.id} className="grid gap-4 sm:grid-cols-2" data-columns-container>
                <div className="space-y-10">
                  <BlockRenderer blocks={leftBlocks} />
                </div>
                <div className="space-y-10">
                  <BlockRenderer blocks={rightBlocks} />
                </div>
              </div>
            );
          }
          case "diagram": {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const snapshot = block.data?.snapshot as any;
            return (
              <DiagramBlock
                key={block.id}
                snapshot={snapshot}
              />
            );
          }
          case "code": {
            const language = String(block.data?.language ?? "javascript");
            const code = String(block.data?.code ?? "");
            const showPreview = Boolean(block.data?.showPreview ?? false);
            return (
              <CodeBlock
                key={block.id}
                language={language}
                code={code}
                showPreview={showPreview}
              />
            );
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
