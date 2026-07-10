"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { ArrowLeft, ArrowRight, X, Pause, Maximize2 } from "lucide-react";
import type { CreativeArchiveItem } from "@/lib/site-config";

function isVideoUrl(url: string): boolean {
  const videoExtensions = [".mp4", ".webm", ".ogg", ".mov", ".avi"];
  return videoExtensions.some((ext) => url.toLowerCase().includes(ext));
}

export function MediaLightbox({
  items,
  activeIndex,
  onChangeIndex,
  onClose,
}: {
  items: CreativeArchiveItem[];
  activeIndex: number | null;
  onChangeIndex: (index: number) => void;
  onClose: () => void;
}) {
  useEffect(() => {
    if (activeIndex === null) return;

    const previousOverflow = document.body.style.overflow;
    const currentIndex = activeIndex;
    document.body.style.overflow = "hidden";

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
        return;
      }

      if (items.length <= 1) return;

      if (event.key === "ArrowLeft") {
        event.preventDefault();
        onChangeIndex((currentIndex - 1 + items.length) % items.length);
      }

      if (event.key === "ArrowRight") {
        event.preventDefault();
        onChangeIndex((currentIndex + 1) % items.length);
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [activeIndex, items.length, onChangeIndex, onClose]);

  if (
    typeof document === "undefined" ||
    activeIndex === null ||
    !items[activeIndex]
  ) {
    return null;
  }

  const item = items[activeIndex];
  const isVideo = isVideoUrl(item.url);
  const canNavigate = items.length > 1;

  return createPortal(
    <div className="fixed inset-0 z-[260] bg-black/95 text-white">
      <div className="absolute inset-x-0 top-0 z-[2] flex items-center justify-between gap-4 border-b border-white/10 bg-black/45 px-5 py-4 backdrop-blur-xl">
        <div className="min-w-0">
          <p className="text-[0.68rem] uppercase tracking-[0.34em] text-white/40">
            Creative Archive
          </p>
          <p className="mt-1 text-xs text-white/42">
            {activeIndex + 1} / {items.length}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white/78 hover:bg-white/[0.08]"
        >
          <X className="size-4" /> Close
        </button>
      </div>

      <button
        type="button"
        onClick={onClose}
        className="absolute inset-0 h-full w-full"
        aria-label="Close viewer"
      />

      <div className="relative z-[1] flex h-full items-center justify-center px-4 pb-8 pt-24 sm:px-6">
        {canNavigate ? (
          <button
            type="button"
            onClick={() =>
              onChangeIndex((activeIndex - 1 + items.length) % items.length)
            }
            className="absolute left-3 top-1/2 z-[2] -translate-y-1/2 rounded-full border border-white/10 bg-black/45 p-3 text-white/84 backdrop-blur hover:bg-white/[0.08] sm:left-6"
            aria-label="Previous item"
          >
            <ArrowLeft className="size-5" />
          </button>
        ) : null}

        <div
          className="relative z-[2] max-h-full max-w-[min(1400px,100%)]"
          onClick={(event) => event.stopPropagation()}
        >
          {isVideo ? (
            <div className="relative">
              <video
                src={item.url}
                autoPlay
                playsInline
                className="max-h-[82vh] w-auto max-w-full object-contain"
                onEnded={() => {
                  // Auto-advance to next video when one ends
                  if (canNavigate) {
                    onChangeIndex((activeIndex + 1) % items.length);
                  }
                }}
                controls
              />
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 rounded-full border border-white/20 bg-black/60 px-3 py-2 text-xs text-white/80 backdrop-blur">
                <Pause className="size-3" />
                Video playing - click to pause/play
              </div>
            </div>
          ) : (
            <img
              src={item.url}
              alt="Archive media"
              className="max-h-[82vh] w-auto max-w-full object-contain"
            />
          )}
        </div>

        {canNavigate ? (
          <button
            type="button"
            onClick={() => onChangeIndex((activeIndex + 1) % items.length)}
            className="absolute right-3 top-1/2 z-[2] -translate-y-1/2 rounded-full border border-white/10 bg-black/45 p-3 text-white/84 backdrop-blur hover:bg-white/[0.08] sm:right-6"
            aria-label="Next item"
          >
            <ArrowRight className="size-5" />
          </button>
        ) : null}
      </div>
    </div>,
    document.body,
  );
}