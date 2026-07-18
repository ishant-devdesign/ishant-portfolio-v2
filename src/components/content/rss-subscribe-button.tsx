"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowUpRight, Check, Copy, Rss } from "lucide-react";
import { buttonClasses } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const itemClass =
  "flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-[13px] text-white/70 transition-colors hover:bg-white/[0.06] hover:text-white";

/**
 * RSS subscribe button with a small action popover: copy the feed URL
 * (the primary "subscribe" flow for RSS readers) or open the raw feed.
 */
export function RssSubscribeButton({ className }: { className?: string }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const rootRef = useRef<HTMLDivElement>(null);
  const copiedTimerRef = useRef<number | null>(null);

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("pointerdown", onPointerDown, true);
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.removeEventListener("pointerdown", onPointerDown, true);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  useEffect(
    () => () => {
      if (copiedTimerRef.current !== null) {
        window.clearTimeout(copiedTimerRef.current);
      }
    },
    [],
  );

  const copyFeedUrl = () => {
    const url = `${window.location.origin}/rss.xml`;

    try {
      const ta = document.createElement("textarea");
      ta.value = url;
      ta.setAttribute("readonly", "");
      ta.style.position = "fixed";
      ta.style.top = "0";
      ta.style.left = "-9999px";
      document.body.appendChild(ta);
      ta.select();
      ta.setSelectionRange(0, 999999);
      document.execCommand("copy");
      document.body.removeChild(ta);
    } catch {}
    try {
      navigator.clipboard.writeText(url);
    } catch {}

    setCopied(true);

    if (copiedTimerRef.current !== null) {
      window.clearTimeout(copiedTimerRef.current);
    }

    copiedTimerRef.current = window.setTimeout(() => {
      setCopied(false);
      setOpen(false);
    }, 1600);
  };

  const openFeed = () => {
    window.open("/rss.xml", "_blank", "noopener,noreferrer");
    setOpen(false);
  };

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-haspopup="menu"
        aria-expanded={open}
        data-cursor="RSS"
        className={buttonClasses({
          tone: "secondary",
          size: "sm",
          className: "gap-1.5 text-xs",
        })}
      >
        <Rss className="size-3.5" />
        RSS
      </button>

      <AnimatePresence>
        {open ? (
          <motion.div
            role="menu"
            aria-label="RSS feed options"
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.15, ease: [0.22, 1, 0.36, 1] }}
            className="absolute right-0 top-full z-50 mt-2 w-64 origin-top-right rounded-2xl border border-white/10 bg-neutral-950 p-1.5 shadow-[0_16px_40px_rgba(0,0,0,0.45)]"
          >
            <div className="px-3 pb-2 pt-2">
              <p className="text-[10px] uppercase tracking-[0.24em] text-white/32">
                New posts via RSS
              </p>
              <p className="mt-1.5 text-xs leading-5 text-white/45">
                Paste the feed URL into any RSS reader and new blogs show up as
                they publish.
              </p>
            </div>

            <button
              type="button"
              role="menuitem"
              onClick={copyFeedUrl}
              className={itemClass}
            >
              {copied ? (
                <Check className="size-3.5 text-emerald-300" />
              ) : (
                <Copy className="size-3.5" />
              )}
              {copied ? "Feed URL copied" : "Copy feed URL"}
            </button>

            <button
              type="button"
              role="menuitem"
              onClick={openFeed}
              className={itemClass}
            >
              <ArrowUpRight className="size-3.5" />
              Open feed
            </button>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
