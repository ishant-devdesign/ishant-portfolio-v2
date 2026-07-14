"use client";

import { Bold, Italic, Code } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import type { FormatType } from "@/lib/text-format";

type TextFormatToolbarProps = {
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
  onFormat: (format: FormatType) => void;
  visible: boolean;
  selectionRect: { top: number; left: number; width: number } | null;
};

const formatOptions: Array<{
  format: FormatType;
  icon: React.ReactNode;
  label: string;
}> = [
  { format: "bold", icon: <Bold className="size-3.5" />, label: "Bold" },
  { format: "italic", icon: <Italic className="size-3.5" />, label: "Italic" },
  { format: "code", icon: <Code className="size-3.5" />, label: "Code" },
];

export function TextFormatToolbar({
  textareaRef,
  onFormat,
  visible,
  selectionRect,
}: TextFormatToolbarProps) {
  const toolbarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        toolbarRef.current &&
        !toolbarRef.current.contains(event.target as Node)
      ) {
        if (textareaRef.current?.contains(event.target as Node)) return;
      }
    }

    if (visible) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [visible, textareaRef]);

  return (
    <AnimatePresence>
      {visible && selectionRect ? (
        <motion.div
          ref={toolbarRef}
          initial={{ opacity: 0, y: 8, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 6, scale: 0.95 }}
          transition={{ duration: 0.15, ease: "easeOut" }}
          className={cn(
            "fixed z-[100] flex items-center gap-1 rounded-full",
            "border border-white/20 bg-[#1a1a1a] p-1.5 shadow-2xl",
            "pointer-events-auto",
          )}
          style={{
            top: selectionRect.top,
            left: selectionRect.left,
          }}
        >
          {formatOptions.map((option) => (
            <button
              key={option.format}
              type="button"
              onClick={() => onFormat(option.format)}
              className={cn(
                "inline-flex items-center justify-center rounded-full border",
                "border-white/30 text-white/90 transition-all duration-150",
                "hover:bg-white/20 hover:text-white h-7 w-7",
                "bg-white/5",
              )}
              title={option.label}
              aria-label={option.label}
            >
              {option.icon}
            </button>
          ))}
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
