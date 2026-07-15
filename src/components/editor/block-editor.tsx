"use client";
import { AnimatePresence, motion } from "framer-motion";
import {
  Plus,
  Trash2,
  ChevronsUpDown,
  PlusCircle,
  Copy,
  GripVertical,
  Eye,
  EyeOff,
  Image,
  Video,
  Link,
} from "lucide-react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type Dispatch,
  type SetStateAction,
  type ReactNode,
} from "react";
import { cn } from "@/lib/utils";

// ─── Mobile drag fix: use TouchSensor for native touch handling ───────────
function isTouchDevice() {
  if (typeof window === "undefined") return false;
  return "ontouchstart" in window || navigator.maxTouchPoints > 0;
}

import type { ContentBlock } from "@/lib/site-config";
import type { CalloutVariant } from "@/components/content/callout-block";
import { createBlock } from "@/lib/editor";
import { AutoGrowTextarea } from "@/components/admin/auto-grow-textarea";
import { buttonClasses } from "@/components/ui/button";
import { MediaAssetField } from "@/components/editor/media-asset-field";
import {
  buildCodePreviewDocument,
  normalizeCodeLanguage,
} from "@/components/content/code-block";

type BlockEditorProps = {
  blocks: ContentBlock[];
  onChange: (blocks: ContentBlock[]) => void;
  blockTypes: readonly string[];
  mediaBucket: string;
  isRoot?: boolean;
};

const headingOptions = [
  { label: "Large", level: 2 },
  { label: "Medium", level: 3 },
  { label: "Small", level: 4 },
  { label: "Mini", level: 5 },
] as const;

const calloutVariantOptions: CalloutVariant[] = ["note", "warning", "success"];

const codeLanguageOptions = [
  { label: "JavaScript", value: "javascript" },
  { label: "TypeScript", value: "typescript" },
  { label: "JSX / TSX", value: "jsx" },
  { label: "HTML", value: "html" },
  { label: "CSS", value: "css" },
  { label: "SCSS", value: "scss" },
  { label: "JSON", value: "json" },
  { label: "Markdown", value: "markdown" },
  { label: "YAML", value: "yaml" },
  { label: "XML", value: "xml" },
  { label: "Bash / Shell", value: "bash" },
  { label: "Python", value: "python" },
  { label: "Java", value: "java" },
  { label: "C", value: "c" },
  { label: "C++", value: "cpp" },
  { label: "C#", value: "csharp" },
  { label: "Go", value: "go" },
  { label: "Rust", value: "rust" },
  { label: "PHP", value: "php" },
  { label: "Ruby", value: "ruby" },
  { label: "Swift", value: "swift" },
  { label: "Kotlin", value: "kotlin" },
  { label: "SQL", value: "sql" },
] as const;

function getLanguageLabel(value: string) {
  return (
    codeLanguageOptions.find((opt) => opt.value === value)?.label ??
    "JavaScript"
  );
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

function cloneBlockWithFreshIds(block: ContentBlock): ContentBlock {
  const data = structuredClone((block.data ?? {}) as Record<string, unknown>);
  const copy: ContentBlock = {
    ...block,
    id: `${block.type}-${crypto.randomUUID()}`,
    data,
  };
  if (copy.type === "columns-2") {
    const columnData = copy.data as Record<string, unknown>;
    columnData.left = Array.isArray(columnData.left)
      ? (columnData.left as ContentBlock[]).map(cloneBlockWithFreshIds)
      : [];
    columnData.right = Array.isArray(columnData.right)
      ? (columnData.right as ContentBlock[]).map(cloneBlockWithFreshIds)
      : [];
  }
  return copy;
}

function duplicateBlock(blocks: ContentBlock[], id: string): ContentBlock[] {
  const index = blocks.findIndex((block) => block.id === id);
  if (index === -1) return blocks;
  const copy = cloneBlockWithFreshIds(blocks[index]);
  return [...blocks.slice(0, index + 1), copy, ...blocks.slice(index + 1)];
}

type InsertBlockMenuProps = {
  index: number;
  open: boolean;
  onOpen: () => void;
  onClose: () => void;
  blockTypes: readonly string[];
  onInsert: (type: string, index: number) => void;
  isRoot?: boolean;
};

// Block type preview configurations
const blockTypePreviews: Record<
  string,
  { icon: ReactNode; label: string; description: string }
> = {
  heading: {
    icon: <strong className="text-base text-white">Heading</strong>,
    label: "Heading",
    description: "h2, h3, h4, or h5",
  },
  paragraph: {
    icon: <p className="text-sm text-white/60">Paragraph text...</p>,
    label: "Paragraph",
    description: "Text content",
  },
  image: {
    icon: (
      <div className="flex h-8 w-12 items-center justify-center rounded border border-white/12">
        <Image className="size-4 text-white/42" />
      </div>
    ),
    label: "Image",
    description: "Photo or graphic",
  },
  video: {
    icon: (
      <div className="flex h-8 w-12 items-center justify-center rounded border border-white/12">
        <Video className="size-4 text-white/42" />
      </div>
    ),
    label: "Video",
    description: "Embedded video",
  },
  quote: {
    icon: (
      <div className="border-l-2 border-white/20 pl-2">
        <p className="text-xs text-white/60">Quote text...</p>
      </div>
    ),
    label: "Quote",
    description: "Testimonial",
  },
  callout: {
    icon: (
      <div className="flex items-center gap-1.5 rounded border border-white/12 bg-white/[0.02] px-2 py-1">
        <div className="size-2 rounded-full bg-blue-400/60" />
        <span className="text-xs text-white/70">Callout text...</span>
      </div>
    ),
    label: "Callout",
    description: "Highlighted note",
  },
  list: {
    icon: (
      <div className="space-y-0.5">
        <div className="flex items-center gap-1">
          <div className="size-1.5 rounded-full bg-white/40" />
          <span className="text-xs text-white/60">List item</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="size-1.5 rounded-full bg-white/40" />
          <span className="text-xs text-white/60">Another item</span>
        </div>
      </div>
    ),
    label: "List",
    description: "Bulleted or numbered",
  },
  accordion: {
    icon: (
      <div className="w-full space-y-0.5">
        <div className="h-4 w-full rounded border border-white/12" />
        <div className="h-3 w-full rounded border border-white/10" />
      </div>
    ),
    label: "Accordion",
    description: "Expandable items",
  },
  divider: {
    icon: <div className="h-px w-8 bg-white/20" />,
    label: "Divider",
    description: "Visual separator",
  },
  table: {
    icon: (
      <div className="w-full space-y-0.5">
        <div className="h-3 w-full rounded border border-white/12" />
        <div className="h-2 w-full rounded border border-white/10" />
      </div>
    ),
    label: "Table",
    description: "Data table",
  },
  code: {
    icon: (
      <div className="flex items-center gap-1 rounded bg-white/[0.02] px-2 py-1 font-mono">
        <span className="text-xs text-white/60">code</span>
      </div>
    ),
    label: "Code",
    description: "Code snippet",
  },
  stepper: {
    icon: (
      <div className="flex items-center gap-1">
        <div className="flex h-4 w-4 items-center justify-center rounded-full border border-white/20 text-[10px] text-white/60">
          1
        </div>
        <span className="text-xs text-white/60">Step</span>
      </div>
    ),
    label: "Stepper",
    description: "Process steps",
  },
  gallery: {
    icon: (
      <div className="grid grid-cols-3 gap-0.5">
        <div className="h-3 w-3 rounded border border-white/12" />
        <div className="h-3 w-3 rounded border border-white/12" />
        <div className="h-3 w-3 rounded border border-white/12" />
      </div>
    ),
    label: "Gallery",
    description: "Image grid",
  },
  link: {
    icon: (
      <div className="flex items-center gap-1.5 rounded border border-white/12 bg-white/[0.02] px-2 py-1">
        <Link className="size-3 text-white/42" />
        <span className="text-xs text-white/70">Link title</span>
      </div>
    ),
    label: "Link",
    description: "External link",
  },
  metric: {
    icon: (
      <div className="rounded border border-white/12 bg-white/[0.02] px-2 py-1">
        <div className="text-[10px] text-white/34">Metric</div>
        <div className="text-xs font-medium text-white">84%</div>
      </div>
    ),
    label: "Metric",
    description: "Key stat",
  },
  timeline: {
    icon: (
      <div className="flex gap-1">
        <div className="h-3 w-3 rounded-full border border-white/20" />
        <div className="space-y-0.5">
          <div className="h-2 w-6 rounded border border-white/12" />
          <div className="h-1.5 w-4 rounded border border-white/10" />
        </div>
      </div>
    ),
    label: "Timeline",
    description: "Chronological events",
  },
};

function InsertBlockMenu({
  index,
  open,
  onOpen,
  onClose,
  blockTypes,
  onInsert,
  isRoot = true,
}: InsertBlockMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        open &&
        menuRef.current &&
        !menuRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open, onClose]);

  // Filter out columns-2 from the insert menu when inside columns (can't nest columns)
  const availableBlockTypes = isRoot
    ? blockTypes
    : blockTypes.filter((type) => type !== "columns-2");

  return (
    <div className="flex justify-start transition-all" data-insert-menu>
      <div ref={menuRef}>
        <button
          type="button"
          onClick={open ? onClose : onOpen}
          className={cn(
            "flex items-center justify-center rounded-full border border-white/10 bg-white/[0.03] transition-all h-10 w-10 mt-3.5",
            open
              ? "border-white/20 bg-white/[0.08] hover:bg-white/[0.12]"
              : "border-white/10 bg-white/[0.03] hover:bg-white/[0.06]",
          )}
          aria-label={
            open
              ? "Close block selector"
              : `Insert block at position ${index + 1}`
          }
        >
          <Plus
            className={cn(
              "text-white/42 transition-transform duration-200",
              open ? "size-5 rotate-45" : "size-5",
            )}
          />
        </button>
        <AnimatePresence>
          {open ? (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              className="overflow-hidden"
            >
              <div className="flex flex-wrap items-center gap-2 pt-3">
                {availableBlockTypes.map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => onInsert(type, index)}
                    className={buttonClasses({ tone: "muted", size: "xs" })}
                  >
                    <Plus className="size-3.5" />
                    {type}
                  </button>
                ))}
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </div>
  );
}

function BlockEditorContent({
  block,
  blocks,
  onChange,
  removeBlock,
  duplicateBlock,
  mediaBucket,
  blockTypes,
  dragHandle,
  openHeadingMenu,
  setOpenHeadingMenu,
  openCodeLangMenu,
  setCodeLangMenu,
  isRoot = true,
}: {
  block: ContentBlock;
  blocks: ContentBlock[];
  onChange: (blocks: ContentBlock[]) => void;
  removeBlock: (id: string) => void;
  duplicateBlock: (id: string) => void;
  mediaBucket: string;
  blockTypes: readonly string[];
  dragHandle?: ReactNode;
  openHeadingMenu: string | null;
  setOpenHeadingMenu: Dispatch<SetStateAction<string | null>>;
  openCodeLangMenu: string | null;
  setCodeLangMenu: Dispatch<SetStateAction<string | null>>;
  isRoot?: boolean;
}) {
  const updateBlockHandler = (
    id: string,
    updater: (block: ContentBlock) => ContentBlock,
  ) => {
    onChange(blocks.map((b) => (b.id === id ? updater(b) : b)));
  };

  // When inside columns-2, filter out Large (h2) heading to prevent nested h2
  const availableHeadingOptions = isRoot
    ? headingOptions
    : headingOptions.filter((option) => option.level !== 2);

  // For nested editors inside columns-2, filter out columns-2 option
  const nestedBlockTypes = blockTypes.filter((type) => type !== "columns-2");

  const headingLevel = Number(block.data?.level ?? 2);
  const headingLabel =
    availableHeadingOptions.find((option) => option.level === headingLevel)
      ?.label ?? "Medium";

  const [headingHighlightedIndex, setHeadingHighlightedIndex] = useState(0);
  const headingButtonRef = useRef<HTMLButtonElement>(null);

  const codeLanguage = String(block.data?.language ?? "javascript");
  const showPreview = Boolean(block.data?.showPreview ?? false);
  const codeValue = String(block.data?.code ?? "");
  const normalizedCodeLanguage = normalizeCodeLanguage(codeLanguage);
  const codePreviewDocument = buildCodePreviewDocument(
    codeValue,
    normalizedCodeLanguage,
  );
  const canPreviewCode = Boolean(codePreviewDocument);
  const showCodePreview = showPreview && canPreviewCode;
  const [showAdminCodePanel, setShowAdminCodePanel] = useState(true);
  const [codeLangHighlightedIndex, setCodeLangHighlightedIndex] = useState(0);
  const codeLangButtonRef = useRef<HTMLButtonElement>(null);
  const headingTypeAheadTimeoutRef = useRef<number | null>(null);
  const codeLangTypeAheadTimeoutRef = useRef<number | null>(null);

  // Cleanup type-ahead timeouts on unmount
  useEffect(() => {
    return () => {
      if (headingTypeAheadTimeoutRef.current) {
        clearTimeout(headingTypeAheadTimeoutRef.current);
      }
      if (codeLangTypeAheadTimeoutRef.current) {
        clearTimeout(codeLangTypeAheadTimeoutRef.current);
      }
    };
  }, []);

  // Keyboard handling for heading dropdown
  useEffect(() => {
    function handleHeadingKeyDown(event: KeyboardEvent) {
      if (openHeadingMenu !== block.id) return;
      if (event.key === "Escape") {
        setOpenHeadingMenu(null);
        headingButtonRef.current?.focus();
      } else if (event.key === "ArrowDown") {
        event.preventDefault();
        setHeadingHighlightedIndex((current) =>
          current < availableHeadingOptions.length - 1 ? current + 1 : 0,
        );
      } else if (event.key === "ArrowUp") {
        event.preventDefault();
        setHeadingHighlightedIndex((current) =>
          current > 0 ? current - 1 : availableHeadingOptions.length - 1,
        );
      } else if (event.key === "Enter") {
        event.preventDefault();
        if (availableHeadingOptions[headingHighlightedIndex]) {
          const option = availableHeadingOptions[headingHighlightedIndex];
          setOpenHeadingMenu(null);
          updateBlockHandler(block.id, (current) => ({
            ...current,
            data: { ...current.data, level: option.level },
          }));
          headingButtonRef.current?.focus();
        }
      } else if (
        event.key.length === 1 &&
        !event.altKey &&
        !event.ctrlKey &&
        !event.metaKey
      ) {
        // Type-ahead support
        const char = event.key.toLowerCase();
        if (headingTypeAheadTimeoutRef.current) {
          clearTimeout(headingTypeAheadTimeoutRef.current);
        }
        const nextMatch = availableHeadingOptions.findIndex((opt, idx) => {
          if (idx > headingHighlightedIndex) {
            return opt.label.toLowerCase().startsWith(char);
          }
          return false;
        });
        const firstMatch =
          nextMatch === -1
            ? availableHeadingOptions.findIndex((opt) =>
                opt.label.toLowerCase().startsWith(char),
              )
            : nextMatch;
        if (firstMatch !== -1) {
          setHeadingHighlightedIndex(firstMatch);
        }
        headingTypeAheadTimeoutRef.current = window.setTimeout(() => {
          headingTypeAheadTimeoutRef.current = null;
        }, 1000);
      }
    }

    if (openHeadingMenu === block.id) {
      document.addEventListener("keydown", handleHeadingKeyDown);
      return () =>
        document.removeEventListener("keydown", handleHeadingKeyDown);
    }
  }, [
    openHeadingMenu,
    block.id,
    headingHighlightedIndex,
    availableHeadingOptions,
    isRoot,
  ]);

  // Keyboard handling for code language dropdown
  useEffect(() => {
    function handleCodeLangKeyDown(event: KeyboardEvent) {
      if (openCodeLangMenu !== block.id) return;
      if (event.key === "Escape") {
        setCodeLangMenu(null);
        codeLangButtonRef.current?.focus();
      } else if (event.key === "ArrowDown") {
        event.preventDefault();
        setCodeLangHighlightedIndex((current) =>
          current < codeLanguageOptions.length - 1 ? current + 1 : 0,
        );
      } else if (event.key === "ArrowUp") {
        event.preventDefault();
        setCodeLangHighlightedIndex((current) =>
          current > 0 ? current - 1 : codeLanguageOptions.length - 1,
        );
      } else if (event.key === "Enter") {
        event.preventDefault();
        if (codeLanguageOptions[codeLangHighlightedIndex]) {
          const opt = codeLanguageOptions[codeLangHighlightedIndex];
          setCodeLangMenu(null);
          updateBlockHandler(block.id, (current) => ({
            ...current,
            data: { ...current.data, language: opt.value },
          }));
          codeLangButtonRef.current?.focus();
        }
      } else if (
        event.key.length === 1 &&
        !event.altKey &&
        !event.ctrlKey &&
        !event.metaKey
      ) {
        // Type-ahead support
        const char = event.key.toLowerCase();
        if (codeLangTypeAheadTimeoutRef.current) {
          clearTimeout(codeLangTypeAheadTimeoutRef.current);
        }
        const nextMatch = codeLanguageOptions.findIndex((opt, idx) => {
          if (idx > codeLangHighlightedIndex) {
            return (
              opt.label.toLowerCase().startsWith(char) ||
              opt.value.toLowerCase().startsWith(char)
            );
          }
          return false;
        });
        const firstMatch =
          nextMatch === -1
            ? codeLanguageOptions.findIndex(
                (opt) =>
                  opt.label.toLowerCase().startsWith(char) ||
                  opt.value.toLowerCase().startsWith(char),
              )
            : nextMatch;
        if (firstMatch !== -1) {
          setCodeLangHighlightedIndex(firstMatch);
        }
        codeLangTypeAheadTimeoutRef.current = window.setTimeout(() => {
          codeLangTypeAheadTimeoutRef.current = null;
        }, 1000);
      }
    }

    if (openCodeLangMenu === block.id) {
      document.addEventListener("keydown", handleCodeLangKeyDown);
      return () =>
        document.removeEventListener("keydown", handleCodeLangKeyDown);
    }
  }, [
    openCodeLangMenu,
    block.id,
    codeLangHighlightedIndex,
    codeLanguageOptions.length,
  ]);

  return (
    <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-4">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          {dragHandle}
          <p className="truncate text-[0.62rem] uppercase tracking-[0.28em] text-white/34">
            {block.type}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => duplicateBlock(block.id)}
            className={buttonClasses({ tone: "muted", iconOnly: true })}
            title="Duplicate block"
          >
            <Copy className="size-4" />
          </button>
          <button
            type="button"
            onClick={() => removeBlock(block.id)}
            className={buttonClasses({ tone: "danger", iconOnly: true })}
            title="Delete block"
          >
            <Trash2 className="size-4" />
          </button>
        </div>
      </div>

      {block.type === "heading" ? (
        <div className="grid gap-3 sm:grid-cols-[160px_minmax(0,1fr)]">
          <div className="relative">
            <button
              ref={headingButtonRef}
              type="button"
              onClick={() => {
                setOpenHeadingMenu((current) =>
                  current === block.id ? null : block.id,
                );
                setHeadingHighlightedIndex(
                  headingOptions.findIndex(
                    (opt) => opt.level === headingLevel,
                  ) || 0,
                );
              }}
              onKeyDown={(event) => {
                if (
                  event.key === "Enter" ||
                  event.key === " " ||
                  event.key === "ArrowDown"
                ) {
                  event.preventDefault();
                  setOpenHeadingMenu((current) =>
                    current === block.id ? null : block.id,
                  );
                }
              }}
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
                  transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                  className="absolute left-0 top-[calc(100%+0.5rem)] z-20 w-full rounded-[1rem] border border-white/10 bg-[#0c0c0c]/96 p-2 backdrop-blur-xl"
                >
                  {availableHeadingOptions.map((option, index) => (
                    <button
                      key={option.level}
                      type="button"
                      onMouseEnter={() => setHeadingHighlightedIndex(index)}
                      onClick={() => {
                        setOpenHeadingMenu(null);
                        updateBlockHandler(block.id, (current) => ({
                          ...current,
                          data: { ...current.data, level: option.level },
                        }));
                        headingButtonRef.current?.focus();
                      }}
                      className={cn(
                        "flex w-full rounded-[0.8rem] px-3 py-2 text-left text-sm transition-colors",
                        headingHighlightedIndex === index
                          ? "bg-white/[0.08] text-white"
                          : "text-white/72 hover:bg-white/[0.04] hover:text-white",
                      )}
                    >
                      {option.label}
                    </button>
                  ))}
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>
          <AutoGrowTextarea
            value={String(block.data?.text ?? "")}
            onChange={(value) =>
              updateBlockHandler(block.id, (current) => ({
                ...current,
                data: { ...current.data, text: value },
              }))
            }
            placeholder="Heading text"
            className="min-h-[1lh] w-full resize-none overflow-hidden rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2 text-sm text-white outline-none"
            enableFormatToolbar
          />
        </div>
      ) : null}

      {block.type === "paragraph" ? (
        <AutoGrowTextarea
          value={String(
            block.data?.text ?? decodeHtml(String(block.data?.html ?? "")),
          )}
          onChange={(value) =>
            updateBlockHandler(block.id, (current) => ({
              ...current,
              data: {
                ...current.data,
                text: value,
                html: `<p>${value}</p>`,
              },
            }))
          }
          placeholder="Paragraph text"
          className="min-h-[1lh] w-full resize-none overflow-hidden rounded-xl border border-white/10 bg-white/[0.02] px-3 py-3 text-sm text-white outline-none"
          enableFormatToolbar
        />
      ) : null}

      {block.type === "image" ? (
        <div className="grid gap-3 rounded-3xl">
          <MediaAssetField
            label="Image source"
            value={String(block.data?.url ?? "")}
            onChange={(value) =>
              updateBlockHandler(block.id, (current) => ({
                ...current,
                data: { ...current.data, url: value },
              }))
            }
            bucket={mediaBucket}
            accept="image/*"
          />
          <input
            placeholder="Alt text"
            value={String(block.data?.alt ?? "")}
            onChange={(event) =>
              updateBlockHandler(block.id, (current) => ({
                ...current,
                data: { ...current.data, alt: event.target.value },
              }))
            }
            className="rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2 text-sm text-white outline-none"
          />
          <AutoGrowTextarea
            value={String(block.data?.caption ?? "")}
            onChange={(value) =>
              updateBlockHandler(block.id, (current) => ({
                ...current,
                data: { ...current.data, caption: value },
              }))
            }
            placeholder="Caption"
            className="min-h-[1lh] w-full resize-none overflow-hidden rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2 text-sm text-white outline-none"
          />
        </div>
      ) : null}

      {block.type === "video" ? (
        <div className="grid gap-3">
          <MediaAssetField
            label="Video source"
            value={String(block.data?.url ?? "")}
            onChange={(value) =>
              updateBlockHandler(block.id, (current) => ({
                ...current,
                data: { ...current.data, url: value },
              }))
            }
            bucket={mediaBucket}
            accept="video/*"
          />
          <AutoGrowTextarea
            value={String(block.data?.caption ?? "")}
            onChange={(value) =>
              updateBlockHandler(block.id, (current) => ({
                ...current,
                data: { ...current.data, caption: value },
              }))
            }
            placeholder="Caption"
            className="min-h-[1lh] w-full resize-none overflow-hidden rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2 text-sm text-white outline-none"
          />
        </div>
      ) : null}

      {block.type === "list" ? (
        <div className="space-y-2">
          {ensureStringArray(block.data?.items).map((item, itemIndex) => (
            <div
              key={`${block.id}-item-${itemIndex}`}
              className="flex items-start gap-2"
            >
              <AutoGrowTextarea
                value={item}
                onChange={(value) => {
                  const items = [...ensureStringArray(block.data?.items)];
                  items[itemIndex] = value;
                  updateBlockHandler(block.id, (current) => ({
                    ...current,
                    data: { ...current.data, items },
                  }));
                }}
                placeholder={`Item ${itemIndex + 1}`}
                className="min-h-[1lh] flex-1 resize-none overflow-hidden rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2 text-sm text-white outline-none"
                enableFormatToolbar
              />
              <button
                type="button"
                onClick={() => {
                  const items = ensureStringArray(block.data?.items).filter(
                    (_, idx) => idx !== itemIndex,
                  );
                  updateBlockHandler(block.id, (current) => ({
                    ...current,
                    data: { ...current.data, items },
                  }));
                }}
                className={buttonClasses({ tone: "danger", iconOnly: true })}
              >
                <Trash2 className="size-3.5" />
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => {
              const items = ensureStringArray(block.data?.items);
              items.push("");
              updateBlockHandler(block.id, (current) => ({
                ...current,
                data: { ...current.data, items },
              }));
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
            value={String(block.data?.text ?? "")}
            onChange={(value) =>
              updateBlockHandler(block.id, (current) => ({
                ...current,
                data: { ...current.data, text: value },
              }))
            }
            placeholder="Quote text"
            className="min-h-[1lh] w-full resize-none overflow-hidden rounded-xl border border-white/10 bg-white/[0.02] px-3 py-3 text-sm text-white outline-none"
            enableFormatToolbar
          />
          <input
            placeholder="Author"
            value={String(block.data?.author ?? "")}
            onChange={(event) =>
              updateBlockHandler(block.id, (current) => ({
                ...current,
                data: { ...current.data, author: event.target.value },
              }))
            }
            className="rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2 text-sm text-white outline-none"
          />
        </div>
      ) : null}

      {block.type === "callout" ? (
        <div className="grid gap-3">
          <div className="flex flex-wrap gap-2">
            {calloutVariantOptions.map((variant) => (
              <button
                key={variant}
                type="button"
                onClick={() =>
                  updateBlockHandler(block.id, (current) => ({
                    ...current,
                    data: { ...current.data, variant },
                  }))
                }
                className={buttonClasses({
                  tone:
                    (block.data?.variant as CalloutVariant) === variant
                      ? "selected"
                      : "muted",
                  size: "xs",
                  className: "normal-case tracking-normal capitalize",
                })}
              >
                {variant}
              </button>
            ))}
          </div>
          <input
            placeholder="Callout title"
            value={String(block.data?.title ?? "")}
            onChange={(event) =>
              updateBlockHandler(block.id, (current) => ({
                ...current,
                data: { ...current.data, title: event.target.value },
              }))
            }
            className="rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2 text-sm text-white outline-none"
          />
          <AutoGrowTextarea
            value={String(block.data?.text ?? "")}
            onChange={(value) =>
              updateBlockHandler(block.id, (current) => ({
                ...current,
                data: { ...current.data, text: value },
              }))
            }
            placeholder="Callout text"
            className="min-h-[1lh] w-full resize-none overflow-hidden rounded-xl border border-white/10 bg-white/[0.02] px-3 py-3 text-sm text-white outline-none"
            enableFormatToolbar
          />
        </div>
      ) : null}

      {block.type === "table" ? (
        <div className="space-y-3">
          <div className="overflow-x-auto rounded-xl border border-white/10">
            <table className="min-w-full border-collapse text-sm text-white/78">
              <thead>
                <tr>
                  {ensureStringArray(block.data?.headers).map(
                    (header, headerIndex) => (
                      <th
                        key={`${block.id}-header-${headerIndex}`}
                        className="border-b border-white/10 px-3 py-2 align-top"
                      >
                        <div className="flex items-start gap-2">
                          <AutoGrowTextarea
                            value={header}
                            onChange={(value) => {
                              const headers = [
                                ...ensureStringArray(block.data?.headers),
                              ];
                              headers[headerIndex] = value;
                              updateBlockHandler(block.id, (current) => ({
                                ...current,
                                data: { ...current.data, headers },
                              }));
                            }}
                            placeholder={`Column ${headerIndex + 1}`}
                            className="min-h-[1lh] w-full resize-none overflow-hidden bg-transparent text-sm text-white outline-none"
                            enableFormatToolbar
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const headers = [
                                ...ensureStringArray(block.data?.headers),
                              ];
                              if (headers.length <= 1) return;
                              headers.splice(headerIndex, 1);
                              const rows = Array.isArray(block.data?.rows)
                                ? (block.data.rows as string[][]).map((row) =>
                                    row.filter((_, idx) => idx !== headerIndex),
                                  )
                                : [];
                              updateBlockHandler(block.id, (current) => ({
                                ...current,
                                data: { ...current.data, headers, rows },
                              }));
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
                {(Array.isArray(block.data?.rows)
                  ? (block.data.rows as string[][])
                  : []
                ).map((row, rowIndex) => (
                  <tr key={`${block.id}-row-${rowIndex}`}>
                    {row.map((cell, cellIndex) => (
                      <td
                        key={`${block.id}-cell-${rowIndex}-${cellIndex}`}
                        className="border-t border-white/10 px-3 py-2 align-top"
                      >
                        <AutoGrowTextarea
                          value={cell}
                          onChange={(value) => {
                            const rows = Array.isArray(block.data?.rows)
                              ? (block.data.rows as string[][]).map((item) => [
                                  ...item,
                                ])
                              : [];
                            rows[rowIndex][cellIndex] = value;
                            updateBlockHandler(block.id, (current) => ({
                              ...current,
                              data: { ...current.data, rows },
                            }));
                          }}
                          placeholder={`Row ${rowIndex + 1}, Col ${cellIndex + 1}`}
                          className="min-h-[1lh] w-full resize-none overflow-hidden bg-transparent text-sm text-white outline-none"
                          enableFormatToolbar
                        />
                      </td>
                    ))}
                    <td className="border-t border-white/10 px-3 py-2 text-right">
                      <button
                        type="button"
                        onClick={() => {
                          const rows = Array.isArray(block.data?.rows)
                            ? (block.data.rows as string[][]).filter(
                                (_, idx) => idx !== rowIndex,
                              )
                            : [];
                          if (rows.length === 0) return;
                          updateBlockHandler(block.id, (current) => ({
                            ...current,
                            data: { ...current.data, rows },
                          }));
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
                const headers = ensureStringArray(block.data?.headers);
                const rows = Array.isArray(block.data?.rows)
                  ? (block.data.rows as string[][]).map((row) => [...row, ""])
                  : [];
                updateBlockHandler(block.id, (current) => ({
                  ...current,
                  data: {
                    ...current.data,
                    headers: [...headers, ""],
                    rows,
                  },
                }));
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
                const headers = ensureStringArray(block.data?.headers);
                const rows = Array.isArray(block.data?.rows)
                  ? (block.data.rows as string[][])
                  : [];
                updateBlockHandler(block.id, (current) => ({
                  ...current,
                  data: {
                    ...current.data,
                    rows: [...rows, new Array(headers.length).fill("")],
                  },
                }));
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
          {Array.isArray(block.data?.items)
            ? (
                block.data.items as Array<{ title: string; content: string }>
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
                          ...(block.data?.items as Array<{
                            title: string;
                            content: string;
                          }>),
                        ];
                        items[itemIndex] = {
                          ...items[itemIndex],
                          title: event.target.value,
                        };
                        updateBlockHandler(block.id, (current) => ({
                          ...current,
                          data: { ...current.data, items },
                        }));
                      }}
                      placeholder={`Accordion title ${itemIndex + 1}`}
                      className="w-full bg-transparent text-sm text-white outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const items = [
                          ...(block.data?.items as Array<{
                            title: string;
                            content: string;
                          }>),
                        ].filter((_, idx) => idx !== itemIndex);
                        updateBlockHandler(block.id, (current) => ({
                          ...current,
                          data: { ...current.data, items },
                        }));
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
                        ...(block.data?.items as Array<{
                          title: string;
                          content: string;
                        }>),
                      ];
                      items[itemIndex] = {
                        ...items[itemIndex],
                        content: value,
                      };
                      updateBlockHandler(block.id, (current) => ({
                        ...current,
                        data: { ...current.data, items },
                      }));
                    }}
                    placeholder="Accordion content"
                    className="mt-3 min-h-[1lh] w-full resize-none overflow-hidden bg-transparent text-sm leading-6 text-white/68 outline-none"
                    enableFormatToolbar
                  />
                </div>
              ))
            : null}
          <button
            type="button"
            onClick={() => {
              const items = Array.isArray(block.data?.items)
                ? [
                    ...(block.data.items as Array<{
                      title: string;
                      content: string;
                    }>),
                  ]
                : [];
              items.push({
                title: "",
                content: "",
              });
              updateBlockHandler(block.id, (current) => ({
                ...current,
                data: { ...current.data, items },
              }));
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

      {block.type === "code" ? (
        <div className="grid gap-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap gap-2">
              <div className="relative w-full min-w-0 sm:w-56">
                <button
                  ref={codeLangButtonRef}
                  type="button"
                  onClick={() => {
                    setCodeLangMenu((current) =>
                      current === block.id ? null : block.id,
                    );
                    setCodeLangHighlightedIndex(
                      codeLanguageOptions.findIndex(
                        (opt) => opt.value === codeLanguage,
                      ) || 0,
                    );
                  }}
                  onKeyDown={(event) => {
                    if (
                      event.key === "Enter" ||
                      event.key === " " ||
                      event.key === "ArrowDown"
                    ) {
                      event.preventDefault();
                      setCodeLangMenu((current) =>
                        current === block.id ? null : block.id,
                      );
                    }
                  }}
                  className="flex w-full min-w-0 items-center justify-between gap-2 rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2 text-sm text-white"
                >
                  <span className="min-w-0 truncate">
                    {getLanguageLabel(codeLanguage)}
                  </span>
                  <ChevronsUpDown className="size-4 shrink-0 text-white/42" />
                </button>
                <AnimatePresence>
                  {openCodeLangMenu === block.id ? (
                    <motion.div
                      initial={{ opacity: 0, y: 8, filter: "blur(12px)" }}
                      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                      exit={{ opacity: 0, y: 6, filter: "blur(12px)" }}
                      transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                      className="absolute left-0 top-[calc(100%+0.5rem)] z-20 max-h-[18rem] w-full overflow-y-auto rounded-[1rem] border border-white/10 bg-[#0c0c0c]/96 p-2 backdrop-blur-xl"
                    >
                      {codeLanguageOptions.map((opt, index) => (
                        <button
                          key={opt.value}
                          type="button"
                          onMouseEnter={() =>
                            setCodeLangHighlightedIndex(index)
                          }
                          onClick={() => {
                            setCodeLangMenu(null);
                            updateBlockHandler(block.id, (current) => ({
                              ...current,
                              data: { ...current.data, language: opt.value },
                            }));
                            codeLangButtonRef.current?.focus();
                          }}
                          className={cn(
                            "flex w-full min-w-0 rounded-[0.8rem] px-3 py-2 text-left text-sm transition-colors",
                            codeLangHighlightedIndex === index
                              ? "bg-white/[0.08] text-white"
                              : "text-white/72 hover:bg-white/[0.04] hover:text-white",
                          )}
                        >
                          <span className="min-w-0 truncate">{opt.label}</span>
                        </button>
                      ))}
                    </motion.div>
                  ) : null}
                </AnimatePresence>
              </div>
              <button
                type="button"
                onClick={() =>
                  updateBlockHandler(block.id, (current) => ({
                    ...current,
                    data: { ...current.data, showPreview: !showPreview },
                  }))
                }
                disabled={!showPreview && !canPreviewCode}
                className={buttonClasses({
                  tone: showPreview ? "selected" : "muted",
                  size: "xs",
                  className:
                    "normal-case tracking-normal disabled:cursor-not-allowed disabled:opacity-40",
                })}
                title={
                  canPreviewCode
                    ? "Toggle live preview for this code block"
                    : "Preview supports HTML, CSS, and JavaScript"
                }
              >
                {showPreview ? (
                  <EyeOff className="size-3.5" />
                ) : (
                  <Eye className="size-3.5" />
                )}
                <span>
                  {showPreview ? "Preview enabled" : "Enable preview"}
                </span>
              </button>
            </div>
            {showCodePreview ? (
              <button
                type="button"
                onClick={() => setShowAdminCodePanel((current) => !current)}
                className={buttonClasses({
                  tone: showAdminCodePanel ? "selected" : "muted",
                  size: "xs",
                  className:
                    "hidden normal-case tracking-normal md:inline-flex",
                })}
              >
                {showAdminCodePanel ? (
                  <EyeOff className="size-3.5" />
                ) : (
                  <Eye className="size-3.5" />
                )}
                <span>{showAdminCodePanel ? "Hide code" : "Show code"}</span>
              </button>
            ) : null}
          </div>
          {showPreview && !canPreviewCode ? (
            <p className="rounded-xl border border-amber-400/15 bg-amber-400/[0.04] px-3 py-2 text-xs leading-5 text-amber-200/72">
              Live preview supports HTML, CSS, and JavaScript. This language
              will still render as code.
            </p>
          ) : null}
          {showCodePreview ? (
            <div
              className={
                showAdminCodePanel
                  ? "grid overflow-hidden rounded-xl border border-white/10 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]"
                  : "grid overflow-hidden rounded-xl border border-white/10"
              }
            >
              {showAdminCodePanel ? (
                <div className="min-w-0 bg-white/[0.02] md:border-r md:border-white/10">
                  <div className="border-b border-white/10 px-3 py-2 text-[0.62rem] uppercase tracking-[0.24em] text-white/34">
                    Code
                  </div>
                  <textarea
                    value={codeValue}
                    onChange={(event) =>
                      updateBlockHandler(block.id, (current) => ({
                        ...current,
                        data: { ...current.data, code: event.target.value },
                      }))
                    }
                    className="h-[32rem] max-h-[70vh] min-h-[18rem] w-full resize-none overflow-auto bg-transparent px-3 py-3 font-mono text-sm leading-6 text-white outline-none"
                    placeholder={
                      'const greet = (name) => {\n  return `Hello, ${name}!`;\n};\n\ngreet("World"); // Hello, World!'
                    }
                    spellCheck={false}
                  />
                </div>
              ) : null}
              <div className="min-w-0 bg-white">
                <div className="border-b border-black/10 bg-white px-3 py-2 text-[0.62rem] uppercase tracking-[0.24em] text-black/40">
                  Preview
                </div>
                <iframe
                  title="Code preview"
                  srcDoc={codePreviewDocument ?? ""}
                  sandbox="allow-scripts allow-modals allow-forms"
                  className="h-[32rem] max-h-[70vh] w-full border-0 bg-white"
                />
              </div>
            </div>
          ) : (
            <textarea
              value={codeValue}
              onChange={(event) =>
                updateBlockHandler(block.id, (current) => ({
                  ...current,
                  data: { ...current.data, code: event.target.value },
                }))
              }
              className="h-[22rem] max-h-[70vh] min-h-[12rem] w-full resize-y overflow-auto rounded-xl border border-white/10 bg-white/[0.02] px-3 py-3 font-mono text-sm leading-6 text-white outline-none"
              placeholder={
                'const greet = (name) => {\n  return `Hello, ${name}!`;\n};\n\ngreet("World"); // Hello, World!'
              }
              spellCheck={false}
            />
          )}
        </div>
      ) : null}

      {block.type === "stepper" ? (
        <div className="space-y-3">
          {Array.isArray(block.data?.steps)
            ? (
                block.data.steps as Array<{
                  title?: string;
                  description?: string;
                }>
              ).map((step, stepIndex) => (
                <div
                  key={`${block.id}-step-${stepIndex}`}
                  className="rounded-[1rem] border border-white/10 p-3"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-white/10 bg-white/[0.02] text-sm font-medium text-white/60">
                      {stepIndex + 1}
                    </div>
                    <div className="flex-1 space-y-2">
                      <input
                        value={step.title ?? ""}
                        onChange={(event) => {
                          const steps = [
                            ...(block.data?.steps as Array<{
                              title?: string;
                              description?: string;
                            }>),
                          ];
                          steps[stepIndex] = {
                            ...steps[stepIndex],
                            title: event.target.value,
                          };
                          updateBlockHandler(block.id, (current) => ({
                            ...current,
                            data: { ...current.data, steps },
                          }));
                        }}
                        placeholder="Step title"
                        className="w-full rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2 text-sm text-white outline-none"
                      />
                      <AutoGrowTextarea
                        value={step.description ?? ""}
                        onChange={(value) => {
                          const steps = [
                            ...(block.data?.steps as Array<{
                              title?: string;
                              description?: string;
                            }>),
                          ];
                          steps[stepIndex] = {
                            ...steps[stepIndex],
                            description: value,
                          };
                          updateBlockHandler(block.id, (current) => ({
                            ...current,
                            data: { ...current.data, steps },
                          }));
                        }}
                        placeholder="Step description"
                        className="min-h-[1lh] w-full resize-none overflow-hidden rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2 text-sm text-white outline-none"
                        enableFormatToolbar
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const steps = [
                          ...(block.data?.steps as Array<{
                            title?: string;
                            description?: string;
                          }>),
                        ].filter((_, idx) => idx !== stepIndex);
                        if (steps.length === 0) return;
                        updateBlockHandler(block.id, (current) => ({
                          ...current,
                          data: { ...current.data, steps },
                        }));
                      }}
                      className={buttonClasses({
                        tone: "danger",
                        iconOnly: true,
                      })}
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                </div>
              ))
            : null}
          <button
            type="button"
            onClick={() => {
              const steps = Array.isArray(block.data?.steps)
                ? [
                    ...(block.data.steps as Array<{
                      title?: string;
                      description?: string;
                    }>),
                  ]
                : [];
              steps.push({
                title: "",
                description: "",
              });
              updateBlockHandler(block.id, (current) => ({
                ...current,
                data: { ...current.data, steps },
              }));
            }}
            className={buttonClasses({
              tone: "muted",
              size: "xs",
              className: "normal-case tracking-normal",
            })}
          >
            <PlusCircle className="size-3.5" />
            Add step
          </button>
        </div>
      ) : null}

      {block.type === "gallery" ? (
        <div className="space-y-3">
          {Array.isArray(block.data?.images)
            ? (
                block.data.images as Array<{
                  url?: string;
                  alt?: string;
                  caption?: string;
                }>
              ).map((img, imgIndex) => (
                <div
                  key={`${block.id}-img-${imgIndex}`}
                  className="rounded-[1rem] border border-white/10 p-3"
                >
                  <MediaAssetField
                    label="Image URL"
                    value={String(img.url ?? "")}
                    onChange={(value) => {
                      const images = [
                        ...(block.data?.images as Array<{
                          url?: string;
                          alt?: string;
                          caption?: string;
                        }>),
                      ];
                      images[imgIndex] = { ...images[imgIndex], url: value };
                      updateBlockHandler(block.id, (current) => ({
                        ...current,
                        data: { ...current.data, images },
                      }));
                    }}
                    bucket={mediaBucket}
                    accept="image/*"
                  />
                  <input
                    value={String(img.alt ?? "")}
                    onChange={(event) => {
                      const images = [
                        ...(block.data?.images as Array<{
                          url?: string;
                          alt?: string;
                          caption?: string;
                        }>),
                      ];
                      images[imgIndex] = {
                        ...images[imgIndex],
                        alt: event.target.value,
                      };
                      updateBlockHandler(block.id, (current) => ({
                        ...current,
                        data: { ...current.data, images },
                      }));
                    }}
                    placeholder="Alt text"
                    className="mt-2 w-full rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2 text-sm text-white outline-none"
                  />
                  <AutoGrowTextarea
                    value={String(img.caption ?? "")}
                    onChange={(value) => {
                      const images = [
                        ...(block.data?.images as Array<{
                          url?: string;
                          alt?: string;
                          caption?: string;
                        }>),
                      ];
                      images[imgIndex] = {
                        ...images[imgIndex],
                        caption: value,
                      };
                      updateBlockHandler(block.id, (current) => ({
                        ...current,
                        data: { ...current.data, images },
                      }));
                    }}
                    placeholder="Caption (optional)"
                    className="mt-2 w-full resize-none overflow-hidden rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2 text-sm text-white outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const images = [
                        ...(block.data?.images as Array<{
                          url?: string;
                          alt?: string;
                          caption?: string;
                        }>),
                      ].filter((_, idx) => idx !== imgIndex);
                      updateBlockHandler(block.id, (current) => ({
                        ...current,
                        data: { ...current.data, images },
                      }));
                    }}
                    className={buttonClasses({
                      tone: "danger",
                      size: "xs",
                      className: "mt-2 normal-case tracking-normal",
                    })}
                  >
                    <Trash2 className="size-3.5" />
                    Remove image
                  </button>
                </div>
              ))
            : null}
          <button
            type="button"
            onClick={() => {
              const images = Array.isArray(block.data?.images)
                ? [
                    ...(block.data.images as Array<{
                      url?: string;
                      alt?: string;
                      caption?: string;
                    }>),
                  ]
                : [];
              images.push({ url: "", alt: "", caption: "" });
              updateBlockHandler(block.id, (current) => ({
                ...current,
                data: { ...current.data, images },
              }));
            }}
            className={buttonClasses({
              tone: "muted",
              size: "xs",
              className: "normal-case tracking-normal",
            })}
          >
            <PlusCircle className="size-3.5" />
            Add image
          </button>
        </div>
      ) : null}

      {block.type === "link" ? (
        <div className="grid gap-3">
          <input
            value={String(block.data?.url ?? "")}
            onChange={(event) =>
              updateBlockHandler(block.id, (current) => ({
                ...current,
                data: { ...current.data, url: event.target.value },
              }))
            }
            placeholder="URL"
            className="w-full rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2 text-sm text-white outline-none"
          />
          <input
            value={String(block.data?.title ?? "")}
            onChange={(event) =>
              updateBlockHandler(block.id, (current) => ({
                ...current,
                data: { ...current.data, title: event.target.value },
              }))
            }
            placeholder="Title"
            className="w-full rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2 text-sm text-white outline-none"
          />
          <AutoGrowTextarea
            value={String(block.data?.description ?? "")}
            onChange={(value) =>
              updateBlockHandler(block.id, (current) => ({
                ...current,
                data: { ...current.data, description: value },
              }))
            }
            placeholder="Description"
            className="w-full resize-none overflow-hidden rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2 text-sm text-white outline-none"
            enableFormatToolbar
          />
        </div>
      ) : null}

      {block.type === "metric" ? (
        <div className="grid gap-3">
          <input
            value={String(block.data?.label ?? "")}
            onChange={(event) =>
              updateBlockHandler(block.id, (current) => ({
                ...current,
                data: { ...current.data, label: event.target.value },
              }))
            }
            placeholder="Label (e.g., Performance)"
            className="w-full rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2 text-sm text-white outline-none"
          />
          <input
            value={String(block.data?.value ?? "")}
            onChange={(event) =>
              updateBlockHandler(block.id, (current) => ({
                ...current,
                data: { ...current.data, value: event.target.value },
              }))
            }
            placeholder="Value (e.g., 98%)"
            className="w-full rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2 text-sm text-white outline-none"
          />
          <AutoGrowTextarea
            value={String(block.data?.description ?? "")}
            onChange={(value) =>
              updateBlockHandler(block.id, (current) => ({
                ...current,
                data: { ...current.data, description: value },
              }))
            }
            placeholder="Description (optional)"
            className="w-full resize-none overflow-hidden rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2 text-sm text-white outline-none"
          />
        </div>
      ) : null}

      {block.type === "timeline" ? (
        <div className="space-y-3">
          {Array.isArray(block.data?.items)
            ? (
                block.data.items as Array<{
                  date?: string;
                  title?: string;
                  description?: string;
                }>
              ).map((item, itemIndex) => (
                <div
                  key={`${block.id}-tl-${itemIndex}`}
                  className="rounded-[1rem] border border-white/10 p-3"
                >
                  <div className="grid gap-2">
                    <input
                      value={item.date ?? ""}
                      onChange={(event) => {
                        const items = [
                          ...(block.data?.items as Array<{
                            date?: string;
                            title?: string;
                            description?: string;
                          }>),
                        ];
                        items[itemIndex] = {
                          ...items[itemIndex],
                          date: event.target.value,
                        };
                        updateBlockHandler(block.id, (current) => ({
                          ...current,
                          data: { ...current.data, items },
                        }));
                      }}
                      placeholder="Date"
                      className="w-full rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2 text-sm text-white outline-none"
                    />
                    <input
                      value={item.title ?? ""}
                      onChange={(event) => {
                        const items = [
                          ...(block.data?.items as Array<{
                            date?: string;
                            title?: string;
                            description?: string;
                          }>),
                        ];
                        items[itemIndex] = {
                          ...items[itemIndex],
                          title: event.target.value,
                        };
                        updateBlockHandler(block.id, (current) => ({
                          ...current,
                          data: { ...current.data, items },
                        }));
                      }}
                      placeholder="Title"
                      className="w-full rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2 text-sm text-white outline-none"
                    />
                    <AutoGrowTextarea
                      value={item.description ?? ""}
                      onChange={(value) => {
                        const items = [
                          ...(block.data?.items as Array<{
                            date?: string;
                            title?: string;
                            description?: string;
                          }>),
                        ];
                        items[itemIndex] = {
                          ...items[itemIndex],
                          description: value,
                        };
                        updateBlockHandler(block.id, (current) => ({
                          ...current,
                          data: { ...current.data, items },
                        }));
                      }}
                      placeholder="Description"
                      className="w-full resize-none overflow-hidden rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2 text-sm text-white outline-none"
                      enableFormatToolbar
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const items = [
                        ...(block.data?.items as Array<{
                          date?: string;
                          title?: string;
                          description?: string;
                        }>),
                      ].filter((_, idx) => idx !== itemIndex);
                      updateBlockHandler(block.id, (current) => ({
                        ...current,
                        data: { ...current.data, items },
                      }));
                    }}
                    className={buttonClasses({
                      tone: "danger",
                      size: "xs",
                      className: "mt-2 normal-case tracking-normal",
                    })}
                  >
                    <Trash2 className="size-3.5" />
                    Remove
                  </button>
                </div>
              ))
            : null}
          <button
            type="button"
            onClick={() => {
              const items = Array.isArray(block.data?.items)
                ? [
                    ...(block.data.items as Array<{
                      date?: string;
                      title?: string;
                      description?: string;
                    }>),
                  ]
                : [];
              items.push({ date: "", title: "", description: "" });
              updateBlockHandler(block.id, (current) => ({
                ...current,
                data: { ...current.data, items },
              }));
            }}
            className={buttonClasses({
              tone: "muted",
              size: "xs",
              className: "normal-case tracking-normal",
            })}
          >
            <PlusCircle className="size-3.5" />
            Add timeline item
          </button>
        </div>
      ) : null}

      {block.type === "columns-2" ? (
        <div className="grid gap-4 lg:grid-cols-2" data-columns-container>
          <div className="min-w-0 rounded-[1.25rem] border border-white/10 bg-black/10 p-3">
            <p className="mb-3 text-[0.62rem] uppercase tracking-[0.28em] text-white/34">
              Left column
            </p>
            <BlockEditor
              isRoot={false}
              blocks={
                Array.isArray(block.data?.left)
                  ? (block.data.left as ContentBlock[])
                  : []
              }
              onChange={(leftBlocks) =>
                updateBlockHandler(block.id, (current) => ({
                  ...current,
                  data: { ...current.data, left: leftBlocks },
                }))
              }
              blockTypes={nestedBlockTypes}
              mediaBucket={mediaBucket}
            />
          </div>
          <div className="min-w-0 rounded-[1.25rem] border border-white/10 bg-black/10 p-3">
            <p className="mb-3 text-[0.62rem] uppercase tracking-[0.28em] text-white/34">
              Right column
            </p>
            <BlockEditor
              isRoot={false}
              blocks={
                Array.isArray(block.data?.right)
                  ? (block.data.right as ContentBlock[])
                  : []
              }
              onChange={(rightBlocks) =>
                updateBlockHandler(block.id, (current) => ({
                  ...current,
                  data: { ...current.data, right: rightBlocks },
                }))
              }
              blockTypes={nestedBlockTypes}
              mediaBucket={mediaBucket}
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}

// ─── FIXED: InsertBlockMenu is now INSIDE SortableBlock ─────────────────
function SortableBlock({
  block,
  onChange,
  removeBlock,
  duplicateBlock,
  mediaBucket,
  blockTypes,
  blocks,
  openHeadingMenu,
  setOpenHeadingMenu,
  openCodeLangMenu,
  setCodeLangMenu,
  isRoot = true,
  insertIndex,
  openInsertMenu,
  setOpenInsertMenu,
  onInsert,
  isExiting,
}: {
  block: ContentBlock;
  blocks: ContentBlock[];
  onChange: (blocks: ContentBlock[]) => void;
  removeBlock: (id: string) => void;
  duplicateBlock: (id: string) => void;
  mediaBucket: string;
  blockTypes: readonly string[];
  openHeadingMenu: string | null;
  setOpenHeadingMenu: Dispatch<SetStateAction<string | null>>;
  openCodeLangMenu: string | null;
  setCodeLangMenu: Dispatch<SetStateAction<string | null>>;
  isRoot?: boolean;
  insertIndex: number;
  openInsertMenu: number | null;
  setOpenInsertMenu: Dispatch<SetStateAction<number | null>>;
  onInsert: (type: string, index: number) => void;
  isExiting?: boolean;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: block.id });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  // Measure the content height when exit starts so we can animate
  // from a known pixel value down to 0.
  const contentRef = useRef<HTMLDivElement>(null);
  const [exitHeight, setExitHeight] = useState<number | null>(null);

  useLayoutEffect(() => {
    if (isExiting && contentRef.current && exitHeight === null) {
      setExitHeight(contentRef.current.offsetHeight);
    }
    if (!isExiting && exitHeight !== null) {
      setExitHeight(null);
    }
  }, [isExiting, exitHeight]);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={isExiting ? "overflow-hidden" : ""}
    >
      {isExiting && exitHeight !== null ? (
        /* ── Exit animation: blur-out + measured height → 0 ── */
        <motion.div
          key={`exit-${block.id}`}
          initial={{
            opacity: 1,
            filter: "blur(0px)",
            y: 0,
            scale: 1,
            height: exitHeight,
          }}
          animate={{
            opacity: 0,
            filter: "blur(16px)",
            y: -12,
            scale: 0.96,
            height: 0,
          }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className="overflow-hidden pointer-events-none"
        >
          <div ref={contentRef}>
            <BlockEditorContent
              block={block}
              blocks={blocks}
              onChange={onChange}
              removeBlock={removeBlock}
              duplicateBlock={duplicateBlock}
              mediaBucket={mediaBucket}
              blockTypes={blockTypes}
              isRoot={isRoot}
              dragHandle={
                <button
                  type="button"
                  className={buttonClasses({
                    tone: "muted",
                    iconOnly: true,
                    className: "shrink-0 cursor-grab active:cursor-grabbing",
                  })}
                  title="Drag block"
                  aria-label={`Drag ${block.type} block`}
                  {...attributes}
                  {...listeners}
                >
                  <GripVertical className="size-4" />
                </button>
              }
              openHeadingMenu={openHeadingMenu}
              setOpenHeadingMenu={setOpenHeadingMenu}
              openCodeLangMenu={openCodeLangMenu}
              setCodeLangMenu={setCodeLangMenu}
            />
          </div>
        </motion.div>
      ) : (
        /* ── Normal / entry animation ── */
        <motion.div
          key={block.id}
          initial={{
            opacity: 0,
            filter: "blur(16px)",
            y: -12,
            scale: 0.97,
          }}
          animate={{
            opacity: 1,
            filter: "blur(0px)",
            y: 0,
            scale: 1,
          }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        >
          <div ref={contentRef}>
            <BlockEditorContent
              block={block}
              blocks={blocks}
              onChange={onChange}
              removeBlock={removeBlock}
              duplicateBlock={duplicateBlock}
              mediaBucket={mediaBucket}
              blockTypes={blockTypes}
              isRoot={isRoot}
              dragHandle={
                <button
                  type="button"
                  className={buttonClasses({
                    tone: "muted",
                    iconOnly: true,
                    className: "shrink-0 cursor-grab active:cursor-grabbing",
                  })}
                  title="Drag block"
                  aria-label={`Drag ${block.type} block`}
                  {...attributes}
                  {...listeners}
                >
                  <GripVertical className="size-4" />
                </button>
              }
              openHeadingMenu={openHeadingMenu}
              setOpenHeadingMenu={setOpenHeadingMenu}
              openCodeLangMenu={openCodeLangMenu}
              setCodeLangMenu={setCodeLangMenu}
            />
            <InsertBlockMenu
              index={insertIndex}
              open={openInsertMenu === insertIndex}
              onOpen={() => setOpenInsertMenu(insertIndex)}
              onClose={() => setOpenInsertMenu(null)}
              blockTypes={blockTypes}
              onInsert={onInsert}
              isRoot={isRoot}
            />
          </div>
        </motion.div>
      )}
    </div>
  );
}

export function BlockEditor({
  blocks,
  onChange,
  blockTypes,
  mediaBucket,
  isRoot = true,
}: BlockEditorProps) {
  const [openHeadingMenu, setOpenHeadingMenu] = useState<string | null>(null);
  const [openCodeLangMenu, setCodeLangMenu] = useState<string | null>(null);
  const [openInsertMenu, setOpenInsertMenu] = useState<number | null>(null);

  // ── Exit animation state ─────────────────────────────────────────────
  // Track which block IDs are playing their exit animation.
  // The block stays in the `blocks` array during the animation so it
  // remains in the correct DOM position, then gets removed afterwards.
  const [exitingBlockIds, setExitingBlockIds] = useState<Set<string>>(
    new Set(),
  );

  const blocksRef = useRef(blocks);
  blocksRef.current = blocks;

  const removeBlockWithAnimation = (id: string) => {
    if (exitingBlockIds.has(id)) return; // prevent double-click
    // Mark the block as exiting — it stays in `blocks` for the animation
    setExitingBlockIds((prev) => new Set(prev).add(id));
    // After the animation completes, finally remove it from data
    setTimeout(() => {
      setExitingBlockIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      // Remove from blocks — the sortable items list will update too
      onChange(blocksRef.current.filter((b) => b.id !== id));
    }, 420); // slightly longer than the 350ms animation duration
  };

  // ── End exit animation state ─────────────────────────────────────────

  // Filter out columns-2 for nested editors
  const nestedBlockTypes = blockTypes.filter((type) => type !== "columns-2");

  const [activeId, setActiveId] = useState<string | null>(null);

  // Use both PointerSensor and TouchSensor for cross-platform support
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const insertBlock = (type: string, index: number) => {
    onChange([
      ...blocks.slice(0, index),
      createBlock(type as ContentBlock["type"]),
      ...blocks.slice(index),
    ]);
    setOpenInsertMenu(null);
  };

  const addBlock = (type: string) => {
    onChange([...blocks, createBlock(type as ContentBlock["type"])]);
  };

  // `removeBlock` is replaced with the animated version
  const removeBlock = removeBlockWithAnimation;

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    if (!over || active.id === over.id) return;
    const activeIndex = blocks.findIndex((block) => block.id === active.id);
    const overIndex = blocks.findIndex((block) => block.id === over.id);
    if (activeIndex === -1 || overIndex === -1) return;
    onChange(arrayMove(blocks, activeIndex, overIndex));
  };

  const duplicateBlockHandler = (id: string) => {
    onChange(duplicateBlock(blocks, id));
  };

  // ── Shared render function for both root and non-root editors ──
  const renderBlocks = (root: boolean) => (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={() => setActiveId("dragging")}
      onDragCancel={() => setActiveId(null)}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={blocks.map((b) => b.id)}
        strategy={verticalListSortingStrategy}
      >
        <div
          className="space-y-4 relative"
          style={{
            touchAction: activeId ? "none" : undefined,
          }}
        >
          {/* Insert button at the very top — stays outside sortable (OK, nothing above it to overlap with) */}
          <InsertBlockMenu
            index={0}
            open={openInsertMenu === 0}
            onOpen={() => setOpenInsertMenu(0)}
            onClose={() => setOpenInsertMenu(null)}
            blockTypes={blockTypes}
            onInsert={insertBlock}
            isRoot={root}
          />
          {blocks.map((block, index) => (
            <div key={block.id}>
              <SortableBlock
                block={block}
                blocks={blocks}
                onChange={onChange}
                removeBlock={removeBlock}
                duplicateBlock={duplicateBlockHandler}
                mediaBucket={mediaBucket}
                blockTypes={root ? blockTypes : nestedBlockTypes}
                isRoot={root}
                openHeadingMenu={openHeadingMenu}
                setOpenHeadingMenu={setOpenHeadingMenu}
                openCodeLangMenu={openCodeLangMenu}
                setCodeLangMenu={setCodeLangMenu}
                insertIndex={index + 1}
                openInsertMenu={openInsertMenu}
                setOpenInsertMenu={setOpenInsertMenu}
                onInsert={insertBlock}
                isExiting={exitingBlockIds.has(block.id)}
              />
            </div>
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );

  return <div className="space-y-4">{renderBlocks(isRoot)}</div>;
}
