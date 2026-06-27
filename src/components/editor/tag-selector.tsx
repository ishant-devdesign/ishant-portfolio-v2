"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { buttonClasses } from "@/components/ui/button";

type TagSelectorProps = {
  value: string[];
  onChange: (tags: string[]) => void;
  suggestions: string[];
};

export function TagSelector({ value, onChange, suggestions }: TagSelectorProps) {
  const [query, setQuery] = useState("");

  const normalizedSuggestions = useMemo(
    () => [...new Set(suggestions)].sort((a, b) => a.localeCompare(b)),
    [suggestions],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return normalizedSuggestions.filter((tag) => !value.includes(tag)).slice(0, 6);
    return normalizedSuggestions
      .filter((tag) => tag.toLowerCase().includes(q) && !value.includes(tag))
      .slice(0, 6);
  }, [normalizedSuggestions, query, value]);

  function addTag(tag: string) {
    const cleaned = tag.trim();
    if (!cleaned || value.includes(cleaned)) return;
    onChange([...value, cleaned]);
    setQuery("");
  }

  function removeTag(tag: string) {
    onChange(value.filter((item) => item !== tag));
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter") {
      event.preventDefault();
      addTag(query);
    }
  }

  return (
    <div className="relative space-y-3">
      <div className="flex flex-wrap items-center gap-2 rounded-[1.2rem] border border-white/10 bg-white/[0.02] px-3 py-3">
        {value.map((tag) => (
          <button
            key={tag}
            type="button"
            onClick={() => removeTag(tag)}
            className={buttonClasses({ tone: "ghost", size: "sm" })}
          >
            <span>{tag}</span>
            <X className="size-3.5" />
          </button>
        ))}

        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type tag and press Enter"
          className="min-w-[180px] flex-1 bg-transparent text-sm text-white outline-none placeholder:text-white/28"
        />
      </div>

      <AnimatePresence>
        {query.trim() && filtered.length > 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 8, filter: "blur(12px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: 6, filter: "blur(12px)" }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="absolute left-0 top-[calc(100%+0.5rem)] z-20 w-full rounded-[1rem] border border-white/10 bg-[#0c0c0c]/96 p-2 backdrop-blur-xl"
          >
            {filtered.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => addTag(tag)}
                className="flex w-full rounded-[0.8rem] px-3 py-2 text-left text-sm text-white/72 transition-colors hover:bg-white/[0.04] hover:text-white"
              >
                {tag}
              </button>
            ))}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
