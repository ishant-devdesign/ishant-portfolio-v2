"use client";

import {
  Bold,
  Italic,
  Code,
  Highlighter,
  PartyPopper,
  Underline,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useLayoutEffect, useRef, useState } from "react";
import type { FormatType } from "@/lib/text-format";

type TextFormatToolbarProps = {
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
  onFormat: (format: FormatType) => void;
  visible: boolean;
  selectionRect: { top: number; left: number; width: number } | null;
};

const classicOptions = [
  { format: "bold" as FormatType, label: "Bold", icon: <Bold className="size-4" /> },
  { format: "italic" as FormatType, label: "Italic", icon: <Italic className="size-4" /> },
  { format: "code" as FormatType, label: "Code", icon: <Code className="size-4" /> },
  { format: "highlight" as FormatType, label: "Highlight", icon: <Highlighter className="size-4" /> },
];

const celebrateOptions = [
  { format: "pop" as FormatType, label: "Pop", icon: <PartyPopper className="size-4" /> },
  { format: "wavy" as FormatType, label: "Wavy", icon: <Underline className="size-4" /> },
];

export function TextFormatToolbar({
  textareaRef,
  onFormat,
  visible,
  selectionRect,
}: TextFormatToolbarProps) {
  const toolbarRef = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(null);

  useLayoutEffect(() => {
    if (!selectionRect || !visible) {
      setCoords(null);
      return;
    }
    const compute = () => {
      const el = toolbarRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const pad = 8;
      const gap = 10;
      let top = selectionRect.top + gap;
      let left = selectionRect.left - r.width / 2;
      if (top + r.height > window.innerHeight - pad) {
        top = selectionRect.top - r.height - gap;
      }
      left = Math.max(pad, Math.min(left, window.innerWidth - r.width - pad));
      top = Math.max(pad, Math.min(top, window.innerHeight - r.height - pad));
      if (r.width > window.innerWidth - pad * 2) left = pad;
      setCoords({ top, left });
    };
    compute();
    const raf1 = requestAnimationFrame(compute);
    const raf2 = requestAnimationFrame(compute);
    return () => {
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
    };
  }, [selectionRect, visible]);

  return (
    <AnimatePresence>
      {visible && selectionRect ? (
        <motion.div
          ref={toolbarRef}
          initial={{ opacity: 0, y: 8, scale: 0.94, filter: "blur(8px)" }}
          animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
          exit={{ opacity: 0, y: 6, scale: 0.94, filter: "blur(8px)" }}
          transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] as any }}
          className="fixed z-[1000] flex items-center gap-1 rounded-full border border-white/[0.12] bg-[#151515]/90 backdrop-blur-[16px] p-1 shadow-[0_8px_24px_rgba(0,0,0,0.35)] pointer-events-auto select-none will-change-transform"
          style={{
            top: coords ? coords.top : -9999,
            left: coords ? coords.left : -9999,
            visibility: coords ? "visible" : "hidden",
          }}
        >
          <div className="flex items-center gap-0.5 rounded-full bg-white/[0.04] p-0.5">
            {classicOptions.map((opt) => (
              <div key={opt.format} className="relative group">
                <button
                  data-cursor="true"
                  onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); onFormat(opt.format); }}
                  className="inline-flex size-8 items-center justify-center rounded-full text-white/60 hover:bg-white/[0.08] hover:text-white transition-colors"
                  aria-label={opt.label}
                >
                  {opt.icon}
                </button>
                <div className="pointer-events-none absolute bottom-full left-1/2 mb-2 hidden -translate-x-1/2 whitespace-nowrap rounded-full bg-black/90 border border-white/10 px-2 py-1 text-[11px] text-white/80 group-hover:block z-50">
                  {opt.label}
                </div>
              </div>
            ))}
          </div>

          <div className="mx-0.5 h-4 w-px bg-white/10" />

          <div className="flex items-center gap-0.5">
            {celebrateOptions.map((opt) => (
              <div key={opt.format} className="relative group">
                <button
                  data-cursor="true"
                  onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); onFormat(opt.format); }}
                  className="inline-flex size-8 items-center justify-center rounded-full bg-white/[0.06] border border-white/10 text-white/70 hover:bg-amber-200/10 hover:border-amber-200/20 hover:text-amber-100 transition-colors"
                  aria-label={opt.label}
                >
                  {opt.icon}
                </button>
                <div className="pointer-events-none absolute bottom-full left-1/2 mb-2 hidden -translate-x-1/2 whitespace-nowrap rounded-full bg-black/90 border border-white/10 px-2 py-1 text-[11px] text-white/80 group-hover:block z-50">
                  {opt.label}
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
