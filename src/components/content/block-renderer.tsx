"use client";

import type { ContentBlock } from "@/lib/site-config";
import type { CalloutVariant } from "@/components/content/callout-block";
import { AccordionBlock } from "@/components/content/accordion-block";
import { CalloutBlock } from "@/components/content/callout-block";
import { QuoteBlock } from "@/components/content/quote-block";
import { CodeBlock } from "@/components/content/code-block";
import { CustomVideoPlayer } from "@/components/ui/custom-video-player";
import { X, ArrowLeft, ArrowRight } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { ListBlock } from "./list-block";
import { StepperBlock } from "./stepper-block";
import { LinkBlock } from "./link-block";
import { InlineContentRenderer } from "./inline-content-renderer";

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

function getYouTubeVideoId(url: string): string | null {
  if (!url) return null;
  const shortMatch = url.match(/youtu\.be\/([^?&]+)/);
  if (shortMatch) return shortMatch[1];
  const regularMatch = url.match(/youtube\.com\/watch\?v=([^?&]+)/);
  if (regularMatch) return regularMatch[1];
  const embedMatch = url.match(/youtube\.com\/embed\/([^?&]+)/);
  if (embedMatch) return embedMatch[1];
  const shortsMatch = url.match(/youtube\.com\/shorts\/([^?&]+)/);
  if (shortsMatch) return shortsMatch[1];
  const mobileMatch = url.match(/m\.youtube\.com\/watch\?v=([^?&]+)/);
  if (mobileMatch) return mobileMatch[1];
  return null;
}

function isYouTubeUrl(url: string): boolean {
  return /youtube\.com|youtu\.be/.test(url);
}

function ImageLightbox({
  images,
  activeIndex,
  onChangeIndex,
  onClose,
}: {
  images: Array<{ url: string; alt: string; caption: string }>;
  activeIndex: number | null;
  onChangeIndex: (index: number) => void;
  onClose: () => void;
}) {
  const previousOverflow = useRef<string>("");

  useEffect(() => {
    if (activeIndex === null) return;
    previousOverflow.current = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
        return;
      }
      if (images.length <= 1) return;
      if (activeIndex === null) return;
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        onChangeIndex((activeIndex - 1 + images.length) % images.length);
      }
      if (event.key === "ArrowRight") {
        event.preventDefault();
        onChangeIndex((activeIndex + 1) % images.length);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow.current;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [activeIndex, images.length, onChangeIndex, onClose]);

  if (
    typeof document === "undefined" ||
    activeIndex === null ||
    !images[activeIndex]
  ) {
    return null;
  }

  const canNavigate = images.length > 1;
  const goToPrevious = () => {
    if (activeIndex > 0) {
      onChangeIndex(activeIndex - 1);
    }
  };
  const goToNext = () => {
    if (activeIndex < images.length - 1) {
      onChangeIndex(activeIndex + 1);
    }
  };
  const image = images[activeIndex];

  return createPortal(
    <div
      className="fixed inset-0 z-[260] flex items-center justify-center bg-black/95 text-white"
      style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0 }}
    >
      <div
        className="absolute inset-x-0 top-0 z-[2] flex items-center justify-between gap-4 border-b border-white/10 bg-black/45 px-5 py-4 backdrop-blur-xl"
        style={{ position: "fixed" }}
      >
        <div className="min-w-0">
          <p className="text-sm text-white/82">
            Image {activeIndex + 1} of {images.length}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white/78 hover:bg-white/[0.08]"
        >
          <X className="size-4" /> Close
        </button>
      </div>

      <div className="flex h-full w-full items-center justify-center px-4 pb-8 pt-24 sm:px-6">
        {canNavigate ? (
          <button
            type="button"
            onClick={goToPrevious}
            disabled={activeIndex === 0}
            className="absolute left-3 top-1/2 z-[2] -translate-y-1/2 rounded-full border border-white/10 bg-black/45 p-3 text-white/84 backdrop-blur disabled:opacity-30 hover:bg-white/[0.08]"
            aria-label="Previous image"
          >
            <ArrowLeft className="size-5" />
          </button>
        ) : null}

        <div
          className="relative z-[2] max-h-full max-w-[min(1400px,100%)]"
          onClick={(event) => event.stopPropagation()}
        >
          <img
            src={image.url}
            alt={image.alt}
            className="max-h-[82vh] w-auto max-w-full object-contain"
          />
          {image.caption || image.alt ? (
            <div className="mx-auto mt-4 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-center text-sm text-white/62 backdrop-blur">
              {image.caption || image.alt}
            </div>
          ) : null}
        </div>

        {canNavigate ? (
          <button
            type="button"
            onClick={goToNext}
            disabled={activeIndex === images.length - 1}
            className="absolute right-3 top-1/2 z-[2] -translate-y-1/2 rounded-full border border-white/10 bg-black/45 p-3 text-white/84 backdrop-blur disabled:opacity-30 hover:bg-white/[0.08]"
            aria-label="Next image"
          >
            <ArrowRight className="size-5" />
          </button>
        ) : null}
      </div>
    </div>,
    document.body,
  );
}

function ImageBlock({
  block,
  onLightboxOpen,
}: {
  block: ContentBlock;
  onLightboxOpen?: () => void;
}) {
  const url = String(block.data?.url ?? "");
  const alt = String(block.data?.alt ?? "");
  const caption = String(block.data?.caption ?? "");

  if (!url) return null;

  return (
    <figure className="space-y-3">
      <button
        type="button"
        onClick={onLightboxOpen}
        className="group block w-full text-left rounded-[1.8rem]"
      >
        <div className="relative overflow-hidden rounded-[1.8rem] border border-white/10">
          <img
            src={url}
            alt={alt}
            className="w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
          />
        </div>
      </button>
      {caption ? (
        <figcaption className="text-sm text-white/44">{caption}</figcaption>
      ) : null}
    </figure>
  );
}

function VideoBlock({ block }: { block: ContentBlock }) {
  const url = String(block.data?.url ?? "");
  const caption = String(block.data?.caption ?? "");
  const videoId = getYouTubeVideoId(url);
  const isYouTube = isYouTubeUrl(url);

  if (!url) return null;

  return (
    <figure data-tts-skip className="space-y-3">
      {isYouTube && videoId ? (
        <div className="rounded-[1.8rem] border border-white/10 bg-black">
          <iframe
            src={`https://www.youtube.com/embed/${videoId}`}
            className="aspect-video w-full rounded-[1.8rem]"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            title="Embedded video"
          />
        </div>
      ) : (
        <CustomVideoPlayer
          src={url}
          className="rounded-[1.8rem] border border-white/10 bg-black/50 overflow-hidden"
        />
      )}
      {caption ? (
        <figcaption className="text-sm text-white/44">{caption}</figcaption>
      ) : null}
    </figure>
  );
}

export function BlockRenderer({ blocks }: { blocks: ContentBlock[] }) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const allImages = blocks.flatMap((block) => {
    if (block.type === "image") {
      const url = String(block.data?.url ?? "");
      if (!url) return [];
      return [
        {
          url,
          alt: String(block.data?.alt ?? ""),
          caption: String(block.data?.caption ?? ""),
        },
      ];
    }
    if (block.type === "gallery") {
      const images = Array.isArray(block.data?.images)
        ? (block.data.images as Array<{
            url?: string;
            alt?: string;
            caption?: string;
          }>)
        : [];
      return images
        .filter((img) => img.url)
        .map((img) => ({
          url: img.url ?? "",
          alt: img.alt ?? "",
          caption: img.caption ?? "",
        }));
    }
    return [];
  });

  const imageLightboxMap: number[] = [];
  let currentLightboxIndex = 0;
  blocks.forEach((block) => {
    if (block.type === "image") {
      const url = String(block.data?.url ?? "");
      if (url) {
        imageLightboxMap.push(currentLightboxIndex);
        currentLightboxIndex++;
      }
    } else if (block.type === "gallery") {
      const images = Array.isArray(block.data?.images)
        ? (block.data.images as Array<{ url?: string }>)
        : [];
      const count = images.filter((img) => img.url).length;
      imageLightboxMap.push(-1);
      currentLightboxIndex += count;
    }
  });

  let imageBlockIndex = -1;

  return (
    <div className="space-y-10">
      {blocks.map((block) => {
        switch (block.type) {
          case "heading": {
            const level = Number(block.data?.level ?? 2);
            const text = String(block.data?.text ?? "");
            const Tag =
              level <= 2
                ? "h2"
                : level === 3
                  ? "h3"
                  : level === 4
                    ? "h4"
                    : "h5";
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
                <InlineContentRenderer text={text} />
              </Tag>
            );
          }
          case "paragraph": {
            const text = getParagraphText(block);
            return (
              <p
                key={block.id}
                className="text-base leading-8 text-white/60 sm:text-lg"
              >
                <InlineContentRenderer text={text} />
              </p>
            );
          }
          case "list": {
            const items = Array.isArray(block.data?.items)
              ? (block.data.items as unknown[]).map((item) => String(item))
              : [];
            const style = String(block.data?.style ?? "unordered");
            return <ListBlock key={block.id} items={items} style={style} />;
          }
          case "stepper": {
            const steps = Array.isArray(block.data?.steps)
              ? (block.data.steps as Array<{
                  title?: string;
                  description?: string;
                }>)
              : [];
            return <StepperBlock key={block.id} steps={steps} />;
          }
          case "image": {
            imageBlockIndex++;
            const url = String(block.data?.url ?? "");
            const lightboxIdx = url ? imageLightboxMap[imageBlockIndex] : -1;
            return (
              <ImageBlock
                key={block.id}
                block={block}
                onLightboxOpen={() => {
                  if (lightboxIdx >= 0) {
                    setLightboxIndex(lightboxIdx);
                  }
                }}
              />
            );
          }
          case "video":
            return <VideoBlock key={block.id} block={block} />;
          case "quote": {
            const text = String(block.data?.text ?? "");
            const author = String(block.data?.author ?? "");
            return <QuoteBlock key={block.id} text={text} author={author} />;
          }
          case "callout": {
            const variant = (block.data?.variant as CalloutVariant) ?? "note";
            const title = String(block.data?.title ?? "");
            const text = String(block.data?.text ?? "");
            return (
              <CalloutBlock
                key={block.id}
                variant={variant}
                title={title}
                text={text}
              />
            );
          }
          case "divider": {
            return <div key={block.id} className="h-px w-full bg-white/8" />;
          }
          case "gallery": {
            const images = Array.isArray(block.data?.images)
              ? (block.data.images as Array<{
                  url?: string;
                  alt?: string;
                  caption?: string;
                }>)
              : [];
            const validImages = images.filter((img) => img.url) as Array<{
              url: string;
              alt?: string;
              caption?: string;
            }>;
            if (!validImages.length) return null;

            const blockIndex = blocks.findIndex((b) => b.id === block.id);
            let startIdx = 0;
            for (let i = 0; i < blockIndex; i++) {
              const b = blocks[i];
              if (b.type === "image") {
                const u = String(b.data?.url ?? "");
                if (u) startIdx += 1;
              } else if (b.type === "gallery") {
                const imgs = Array.isArray(b.data?.images)
                  ? (b.data.images as Array<{ url?: string }>)
                  : [];
                startIdx += imgs.filter((im) => im.url).length;
              }
            }

            const openAt = (idx: number) => setLightboxIndex(startIdx + idx);

            if (validImages.length === 1) {
              const img = validImages[0];
              return (
                <figure key={block.id} className="space-y-3">
                  <button
                    type="button"
                    onClick={() => openAt(0)}
                    className="group block w-full text-left"
                  >
                    <div className="relative overflow-hidden rounded-[1.8rem] border border-white/10 bg-white/[0.02]">
                      <img
                        src={img.url}
                        alt={img.alt ?? ""}
                        className="aspect-[16/10] w-full object-cover transition-transform duration-700 group-hover:scale-[1.02]"
                      />
                      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                    </div>
                  </button>
                  {img.caption ? (
                    <figcaption className="text-sm text-white/44">
                      {img.caption}
                    </figcaption>
                  ) : null}
                </figure>
              );
            }

            if (validImages.length === 2) {
              return (
                <div key={block.id} data-tts-skip className="space-y-3">
                  <div className="relative overflow-hidden rounded-[1.8rem] border border-white/10 bg-black">
                    <button
                      type="button"
                      onClick={() => openAt(0)}
                      className="group block w-full text-left"
                    >
                      <img
                        src={validImages[0].url}
                        alt={validImages[0].alt ?? ""}
                        className="aspect-[16/9] w-full object-cover transition-transform duration-700 group-hover:scale-[1.02]"
                      />
                    </button>
                    {/* Floating thumbnails inside main box */}
                    <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between gap-3">
                      <div className="flex-1">
                        {validImages[0].caption ? (
                          <p className="text-sm text-white/80 line-clamp-1 drop-shadow">
                            {validImages[0].caption}
                          </p>
                        ) : null}
                      </div>
                      <div className="flex gap-2">
                        {validImages.slice(1).map((img, idx) => (
                          <button
                            key={`thumb-${idx}`}
                            type="button"
                            onClick={() => openAt(idx + 1)}
                            className="group/thumb relative size-14 shrink-0 overflow-hidden rounded-xl border border-white/20 bg-black/40 backdrop-blur-md transition-all hover:scale-105 hover:border-white/30"
                          >
                            <img
                              src={img.url}
                              alt={img.alt ?? ""}
                              className="size-full object-cover"
                            />
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                    <div className="absolute top-3 right-3 rounded-full bg-black/60 px-2.5 py-1 text-[11px] text-white/70 backdrop-blur">
                      {validImages.length} photos
                    </div>
                  </div>
                </div>
              );
            }

            // 3+ images: main image with floating thumbnail strip inside
            const first = validImages[0];
            const thumbs = validImages.slice(1, 6); // show up to 5 thumbs floating
            const remainingCount = validImages.length - 1 - thumbs.length;

            return (
              <div key={block.id} data-tts-skip className="space-y-3">
                <div className="relative overflow-hidden rounded-[1.8rem] border border-white/10 bg-black">
                  <button
                    type="button"
                    onClick={() => openAt(0)}
                    className="group block w-full text-left"
                  >
                    <img
                      src={first.url}
                      alt={first.alt ?? ""}
                      className="aspect-[16/10] w-full object-cover transition-transform duration-700 group-hover:scale-[1.02]"
                    />
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                  </button>

                  {/* Floating thumbnails inside main box - bottom */}
                  <div className="absolute bottom-0 left-0 right-0 p-3">
                    <div className="flex items-end justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        {first.caption ? (
                          <p className="text-sm text-white/90 drop-shadow line-clamp-1">
                            {first.caption}
                          </p>
                        ) : null}
                        <p className="mt-1 text-[11px] text-white/60">
                          {validImages.length} photos • click to expand
                        </p>
                      </div>

                      <div className="flex shrink-0 items-center gap-2 rounded-full border border-white/10 bg-black/50 p-1 backdrop-blur-xl">
                        {thumbs.map((img, idx) => {
                          const actualIndex = idx + 1;
                          const isLastWithMore =
                            idx === thumbs.length - 1 && remainingCount > 0;
                          return (
                            <button
                              key={`float-thumb-${idx}`}
                              type="button"
                              onClick={() => openAt(actualIndex)}
                              className="group/thumb relative size-11 shrink-0 overflow-hidden rounded-full border border-white/15 bg-black/40 transition-all hover:scale-110 hover:border-white/30"
                            >
                              <img
                                src={img.url}
                                alt={img.alt ?? ""}
                                className="size-full object-cover"
                              />
                              {isLastWithMore ? (
                                <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-[2px]">
                                  <span className="text-[11px] font-medium text-white">
                                    +{remainingCount + 1}
                                  </span>
                                </div>
                              ) : null}
                            </button>
                          );
                        })}
                        {remainingCount === 0 && thumbs.length < 4 ? (
                          <div className="size-11 rounded-full border border-dashed border-white/20 bg-white/[0.04] flex items-center justify-center text-[10px] text-white/30">
                            {validImages.length}
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </div>

                  <div className="absolute top-3 right-3 rounded-full bg-black/60 px-2.5 py-1 text-[11px] text-white/70 backdrop-blur">
                    {validImages.length} photos
                  </div>
                </div>
              </div>
            );
          }
          case "link": {
            const url = String(block.data?.url ?? "");
            const title = String(block.data?.title ?? "");
            const description = String(block.data?.description ?? "");
            return (
              <LinkBlock
                key={block.id}
                url={url}
                title={title}
                description={description}
              />
            );
          }
          case "metric": {
            const label = String(block.data?.label ?? "");
            const value = String(block.data?.value ?? "");
            const description = String(block.data?.description ?? "");
            return (
              <div
                key={block.id}
                className="rounded-[1.4rem] border border-white/10 bg-white/[0.03] p-5"
              >
                <p className="text-[0.62rem] uppercase tracking-[0.28em] text-white/34">
                  {label}
                </p>
                <p className="mt-2 font-heading text-3xl text-white">{value}</p>
                {description ? (
                  <p className="mt-1 text-sm text-white/44">{description}</p>
                ) : null}
              </div>
            );
          }
          case "timeline": {
            const items = Array.isArray(block.data?.items)
              ? (block.data.items as Array<{
                  date?: string;
                  title?: string;
                  description?: string;
                }>)
              : [];
            return (
              <div key={block.id} className="space-y-6">
                {items.map((item, index) => (
                  <div key={`${block.id}-tl-${index}`} className="flex gap-4">
                    <div className="w-20 shrink-0">
                      <p className="text-[0.62rem] uppercase tracking-[0.2em] text-white/34">
                        {item.date}
                      </p>
                    </div>
                    <div className="flex-1 border-l-2 border-white/8 pl-4">
                      <p className="text-sm font-medium text-white/90">
                        <InlineContentRenderer text={item.title ?? ""} />
                      </p>
                      {item.description ? (
                        <p className="mt-1 text-sm text-white/60">
                          <InlineContentRenderer text={item.description} />
                        </p>
                      ) : null}
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
              <div
                key={block.id}
                className="grid gap-4 sm:grid-cols-2"
                data-columns-container
              >
                <div className="space-y-10">
                  <BlockRenderer blocks={leftBlocks} />
                </div>
                <div className="space-y-10">
                  <BlockRenderer blocks={rightBlocks} />
                </div>
              </div>
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
              ? (block.data.rows as unknown[][]).map((row) =>
                  row.map((cell) => String(cell)),
                )
              : [];
            return (
              <div
                key={block.id}
                className="overflow-x-auto rounded-[1.6rem] border border-white/10 bg-white/[0.03]"
              >
                <table className="min-w-full border-collapse text-left text-sm text-white/68">
                  <thead>
                    <tr>
                      {headers.map((header) => (
                        <th
                          key={`${block.id}-${header}`}
                          className="border-b border-white/10 px-4 py-3 text-white/82"
                        >
                          <InlineContentRenderer text={header} />
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row, rowIndex) => (
                      <tr key={`${block.id}-row-${rowIndex}`}>
                        {row.map((cell, cellIndex) => (
                          <td
                            key={`${block.id}-cell-${rowIndex}-${cellIndex}`}
                            className="border-t border-white/8 px-4 py-3"
                          >
                            <InlineContentRenderer text={cell} />
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
              ? (block.data.items as Array<{
                  title?: string;
                  content?: string;
                }>)
              : [];
            return <AccordionBlock key={block.id} items={items} />;
          }
          default:
            return null;
        }
      })}
      <ImageLightbox
        images={allImages}
        activeIndex={lightboxIndex}
        onChangeIndex={setLightboxIndex}
        onClose={() => setLightboxIndex(null)}
      />
    </div>
  );
}
