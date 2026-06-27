"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  PlusCircle,
} from "lucide-react";
import { useMemo, useState } from "react";
import type { ContentBlock } from "@/lib/site-config";
import { createBlock } from "@/lib/editor";
import { AutoGrowTextarea } from "@/components/admin/auto-grow-textarea";
import { buttonClasses } from "@/components/ui/button";
import { MediaAssetField } from "@/components/editor/media-asset-field";

type BlockEditorProps = {
  blocks: ContentBlock[];
  onChange: (blocks: ContentBlock[]) => void;
  blockTypes: readonly string[];
  mediaBucket: string;
};

const headingOptions = [
  { label: "Large", level: 2 },
  { label: "Medium", level: 3 },
  { label: "Small", level: 4 },
  { label: "Mini", level: 5 },
] as const;

function updateBlock(
  blocks: ContentBlock[],
  id: string,
  updater: (block: ContentBlock) => ContentBlock,
) {
  return blocks.map((block) => (block.id === id ? updater(block) : block));
}

function ensureStringArray(value: unknown) {
  return Array.isArray(value) ? value.map((item) => String(item)) : [];
}

function decodeHtml(input: string) {
  return input
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/<[^>]+>/g, "")
    .trim();
}

export function BlockEditor({
  blocks,
  onChange,
  blockTypes,
  mediaBucket,
}: BlockEditorProps) {
  const [openHeadingMenu, setOpenHeadingMenu] = useState<string | null>(null);

  const addBlock = (type: string) => {
    onChange([...blocks, createBlock(type)]);
  };

  const removeBlock = (id: string) => {
    onChange(blocks.filter((block) => block.id !== id));
  };

  const moveBlock = (index: number, direction: -1 | 1) => {
    const next = [...blocks];
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= blocks.length) return;
    [next[index], next[targetIndex]] = [next[targetIndex], next[index]];
    onChange(next);
  };

  const renderedBlocks = useMemo(() => blocks, [blocks]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {blockTypes.map((type) => (
          <button
            key={type}
            type="button"
            onClick={() => addBlock(type)}
            className={buttonClasses({ tone: "muted", size: "xs" })}
          >
            <Plus className="size-3.5" />
            {type}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {renderedBlocks.map((block, index) => {
          const headingLevel = Number(block.data?.level ?? 2);
          const headingLabel =
            headingOptions.find((option) => option.level === headingLevel)
              ?.label ?? "Large";

          return (
            <div
              key={block.id}
              className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-4"
            >
              <div className="mb-4 flex items-center justify-between gap-3">
                <p className="text-[0.62rem] uppercase tracking-[0.28em] text-white/34">
                  {block.type}
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => moveBlock(index, -1)}
                    className={buttonClasses({ tone: "muted", iconOnly: true })}
                  >
                    <ChevronUp className="size-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => moveBlock(index, 1)}
                    className={buttonClasses({ tone: "muted", iconOnly: true })}
                  >
                    <ChevronDown className="size-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => removeBlock(block.id)}
                    className={buttonClasses({
                      tone: "danger",
                      iconOnly: true,
                    })}
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </div>

              {block.type === "heading" ? (
                <div className="grid gap-3 sm:grid-cols-[160px_minmax(0,1fr)]">
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() =>
                        setOpenHeadingMenu((current) =>
                          current === block.id ? null : block.id,
                        )
                      }
                      className="flex w-full items-center justify-between rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2 text-sm text-white"
                    >
                      <span>{headingLabel}</span>
                      <ChevronsUpDown className="size-4 text-white/42" />
                    </button>
                    <AnimatePresence>
                      {openHeadingMenu === block.id ? (
                        <motion.div
                          initial={{ opacity: 0, y: 8, filter: "blur(12px)" }}
                          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                          exit={{ opacity: 0, y: 6, filter: "blur(12px)" }}
                          transition={{
                            duration: 0.22,
                            ease: [0.22, 1, 0.36, 1],
                          }}
                          className="absolute left-0 top-[calc(100%+0.5rem)] z-20 w-full rounded-[1rem] border border-white/10 bg-[#0c0c0c]/96 p-2 backdrop-blur-xl"
                        >
                          {headingOptions.map((option) => (
                            <button
                              key={option.level}
                              type="button"
                              onClick={() => {
                                setOpenHeadingMenu(null);
                                onChange(
                                  updateBlock(blocks, block.id, (current) => ({
                                    ...current,
                                    data: {
                                      ...current.data,
                                      level: option.level,
                                    },
                                  })),
                                );
                              }}
                              className="flex w-full rounded-[0.8rem] px-3 py-2 text-left text-sm text-white/72 transition-colors hover:bg-white/[0.04] hover:text-white"
                            >
                              {option.label}
                            </button>
                          ))}
                        </motion.div>
                      ) : null}
                    </AnimatePresence>
                  </div>
                  <AutoGrowTextarea
                    value={String(block.data.text ?? "")}
                    onChange={(value) =>
                      onChange(
                        updateBlock(blocks, block.id, (current) => ({
                          ...current,
                          data: { ...current.data, text: value },
                        })),
                      )
                    }
                    className="min-h-[1lh] w-full resize-none overflow-hidden rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2 text-sm text-white outline-none"
                  />
                </div>
              ) : null}

              {block.type === "paragraph" ? (
                <AutoGrowTextarea
                  value={String(
                    block.data.text ??
                      decodeHtml(String(block.data.html ?? "")),
                  )}
                  onChange={(value) =>
                    onChange(
                      updateBlock(blocks, block.id, (current) => ({
                        ...current,
                        data: {
                          ...current.data,
                          text: value,
                          html: `<p>${value}</p>`,
                        },
                      })),
                    )
                  }
                  className="min-h-[1lh] w-full resize-none overflow-hidden rounded-xl border border-white/10 bg-white/[0.02] px-3 py-3 text-sm text-white outline-none"
                />
              ) : null}

              {block.type === "image" ? (
                <div className="grid gap-3">
                  <MediaAssetField
                    label="Image source"
                    value={String(block.data.url ?? "")}
                    onChange={(value) =>
                      onChange(
                        updateBlock(blocks, block.id, (current) => ({
                          ...current,
                          data: { ...current.data, url: value },
                        })),
                      )
                    }
                    bucket={mediaBucket}
                    accept="image/*"
                  />
                  <input
                    placeholder="Alt text"
                    value={String(block.data.alt ?? "")}
                    onChange={(event) =>
                      onChange(
                        updateBlock(blocks, block.id, (current) => ({
                          ...current,
                          data: { ...current.data, alt: event.target.value },
                        })),
                      )
                    }
                    className="rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2 text-sm text-white outline-none"
                  />
                  <AutoGrowTextarea
                    value={String(block.data.caption ?? "")}
                    onChange={(value) =>
                      onChange(
                        updateBlock(blocks, block.id, (current) => ({
                          ...current,
                          data: { ...current.data, caption: value },
                        })),
                      )
                    }
                    className="min-h-[1lh] w-full resize-none overflow-hidden rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2 text-sm text-white outline-none"
                  />
                </div>
              ) : null}

              {block.type === "video" ? (
                <div className="grid gap-3">
                  <MediaAssetField
                    label="Video source"
                    value={String(block.data.url ?? "")}
                    onChange={(value) =>
                      onChange(
                        updateBlock(blocks, block.id, (current) => ({
                          ...current,
                          data: { ...current.data, url: value },
                        })),
                      )
                    }
                    bucket={mediaBucket}
                    accept="video/*"
                  />
                  <AutoGrowTextarea
                    value={String(block.data.caption ?? "")}
                    onChange={(value) =>
                      onChange(
                        updateBlock(blocks, block.id, (current) => ({
                          ...current,
                          data: { ...current.data, caption: value },
                        })),
                      )
                    }
                    className="min-h-[1lh] w-full resize-none overflow-hidden rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2 text-sm text-white outline-none"
                  />
                </div>
              ) : null}

              {block.type === "list" ? (
                <div className="space-y-2">
                  {ensureStringArray(block.data.items).map((item, itemIndex) => (
                    <div key={`${block.id}-item-${itemIndex}`} className="flex items-start gap-2">
                      <AutoGrowTextarea
                        value={item}
                        onChange={(value) => {
                          const items = [...ensureStringArray(block.data.items)];
                          items[itemIndex] = value;
                          onChange(
                            updateBlock(blocks, block.id, (current) => ({
                              ...current,
                              data: { ...current.data, items },
                            })),
                          );
                        }}
                        className="min-h-[1lh] flex-1 resize-none overflow-hidden rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2 text-sm text-white outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const items = ensureStringArray(block.data.items).filter(
                            (_, idx) => idx !== itemIndex,
                          );
                          onChange(
                            updateBlock(blocks, block.id, (current) => ({
                              ...current,
                              data: { ...current.data, items },
                            })),
                          );
                        }}
                        className={buttonClasses({
                          tone: "danger",
                          iconOnly: true,
                        })}
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => {
                      const items = ensureStringArray(block.data.items);
                      items.push("");
                      onChange(
                        updateBlock(blocks, block.id, (current) => ({
                          ...current,
                          data: { ...current.data, items },
                        })),
                      );
                    }}
                    className={buttonClasses({
                      tone: "muted",
                      size: "xs",
                      className: "normal-case tracking-normal",
                    })}
                  >
                    <PlusCircle className="size-3.5" />
                    Add item
                  </button>
                </div>
              ) : null}

              {block.type === "quote" ? (
                <div className="grid gap-3">
                  <AutoGrowTextarea
                    value={String(block.data.text ?? "")}
                    onChange={(value) =>
                      onChange(
                        updateBlock(blocks, block.id, (current) => ({
                          ...current,
                          data: { ...current.data, text: value },
                        })),
                      )
                    }
                    className="min-h-[1lh] w-full resize-none overflow-hidden rounded-xl border border-white/10 bg-white/[0.02] px-3 py-3 text-sm text-white outline-none"
                  />
                  <input
                    placeholder="Author"
                    value={String(block.data.author ?? "")}
                    onChange={(event) =>
                      onChange(
                        updateBlock(blocks, block.id, (current) => ({
                          ...current,
                          data: { ...current.data, author: event.target.value },
                        })),
                      )
                    }
                    className="rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2 text-sm text-white outline-none"
                  />
                </div>
              ) : null}

              {block.type === "callout" ? (
                <div className="grid gap-3">
                  <input
                    placeholder="Callout title"
                    value={String(block.data.title ?? "")}
                    onChange={(event) =>
                      onChange(
                        updateBlock(blocks, block.id, (current) => ({
                          ...current,
                          data: { ...current.data, title: event.target.value },
                        })),
                      )
                    }
                    className="rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2 text-sm text-white outline-none"
                  />
                  <AutoGrowTextarea
                    value={String(block.data.text ?? "")}
                    onChange={(value) =>
                      onChange(
                        updateBlock(blocks, block.id, (current) => ({
                          ...current,
                          data: { ...current.data, text: value },
                        })),
                      )
                    }
                    className="min-h-[1lh] w-full resize-none overflow-hidden rounded-xl border border-white/10 bg-white/[0.02] px-3 py-3 text-sm text-white outline-none"
                  />
                </div>
              ) : null}

              {block.type === "table" ? (
                <div className="space-y-3">
                  <div className="overflow-x-auto rounded-xl border border-white/10">
                    <table className="min-w-full border-collapse text-sm text-white/78">
                      <thead>
                        <tr>
                          {ensureStringArray(block.data.headers).map(
                            (header, headerIndex) => (
                              <th
                                key={`${block.id}-header-${headerIndex}`}
                                className="border-b border-white/10 px-3 py-2 align-top"
                              >
                                <div className="flex items-start gap-2">
                                  <input
                                    value={header}
                                    onChange={(event) => {
                                      const headers = [
                                        ...ensureStringArray(
                                          block.data.headers,
                                        ),
                                      ];
                                      headers[headerIndex] = event.target.value;
                                      onChange(
                                        updateBlock(
                                          blocks,
                                          block.id,
                                          (current) => ({
                                            ...current,
                                            data: { ...current.data, headers },
                                          }),
                                        ),
                                      );
                                    }}
                                    className="w-full bg-transparent outline-none"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const headers = [
                                        ...ensureStringArray(
                                          block.data.headers,
                                        ),
                                      ];
                                      if (headers.length <= 1) return;
                                      headers.splice(headerIndex, 1);
                                      const rows = Array.isArray(
                                        block.data.rows,
                                      )
                                        ? (block.data.rows as string[][]).map(
                                            (row) =>
                                              row.filter(
                                                (_, idx) => idx !== headerIndex,
                                              ),
                                          )
                                        : [];
                                      onChange(
                                        updateBlock(
                                          blocks,
                                          block.id,
                                          (current) => ({
                                            ...current,
                                            data: {
                                              ...current.data,
                                              headers,
                                              rows,
                                            },
                                          }),
                                        ),
                                      );
                                    }}
                                    className={buttonClasses({
                                      tone: "danger",
                                      iconOnly: true,
                                    })}
                                  >
                                    <Trash2 className="size-3.5" />
                                  </button>
                                </div>
                              </th>
                            ),
                          )}
                        </tr>
                      </thead>
                      <tbody>
                        {(Array.isArray(block.data.rows)
                          ? (block.data.rows as string[][])
                          : []
                        ).map((row, rowIndex) => (
                          <tr key={`${block.id}-row-${rowIndex}`}>
                            {row.map((cell, cellIndex) => (
                              <td
                                key={`${block.id}-cell-${rowIndex}-${cellIndex}`}
                                className="border-t border-white/10 px-3 py-2"
                              >
                                <input
                                  value={cell}
                                  onChange={(event) => {
                                    const rows = Array.isArray(block.data.rows)
                                      ? (block.data.rows as string[][]).map(
                                          (item) => [...item],
                                        )
                                      : [];
                                    rows[rowIndex][cellIndex] =
                                      event.target.value;
                                    onChange(
                                      updateBlock(
                                        blocks,
                                        block.id,
                                        (current) => ({
                                          ...current,
                                          data: { ...current.data, rows },
                                        }),
                                      ),
                                    );
                                  }}
                                  className="w-full bg-transparent outline-none"
                                />
                              </td>
                            ))}
                            <td className="border-t border-white/10 px-3 py-2 text-right">
                              <button
                                type="button"
                                onClick={() => {
                                  const rows = Array.isArray(block.data.rows)
                                    ? (block.data.rows as string[][]).filter(
                                        (_, idx) => idx !== rowIndex,
                                      )
                                    : [];
                                  if (rows.length === 0) return;
                                  onChange(
                                    updateBlock(
                                      blocks,
                                      block.id,
                                      (current) => ({
                                        ...current,
                                        data: { ...current.data, rows },
                                      }),
                                    ),
                                  );
                                }}
                                className={buttonClasses({
                                  tone: "danger",
                                  iconOnly: true,
                                })}
                              >
                                <Trash2 className="size-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        const headers = ensureStringArray(block.data.headers);
                        const rows = Array.isArray(block.data.rows)
                          ? (block.data.rows as string[][]).map((row) => [
                              ...row,
                              "",
                            ])
                          : [];
                        onChange(
                          updateBlock(blocks, block.id, (current) => ({
                            ...current,
                            data: {
                              ...current.data,
                              headers: [
                                ...headers,
                                `Column ${headers.length + 1}`,
                              ],
                              rows,
                            },
                          })),
                        );
                      }}
                      className={buttonClasses({
                        tone: "muted",
                        size: "xs",
                        className: "normal-case tracking-normal",
                      })}
                    >
                      <PlusCircle className="size-3.5" />
                      Add column
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const headers = ensureStringArray(block.data.headers);
                        const rows = Array.isArray(block.data.rows)
                          ? (block.data.rows as string[][])
                          : [];
                        onChange(
                          updateBlock(blocks, block.id, (current) => ({
                            ...current,
                            data: {
                              ...current.data,
                              rows: [
                                ...rows,
                                new Array(headers.length).fill(""),
                              ],
                            },
                          })),
                        );
                      }}
                      className={buttonClasses({
                        tone: "muted",
                        size: "xs",
                        className: "normal-case tracking-normal",
                      })}
                    >
                      <PlusCircle className="size-3.5" />
                      Add row
                    </button>
                  </div>
                </div>
              ) : null}

              {block.type === "accordion" ? (
                <div className="space-y-3">
                  {Array.isArray(block.data.items)
                    ? (
                        block.data.items as Array<{
                          title: string;
                          content: string;
                        }>
                      ).map((item, itemIndex) => (
                        <div
                          key={`${block.id}-accordion-${itemIndex}`}
                          className="rounded-[1rem] border border-white/10 p-3"
                        >
                          <div className="flex items-center gap-3">
                            <input
                              value={item.title}
                              onChange={(event) => {
                                const items = [
                                  ...(block.data.items as Array<{
                                    title: string;
                                    content: string;
                                  }>),
                                ];
                                items[itemIndex] = {
                                  ...items[itemIndex],
                                  title: event.target.value,
                                };
                                onChange(
                                  updateBlock(blocks, block.id, (current) => ({
                                    ...current,
                                    data: { ...current.data, items },
                                  })),
                                );
                              }}
                              className="w-full bg-transparent text-sm text-white outline-none"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                const items = [
                                  ...(block.data.items as Array<{
                                    title: string;
                                    content: string;
                                  }>),
                                ].filter((_, idx) => idx !== itemIndex);
                                onChange(
                                  updateBlock(blocks, block.id, (current) => ({
                                    ...current,
                                    data: { ...current.data, items },
                                  })),
                                );
                              }}
                              className={buttonClasses({
                                tone: "danger",
                                iconOnly: true,
                              })}
                            >
                              <Trash2 className="size-4" />
                            </button>
                          </div>
                          <AutoGrowTextarea
                            value={item.content}
                            onChange={(value) => {
                              const items = [
                                ...(block.data.items as Array<{
                                  title: string;
                                  content: string;
                                }>),
                              ];
                              items[itemIndex] = {
                                ...items[itemIndex],
                                content: value,
                              };
                              onChange(
                                updateBlock(blocks, block.id, (current) => ({
                                  ...current,
                                  data: { ...current.data, items },
                                })),
                              );
                            }}
                            className="mt-3 min-h-[1lh] w-full resize-none overflow-hidden bg-transparent text-sm leading-6 text-white/68 outline-none"
                          />
                        </div>
                      ))
                    : null}
                  <button
                    type="button"
                    onClick={() => {
                      const items = Array.isArray(block.data.items)
                        ? [
                            ...(block.data.items as Array<{
                              title: string;
                              content: string;
                            }>),
                          ]
                        : [];
                      items.push({
                        title: "Accordion item",
                        content: "Accordion content",
                      });
                      onChange(
                        updateBlock(blocks, block.id, (current) => ({
                          ...current,
                          data: { ...current.data, items },
                        })),
                      );
                    }}
                    className={buttonClasses({
                      tone: "muted",
                      size: "xs",
                      className: "normal-case tracking-normal",
                    })}
                  >
                    <PlusCircle className="size-3.5" />
                    Add item
                  </button>
                </div>
              ) : null}

              {block.type === "divider" ? (
                <p className="text-sm text-white/42">
                  Divider block — no editable content.
                </p>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
