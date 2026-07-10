"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ChevronsUpDown } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

type Option = {
  label: string;
  value: string;
};

export function DropdownSelect({
  value,
  options,
  onChange,
  className,
  placeholder,
}: {
  value: string;
  options: Option[];
  onChange: (value: string) => void;
  className?: string;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState<number>(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const highlightedOption = options.find((opt) => opt.value === value)
    ? options.findIndex((opt) => opt.value === value)
    : 0;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
      setHighlightedIndex(highlightedOption >= 0 ? highlightedOption : 0);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open, highlightedOption]);

  const typeAheadTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (!open) {
        if (event.key === "Enter" || event.key === " " || event.key === "ArrowDown") {
          event.preventDefault();
          setOpen(true);
        }
        return;
      }

      if (event.key === "Escape") {
        event.preventDefault();
        setOpen(false);
        buttonRef.current?.focus();
      } else if (event.key === "ArrowDown") {
        event.preventDefault();
        setHighlightedIndex((current) =>
          current < options.length - 1 ? current + 1 : 0,
        );
      } else if (event.key === "ArrowUp") {
        event.preventDefault();
        setHighlightedIndex((current) =>
          current > 0 ? current - 1 : options.length - 1,
        );
      } else if (event.key === "Enter") {
        event.preventDefault();
        if (options[highlightedIndex]) {
          onChange(options[highlightedIndex].value);
          setOpen(false);
          buttonRef.current?.focus();
        }
      } else if (event.key.length === 1 && !event.altKey && !event.ctrlKey && !event.metaKey) {
        // Type-ahead: single character keys (not modifiers)
        const char = event.key.toLowerCase();

        // Clear any pending type-ahead timeout
        if (typeAheadTimeoutRef.current) {
          clearTimeout(typeAheadTimeoutRef.current);
        }

        // Find the next option starting with this character after current highlight
        const nextMatch = options.findIndex((opt, idx) => {
          if (idx > highlightedIndex) {
            return opt.label.toLowerCase().startsWith(char) || opt.value.toLowerCase().startsWith(char);
          }
          return false;
        });

        // If no match after current, search from beginning
        const firstMatch = nextMatch === -1
          ? options.findIndex((opt) => opt.label.toLowerCase().startsWith(char) || opt.value.toLowerCase().startsWith(char))
          : nextMatch;

        if (firstMatch !== -1) {
          setHighlightedIndex(firstMatch);
        }

        // Reset the type-ahead search after a short delay
        typeAheadTimeoutRef.current = window.setTimeout(() => {
          typeAheadTimeoutRef.current = null;
        }, 1000);
      }
    }

    if (open) {
      document.addEventListener("keydown", handleKeyDown);
      return () => document.removeEventListener("keydown", handleKeyDown);
    }
  }, [open, onChange, options, highlightedIndex]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (typeAheadTimeoutRef.current) {
        clearTimeout(typeAheadTimeoutRef.current);
      }
    };
  }, []);

  const current = options.find((option) => option.value === value) ?? options[0];

  return (
    <div className={cn("relative", className)} ref={containerRef}>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((state) => !state)}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " " || event.key === "ArrowDown") {
            event.preventDefault();
            setOpen(true);
          }
        }}
        className="flex w-full items-center justify-between rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2 text-sm text-white"
      >
        <span className={!value && placeholder ? "text-white/42" : ""}>
          {current?.label ?? placeholder ?? value}
        </span>
        <ChevronsUpDown className="size-4 text-white/42" />
      </button>

      <AnimatePresence>
        {open ? (
          <motion.div
            initial={{ opacity: 0, y: 8, filter: "blur(12px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: 6, filter: "blur(12px)" }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="absolute left-0 top-[calc(100%+0.5rem)] z-20 w-full max-h-60 overflow-y-auto rounded-[1rem] border border-white/10 bg-[#0c0c0c]/96 p-2 backdrop-blur-xl"
          >
            {options.map((option, index) => (
              <button
                key={option.value}
                type="button"
                onMouseEnter={() => setHighlightedIndex(index)}
                onClick={() => {
                  onChange(option.value);
                  setOpen(false);
                  buttonRef.current?.focus();
                }}
                className={cn(
                  "flex w-full rounded-[0.8rem] px-3 py-2 text-left text-sm transition-colors",
                  highlightedIndex === index
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
  );
}
