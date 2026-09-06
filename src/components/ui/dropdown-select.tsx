"use client";

import { AnimatePresence, motion } from "framer-motion";
import { createPortal } from "react-dom";
import { Check, ChevronsUpDown, Loader2, Search } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";

type Option = {
  label: string;
  value: string;
};

type DropdownSelectProps = {
  value: string;
  options: Option[];
  onChange: (value: string) => void;
  className?: string;
  placeholder?: string;
  searchable?: boolean;
  searchPlaceholder?: string;
  menuClassName?: string;
  onPreview?: (value: string) => void | Promise<void>;
  previewingValue?: string | null;
  previewLoadingValue?: string | null;
  previewDisabled?: boolean;
  onOpenChange?: (open: boolean) => void;
};

function PreviewWaveform({ active }: { active: boolean }) {
  const bars = [
    { idle: 5, frames: [5, 9, 6, 10, 5] },
    { idle: 9, frames: [9, 13, 8, 11, 9] },
    { idle: 12, frames: [12, 7, 14, 8, 12] },
    { idle: 8, frames: [8, 12, 7, 13, 8] },
    { idle: 5, frames: [5, 10, 6, 9, 5] },
  ] as const;

  return (
    <span
      className="relative flex h-4 w-5 items-center justify-center"
      aria-hidden="true"
    >
      <span className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 rounded-full bg-white/12" />
      <span className="relative flex h-[14px] w-full items-center justify-center gap-[2px]">
        {bars.map((bar, index) => (
          <motion.span
            key={index}
            className="block w-[2px] rounded-full bg-current"
            style={{ height: `${bar.idle}px` }}
            initial={false}
            animate={
              active
                ? {
                    height: bar.frames.map((frame) => `${frame}px`),
                    opacity: [0.58, 1, 0.82, 1, 0.58],
                    scaleY: [0.98, 1.02, 0.96, 1.02, 0.98],
                  }
                : {
                    height: `${bar.idle}px`,
                    opacity: 0.74,
                    scaleY: 1,
                  }
            }
            transition={
              active
                ? {
                    duration: 1.05,
                    repeat: Infinity,
                    ease: [0.4, 0, 0.2, 1],
                    delay: index * 0.06,
                  }
                : { duration: 0.18, ease: [0.22, 1, 0.36, 1] }
            }
          />
        ))}
      </span>
    </span>
  );
}

function splitOptionLabel(label: string) {
  if (label.includes(" — ")) {
    const [title, ...rest] = label.split(" — ");
    return {
      prefix: null,
      title: title.trim(),
      meta: rest.join(" — ").trim(),
    };
  }

  if (label.includes("·")) {
    const [prefix, ...rest] = label.split("·");
    return {
      prefix: prefix.trim(),
      title: rest.join("·").trim(),
      meta: null,
    };
  }

  return {
    prefix: null,
    title: label,
    meta: null,
  };
}

export function DropdownSelect({
  value,
  options,
  onChange,
  className,
  placeholder,
  searchable,
  searchPlaceholder = "Search voices…",
  menuClassName,
  onPreview,
  previewingValue,
  previewLoadingValue,
  previewDisabled = false,
  onOpenChange,
}: DropdownSelectProps) {
  const [open, setOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const [query, setQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const typeAheadTimeoutRef = useRef<number | null>(null);
  const openStateInitializedRef = useRef(false);
  const [menuPlacement, setMenuPlacement] = useState<{
    left: number;
    top: number | null;
    bottom: number | null;
    width: number | null;
    maxHeight: number | null;
    vertical: "down" | "up";
  }>({
    left: 0,
    top: null,
    bottom: null,
    width: null,
    maxHeight: null,
    vertical: "down",
  });

  const current =
    options.find((option) => option.value === value) ?? options[0];
  const enableSearch = searchable ?? options.length > 10;
  const wideMenu = options.length > 8;

  const filteredOptions = useMemo(() => {
    if (!query.trim()) return options;
    const normalized = query.trim().toLowerCase();
    return options.filter((option) => {
      const text = `${option.label} ${option.value}`.toLowerCase();
      return text.includes(normalized);
    });
  }, [options, query]);

  const selectedIndexInFiltered = filteredOptions.findIndex(
    (option) => option.value === value,
  );

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      if (
        containerRef.current?.contains(target) ||
        menuRef.current?.contains(target)
      ) {
        return;
      }
      setOpen(false);
      setQuery("");
    }

    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
      if (enableSearch) {
        window.setTimeout(() => searchInputRef.current?.focus(), 10);
      }
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [enableSearch, open]);

  useEffect(() => {
    if (!openStateInitializedRef.current) {
      openStateInitializedRef.current = true;
      return;
    }
    onOpenChange?.(open);
  }, [onOpenChange, open]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      const activeList = filteredOptions;
      const activeOption = activeList[highlightedIndex];
      const searchFocused = document.activeElement === searchInputRef.current;
      const previewFocused =
        event.target instanceof HTMLElement &&
        event.target.closest("[data-dropdown-preview='true']") !== null;

      if (!open) {
        if (
          event.key === "Enter" ||
          event.key === " " ||
          event.key === "ArrowDown"
        ) {
          event.preventDefault();
          setHighlightedIndex(
            selectedIndexInFiltered >= 0 ? selectedIndexInFiltered : 0,
          );
          setOpen(true);
        }
        return;
      }

      if (event.key === "Escape") {
        event.preventDefault();
        setOpen(false);
        setQuery("");
        buttonRef.current?.focus();
        return;
      }

      if (event.key === "ArrowDown") {
        event.preventDefault();
        setHighlightedIndex((currentIndex) =>
          currentIndex < activeList.length - 1 ? currentIndex + 1 : 0,
        );
        return;
      }

      if (event.key === "ArrowUp") {
        event.preventDefault();
        setHighlightedIndex((currentIndex) =>
          currentIndex > 0 ? currentIndex - 1 : activeList.length - 1,
        );
        return;
      }

      if (event.key === "Enter") {
        if (previewFocused) return;
        event.preventDefault();
        if (activeOption) {
          onChange(activeOption.value);
          setOpen(false);
          setQuery("");
          buttonRef.current?.focus();
        }
        return;
      }

      if (searchFocused || previewFocused) return;

      if (
        event.key.length === 1 &&
        !event.altKey &&
        !event.ctrlKey &&
        !event.metaKey
      ) {
        const char = event.key.toLowerCase();

        if (typeAheadTimeoutRef.current) {
          clearTimeout(typeAheadTimeoutRef.current);
        }

        const nextMatch = activeList.findIndex((opt, idx) => {
          if (idx <= highlightedIndex) return false;
          return (
            opt.label.toLowerCase().startsWith(char) ||
            opt.value.toLowerCase().startsWith(char)
          );
        });

        const firstMatch =
          nextMatch === -1
            ? activeList.findIndex(
                (opt) =>
                  opt.label.toLowerCase().startsWith(char) ||
                  opt.value.toLowerCase().startsWith(char),
              )
            : nextMatch;

        if (firstMatch !== -1) {
          setHighlightedIndex(firstMatch);
        }

        typeAheadTimeoutRef.current = window.setTimeout(() => {
          typeAheadTimeoutRef.current = null;
        }, 1000);
      }
    }

    if (open) {
      document.addEventListener("keydown", handleKeyDown);
      return () => document.removeEventListener("keydown", handleKeyDown);
    }
  }, [
    filteredOptions,
    highlightedIndex,
    onChange,
    open,
    selectedIndexInFiltered,
  ]);

  useEffect(() => {
    if (!open) return;

    const gutter = 16;

    const updatePlacement = () => {
      const button = buttonRef.current;
      const menu = menuRef.current;
      if (!button || !menu) return;

      const buttonRect = button.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const preferredWidth = wideMenu ? 448 : buttonRect.width;
      const measuredWidth = Math.max(
        menu.scrollWidth,
        preferredWidth,
        buttonRect.width,
      );
      const width = Math.min(measuredWidth, viewportWidth - gutter * 2);
      const left = Math.min(
        Math.max(gutter, buttonRect.left),
        viewportWidth - width - gutter,
      );

      const spaceBelow = viewportHeight - buttonRect.bottom - gutter;
      const spaceAbove = buttonRect.top - gutter;
      const vertical: "down" | "up" =
        spaceBelow >= 220 || spaceBelow >= spaceAbove ? "down" : "up";
      const maxHeight = Math.max(
        180,
        Math.min(
          vertical === "down" ? spaceBelow : spaceAbove,
          viewportHeight - gutter * 2,
        ),
      );
      const top =
        vertical === "down"
          ? Math.min(buttonRect.bottom + 8, viewportHeight - gutter - maxHeight)
          : null;
      const bottom =
        vertical === "up"
          ? Math.max(viewportHeight - buttonRect.top + 8, gutter)
          : null;

      setMenuPlacement((current) => {
        if (
          current.left == left &&
          current.top == top &&
          current.bottom == bottom &&
          current.width == width &&
          current.maxHeight == maxHeight &&
          current.vertical == vertical
        ) {
          return current;
        }
        return { left, top, bottom, width, maxHeight, vertical };
      });
    };

    const raf = window.requestAnimationFrame(updatePlacement);
    const onResize = () => updatePlacement();
    window.addEventListener("resize", onResize);
    window.addEventListener("scroll", onResize, true);

    return () => {
      window.cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", onResize, true);
    };
  }, [filteredOptions.length, open, query, wideMenu]);

  useEffect(() => {
    return () => {
      if (typeAheadTimeoutRef.current) {
        clearTimeout(typeAheadTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className={cn("relative", className)} ref={containerRef}>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => {
          if (!open) {
            setHighlightedIndex(
              selectedIndexInFiltered >= 0 ? selectedIndexInFiltered : 0,
            );
          } else {
            setQuery("");
          }
          setOpen((state) => !state);
        }}
        onKeyDown={(event) => {
          if (
            event.key === "Enter" ||
            event.key === " " ||
            event.key === "ArrowDown"
          ) {
            event.preventDefault();
            setHighlightedIndex(
              selectedIndexInFiltered >= 0 ? selectedIndexInFiltered : 0,
            );
            setOpen(true);
          }
        }}
        className="flex w-full items-center justify-between rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2 text-sm text-white"
      >
        <span className={!value && placeholder ? "text-white/42" : "truncate"}>
          {current?.label ?? placeholder ?? value}
        </span>
        <ChevronsUpDown className="ml-2 size-4 shrink-0 text-white/42" />
      </button>

      {typeof document !== "undefined"
        ? createPortal(
            <AnimatePresence>
              {open ? (
                <motion.div
                  ref={menuRef}
                  initial={{
                    opacity: 0,
                    y: menuPlacement.vertical === "down" ? 8 : -8,
                    filter: "blur(12px)",
                  }}
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  exit={{
                    opacity: 0,
                    y: menuPlacement.vertical === "down" ? 6 : -6,
                    filter: "blur(12px)",
                  }}
                  transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                  style={{
                    position: "fixed",
                    left: menuPlacement.left,
                    top: menuPlacement.top ?? undefined,
                    bottom: menuPlacement.bottom ?? undefined,
                    width: menuPlacement.width
                      ? `${menuPlacement.width}px`
                      : undefined,
                    maxHeight: menuPlacement.maxHeight
                      ? `${menuPlacement.maxHeight}px`
                      : undefined,
                  }}
                  className={cn(
                    "z-[320] mt-2 overflow-hidden rounded-[1.2rem] border border-white/10 bg-[#0b0b0b]/96 backdrop-blur-xl shadow-[0_18px_48px_rgba(0,0,0,0.42)]",
                    menuClassName,
                  )}
                >
                  {enableSearch ? (
                    <div className="sticky top-0 z-[1] border-b border-white/8 bg-[#0b0b0b]/96 p-2 backdrop-blur-xl">
                      <label className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-white/76">
                        <Search className="size-4 shrink-0 text-white/38" />
                        <input
                          ref={searchInputRef}
                          value={query}
                          onChange={(event) => {
                            setQuery(event.target.value);
                            setHighlightedIndex(0);
                          }}
                          placeholder={searchPlaceholder}
                          className="w-full bg-transparent text-sm text-white outline-none placeholder:text-white/34"
                        />
                      </label>
                    </div>
                  ) : null}

                  <div
                    className="overflow-y-auto p-2"
                    style={{
                      maxHeight: menuPlacement.maxHeight
                        ? `${Math.max(120, menuPlacement.maxHeight - (enableSearch ? 64 : 16))}px`
                        : undefined,
                    }}
                  >
                    {filteredOptions.length === 0 ? (
                      <div className="rounded-[1rem] border border-white/8 bg-white/[0.02] px-3 py-3 text-sm text-white/44">
                        No voices found.
                      </div>
                    ) : (
                      filteredOptions.map((option, index) => {
                        const parsed = splitOptionLabel(option.label);
                        const selected = option.value === value;
                        const highlighted = highlightedIndex === index;
                        const previewing = previewingValue === option.value;
                        const previewLoading =
                          previewLoadingValue === option.value;

                        return (
                          <button
                            key={option.value}
                            onMouseEnter={() => setHighlightedIndex(index)}
                            className={cn(
                              "flex w-full items-center gap-2 rounded-[1rem] border px-2 py-2 text-left transition-colors",
                              highlighted
                                ? "border-white/12 bg-white/[0.08] text-white"
                                : "border-transparent text-white/72 hover:border-white/8 hover:bg-white/[0.04] hover:text-white",
                            )}
                          >
                            <div
                              onClick={() => {
                                onChange(option.value);
                                setOpen(false);
                                setQuery("");
                                buttonRef.current?.focus();
                              }}
                              className="min-w-0 flex-1 rounded-[0.85rem] bg-transparent px-1 py-0.5 text-left outline-none"
                            >
                              <span className="flex min-w-0 flex-col">
                                <span className="flex min-w-0 items-center gap-2">
                                  {parsed.prefix ? (
                                    <span className="shrink-0 rounded-full border border-white/10 px-2 py-1 text-[10px] uppercase tracking-[0.12em] text-white/46">
                                      {parsed.prefix}
                                    </span>
                                  ) : null}
                                  <span className="truncate text-sm text-white">
                                    {parsed.title}
                                  </span>
                                </span>
                                {parsed.meta ? (
                                  <span className="mt-1 truncate pr-2 text-[11px] text-white/46">
                                    {parsed.meta}
                                  </span>
                                ) : null}
                              </span>
                            </div>

                            <div className="ml-auto flex shrink-0 items-center gap-1">
                              {selected ? (
                                <span className="flex size-8 items-center justify-center rounded-full text-white/76">
                                  <Check className="size-4" />
                                </span>
                              ) : null}

                              {onPreview ? (
                                <button
                                  type="button"
                                  data-dropdown-preview="true"
                                  onClick={(event) => {
                                    event.preventDefault();
                                    event.stopPropagation();
                                    void onPreview(option.value);
                                  }}
                                  disabled={previewDisabled}
                                  aria-label={
                                    previewing
                                      ? `Stop preview for ${option.label}`
                                      : `Preview ${option.label}`
                                  }
                                  title={
                                    previewing
                                      ? "Stop preview"
                                      : "Preview voice"
                                  }
                                  className={cn(
                                    "flex h-8 min-w-9 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] px-2.5 text-white/68 transition-colors",
                                    previewDisabled
                                      ? "cursor-not-allowed opacity-40"
                                      : "hover:border-white/14 hover:bg-white/[0.08] hover:text-white",
                                    (previewing || previewLoading) &&
                                      "border-white/16 bg-white/[0.10] text-white shadow-[0_0_18px_rgba(255,255,255,0.06)]",
                                  )}
                                >
                                  {previewLoading ? (
                                    <Loader2 className="size-3.5 animate-spin" />
                                  ) : (
                                    <PreviewWaveform active={previewing} />
                                  )}
                                </button>
                              ) : null}
                            </div>
                          </button>
                        );
                      })
                    )}
                  </div>
                </motion.div>
              ) : null}
            </AnimatePresence>,
            document.body,
          )
        : null}
    </div>
  );
}
