"use client";

import { Plus, Trash2, GripVertical } from "lucide-react";
import { buttonClasses } from "@/components/ui/button";
import { AutoGrowTextarea } from "@/components/admin/auto-grow-textarea";
import type { ContentBlock } from "@/lib/site-config";

type NestedBlockEditorProps = {
  blocks: ContentBlock[];
  onChange: (blocks: ContentBlock[]) => void;
  blockTypes: readonly string[];
  title?: string;
};

export function NestedBlockEditor({
  blocks,
  onChange,
  blockTypes,
  title,
}: NestedBlockEditorProps) {
  const addNestedBlock = (type: string) => {
    const newBlock: ContentBlock = {
      id: `${type}-${crypto.randomUUID()}`,
      type,
      data: getDefaultBlockData(type),
    };
    onChange([...blocks, newBlock]);
  };

  const removeNestedBlock = (id: string) => {
    onChange(blocks.filter((b) => b.id !== id));
  };

  const updateNestedBlock = (id: string, data: Record<string, unknown>) => {
    onChange(
      blocks.map((b) => (b.id === id ? { ...b, data } : b)),
    );
  };

  return (
    <div className="space-y-3">
      {title ? (
        <p className="text-[0.62rem] uppercase tracking-[0.28em] text-white/34">{title}</p>
      ) : null}

      {blocks.length > 0 ? (
        <div className="space-y-2">
          {blocks.map((block) => (
            <div
              key={block.id}
              className="rounded-[1rem] border border-white/10 bg-white/[0.02] p-3"
            >
              <div className="flex items-center justify-between gap-2">
                <p className="text-[0.62rem] uppercase tracking-[0.28em] text-white/34">
                  {block.type}
                </p>
                <button
                  type="button"
                  onClick={() => removeNestedBlock(block.id)}
                  className={buttonClasses({ tone: "danger", iconOnly: true })}
                >
                  <Trash2 className="size-3.5" />
                </button>
              </div>

              {block.type === "paragraph" ? (
                <AutoGrowTextarea
                  value={String(block.data?.text ?? "")}
                  onChange={(value) => updateNestedBlock(block.id, { text: value })}
                  className="mt-2 w-full resize-none overflow-hidden rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2 text-sm text-white outline-none"
                />
              ) : null}

              {block.type === "callout" ? (
                <>
                  <input
                    value={String(block.data?.title ?? "")}
                    onChange={(e) =>
                      updateNestedBlock(block.id, { ...block.data, title: e.target.value })
                    }
                    placeholder="Title"
                    className="mt-2 w-full rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2 text-sm text-white outline-none"
                  />
                  <AutoGrowTextarea
                    value={String(block.data?.text ?? "")}
                    onChange={(value) =>
                      updateNestedBlock(block.id, { ...block.data, text: value })
                    }
                    className="mt-2 w-full resize-none overflow-hidden rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2 text-sm text-white outline-none"
                  />
                </>
              ) : null}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-white/42">No blocks in this column yet</p>
      )}

      <div className="flex flex-wrap gap-1.5">
        {blockTypes.map((type) => (
          <button
            key={type}
            type="button"
            onClick={() => addNestedBlock(type)}
            className={buttonClasses({ tone: "muted", size: "xs" })}
          >
            <Plus className="size-3" />
            {type}
          </button>
        ))}
      </div>
    </div>
  );
}

function getDefaultBlockData(type: string): Record<string, unknown> {
  switch (type) {
    case "paragraph":
      return { text: "New paragraph" };
    case "callout":
      return { variant: "note", title: "Note", text: "Content" };
    case "list":
      return { items: ["List item"] };
    case "quote":
      return { text: "Quote text", author: "" };
    case "image":
      return { url: "", alt: "", caption: "" };
    case "link":
      return { url: "https://example.com", title: "Link", description: "" };
    case "metric":
      return { label: "Metric", value: "100%", description: "" };
    case "divider":
      return {};
    case "stepper":
      return { steps: [{ title: "Step 1", description: "Details" }] };
    case "gallery":
      return { images: [{ url: "", alt: "", caption: "" }] };
    case "code":
      return { language: "javascript", code: "// code", showPreview: false };
    default:
      return {};
  }
}