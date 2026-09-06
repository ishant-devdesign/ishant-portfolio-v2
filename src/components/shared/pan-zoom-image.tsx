"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Minus, Plus, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";

const MIN_SCALE = 1;
const MAX_SCALE = 5;
const ZOOM_STEP = 0.35;
const PILL_INNER_HEIGHT = 32;
const PILL_OUTER_PADDING = 8;
const PILL_TOTAL_HEIGHT = PILL_INNER_HEIGHT + PILL_OUTER_PADDING * 2;
const PILL_BOTTOM_OFFSET = 18;
const PILL_IMAGE_GAP = 12;

const sideNavPillShellClass =
  "relative inline-flex items-center overflow-hidden rounded-full p-2 text-white";
const sideNavPillSurfaceClass =
  "pointer-events-none absolute inset-0 rounded-full bg-white/[0.055]";

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function PanZoomImage({
  src,
  alt,
  caption,
  className,
}: {
  src: string;
  alt: string;
  caption?: string | null;
  className?: string;
}) {
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const frameRef = useRef<HTMLDivElement | null>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const dragRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    originX: number;
    originY: number;
  } | null>(null);
  const scaleRef = useRef(1);
  const offsetRef = useRef({ x: 0, y: 0 });

  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);

  const hasCaption = Boolean(caption?.trim());
  const displayCaption = caption?.trim() || "";
  const imageBottomInset = hasCaption
    ? PILL_TOTAL_HEIGHT + PILL_BOTTOM_OFFSET + PILL_IMAGE_GAP
    : 0;

  const setScaleValue = (nextScale: number) => {
    scaleRef.current = nextScale;
    setScale(nextScale);
  };

  const setOffsetValue = (nextOffset: { x: number; y: number }) => {
    offsetRef.current = nextOffset;
    setOffset(nextOffset);
  };

  const clampOffset = useCallback(
    (nextOffset: { x: number; y: number }, nextScale: number) => {
      const frame = frameRef.current;
      const image = imageRef.current;

      if (!frame || !image || nextScale <= 1) {
        return { x: 0, y: 0 };
      }

      const frameRect = frame.getBoundingClientRect();
      const imageRect = image.getBoundingClientRect();
      const currentScale = Math.max(scaleRef.current, 1);
      const baseWidth = imageRect.width / currentScale;
      const baseHeight = imageRect.height / currentScale;
      const scaledWidth = baseWidth * nextScale;
      const scaledHeight = baseHeight * nextScale;

      const maxX = Math.max(0, (scaledWidth - frameRect.width) / 2);
      const maxY = Math.max(0, (scaledHeight - frameRect.height) / 2);

      return {
        x: clamp(nextOffset.x, -maxX, maxX),
        y: clamp(nextOffset.y, -maxY, maxY),
      };
    },
    [],
  );

  const applyScale = useCallback(
    (nextScale: number, anchor?: { x: number; y: number }) => {
      const clampedScale = clamp(nextScale, MIN_SCALE, MAX_SCALE);

      if (clampedScale <= 1) {
        setScaleValue(1);
        setOffsetValue({ x: 0, y: 0 });
        setDragging(false);
        dragRef.current = null;
        return;
      }

      const frame = frameRef.current;
      const currentScale = scaleRef.current;
      const currentOffset = offsetRef.current;
      let nextOffset = currentOffset;

      if (frame && anchor) {
        const rect = frame.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        const localX = (anchor.x - centerX - currentOffset.x) / currentScale;
        const localY = (anchor.y - centerY - currentOffset.y) / currentScale;

        nextOffset = {
          x: anchor.x - centerX - localX * clampedScale,
          y: anchor.y - centerY - localY * clampedScale,
        };
      }

      setScaleValue(clampedScale);
      setOffsetValue(clampOffset(nextOffset, clampedScale));
    },
    [clampOffset],
  );

  const resetTransform = useCallback(() => {
    setScaleValue(1);
    setOffsetValue({ x: 0, y: 0 });
    setDragging(false);
    dragRef.current = null;
  }, []);

  useEffect(() => {
    const handleResize = () => {
      setOffsetValue(clampOffset(offsetRef.current, scaleRef.current));
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [clampOffset]);

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    event.stopPropagation();
    if (scaleRef.current <= 1) return;

    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      originX: offsetRef.current.x,
      originY: offsetRef.current.y,
    };
    setDragging(true);
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;

    setOffsetValue(
      clampOffset(
        {
          x: drag.originX + (event.clientX - drag.startX),
          y: drag.originY + (event.clientY - drag.startY),
        },
        scaleRef.current,
      ),
    );
  };

  const endDragging = (event?: React.PointerEvent<HTMLDivElement>) => {
    if (event && dragRef.current?.pointerId === event.pointerId) {
      try {
        event.currentTarget.releasePointerCapture(event.pointerId);
      } catch {
        // Ignore capture-release issues across browsers.
      }
    }

    dragRef.current = null;
    setDragging(false);
  };

  const handleWheel = (event: React.WheelEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    const delta = event.deltaY < 0 ? ZOOM_STEP : -ZOOM_STEP;
    applyScale(scaleRef.current + delta, {
      x: event.clientX,
      y: event.clientY,
    });
  };

  const handleDoubleClick = (event: React.MouseEvent<HTMLDivElement>) => {
    event.stopPropagation();
    if (scaleRef.current > 1) {
      resetTransform();
      return;
    }

    applyScale(2, { x: event.clientX, y: event.clientY });
  };

  const cursorMode = useMemo(
    () => (scale > 1 ? (dragging ? "panning" : "pan") : "zoom"),
    [dragging, scale],
  );

  return (
    <div
      className={cn("relative h-full w-full", className)}
      onClick={(event) => event.stopPropagation()}
    >
      <div
        ref={viewportRef}
        data-cursor={scale > 1 ? "Pan image" : "Zoom image"}
        data-cursor-mode={cursorMode}
        data-cursor-no-snap="true"
        className="absolute inset-0 cursor-none"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={endDragging}
        onPointerCancel={endDragging}
        onLostPointerCapture={() => {
          dragRef.current = null;
          setDragging(false);
        }}
        onWheel={handleWheel}
        onDoubleClick={handleDoubleClick}
        style={{ touchAction: scale > 1 ? "none" : "manipulation" }}
      >
        <div
          ref={frameRef}
          className="absolute inset-x-0 top-0 flex items-center justify-center px-4 sm:px-6"
          style={{ bottom: `${imageBottomInset}px` }}
        >
          <img
            ref={imageRef}
            src={src}
            alt={alt}
            draggable={false}
            onDragStart={(event) => event.preventDefault()}
            className="max-h-full max-w-full select-none object-contain cursor-none"
            style={{
              transform: `translate3d(${offset.x}px, ${offset.y}px, 0) scale(${scale})`,
              transformOrigin: "center center",
              transition: dragging
                ? "none"
                : "transform 180ms cubic-bezier(0.22, 1, 0.36, 1)",
            }}
          />
        </div>
      </div>

      {hasCaption ? (
        <div
          className="pointer-events-none absolute inset-x-0 z-[3] flex justify-center px-4"
          style={{ bottom: `${PILL_BOTTOM_OFFSET}px` }}
        >
          <div
            className={cn(sideNavPillShellClass, "max-w-[min(92vw,56rem)]")}
            style={{
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
            }}
          >
            <span className={sideNavPillSurfaceClass} />
            <div className="relative z-10 flex h-8 items-center rounded-full px-4 text-center text-sm tracking-[-0.01em] text-white">
              <span className="line-clamp-1">{displayCaption}</span>
            </div>
          </div>
        </div>
      ) : null}

      <AnimatePresence>
        {scale > 1 ? (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.96 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="pointer-events-none absolute right-4 z-[4] flex justify-end sm:right-6"
            style={{ bottom: `${PILL_BOTTOM_OFFSET}px` }}
          >
            <div
              className={cn(sideNavPillShellClass, "pointer-events-auto gap-1")}
              style={{
                backdropFilter: "blur(12px)",
                WebkitBackdropFilter: "blur(12px)",
              }}
            >
              <span className={sideNavPillSurfaceClass} />

              <button
                type="button"
                onClick={() => applyScale(scaleRef.current - ZOOM_STEP)}
                disabled={scale <= MIN_SCALE}
                aria-label="Zoom out"
                title="Zoom out"
                className="relative z-10 flex h-8 w-8 items-center justify-center rounded-full text-white/70 transition-colors hover:bg-white/[0.055] hover:text-white disabled:opacity-35"
              >
                <Minus className="size-4" />
              </button>

              <button
                type="button"
                onClick={resetTransform}
                aria-label="Reset zoom"
                title="Reset zoom"
                className="relative z-10 inline-flex h-8 items-center gap-2 rounded-full px-3 text-sm text-white transition-colors hover:bg-white/[0.055]"
              >
                <RotateCcw className="size-3.5" />
                <span className="tabular-nums tracking-[-0.01em]">
                  {Math.round(scale * 100)}%
                </span>
              </button>

              <button
                type="button"
                onClick={() => applyScale(scaleRef.current + ZOOM_STEP)}
                disabled={scale >= MAX_SCALE}
                aria-label="Zoom in"
                title="Zoom in"
                className="relative z-10 flex h-8 w-8 items-center justify-center rounded-full text-white/70 transition-colors hover:bg-white/[0.055] hover:text-white disabled:opacity-35"
              >
                <Plus className="size-4" />
              </button>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
