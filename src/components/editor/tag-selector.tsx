"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CornerDownLeft, Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";

type TagSelectorProps = {
  value: string[];
  onChange: (tags: string[]) => void;
  suggestions: string[];
};

type Row = { kind: "create"; label: string } | { kind: "tag"; label: string };

export function TagSelector({
  value,
  onChange,
  suggestions,
}: TagSelectorProps) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const normalizedSuggestions = useMemo(
    () => [...new Set(suggestions)].sort((a, b) => a.localeCompare(b)),
    [suggestions],
  );

  const hasValue = (tag: string) =>
    value.some((item) => item.toLowerCase() === tag.toLowerCase());

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const pool = q
      ? normalizedSuggestions.filter((tag) => tag.toLowerCase().includes(q))
      : normalizedSuggestions;
    return pool.filter((tag) => !hasValue(tag)).slice(0, 7);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [normalizedSuggestions, query, value]);

  const trimmed = query.trim();
  const canCreate =
    trimmed.length > 0 &&
    !hasValue(trimmed) &&
    !normalizedSuggestions.some(
      (tag) => tag.toLowerCase() === trimmed.toLowerCase(),
    );

  const rows: Row[] = [
    ...(canCreate ? [{ kind: "create" as const, label: trimmed }] : []),
    ...filtered.map((tag) => ({ kind: "tag" as const, label: tag })),
  ];

  // Derived, wrap-safe active row — no reset effect needed
  const safeActiveIndex = rows.length ? activeIndex % rows.length : 0;

  // Close the dropdown on outside pointer press
  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: PointerEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  // Keep the active row visible while navigating
  useEffect(() => {
    if (!open || !listRef.current) return;
    const active = listRef.current.querySelector<HTMLElement>(
      '[data-active="true"]',
    );
    active?.scrollIntoView({ block: "nearest" });
  }, [safeActiveIndex, open]);

  function addTag(tag: string) {
    const cleaned = tag.trim().replace(/^#+/, "");
    if (!cleaned || hasValue(cleaned)) {
      setQuery("");
      return;
    }
    onChange([...value, cleaned]);
    setQuery("");
    setOpen(true);
    inputRef.current?.focus();
  }

  function removeTag(tag: string) {
    onChange(value.filter((item) => item !== tag));
  }

  function commitRow(index: number) {
    const row = rows[index];
    if (!row) return;
    addTag(row.label);
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setOpen(true);
      setActiveIndex((i) => (rows.length ? (i + 1) % rows.length : 0));
      return;
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      setOpen(true);
      setActiveIndex((i) =>
        rows.length ? (i - 1 + rows.length) % rows.length : 0,
      );
      return;
    }
    if (event.key === "Enter" || event.key === ",") {
      event.preventDefault();
      if (rows.length > 0) {
        commitRow(open ? safeActiveIndex : 0);
      } else if (trimmed) {
        addTag(trimmed);
      }
      return;
    }
    if (event.key === "Escape") {
      setOpen(false);
      return;
    }
    if (event.key === "Backspace" && !query && value.length > 0) {
      removeTag(value[value.length - 1]);
    }
  }

  const showDropdown = open && rows.length > 0;

  return (
    <div ref={containerRef} className="relative space-y-3">
      {/* Chip field */}
      <div
        className={cn(
          "flex flex-wrap items-center gap-1.5 rounded-[1.2rem] border bg-white/[0.02] px-3 py-2.5 transition-colors",
          open ? "border-white/20" : "border-white/10",
        )}
        onClick={() => inputRef.current?.focus()}
      >
        <AnimatePresence initial={false}>
          {value.map((tag) => (
            <motion.span
              key={tag}
              layout
              initial={{ opacity: 0, scale: 0.85, filter: "blur(6px)" }}
              animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
              exit={{ opacity: 0, scale: 0.85, filter: "blur(6px)" }}
              transition={{ duration: 0.16, ease: "easeOut" }}
              className="group inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.05] py-1 pl-2.5 pr-1.5 text-xs leading-none text-white/72"
            >
              <span className="translate-y-[0.5px]">{tag}</span>
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  removeTag(tag);
                }}
                aria-label={`Remove tag ${tag}`}
                className="flex size-4 items-center justify-center rounded-full text-white/35 transition-colors hover:bg-white/10 hover:text-rose-300"
              >
                <X className="size-3" />
              </button>
            </motion.span>
          ))}
        </AnimatePresence>

        <input
          ref={inputRef}
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={
            value.length === 0
              ? "Add tags… Enter or comma to add"
              : "Add another tag…"
          }
          aria-label="Add tags"
          aria-expanded={showDropdown}
          aria-controls="tag-selector-listbox"
          role="combobox"
          className="min-w-[10rem] flex-1 bg-transparent py-1 text-sm text-white outline-none placeholder:text-white/28"
        />
      </div>

      {/* Suggestion / create dropdown */}
      <AnimatePresence>
        {showDropdown ? (
          <motion.div
            initial={{ opacity: 0, y: 8, filter: "blur(12px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: 6, filter: "blur(12px)" }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="absolute left-0 top-[calc(100%+0.5rem)] z-20 w-full overflow-hidden rounded-[1rem] border border-white/10 bg-[#0c0c0c]/96 backdrop-blur-xl"
          >
            <div
              ref={listRef}
              id="tag-selector-listbox"
              role="listbox"
              className="max-h-56 overflow-y-auto p-1.5"
            >
              {rows.map((row, index) => {
                const active = index === safeActiveIndex;
                return (
                  <button
                    key={`${row.kind}-${row.label}`}
                    type="button"
                    role="option"
                    aria-selected={active}
                    data-active={active}
                    onMouseEnter={() => setActiveIndex(index)}
                    onClick={() => commitRow(index)}
                    className={cn(
                      "flex w-full items-center gap-2.5 rounded-[0.75rem] px-3 py-2 text-left text-sm transition-colors",
                      active ? "bg-white/[0.06] text-white" : "text-white/72",
                    )}
                  >
                    {row.kind === "create" ? (
                      <>
                        <span className="flex size-5 shrink-0 items-center justify-center rounded-md border border-amber-200/20 bg-amber-200/10">
                          <Plus className="size-3 text-amber-100" />
                        </span>
                        <span>
                          Create{" "}
                          <span className="font-medium text-amber-100">
                            {row.label}
                          </span>
                        </span>
                      </>
                    ) : (
                      <span className="pl-[1.875rem]">{row.label}</span>
                    )}
                    {active ? (
                      <CornerDownLeft className="ml-auto size-3.5 text-white/30" />
                    ) : null}
                  </button>
                );
              })}
            </div>
            <div className="border-t border-white/[0.06] px-3 py-2 text-[10px] tracking-wide text-white/28">
              ↑↓ navigate · Enter or comma to add · Backspace removes last tag
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
