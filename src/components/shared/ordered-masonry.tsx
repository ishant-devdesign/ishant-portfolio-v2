"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useDraggable,
  useSensor,
  useSensors,
  type DragCancelEvent,
  type DragEndEvent,
  type DragMoveEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { cn } from "@/lib/utils";

type DragHandleProps = {
  ref?: (node: HTMLElement | null) => void;
  attributes: Record<string, any>;
  listeners: Record<string, any>;
};

type OrderedMasonryProps<T> = {
  items: T[];
  getItemId: (item: T) => string;
  renderItem: (args: {
    item: T;
    index: number;
    width: number;
    isDragging: boolean;
    isDragOverlay: boolean;
    dragHandleProps?: DragHandleProps;
  }) => ReactNode;
  gap?: number;
  className?: string;
  itemClassName?: string;
  estimatedHeight?: number;
  transitionMs?: number;
  getColumnCount?: (viewportWidth: number) => number;
  sortable?: boolean;
  onReorder?: (nextItems: T[]) => void;
};

type MasonryPosition = {
  x: number;
  y: number;
  width: number;
  height: number;
};

type ColumnEntry = {
  id: string;
  y: number;
  height: number;
  index: number;
};

type ComputedLayout = {
  positions: Map<string, MasonryPosition>;
  containerHeight: number;
  columns: ColumnEntry[][];
};

type ClientPoint = {
  x: number;
  y: number;
};

function defaultGetColumnCount(viewportWidth: number) {
  if (viewportWidth >= 1280) return 3;
  if (viewportWidth >= 640) return 2;
  return 1;
}

function sameOrder<T>(a: T[], b: T[], getItemId: (item: T) => string): boolean {
  if (a.length !== b.length) return false;

  for (let index = 0; index < a.length; index += 1) {
    if (getItemId(a[index]) !== getItemId(b[index])) {
      return false;
    }
  }

  return true;
}

function composeRefs<T>(
  ...refs: Array<((node: T | null) => void) | undefined>
) {
  return (node: T | null) => {
    refs.forEach((ref) => ref?.(node));
  };
}

function arrayMove<T>(array: T[], from: number, to: number) {
  if (from === to) return array;

  const next = [...array];
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved);
  return next;
}

function getClientPointFromEvent(
  event: Event | null | undefined,
): ClientPoint | null {
  if (!event) return null;

  if ("clientX" in event && "clientY" in event) {
    return {
      x: Number(event.clientX),
      y: Number(event.clientY),
    };
  }

  if ("touches" in event && event.touches?.[0]) {
    return {
      x: event.touches[0].clientX,
      y: event.touches[0].clientY,
    };
  }

  if ("changedTouches" in event && event.changedTouches?.[0]) {
    return {
      x: event.changedTouches[0].clientX,
      y: event.changedTouches[0].clientY,
    };
  }

  return null;
}

function computeOrderedLayout<T>({
  items,
  getItemId,
  columnCount,
  columnWidth,
  gap,
  measuredHeights,
  estimatedHeight,
}: {
  items: T[];
  getItemId: (item: T) => string;
  columnCount: number;
  columnWidth: number;
  gap: number;
  measuredHeights: Record<string, number>;
  estimatedHeight?: number;
}): ComputedLayout {
  const columnHeights = Array.from({ length: columnCount }, () => 0);
  const positions = new Map<string, MasonryPosition>();
  const columns: ColumnEntry[][] = Array.from(
    { length: columnCount },
    () => [],
  );

  const fallbackHeight =
    estimatedHeight ?? Math.max(180, Math.round(columnWidth * 0.72));

  items.forEach((item, index) => {
    const id = getItemId(item);
    const columnIndex = index % columnCount;
    const x = columnIndex * (columnWidth + gap);
    const y = columnHeights[columnIndex];
    const height = measuredHeights[id] ?? fallbackHeight;

    positions.set(id, {
      x,
      y,
      width: columnWidth,
      height,
    });

    columns[columnIndex].push({
      id,
      y,
      height,
      index,
    });

    columnHeights[columnIndex] = y + height + gap;
  });

  return {
    positions,
    columns,
    containerHeight: items.length > 0 ? Math.max(...columnHeights) - gap : 0,
  };
}

function findNearestColumn({
  pointerX,
  columnCount,
  columnWidth,
  gap,
}: {
  pointerX: number;
  columnCount: number;
  columnWidth: number;
  gap: number;
}) {
  const trackWidth = columnCount * columnWidth + (columnCount - 1) * gap;
  const clampedX = Math.max(0, Math.min(trackWidth - 1, pointerX));

  let bestColumn = 0;
  let bestDistance = Number.POSITIVE_INFINITY;

  for (let column = 0; column < columnCount; column += 1) {
    const centerX = column * (columnWidth + gap) + columnWidth / 2;
    const distance = Math.abs(clampedX - centerX);

    if (distance < bestDistance) {
      bestDistance = distance;
      bestColumn = column;
    }
  }

  return bestColumn;
}

function projectInsertIndex<T>({
  pointerX,
  pointerY,
  itemsWithoutActive,
  layoutWithoutActive,
  columnCount,
  columnWidth,
  gap,
}: {
  pointerX: number;
  pointerY: number;
  itemsWithoutActive: T[];
  layoutWithoutActive: ComputedLayout;
  columnCount: number;
  columnWidth: number;
  gap: number;
}) {
  if (itemsWithoutActive.length === 0) {
    return 0;
  }

  const targetColumn = findNearestColumn({
    pointerX,
    columnCount,
    columnWidth,
    gap,
  });

  const entries = layoutWithoutActive.columns[targetColumn] ?? [];

  let slot = 0;
  while (
    slot < entries.length &&
    pointerY > entries[slot].y + entries[slot].height / 2
  ) {
    slot += 1;
  }

  const rawIndex = slot * columnCount + targetColumn;
  return Math.max(0, Math.min(itemsWithoutActive.length, rawIndex));
}

function StaticMasonryItem<T>({
  id,
  item,
  index,
  position,
  transitionMs,
  measureRef,
  itemClassName,
  renderItem,
}: {
  id: string;
  item: T;
  index: number;
  position: MasonryPosition;
  transitionMs: number;
  measureRef: (node: HTMLDivElement | null) => void;
  itemClassName?: string;
  renderItem: OrderedMasonryProps<T>["renderItem"];
}) {
  const style: CSSProperties = {
    position: "absolute",
    top: position.y,
    left: position.x,
    width: position.width,
    transitionProperty: "top, left, width, opacity",
    transitionDuration: `${transitionMs}ms`,
    transitionTimingFunction: "cubic-bezier(0.22, 1, 0.36, 1)",
  };

  return (
    <div
      ref={measureRef}
      className={cn("w-full", itemClassName)}
      style={style}
      data-masonry-id={id}
    >
      {renderItem({
        item,
        index,
        width: position.width,
        isDragging: false,
        isDragOverlay: false,
      })}
    </div>
  );
}

function DraggableMasonryItem<T>({
  id,
  item,
  index,
  position,
  transitionMs,
  measureRef,
  itemClassName,
  renderItem,
}: {
  id: string;
  item: T;
  index: number;
  position: MasonryPosition;
  transitionMs: number;
  measureRef: (node: HTMLDivElement | null) => void;
  itemClassName?: string;
  renderItem: OrderedMasonryProps<T>["renderItem"];
}) {
  const { setNodeRef, attributes, listeners, isDragging } = useDraggable({
    id,
  });

  const style: CSSProperties = {
    position: "absolute",
    top: position.y,
    left: position.x,
    width: position.width,
    transitionProperty: "top, left, width, opacity",
    transitionDuration: `${transitionMs}ms`,
    transitionTimingFunction: "cubic-bezier(0.22, 1, 0.36, 1)",
    opacity: isDragging ? 0 : 1,
    pointerEvents: isDragging ? "none" : undefined,
  };

  const dragHandleProps: DragHandleProps = {
    attributes: attributes as Record<string, any>,
    listeners: (listeners ?? {}) as Record<string, any>,
  };

  return (
    <div
      ref={composeRefs<HTMLDivElement>(setNodeRef, measureRef)}
      className={cn("w-full", itemClassName)}
      style={style}
      data-masonry-id={id}
    >
      {renderItem({
        item,
        index,
        width: position.width,
        isDragging,
        isDragOverlay: false,
        dragHandleProps,
      })}
    </div>
  );
}

export function OrderedMasonry<T>({
  items,
  getItemId,
  renderItem,
  gap = 16,
  className,
  itemClassName,
  estimatedHeight,
  transitionMs = 280,
  getColumnCount = defaultGetColumnCount,
  sortable = false,
  onReorder,
}: OrderedMasonryProps<T>) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const itemObserverRef = useRef<ResizeObserver | null>(null);
  const itemNodesRef = useRef(new Map<string, HTMLDivElement>());
  const syncPendingRef = useRef(false);
  const draftItemsRef = useRef(items);
  const startItemsRef = useRef(items);
  const dragStartPointerRef = useRef<ClientPoint | null>(null);

  const [containerWidth, setContainerWidth] = useState(0);
  const [viewportWidth, setViewportWidth] = useState(0);
  const [measuredHeights, setMeasuredHeights] = useState<
    Record<string, number>
  >({});
  const [activeId, setActiveId] = useState<string | null>(null);
  const [draftItems, setDraftItems] = useState(items);
  const [overlayWidth, setOverlayWidth] = useState<number | null>(null);

  useEffect(() => {
    draftItemsRef.current = draftItems;
  }, [draftItems]);

  useEffect(() => {
    if (activeId !== null) return;

    if (syncPendingRef.current) {
      if (sameOrder(items, draftItemsRef.current, getItemId)) {
        syncPendingRef.current = false;
      }
      return;
    }

    if (!sameOrder(items, draftItemsRef.current, getItemId)) {
      setDraftItems(items);
      draftItemsRef.current = items;
    }
  }, [activeId, getItemId, items]);

  useEffect(() => {
    function updateViewportWidth() {
      setViewportWidth(window.innerWidth);
    }

    updateViewportWidth();
    window.addEventListener("resize", updateViewportWidth);

    return () => {
      window.removeEventListener("resize", updateViewportWidth);
    };
  }, []);

  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;

    const measure = () => {
      const nextWidth = Math.ceil(node.getBoundingClientRect().width);
      if (nextWidth > 0) {
        setContainerWidth(nextWidth);
      }
    };

    measure();
    const frame = window.requestAnimationFrame(measure);

    const observer = new ResizeObserver(() => {
      measure();
    });

    observer.observe(node);
    window.addEventListener("resize", measure);

    return () => {
      window.cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, []);

  useEffect(() => {
    const observer = new ResizeObserver((entries) => {
      setMeasuredHeights((current) => {
        let changed = false;
        const next = { ...current };

        for (const entry of entries) {
          const target = entry.target as HTMLDivElement;
          const id = target.dataset.masonryId;
          if (!id) continue;

          const nextHeight = Math.ceil(entry.contentRect.height);
          if (next[id] !== nextHeight) {
            next[id] = nextHeight;
            changed = true;
          }
        }

        return changed ? next : current;
      });
    });

    itemObserverRef.current = observer;

    for (const [id, node] of itemNodesRef.current.entries()) {
      node.dataset.masonryId = id;
      observer.observe(node);
    }

    return () => {
      observer.disconnect();
      itemObserverRef.current = null;
    };
  }, []);

  useEffect(() => {
    const validIds = new Set(items.map(getItemId));

    setMeasuredHeights((current) => {
      let changed = false;
      const next: Record<string, number> = {};

      for (const [id, height] of Object.entries(current)) {
        if (validIds.has(id)) {
          next[id] = height;
        } else {
          changed = true;
        }
      }

      return changed ? next : current;
    });
  }, [getItemId, items]);

  const registerItemNode = useCallback(
    (id: string) => (node: HTMLDivElement | null) => {
      const previous = itemNodesRef.current.get(id);

      if (previous && itemObserverRef.current) {
        itemObserverRef.current.unobserve(previous);
      }

      if (!node) {
        itemNodesRef.current.delete(id);
        return;
      }

      node.dataset.masonryId = id;
      itemNodesRef.current.set(id, node);

      if (itemObserverRef.current) {
        itemObserverRef.current.observe(node);
      }
    },
    [],
  );

  const hasMeasuredContainer = containerWidth > 0;
  const resolvedViewportWidth =
    viewportWidth > 0
      ? viewportWidth
      : typeof window !== "undefined"
        ? window.innerWidth
        : 0;

  const columnCount = Math.max(1, getColumnCount(resolvedViewportWidth || 0));

  const columnWidth =
    hasMeasuredContainer && columnCount > 0
      ? (containerWidth - gap * (columnCount - 1)) / columnCount
      : 0;

  const displayItems = sortable ? draftItems : items;

  const layout = useMemo(() => {
    if (!hasMeasuredContainer || columnWidth <= 0) {
      return {
        positions: new Map<string, MasonryPosition>(),
        containerHeight: 0,
        columns: Array.from({ length: Math.max(1, columnCount) }, () => []),
      } as ComputedLayout;
    }

    return computeOrderedLayout({
      items: displayItems,
      getItemId,
      columnCount,
      columnWidth,
      gap,
      measuredHeights,
      estimatedHeight,
    });
  }, [
    columnCount,
    columnWidth,
    displayItems,
    estimatedHeight,
    gap,
    getItemId,
    hasMeasuredContainer,
    measuredHeights,
  ]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
  );

  const activeItem =
    activeId !== null
      ? (draftItemsRef.current.find((item) => getItemId(item) === activeId) ??
        items.find((item) => getItemId(item) === activeId) ??
        null)
      : null;

  const activeIndex =
    activeId !== null
      ? draftItems.findIndex((item) => getItemId(item) === activeId)
      : -1;

  function handleDragStart(event: DragStartEvent) {
    const nextActiveId = String(event.active.id);

    syncPendingRef.current = false;
    startItemsRef.current = items;
    draftItemsRef.current = items;
    setDraftItems(items);
    setActiveId(nextActiveId);

    dragStartPointerRef.current = getClientPointFromEvent(
      event.activatorEvent as Event | undefined,
    );

    const nextOverlayWidth =
      event.active.rect.current.initial?.width ??
      event.active.rect.current.translated?.width ??
      columnWidth;

    setOverlayWidth(nextOverlayWidth || columnWidth);
  }

  function handleDragMove(event: DragMoveEvent) {
    if (!containerRef.current) return;
    if (!activeId) return;

    const startPointer = dragStartPointerRef.current;
    if (!startPointer) return;

    const pointerXViewport = startPointer.x + event.delta.x;
    const pointerYViewport = startPointer.y + event.delta.y;

    const containerRect = containerRef.current.getBoundingClientRect();
    const pointerX = pointerXViewport - containerRect.left;
    const pointerY = pointerYViewport - containerRect.top;

    setDraftItems((current) => {
      const currentActiveIndex = current.findIndex(
        (item) => getItemId(item) === activeId,
      );
      if (currentActiveIndex === -1) return current;

      const activeItemInCurrent = current[currentActiveIndex];
      const itemsWithoutActive = current.filter(
        (item) => getItemId(item) !== activeId,
      );

      const layoutWithoutActive = computeOrderedLayout({
        items: itemsWithoutActive,
        getItemId,
        columnCount,
        columnWidth,
        gap,
        measuredHeights,
        estimatedHeight,
      });

      const targetIndex = projectInsertIndex({
        pointerX,
        pointerY,
        itemsWithoutActive,
        layoutWithoutActive,
        columnCount,
        columnWidth,
        gap,
      });

      const next = [...itemsWithoutActive];
      next.splice(targetIndex, 0, activeItemInCurrent);

      if (sameOrder(current, next, getItemId)) {
        return current;
      }

      draftItemsRef.current = next;
      return next;
    });
  }

  function handleDragCancel(_event: DragCancelEvent) {
    syncPendingRef.current = false;
    dragStartPointerRef.current = null;
    setActiveId(null);
    setOverlayWidth(null);
    draftItemsRef.current = startItemsRef.current;
    setDraftItems(startItemsRef.current);
  }

  function handleDragEnd(_event: DragEndEvent) {
    const finalItems = draftItemsRef.current;
    const startItems = startItemsRef.current;
    const changed = !sameOrder(startItems, finalItems, getItemId);

    dragStartPointerRef.current = null;
    setActiveId(null);
    setOverlayWidth(null);

    if (!changed) {
      syncPendingRef.current = false;
      draftItemsRef.current = startItems;
      setDraftItems(startItems);
      return;
    }

    syncPendingRef.current = true;
    draftItemsRef.current = finalItems;
    setDraftItems(finalItems);
    onReorder?.(finalItems);
  }

  if (!hasMeasuredContainer) {
    return (
      <div ref={containerRef} className={cn("relative w-full", className)}>
        <div className="space-y-4">
          {displayItems.map((item, index) => {
            const id = getItemId(item);

            return (
              <div
                key={id}
                ref={registerItemNode(id)}
                className={cn("w-full", itemClassName)}
                data-masonry-id={id}
              >
                {renderItem({
                  item,
                  index,
                  width: 0,
                  isDragging: false,
                  isDragOverlay: false,
                })}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  const content = (
    <div
      ref={containerRef}
      className={cn("relative w-full", className)}
      style={{ height: layout.containerHeight }}
    >
      {displayItems.map((item, index) => {
        const id = getItemId(item);
        const position = layout.positions.get(id);

        if (!position) return null;

        if (sortable) {
          return (
            <DraggableMasonryItem
              key={id}
              id={id}
              item={item}
              index={index}
              position={position}
              transitionMs={transitionMs}
              measureRef={registerItemNode(id)}
              itemClassName={itemClassName}
              renderItem={renderItem}
            />
          );
        }

        return (
          <StaticMasonryItem
            key={id}
            id={id}
            item={item}
            index={index}
            position={position}
            transitionMs={transitionMs}
            measureRef={registerItemNode(id)}
            itemClassName={itemClassName}
            renderItem={renderItem}
          />
        );
      })}
    </div>
  );

  const overlay =
    activeItem && typeof document !== "undefined"
      ? createPortal(
          <DragOverlay dropAnimation={null}>
            <div
              className="pointer-events-none"
              style={{ width: overlayWidth ?? columnWidth }}
            >
              {renderItem({
                item: activeItem,
                index: activeIndex,
                width: overlayWidth ?? columnWidth,
                isDragging: false,
                isDragOverlay: true,
              })}
            </div>
          </DragOverlay>,
          document.body,
        )
      : null;

  if (!sortable) {
    return content;
  }

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragMove={handleDragMove}
      onDragCancel={handleDragCancel}
      onDragEnd={handleDragEnd}
    >
      {content}
      {overlay}
    </DndContext>
  );
}
