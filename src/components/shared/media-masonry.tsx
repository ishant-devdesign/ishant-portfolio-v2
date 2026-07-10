"use client";

import { GripVertical, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { buttonClasses } from "@/components/ui/button";
import type { CreativeArchiveItem } from "@/lib/site-config";

type MediaMasonryProps = {
  items: CreativeArchiveItem[];
  onItemClick?: (index: number) => void;
  adminMode?: boolean;
  draggingIndex?: number | null;
  onDragStart?: (index: number) => void;
  onDragOver?: (event: React.DragEvent) => void;
  onDrop?: (targetIndex: number) => void;
  onDragEnd?: () => void;
  onDeleteItem?: (index: number) => void;
};

function isVideoUrl(url: string): boolean {
  const videoExtensions = [".mp4", ".webm", ".ogg", ".mov", ".avi"];
  return videoExtensions.some((ext) => url.toLowerCase().includes(ext));
}

export function MediaMasonry({
  items,
  onItemClick,
  adminMode = false,
  draggingIndex,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
  onDeleteItem,
}: MediaMasonryProps) {
  if (items.length === 0) {
    return null;
  }

  return (
    <div className="columns-1 gap-4 sm:columns-2 xl:columns-3">
      {items.map((item, index) => {
        const isDragging = draggingIndex === index;
        const isVideo = isVideoUrl(item.url);

        if (adminMode) {
          return (
            <div
              key={item.id}
              draggable
              onDragStart={() => onDragStart?.(index)}
              onDragOver={(event) => {
                event.preventDefault();
                onDragOver?.(event);
              }}
              onDrop={() => onDrop?.(index)}
              onDragEnd={onDragEnd}
              className={cn(
                "rounded-[1.6rem] border bg-white/[0.02] p-3 mb-4 break-inside-avoid",
                "border-white/10",
                isDragging ? "opacity-55" : "opacity-100",
              )}
            >
              <div className="mb-3 flex items-center justify-between gap-3 text-xs text-white/46">
                <span className="inline-flex items-center gap-2 rounded-full border border-white/10 px-3 py-1">
                  <GripVertical className="size-3.5" /> Drag to reorder
                </span>
                <button
                  type="button"
                  onClick={() => onItemClick?.(index)}
                  className={buttonClasses({ tone: "muted", size: "xs" })}
                >
                  Preview
                </button>
              </div>

              <div className="relative overflow-hidden rounded-[1.2rem] border border-white/10 bg-black/20">
                {isVideo ? (
                  <video
                    src={item.url}
                    muted
                    className="h-auto w-full object-cover"
                  />
                ) : (
                  <img
                    src={item.url}
                    alt="Archive media"
                    className="h-auto w-full object-cover"
                  />
                )}
              </div>

              <div className="mt-3 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => onDeleteItem?.(index)}
                  className={buttonClasses({ tone: "muted", size: "sm" })}
                >
                  <X className="size-3.5" /> Remove
                </button>
              </div>
            </div>
          );
        }

        return (
          <div key={item.id} className="mb-4 break-inside-avoid">
            <button
              type="button"
              onClick={() => onItemClick?.(index)}
              className="group block w-full overflow-hidden rounded-[1.6rem] border border-white/10 bg-black/20 text-left"
            >
              {isVideo ? (
                <video
                  src={item.url}
                  muted
                  className="h-auto w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                />
              ) : (
                <img
                  src={item.url}
                  alt="Archive media"
                  className="h-auto w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                />
              )}
            </button>
          </div>
        );
      })}
    </div>
  );
}