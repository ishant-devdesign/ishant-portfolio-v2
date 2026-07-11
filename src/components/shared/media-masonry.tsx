"use client";

import type { Ref } from "react";
import { Eye, GripVertical, Play, Trash2 } from "lucide-react";
import { OrderedMasonry } from "@/components/shared/ordered-masonry";
import type { CreativeArchiveItem } from "@/lib/site-config";
import { cn } from "@/lib/utils";

type MediaMasonryProps = {
  items: CreativeArchiveItem[];
  onItemClick?: (index: number) => void;
  adminMode?: boolean;
  onDeleteItem?: (itemId: string) => void;
  onReorder?: (nextItems: CreativeArchiveItem[]) => void;
};

function isVideoUrl(url: string): boolean {
  const videoExtensions = [".mp4", ".webm", ".ogg", ".mov", ".avi"];
  return videoExtensions.some((ext) => url.toLowerCase().includes(ext));
}

const floatingIconButtonClass =
  "inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-black/55 text-white/78 shadow-[0_8px_28px_rgba(0,0,0,0.35)] backdrop-blur-xl transition-colors hover:bg-black/72 hover:text-white";

const floatingActionPillClass =
  "absolute bottom-3 right-3 z-10 inline-flex items-center gap-1 rounded-full border border-white/10 bg-black/55 p-1.5 shadow-[0_8px_28px_rgba(0,0,0,0.35)] backdrop-blur-xl";

function MediaPreview({
  item,
  interactive = false,
}: {
  item: CreativeArchiveItem;
  interactive?: boolean;
}) {
  const isVideo = isVideoUrl(item.url);

  if (isVideo) {
    return (
      <div className="relative">
        <video
          src={item.url}
          muted
          playsInline
          preload="metadata"
          className={cn(
            "h-auto w-full object-cover",
            interactive &&
              "transition-transform duration-500 group-hover:scale-[1.02]",
          )}
        />
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div
            className={cn(
              "flex items-center justify-center rounded-full bg-black/45 backdrop-blur-sm transition-transform duration-200",
              interactive ? "h-12 w-12 group-hover:scale-110" : "h-14 w-14",
            )}
          >
            <Play
              className={cn("text-white", interactive ? "size-5" : "size-6")}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <img
      src={item.url}
      alt="Archive media"
      className={cn(
        "h-auto w-full object-cover",
        interactive &&
          "transition-transform duration-500 group-hover:scale-[1.02]",
      )}
    />
  );
}

export function MediaMasonry({
  items,
  onItemClick,
  adminMode = false,
  onDeleteItem,
  onReorder,
}: MediaMasonryProps) {
  if (items.length === 0) {
    return null;
  }

  return (
    <OrderedMasonry
      items={items}
      gap={16}
      sortable={adminMode}
      onReorder={onReorder}
      getItemId={(item) => item.id}
      renderItem={({
        item,
        index,
        dragHandleProps,
        isDragOverlay,
        isDragging,
      }) => {
        if (adminMode) {
          const dragHandleRef = dragHandleProps?.ref as
            | Ref<HTMLButtonElement>
            | undefined;

          return (
            <div
              className={cn(
                "group relative",
                isDragOverlay &&
                  "rotate-[1.2deg] scale-[1.01] shadow-[0_18px_50px_rgba(0,0,0,0.34)]",
                isDragging && "opacity-0",
              )}
            >
              <div
                role="button"
                tabIndex={0}
                onClick={() => onItemClick?.(index)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    onItemClick?.(index);
                  }
                }}
                className="relative block w-full overflow-hidden rounded-[1.6rem] border border-white/10 bg-black/20 text-left outline-none"
              >
                <button
                  type="button"
                  ref={dragHandleRef}
                  {...(dragHandleProps?.attributes ?? {})}
                  {...(dragHandleProps?.listeners ?? {})}
                  onClick={(event) => event.stopPropagation()}
                  className={cn(
                    floatingIconButtonClass,
                    "absolute left-3 top-3 z-10 cursor-grab active:cursor-grabbing",
                  )}
                  aria-label="Drag to reorder"
                  title="Drag to reorder"
                >
                  <GripVertical className="size-4" />
                </button>

                <div
                  className={floatingActionPillClass}
                  onClick={(event) => event.stopPropagation()}
                >
                  <button
                    type="button"
                    onClick={() => onItemClick?.(index)}
                    className={floatingIconButtonClass}
                    aria-label="Preview item"
                    title="Preview"
                  >
                    <Eye className="size-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => onDeleteItem?.(item.id)}
                    className={floatingIconButtonClass}
                    aria-label="Remove item"
                    title="Remove"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>

                <MediaPreview item={item} interactive />
              </div>
            </div>
          );
        }

        return (
          <button
            type="button"
            onClick={() => onItemClick?.(index)}
            className="group block w-full overflow-hidden rounded-[1.6rem] border border-white/10 bg-black/20 text-left"
          >
            <MediaPreview item={item} interactive />
          </button>
        );
      }}
    />
  );
}
