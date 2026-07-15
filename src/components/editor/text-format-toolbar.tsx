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
import { cn } from "@/lib/utils";
import type { FormatType } from "@/lib/text-format";

type TextFormatToolbarProps = {
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
  onFormat: (format: FormatType) => void;
  visible: boolean;
  selectionRect: { top: number; left: number; width: number } | null;
};

const classicOptions = [
  {
    format: "bold" as FormatType,
    icon: <Bold className="size-3.5" />,
    label: "Bold **",
  },
  {
    format: "italic" as FormatType,
    icon: <Italic className="size-3.5" />,
    label: "Italic *",
  },
  {
    format: "code" as FormatType,
    icon: <Code className="size-3.5" />,
    label: "Code `",
  },
  {
    format: "highlight" as FormatType,
    icon: <Highlighter className="size-3.5" />,
    label: "Highlight ==",
  },
];

const celebrateOptions = [
  {
    format: "pop" as FormatType,
    icon: <PartyPopper className="size-4" />,
    title: "Pop",
    desc: "Jump + dots → gradient",
    example: "@@",
  },
  {
    format: "wavy" as FormatType,
    icon: <Underline className="size-4" />,
    title: "Wavy",
    desc: "Organic pen [1,0,0,1]",
    example: "__",
  },
];

export function TextFormatToolbar({
  textareaRef,
  onFormat,
  visible,
  selectionRect,
}: TextFormatToolbarProps) {
  const toolbarRef = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(
    null,
  );

  useLayoutEffect(() => {
    if (!selectionRect || !visible) {
      setCoords(null);
      return;
    }

    const compute = () => {
      const el = toolbarRef.current;
      if (!el) return;
      const tbRect = el.getBoundingClientRect();
      const pad = 8;
      const gapBelow = 14;

      let top = selectionRect.top + gapBelow;
      let left = selectionRect.left - tbRect.width / 2;

      // Edge detection for horizontal positioning
      const minLeft = pad;
      const maxLeft = window.innerWidth - tbRect.width - pad;

      // If pill would overflow right edge, align to right
      if (left > maxLeft) {
        left = maxLeft;
      }
      // If pill would overflow left edge, align to left
      else if (left < minLeft) {
        left = minLeft;
      }

      // If pill is wider than viewport, pin to left edge
      if (tbRect.width > window.innerWidth - pad * 2) {
        left = minLeft;
      }

      left = Math.max(minLeft, Math.min(left, maxLeft));

      const maxTop = window.innerHeight - tbRect.height - pad;
      top = Math.min(top, maxTop);
      top = Math.max(pad, top);
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
          initial={{ opacity: 0, y: 10, scale: 0.92, filter: "blur(14px)" }}
          animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
          exit={{ opacity: 0, y: 8, scale: 0.92, filter: "blur(12px)" }}
          transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
          className={cn(
            "fixed z-[1000] w-[min(300px,calc(100vw-16px))] overflow-hidden rounded-[1.15rem]",
            "border border-white/[0.12] bg-[#0f0f0f]/85 backdrop-blur-[20px]",
            "shadow-[0_12px_36px_rgba(0,0,0,0.55),0_0_0_1px_rgba(255,255,255,0.05)_inset]",
            "pointer-events-auto select-none",
          )}
          style={{
            top: coords ? coords.top : -9999,
            left: coords ? coords.left : -9999,
            visibility: coords ? "visible" : "hidden",
          }}
        >
          <div className="p-2">
            {/* Classic 4 - static, no loop */}
            <div className="flex items-center gap-1 rounded-full border border-white/[0.06] bg-white/[0.03] p-1">
              {classicOptions.map((opt, i) => (
                <motion.button
                  key={opt.format}
                  data-cursor="true"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.03, duration: 0.22 }}
                  whileHover={{ scale: 1.08 }}
                  whileTap={{ scale: 0.9 }}
                  onPointerDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onFormat(opt.format);
                  }}
                  className="inline-flex size-7 items-center justify-center rounded-full border border-white/10 bg-white/[0.05] text-white/70 hover:bg-white/[0.12] hover:text-white transition-colors"
                  title={opt.label}
                >
                  {opt.icon}
                </motion.button>
              ))}
            </div>

            {/* Celebrate 2 - bigger cards with description */}
            <div className="mt-2 grid grid-cols-2 gap-1.5">
              {celebrateOptions.map((opt, i) => (
                <motion.button
                  key={opt.format}
                  data-cursor="true"
                  initial={{ opacity: 0, y: 6, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{
                    delay: 0.1 + i * 0.06,
                    duration: 0.28,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                  whileHover={{ scale: 1.03, y: -1 }}
                  whileTap={{ scale: 0.96 }}
                  onPointerDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onFormat(opt.format);
                  }}
                  className="group relative flex flex-col items-start gap-1.5 rounded-[0.85rem] border border-white/[0.08] bg-white/[0.04] p-2.5 text-left transition-all hover:border-amber-200/20 hover:bg-white/[0.07]"
                >
                  <div className="flex size-7 items-center justify-center rounded-full bg-[#1c1c1c] border border-white/10 text-white/70 group-hover:text-amber-100">
                    {opt.icon}
                  </div>
                  <div>
                    <p className="text-[11px] font-medium leading-none text-white/90">
                      {opt.title}
                    </p>
                    <p className="mt-1 text-[9px] leading-[1.25] text-white/40 group-hover:text-white/55">
                      {opt.desc}
                    </p>
                  </div>
                  <span className="absolute right-1.5 top-1.5 rounded-full bg-white/[0.06] px-1 py-0.5 font-mono text-[8px] text-white/25">
                    {opt.example}
                  </span>
                </motion.button>
              ))}
            </div>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}