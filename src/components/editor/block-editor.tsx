"use client";

import { AnimatePresence, motion } from "framer-motion";
import { createPortal } from "react-dom";

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
  Type,
  Pilcrow,
  Quote,
  Info,
  List,
  Table,
  Code2,
  ListChecks,
  Images,
  BarChart3,
  Clock,
  PanelTop,
  SeparatorHorizontal,
  Columns2,
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

import type { ContentBlock } from "@/lib/site-config";
import type { CalloutVariant } from "@/components/content/callout-block";
import { createBlock } from "@/lib/editor";
import { AutoGrowTextarea } from "@/components/admin/auto-grow-textarea";
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

/**
 * Custom hook to compute portal positioning for popovers & dropdowns
 * so they escape all parent CSS transform stacking contexts.
 */
function usePortalPosition(
  isOpen: boolean,
  targetRef: React.RefObject<HTMLElement | null>,
) {
  const [coords, setCoords] = useState<{
    top: number;
    left: number;
    width: number;
  } | null>(null);

  useEffect(() => {
    if (!isOpen || !targetRef.current) {
      setCoords(null);
      return;
    }

    const updateCoords = () => {
      if (targetRef.current) {
        const rect = targetRef.current.getBoundingClientRect();
        setCoords({
          top: rect.bottom + 6,
          left: rect.left,
          width: Math.max(rect.width, 160),
        });
      }
    };

    updateCoords();

    window.addEventListener("scroll", updateCoords, true);
    window.addEventListener("resize", updateCoords);

    return () => {
      window.removeEventListener("scroll", updateCoords, true);
      window.removeEventListener("resize", updateCoords);
    };
  }, [isOpen, targetRef]);

  return coords;
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

const blockTypePreviews: Record<
  string,
  { icon: ReactNode; label: string; description: string }
> = {
  heading: {
    icon: <Type className="size-4 text-white/70" />,
    label: "Heading",
    description: "h2, h3, h4, or h5 title",
  },
  paragraph: {
    icon: <Pilcrow className="size-4 text-white/70" />,
    label: "Paragraph",
    description: "Text content",
  },
  image: {
    icon: <Image className="size-4 text-white/70" />,
    label: "Image",
    description: "Photo or graphic",
  },
  video: {
    icon: <Video className="size-4 text-white/70" />,
    label: "Video",
    description: "Embedded video",
  },
  quote: {
    icon: <Quote className="size-4 text-white/70" />,
    label: "Quote",
    description: "Testimonial",
  },
  callout: {
    icon: <Info className="size-4 text-white/70" />,
    label: "Callout",
    description: "Highlighted note",
  },
  list: {
    icon: <List className="size-4 text-white/70" />,
    label: "List",
    description: "Bulleted or numbered",
  },
  accordion: {
    icon: <PanelTop className="size-4 text-white/70" />,
    label: "Accordion",
    description: "Expandable items",
  },
  divider: {
    icon: <SeparatorHorizontal className="size-4 text-white/50" />,
    label: "Divider",
    description: "Visual separator",
  },
  table: {
    icon: <Table className="size-4 text-white/70" />,
    label: "Table",
    description: "Data table",
  },
  code: {
    icon: <Code2 className="size-4 text-white/70" />,
    label: "Code",
    description: "Code snippet",
  },
  stepper: {
    icon: <ListChecks className="size-4 text-white/70" />,
    label: "Stepper",
    description: "Process steps",
  },
  gallery: {
    icon: <Images className="size-4 text-white/70" />,
    label: "Gallery",
    description: "Image grid",
  },
  link: {
    icon: <Link className="size-4 text-white/70" />,
    label: "Link",
    description: "External link",
  },
  metric: {
    icon: <BarChart3 className="size-4 text-white/70" />,
    label: "Metric",
    description: "Key stat",
  },
  timeline: {
    icon: <Clock className="size-4 text-white/70" />,
    label: "Timeline",
    description: "Chronological events",
  },
  "columns-2": {
    icon: <Columns2 className="size-4 text-white/70" />,
    label: "2 Columns",
    description: "Side-by-side split layout",
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
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const coords = usePortalPosition(open, buttonRef);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        open &&
        menuRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    }

    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open, onClose]);

  const availableBlockTypes = isRoot
    ? blockTypes
    : blockTypes.filter((type) => type !== "columns-2");

  return (
    <div
      className="mt-3.5 flex items-center justify-start relative"
      data-insert-menu
    >
      <div className="flex items-center">
        <button
          ref={buttonRef}
          type="button"
          onClick={open ? onClose : onOpen}
          className={cn(
            "group flex size-8 items-center justify-center rounded-full border transition-all duration-200 select-none shadow-sm",
            open
              ? "border-white/30 bg-white text-black rotate-45 shadow-md"
              : "border-white/10 bg-white/[0.03] text-white/50 hover:bg-white/[0.08] hover:text-white hover:border-white/20",
          )}
          title={
            open
              ? "Close selector"
              : `Add block ${index === 0 ? "at top" : `after #${index}`}`
          }
          aria-label={
            open
              ? "Close block selector"
              : `Insert block at position ${index + 1}`
          }
        >
          <Plus className="size-5 transition-transform group-hover:scale-110" />
        </button>

        {/* Portaled Minimal Format-Pill Menu */}
        {typeof document !== "undefined" &&
          createPortal(
            <AnimatePresence>
              {open && coords ? (
                <motion.div
                  ref={menuRef}
                  onClick={(e) => e.stopPropagation()}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                  initial={{
                    opacity: 0,
                    y: 6,
                    scale: 0.96,
                    filter: "blur(8px)",
                  }}
                  animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
                  exit={{ opacity: 0, y: 6, scale: 0.96, filter: "blur(8px)" }}
                  transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
                  className="fixed z-[9999] pointer-events-auto max-w-[min(540px,92vw)] overflow-hidden rounded-3xl border border-white/[0.12] bg-[#141414] p-3.5 backdrop-blur-[24px] shadow-[0_24px_60px_rgba(0,0,0,0.85),0_0_0_1px_rgba(255,255,255,0.06)_inset]"
                  style={{
                    top: coords.top,
                    left: Math.max(
                      12,
                      Math.min(coords.left, window.innerWidth - 480),
                    ),
                    width: Math.max(coords.width, 340),
                  }}
                >
                  <p className="px-2 pb-2 text-[10px] uppercase tracking-[0.2em] font-medium text-white/35">
                    Choose Block
                  </p>
                  <div className="grid gap-2 sm:grid-cols-2 max-h-[320px] overflow-y-auto pr-1">
                    {availableBlockTypes.map((type) => {
                      const preview = blockTypePreviews[type];
                      return (
                        <button
                          key={type}
                          type="button"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                          }}
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            onInsert(type, index);
                          }}
                          className="group/item flex items-center gap-3 rounded-full bg-white/[0.03] p-2 text-left transition-all hover:border-white/20 hover:bg-white/[0.08] hover:shadow-md"
                        >
                          <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-white/[0.08] group-hover/item:border-white/20 transition-colors">
                            <span className="scale-90 text-white/70 group-hover/item:text-white">
                              {preview?.icon}
                            </span>
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-semibold text-white/85 group-hover/item:text-white">
                              {preview?.label || type}
                            </p>
                            <p className="text-[10px] text-white/40 group-hover/item:text-white/60 truncate">
                              {preview?.description}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </motion.div>
              ) : null}
            </AnimatePresence>,
            document.body,
          )}
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

  const availableHeadingOptions = isRoot
    ? headingOptions
    : headingOptions.filter((option) => option.level !== 2);

  const nestedBlockTypes = blockTypes.filter((type) => type !== "columns-2");

  const headingLevel = Number(block.data?.level ?? 2);
  const headingLabel =
    availableHeadingOptions.find((option) => option.level === headingLevel)
      ?.label ?? "Medium";

  const [headingHighlightedIndex, setHeadingHighlightedIndex] = useState(0);
  const headingButtonRef = useRef<HTMLButtonElement>(null);
  const headingMenuRef = useRef<HTMLDivElement>(null);

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
  const codeLangMenuRef = useRef<HTMLDivElement>(null);

  const headingTypeAheadTimeoutRef = useRef<number | null>(null);
  const codeLangTypeAheadTimeoutRef = useRef<number | null>(null);

  const headingCoords = usePortalPosition(
    openHeadingMenu === block.id,
    headingButtonRef,
  );

  const codeLangCoords = usePortalPosition(
    openCodeLangMenu === block.id,
    codeLangButtonRef,
  );

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
          updateBlockHandler(block.id, (current) => ({
            ...current,
            data: { ...current.data, level: option.level },
          }));
          setOpenHeadingMenu(null);
          headingButtonRef.current?.focus();
        }
      } else if (
        event.key.length === 1 &&
        !event.altKey &&
        !event.ctrlKey &&
        !event.metaKey
      ) {
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
      requestAnimationFrame(() => {
        headingMenuRef.current?.focus();
      });
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
          updateBlockHandler(block.id, (current) => ({
            ...current,
            data: { ...current.data, language: opt.value },
          }));
          setCodeLangMenu(null);
          codeLangButtonRef.current?.focus();
        }
      } else if (
        event.key.length === 1 &&
        !event.altKey &&
        !event.ctrlKey &&
        !event.metaKey
      ) {
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
      requestAnimationFrame(() => {
        codeLangMenuRef.current?.focus();
      });
      return () =>
        document.removeEventListener("keydown", handleCodeLangKeyDown);
    }
  }, [
    openCodeLangMenu,
    block.id,
    codeLangHighlightedIndex,
    codeLanguageOptions.length,
  ]);

  const listStyle = String(block.data?.style ?? "unordered");
  const isUnordered = listStyle === "unordered" || listStyle === "bullet";
  const isOrdered = listStyle === "ordered" || listStyle === "numbered";

  return (
    <div className="group relative rounded-[2rem] border border-white/[0.08] bg-[#151515]/80 backdrop-blur-[16px] shadow-[0_8px_28px_rgba(0,0,0,0.35)] transition-all duration-300 hover:border-white/[0.14]">
      {/* Header Bar */}
      <div className="relative flex items-center justify-between gap-3 border-b border-white/[0.06] bg-white/[0.02] px-5 py-3 rounded-t-[2rem]">
        <div className="flex min-w-0 items-center gap-3">
          {dragHandle}
          {/* Unified icon + block name + | + block desc cell */}
          <div className="flex items-center gap-2.5 rounded-full bg-white/[0.04] px-3.5 py-1.5 border border-white/[0.06] transition-colors">
            <span className="text-white/70">
              {blockTypePreviews[block.type]?.icon || (
                <div className="size-2 rounded-full bg-white/30" />
              )}
            </span>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/85">
                {block.type}
              </span>
              {blockTypePreviews[block.type]?.description ? (
                <span className="hidden sm:inline-block text-[10px] text-white/40 normal-case font-normal border-l border-white/10 pl-2">
                  {blockTypePreviews[block.type]?.description}
                </span>
              ) : null}
            </div>
          </div>
        </div>

        {/* Format-Pill Action Track */}
        <div className="flex items-center gap-0.5 rounded-full bg-white/[0.04] p-1 border border-white/[0.06]">
          <button
            type="button"
            onClick={() => duplicateBlock(block.id)}
            className="inline-flex size-7 items-center justify-center rounded-full text-white/60 hover:bg-white/[0.08] hover:text-white transition-colors"
            title="Duplicate block"
          >
            <Copy className="size-3.5" />
          </button>
          <div className="mx-0.5 h-3.5 w-px bg-white/10" />
          <button
            type="button"
            onClick={() => removeBlock(block.id)}
            className="inline-flex size-7 items-center justify-center rounded-full text-white/50 hover:bg-rose-500/20 hover:text-rose-200 transition-colors"
            title="Delete block"
          >
            <Trash2 className="size-3.5" />
          </button>
        </div>
      </div>

      {/* Main Content Body */}
      <div className="relative p-6 space-y-4 rounded-b-[2rem]">
        {block.type === "heading" ? (
          <div className="grid gap-4 sm:grid-cols-[160px_minmax(0,1fr)] items-center">
            <div className="relative">
              <button
                ref={headingButtonRef}
                type="button"
                onClick={() => {
                  setOpenHeadingMenu((current) =>
                    current === block.id ? null : block.id,
                  );
                  setHeadingHighlightedIndex(
                    availableHeadingOptions.findIndex(
                      (opt) => opt.level === headingLevel,
                    ) || 0,
                  );
                }}
                className="h-11 flex w-full items-center justify-between gap-2 rounded-full bg-white/[0.06] hover:bg-white/[0.1] px-4 text-xs font-semibold text-white transition-all select-none"
              >
                <span>{headingLabel}</span>
                <ChevronsUpDown className="size-3.5 text-white/50" />
              </button>

              {/* Portaled Heading Menu */}
              {typeof document !== "undefined" &&
                createPortal(
                  <AnimatePresence>
                    {openHeadingMenu === block.id && headingCoords ? (
                      <motion.div
                        ref={headingMenuRef}
                        onClick={(e) => e.stopPropagation()}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                        }}
                        initial={{
                          opacity: 0,
                          y: 6,
                          scale: 0.96,
                          filter: "blur(8px)",
                        }}
                        animate={{
                          opacity: 1,
                          y: 0,
                          scale: 1,
                          filter: "blur(0px)",
                        }}
                        exit={{
                          opacity: 0,
                          y: 6,
                          scale: 0.96,
                          filter: "blur(8px)",
                        }}
                        transition={{
                          duration: 0.18,
                          ease: [0.22, 1, 0.36, 1],
                        }}
                        className="fixed z-[9999] pointer-events-auto min-w-[160px] overflow-hidden rounded-2xl border border-white/[0.12] bg-[#181818] p-1.5 backdrop-blur-[20px] shadow-[0_20px_50px_rgba(0,0,0,0.8),0_0_0_1px_rgba(255,255,255,0.06)_inset]"
                        style={{
                          top: headingCoords.top,
                          left: headingCoords.left,
                          width: headingCoords.width,
                        }}
                        role="listbox"
                        tabIndex={-1}
                      >
                        {availableHeadingOptions.map((option, index) => (
                          <button
                            key={option.level}
                            type="button"
                            role="option"
                            aria-selected={headingHighlightedIndex === index}
                            tabIndex={-1}
                            onMouseEnter={() =>
                              setHeadingHighlightedIndex(index)
                            }
                            onMouseDown={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                            }}
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              updateBlockHandler(block.id, (current) => ({
                                ...current,
                                data: { ...current.data, level: option.level },
                              }));
                              setOpenHeadingMenu(null);
                            }}
                            className={cn(
                              "flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-xs font-medium transition-colors select-none",
                              headingHighlightedIndex === index
                                ? "bg-white/10 text-white"
                                : "text-white/70 hover:bg-white/[0.04] hover:text-white",
                            )}
                          >
                            <span>{option.label}</span>
                            <span className="text-[10px] font-mono text-white/30">
                              H{option.level}
                            </span>
                          </button>
                        ))}
                      </motion.div>
                    ) : null}
                  </AnimatePresence>,
                  document.body,
                )}
            </div>
            <AutoGrowTextarea
              value={String(block.data?.text ?? "")}
              onChange={(value) =>
                updateBlockHandler(block.id, (current) => ({
                  ...current,
                  data: { ...current.data, text: value },
                }))
              }
              placeholder="Heading text..."
              className="min-h-[2.75rem] h-11 flex items-center w-full resize-none overflow-hidden rounded-2xl bg-white/[0.03] hover:bg-white/[0.05] focus:bg-white/[0.06] px-4 py-2.5 text-sm font-medium text-white placeholder:text-white/25 outline-none transition-all"
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
            placeholder="Paragraph text..."
            className="min-h-[2.75rem] w-full resize-none overflow-hidden rounded-2xl bg-white/[0.03] hover:bg-white/[0.05] focus:bg-white/[0.06] px-4 py-2.5 text-sm leading-7 text-white placeholder:text-white/25 outline-none transition-all"
            enableFormatToolbar
          />
        ) : null}

        {block.type === "image" ? (
          <div className="grid gap-3">
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
              className="h-11 w-full rounded-2xl bg-white/[0.03] hover:bg-white/[0.05] focus:bg-white/[0.06] px-4 py-2.5 text-sm text-white placeholder:text-white/25 outline-none transition-all"
            />
            <AutoGrowTextarea
              value={String(block.data?.caption ?? "")}
              onChange={(value) =>
                updateBlockHandler(block.id, (current) => ({
                  ...current,
                  data: { ...current.data, caption: value },
                }))
              }
              placeholder="Caption (optional)"
              className="min-h-[2.75rem] w-full resize-none overflow-hidden rounded-2xl bg-white/[0.03] hover:bg-white/[0.05] focus:bg-white/[0.06] px-4 py-2.5 text-sm text-white placeholder:text-white/25 outline-none transition-all"
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
              placeholder="Caption (optional)"
              className="min-h-[2.75rem] w-full resize-none overflow-hidden rounded-2xl bg-white/[0.03] hover:bg-white/[0.05] focus:bg-white/[0.06] px-4 py-2.5 text-sm text-white placeholder:text-white/25 outline-none transition-all"
            />
          </div>
        ) : null}

        {block.type === "list" ? (
          <div className="space-y-3">
            {/* Animated Motion List Toggle */}
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-wider font-medium text-white/40">
                List Style
              </span>
              <div className="relative flex items-center rounded-full bg-white/[0.04] p-1 border border-white/[0.06] shadow-inner">
                <button
                  type="button"
                  onClick={() =>
                    updateBlockHandler(block.id, (current) => ({
                      ...current,
                      data: { ...current.data, style: "unordered" },
                    }))
                  }
                  className={cn(
                    "relative z-10 inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-semibold transition-colors select-none",
                    isUnordered
                      ? "text-black"
                      : "text-white/60 hover:text-white",
                  )}
                >
                  {isUnordered && (
                    <motion.span
                      layoutId={`list-style-pill-${block.id}`}
                      className="absolute inset-0 rounded-full bg-white shadow-md z-[-1]"
                      transition={{
                        type: "spring",
                        stiffness: 450,
                        damping: 30,
                      }}
                    />
                  )}
                  <span>• Bullet</span>
                </button>
                <button
                  type="button"
                  onClick={() =>
                    updateBlockHandler(block.id, (current) => ({
                      ...current,
                      data: { ...current.data, style: "ordered" },
                    }))
                  }
                  className={cn(
                    "relative z-10 inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-semibold transition-colors select-none",
                    isOrdered ? "text-black" : "text-white/60 hover:text-white",
                  )}
                >
                  {isOrdered && (
                    <motion.span
                      layoutId={`list-style-pill-${block.id}`}
                      className="absolute inset-0 rounded-full bg-white shadow-md z-[-1]"
                      transition={{
                        type: "spring",
                        stiffness: 450,
                        damping: 30,
                      }}
                    />
                  )}
                  <span>1. Numbered</span>
                </button>
              </div>
            </div>

            {/* List items with exact sentence-1 vertical baseline alignment */}
            {ensureStringArray(block.data?.items).map((item, itemIndex) => (
              <div
                key={`${block.id}-item-${itemIndex}`}
                className="group/item flex items-start gap-3 rounded-2xl bg-white/[0.025] hover:bg-white/[0.04] px-3.5 py-2.5 transition-all"
              >
                <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-white/[0.08] text-[10px] font-mono font-bold text-white/60">
                  {isOrdered ? String(itemIndex + 1) : "•"}
                </span>
                <div className="flex-1 min-w-0">
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
                    className="min-h-[1.5rem] w-full resize-none overflow-hidden bg-transparent py-0 text-sm leading-6 text-white placeholder:text-white/20 outline-none"
                    enableFormatToolbar
                  />
                </div>
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
                  className="inline-flex size-6 shrink-0 items-center justify-center rounded-full text-white/30 hover:bg-rose-500/20 hover:text-rose-200 transition-colors"
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
              className="h-9 inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] hover:border-white/20 px-4 text-xs font-semibold text-white/80 hover:text-white transition-all shadow-sm"
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
              placeholder="Quote text..."
              className="min-h-[2.75rem] w-full resize-none overflow-hidden rounded-2xl bg-white/[0.03] hover:bg-white/[0.05] focus:bg-white/[0.06] px-4 py-2.5 text-sm text-white placeholder:text-white/25 outline-none transition-all"
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
              className="h-11 w-full rounded-2xl bg-white/[0.03] hover:bg-white/[0.05] focus:bg-white/[0.06] px-4 text-sm text-white placeholder:text-white/25 outline-none transition-all"
            />
          </div>
        ) : null}

        {block.type === "callout" ? (
          <div className="grid gap-3">
            <div className="flex items-center gap-1 rounded-full bg-white/[0.04] p-1 border border-white/[0.06] w-fit shadow-inner">
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
                  className={cn(
                    "rounded-full px-3.5 py-1 text-xs font-semibold capitalize transition-all select-none",
                    (block.data?.variant as CalloutVariant) === variant
                      ? "bg-white text-black shadow-md"
                      : "text-white/60 hover:text-white",
                  )}
                >
                  {variant}
                </button>
              ))}
            </div>
            <input
              placeholder="Callout title (optional)"
              value={String(block.data?.title ?? "")}
              onChange={(event) =>
                updateBlockHandler(block.id, (current) => ({
                  ...current,
                  data: { ...current.data, title: event.target.value },
                }))
              }
              className="h-11 w-full rounded-2xl bg-white/[0.03] hover:bg-white/[0.05] focus:bg-white/[0.06] px-4 text-sm text-white placeholder:text-white/25 outline-none transition-all"
            />
            <AutoGrowTextarea
              value={String(block.data?.text ?? "")}
              onChange={(value) =>
                updateBlockHandler(block.id, (current) => ({
                  ...current,
                  data: { ...current.data, text: value },
                }))
              }
              placeholder="Callout text..."
              className="min-h-[2.75rem] w-full resize-none overflow-hidden rounded-2xl bg-white/[0.03] hover:bg-white/[0.05] focus:bg-white/[0.06] px-4 py-2.5 text-sm text-white placeholder:text-white/25 outline-none transition-all"
              enableFormatToolbar
            />
          </div>
        ) : null}

        {block.type === "table" ? (
          <div className="space-y-3">
            <div className="overflow-x-auto rounded-2xl bg-white/[0.02] p-1">
              <table className="min-w-full border-collapse text-sm text-white/80">
                <thead>
                  <tr>
                    {ensureStringArray(block.data?.headers).map(
                      (header, headerIndex) => (
                        <th
                          key={`${block.id}-header-${headerIndex}`}
                          className="p-2 align-top border-b border-white/10"
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
                              className="min-h-[1.5rem] py-0.5 w-full resize-none overflow-hidden bg-transparent text-xs font-semibold uppercase tracking-wider text-white outline-none"
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
                                      row.filter(
                                        (_, idx) => idx !== headerIndex,
                                      ),
                                    )
                                  : [];
                                updateBlockHandler(block.id, (current) => ({
                                  ...current,
                                  data: { ...current.data, headers, rows },
                                }));
                              }}
                              className="inline-flex size-6 shrink-0 items-center justify-center rounded-full text-white/30 hover:bg-rose-500/20 hover:text-rose-200 transition-colors"
                            >
                              <Trash2 className="size-3" />
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
                          className="p-2 align-top border-t border-white/[0.06]"
                        >
                          <AutoGrowTextarea
                            value={cell}
                            onChange={(value) => {
                              const rows = Array.isArray(block.data?.rows)
                                ? (block.data.rows as string[][]).map(
                                    (item) => [...item],
                                  )
                                : [];
                              rows[rowIndex][cellIndex] = value;
                              updateBlockHandler(block.id, (current) => ({
                                ...current,
                                data: { ...current.data, rows },
                              }));
                            }}
                            placeholder={`Row ${rowIndex + 1}, Col ${cellIndex + 1}`}
                            className="min-h-[1.5rem] py-0.5 w-full resize-none overflow-hidden bg-transparent text-sm text-white outline-none"
                            enableFormatToolbar
                          />
                        </td>
                      ))}
                      <td className="p-2 text-right border-t border-white/[0.06]">
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
                          className="inline-flex size-6 items-center justify-center rounded-full text-white/30 hover:bg-rose-500/20 hover:text-rose-200 transition-colors"
                        >
                          <Trash2 className="size-3" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex items-center gap-2">
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
                className="h-9 inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] hover:border-white/20 px-4 text-xs font-semibold text-white/80 hover:text-white transition-all shadow-sm"
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
                className="h-9 inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] hover:border-white/20 px-4 text-xs font-semibold text-white/80 hover:text-white transition-all shadow-sm"
              >
                <PlusCircle className="size-3.5" />
                Add row
              </button>
            </div>
          </div>
        ) : null}

        {block.type === "accordion" ? (
          <div className="space-y-3">
            {Array.isArray(block.data?.items) &&
              (
                block.data.items as Array<{ title: string; content: string }>
              ).map((item, itemIndex) => (
                <div
                  key={`${block.id}-accordion-${itemIndex}`}
                  className="rounded-2xl bg-white/[0.02] hover:bg-white/[0.03] p-4 space-y-3 transition-colors"
                >
                  <div className="flex items-center gap-2">
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
                      placeholder={`Accordion Item ${itemIndex + 1} Title`}
                      className="w-full bg-transparent text-sm font-medium text-white outline-none placeholder:text-white/25"
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
                      className="inline-flex size-7 shrink-0 items-center justify-center rounded-full text-white/30 hover:bg-rose-500/20 hover:text-rose-200 transition-colors"
                    >
                      <Trash2 className="size-3.5" />
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
                    placeholder="Accordion content..."
                    className="min-h-[1.5rem] py-0.5 w-full resize-none overflow-hidden bg-transparent text-sm leading-6 text-white/70 outline-none placeholder:text-white/20"
                    enableFormatToolbar
                  />
                </div>
              ))}
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
              className="h-9 inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] hover:border-white/20 px-4 text-xs font-semibold text-white/80 hover:text-white transition-all shadow-sm"
            >
              <PlusCircle className="size-3.5" />
              Add item
            </button>
          </div>
        ) : null}

        {block.type === "divider" ? (
          <div className="flex items-center justify-center py-2 text-white/20">
            <span className="text-[11px] uppercase tracking-widest font-mono">
              — Divider —
            </span>
          </div>
        ) : null}

        {block.type === "code" ? (
          <div className="grid gap-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
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
                    className="h-11 flex w-full items-center justify-between gap-2 rounded-full bg-white/[0.06] hover:bg-white/[0.1] px-4 text-xs font-semibold text-white transition-all select-none"
                  >
                    <span className="truncate">
                      {getLanguageLabel(codeLanguage)}
                    </span>
                    <ChevronsUpDown className="size-3.5 shrink-0 text-white/50" />
                  </button>

                  {/* Portaled Code Language Menu */}
                  {typeof document !== "undefined" &&
                    createPortal(
                      <AnimatePresence>
                        {openCodeLangMenu === block.id && codeLangCoords ? (
                          <motion.div
                            ref={codeLangMenuRef}
                            onClick={(e) => e.stopPropagation()}
                            onMouseDown={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                            }}
                            initial={{
                              opacity: 0,
                              y: 6,
                              scale: 0.96,
                              filter: "blur(8px)",
                            }}
                            animate={{
                              opacity: 1,
                              y: 0,
                              scale: 1,
                              filter: "blur(0px)",
                            }}
                            exit={{
                              opacity: 0,
                              y: 6,
                              scale: 0.96,
                              filter: "blur(8px)",
                            }}
                            transition={{
                              duration: 0.18,
                              ease: [0.22, 1, 0.36, 1],
                            }}
                            className="fixed z-[9999] pointer-events-auto max-h-[18rem] overflow-y-auto rounded-2xl border border-white/[0.12] bg-[#181818] p-1.5 backdrop-blur-[20px] shadow-[0_20px_50px_rgba(0,0,0,0.8)]"
                            style={{
                              top: codeLangCoords.top,
                              left: codeLangCoords.left,
                              width: Math.max(codeLangCoords.width, 180),
                            }}
                            role="listbox"
                            tabIndex={-1}
                          >
                            {codeLanguageOptions.map((opt, index) => (
                              <button
                                key={opt.value}
                                type="button"
                                role="option"
                                aria-selected={
                                  codeLangHighlightedIndex === index
                                }
                                tabIndex={-1}
                                onMouseEnter={() =>
                                  setCodeLangHighlightedIndex(index)
                                }
                                onMouseDown={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                }}
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  updateBlockHandler(block.id, (current) => ({
                                    ...current,
                                    data: {
                                      ...current.data,
                                      language: opt.value,
                                    },
                                  }));
                                  setCodeLangMenu(null);
                                }}
                                className={cn(
                                  "flex w-full min-w-0 rounded-xl px-3 py-2 text-left text-xs font-medium transition-colors select-none",
                                  codeLangHighlightedIndex === index
                                    ? "bg-white/10 text-white"
                                    : "text-white/70 hover:bg-white/[0.04] hover:text-white",
                                )}
                              >
                                <span className="truncate">{opt.label}</span>
                              </button>
                            ))}
                          </motion.div>
                        ) : null}
                      </AnimatePresence>,
                      document.body,
                    )}
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
                  className={cn(
                    "h-11 inline-flex items-center justify-center gap-1.5 rounded-full px-4 text-xs font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-40 select-none",
                    showPreview
                      ? "bg-white/15 text-white"
                      : "bg-white/[0.04] text-white/60 hover:bg-white/[0.08] hover:text-white",
                  )}
                >
                  {showPreview ? (
                    <EyeOff className="size-3.5" />
                  ) : (
                    <Eye className="size-3.5" />
                  )}
                  <span>
                    {showPreview ? "Preview active" : "Enable preview"}
                  </span>
                </button>
              </div>
              {showCodePreview ? (
                <button
                  type="button"
                  onClick={() => setShowAdminCodePanel((current) => !current)}
                  className="h-11 hidden md:inline-flex items-center justify-center gap-1.5 rounded-full bg-white/[0.04] px-4 text-xs font-semibold text-white/60 hover:bg-white/[0.08] hover:text-white transition-colors select-none"
                >
                  {showAdminCodePanel ? (
                    <EyeOff className="size-3.5" />
                  ) : (
                    <Eye className="size-3.5" />
                  )}
                  <span>
                    {showAdminCodePanel ? "Hide editor" : "Show editor"}
                  </span>
                </button>
              ) : null}
            </div>
            {showPreview && !canPreviewCode ? (
              <p className="rounded-2xl bg-amber-400/[0.08] px-4 py-2.5 text-xs text-amber-200/80">
                Live preview is supported for HTML, CSS, and JavaScript.
              </p>
            ) : null}
            {showCodePreview ? (
              <div
                className={
                  showAdminCodePanel
                    ? "grid overflow-hidden rounded-2xl bg-black/40 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]"
                    : "grid overflow-hidden rounded-2xl bg-black/40"
                }
              >
                {showAdminCodePanel ? (
                  <div className="min-w-0 bg-[#0c0c0c] md:border-r md:border-white/10">
                    <div className="px-4 py-2.5 text-[10px] uppercase font-mono tracking-wider text-white/40 border-b border-white/10">
                      Code Editor
                    </div>
                    <textarea
                      value={codeValue}
                      onChange={(event) =>
                        updateBlockHandler(block.id, (current) => ({
                          ...current,
                          data: { ...current.data, code: event.target.value },
                        }))
                      }
                      className="h-[28rem] max-h-[70vh] min-h-[16rem] w-full resize-none overflow-auto bg-transparent px-4 py-3 font-mono text-xs leading-6 text-white outline-none"
                      placeholder="// Code snippet..."
                      spellCheck={false}
                    />
                  </div>
                ) : null}
                <div className="min-w-0 bg-white">
                  <div className="px-4 py-2.5 text-[10px] uppercase font-mono tracking-wider text-zinc-600 bg-zinc-100 border-b border-zinc-200">
                    Live Output
                  </div>
                  <iframe
                    title="Code preview"
                    srcDoc={codePreviewDocument ?? ""}
                    sandbox="allow-scripts allow-modals allow-forms"
                    className="h-[28rem] max-h-[70vh] w-full border-0 bg-white"
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
                className="h-[18rem] max-h-[70vh] min-h-[10rem] w-full resize-y overflow-auto rounded-2xl bg-white/[0.03] hover:bg-white/[0.05] focus:bg-white/[0.06] px-4 py-3 font-mono text-xs leading-6 text-white placeholder:text-white/25 outline-none transition-all"
                placeholder="// Code snippet..."
                spellCheck={false}
              />
            )}
          </div>
        ) : null}

        {block.type === "stepper" ? (
          <div className="space-y-3">
            {Array.isArray(block.data?.steps) &&
              (
                block.data.steps as Array<{
                  title?: string;
                  description?: string;
                }>
              ).map((step, stepIndex) => (
                <div
                  key={`${block.id}-step-${stepIndex}`}
                  className="rounded-2xl bg-white/[0.02] hover:bg-white/[0.03] p-4 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-white/[0.08] text-[10px] font-mono font-bold text-white mt-1">
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
                        className="w-full bg-transparent text-sm font-medium text-white outline-none placeholder:text-white/25"
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
                        placeholder="Step description..."
                        className="min-h-[1.5rem] py-0.5 w-full resize-none overflow-hidden bg-transparent text-sm text-white/70 outline-none placeholder:text-white/20"
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
                      className="inline-flex size-7 shrink-0 items-center justify-center rounded-full text-white/30 hover:bg-rose-500/20 hover:text-rose-200 transition-colors"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                </div>
              ))}
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
              className="h-9 inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] hover:border-white/20 px-4 text-xs font-semibold text-white/80 hover:text-white transition-all shadow-sm"
            >
              <PlusCircle className="size-3.5" />
              Add step
            </button>
          </div>
        ) : null}

        {block.type === "gallery" ? (
          <div className="space-y-3">
            {Array.isArray(block.data?.images) &&
              (
                block.data.images as Array<{
                  url?: string;
                  alt?: string;
                  caption?: string;
                }>
              ).map((img, imgIndex) => (
                <div
                  key={`${block.id}-img-${imgIndex}`}
                  className="rounded-2xl bg-white/[0.02] hover:bg-white/[0.03] p-4 space-y-3 transition-colors"
                >
                  <MediaAssetField
                    label={`Gallery Image #${imgIndex + 1}`}
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
                    className="h-11 w-full rounded-2xl bg-white/[0.03] hover:bg-white/[0.05] focus:bg-white/[0.06] px-4 text-sm text-white placeholder:text-white/25 outline-none transition-all"
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
                    className="min-h-[2.75rem] w-full resize-none overflow-hidden rounded-2xl bg-white/[0.03] hover:bg-white/[0.05] focus:bg-white/[0.06] px-4 py-2.5 text-sm text-white placeholder:text-white/25 outline-none transition-all"
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
                    className="inline-flex items-center gap-1.5 rounded-full bg-rose-500/10 hover:bg-rose-500/20 px-3 py-1 text-xs font-medium text-rose-300 transition-colors"
                  >
                    <Trash2 className="size-3.5" />
                    Remove image
                  </button>
                </div>
              ))}
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
              className="h-9 inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] hover:border-white/20 px-4 text-xs font-semibold text-white/80 hover:text-white transition-all shadow-sm"
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
              placeholder="Target URL (https://...)"
              className="h-11 w-full rounded-2xl bg-white/[0.03] hover:bg-white/[0.05] focus:bg-white/[0.06] px-4 text-sm text-white placeholder:text-white/25 outline-none transition-all"
            />
            <input
              value={String(block.data?.title ?? "")}
              onChange={(event) =>
                updateBlockHandler(block.id, (current) => ({
                  ...current,
                  data: { ...current.data, title: event.target.value },
                }))
              }
              placeholder="Card Title"
              className="h-11 w-full rounded-2xl bg-white/[0.03] hover:bg-white/[0.05] focus:bg-white/[0.06] px-4 text-sm font-medium text-white placeholder:text-white/25 outline-none transition-all"
            />
            <AutoGrowTextarea
              value={String(block.data?.description ?? "")}
              onChange={(value) =>
                updateBlockHandler(block.id, (current) => ({
                  ...current,
                  data: { ...current.data, description: value },
                }))
              }
              placeholder="Description..."
              className="w-full resize-none overflow-hidden rounded-2xl bg-white/[0.03] hover:bg-white/[0.05] focus:bg-white/[0.06] px-4 py-2.5 text-sm text-white placeholder:text-white/25 outline-none transition-all"
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
              placeholder="Label (e.g., Performance Score)"
              className="h-11 w-full rounded-2xl bg-white/[0.03] hover:bg-white/[0.05] focus:bg-white/[0.06] px-4 text-sm text-white placeholder:text-white/25 outline-none transition-all"
            />
            <input
              value={String(block.data?.value ?? "")}
              onChange={(event) =>
                updateBlockHandler(block.id, (current) => ({
                  ...current,
                  data: { ...current.data, value: event.target.value },
                }))
              }
              placeholder="Value (e.g., 99.8%)"
              className="h-11 w-full rounded-2xl bg-white/[0.03] hover:bg-white/[0.05] focus:bg-white/[0.06] px-4 text-sm font-semibold text-white placeholder:text-white/25 outline-none transition-all"
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
              className="w-full resize-none overflow-hidden rounded-2xl bg-white/[0.03] hover:bg-white/[0.05] focus:bg-white/[0.06] px-4 py-2.5 text-sm text-white placeholder:text-white/25 outline-none transition-all"
            />
          </div>
        ) : null}

        {block.type === "timeline" ? (
          <div className="space-y-3">
            {Array.isArray(block.data?.items) &&
              (
                block.data.items as Array<{
                  date?: string;
                  title?: string;
                  description?: string;
                }>
              ).map((item, itemIndex) => (
                <div
                  key={`${block.id}-tl-${itemIndex}`}
                  className="rounded-2xl bg-white/[0.02] hover:bg-white/[0.03] p-4 space-y-3 transition-colors"
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
                      placeholder="Date or Period (e.g., Q1 2024)"
                      className="h-10 w-full rounded-2xl bg-white/[0.03] hover:bg-white/[0.05] focus:bg-white/[0.06] px-4 text-xs text-white placeholder:text-white/25 outline-none transition-all"
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
                      placeholder="Milestone Title"
                      className="h-11 w-full rounded-2xl bg-white/[0.03] hover:bg-white/[0.05] focus:bg-white/[0.06] px-4 text-sm font-medium text-white placeholder:text-white/25 outline-none transition-all"
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
                      placeholder="Milestone description..."
                      className="w-full resize-none overflow-hidden bg-transparent text-sm text-white/70 outline-none placeholder:text-white/20"
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
                    className="inline-flex items-center gap-1.5 rounded-full bg-rose-500/10 hover:bg-rose-500/20 px-3 py-1 text-xs font-medium text-rose-300 transition-colors"
                  >
                    <Trash2 className="size-3.5" />
                    Remove
                  </button>
                </div>
              ))}
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
              className="h-9 inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] hover:border-white/20 px-4 text-xs font-semibold text-white/80 hover:text-white transition-all shadow-sm"
            >
              <PlusCircle className="size-3.5" />
              Add timeline item
            </button>
          </div>
        ) : null}

        {block.type === "columns-2" ? (
          <div className="grid gap-4 lg:grid-cols-2" data-columns-container>
            <div className="min-w-0 rounded-2xl bg-black/20 p-4 border border-white/[0.04]">
              <p className="mb-3 text-[10px] uppercase font-mono tracking-widest text-white/35">
                Left Column
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
            <div className="min-w-0 rounded-2xl bg-black/20 p-4 border border-white/[0.04]">
              <p className="mb-3 text-[10px] uppercase font-mono tracking-widest text-white/35">
                Right Column
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
    </div>
  );
}

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
      className={cn(
        "transition-all relative",
        isExiting ? "overflow-hidden" : "",
      )}
    >
      {isExiting && exitHeight !== null ? (
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
                  className="shrink-0 cursor-grab active:cursor-grabbing text-white/40 hover:text-white transition-colors p-2 rounded-full"
                  title="Drag to reorder"
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
                  className="shrink-0 cursor-grab active:cursor-grabbing text-white/40 hover:text-white transition-colors p-2 rounded-full"
                  title="Drag to reorder"
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

  const [exitingBlockIds, setExitingBlockIds] = useState<Set<string>>(
    new Set(),
  );

  const blocksRef = useRef(blocks);
  blocksRef.current = blocks;

  const removeBlockWithAnimation = (id: string) => {
    if (exitingBlockIds.has(id)) return;

    setExitingBlockIds((prev) => new Set(prev).add(id));

    setTimeout(() => {
      setExitingBlockIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      onChange(blocksRef.current.filter((b) => b.id !== id));
    }, 420);
  };

  const nestedBlockTypes = blockTypes.filter((type) => type !== "columns-2");

  const [activeId, setActiveId] = useState<string | null>(null);

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
