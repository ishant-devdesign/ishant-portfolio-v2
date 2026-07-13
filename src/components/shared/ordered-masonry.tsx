"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
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
  attributes: Record<string, any>;
  listeners: Record<string, any>;
};

type OrderedMasonryProps<T> = {
  items: T[];
  getItemId: (item: T) => string;
  getItemColumn: (item: T) => number | null | undefined;
  setItemColumn: (item: T, columnIndex: number) => T;
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
  getColumnCount?: (viewportWidth: number) => number;
  sortable?: boolean;
  onReorder?: (nextItems: T[]) => void;
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

// ─── Mobile drag fix: use TouchSensor for native touch handling ───────────

function isTouchDevice() {
  if (typeof window === "undefined") return false;
  return "ontouchstart" in window || navigator.maxTouchPoints > 0;
}

function composeRefs<T>(
  ...refs: Array<((node: T | null) => void) | undefined>
) {
  return (node: T | null) => {
    refs.forEach((ref) => ref?.(node));
  };
}

function getClientPointFromEvent(
  event: Event | null | undefined,
): ClientPoint | null {
  if (!event) return null;

  const mouseEvent = event as MouseEvent;
  if (
    typeof mouseEvent.clientX === "number" &&
    typeof mouseEvent.clientY === "number"
  ) {
    return {
      x: mouseEvent.clientX,
      y: mouseEvent.clientY,
    };
  }

  const touchEvent = event as TouchEvent;
  const touch = touchEvent.touches?.[0] ?? touchEvent.changedTouches?.[0];

  if (touch) {
    return {
      x: touch.clientX,
      y: touch.clientY,
    };
  }

  return null;
}

function groupItemsIntoColumns<T>({
  items,
  columnCount,
  getItemColumn,
}: {
  items: T[];
  columnCount: number;
  getItemColumn: (item: T) => number | null | undefined;
}) {
  const columns = Array.from({ length: columnCount }, () => [] as T[]);

  items.forEach((item, index) => {
    const rawColumn = getItemColumn(item);
    const fallbackColumn = index % columnCount;

    const resolvedColumn =
      typeof rawColumn === "number" &&
      Number.isInteger(rawColumn) &&
      rawColumn >= 0 &&
      rawColumn < columnCount
        ? rawColumn
        : fallbackColumn;

    columns[resolvedColumn].push(item);
  });

  return columns;
}

function flattenColumns<T>({
  columns,
  setItemColumn,
}: {
  columns: T[][];
  setItemColumn: (item: T, columnIndex: number) => T;
}) {
  return columns.flatMap((columnItems, columnIndex) =>
    columnItems.map((item) => setItemColumn(item, columnIndex)),
  );
}

function findTargetColumn({
  pointerX,
  containerWidth,
  columnCount,
  gap,
}: {
  pointerX: number;
  containerWidth: number;
  columnCount: number;
  gap: number;
}) {
  const columnWidth = (containerWidth - gap * (columnCount - 1)) / columnCount;
  const trackWidth = columnCount * columnWidth + (columnCount - 1) * gap;
  const clampedX = Math.max(0, Math.min(trackWidth - 1, pointerX));

  let bestColumn = 0;
  let bestDistance = Number.POSITIVE_INFINITY;

  for (let columnIndex = 0; columnIndex < columnCount; columnIndex += 1) {
    const centerX = columnIndex * (columnWidth + gap) + columnWidth / 2;
    const distance = Math.abs(clampedX - centerX);

    if (distance < bestDistance) {
      bestDistance = distance;
      bestColumn = columnIndex;
    }
  }

  return bestColumn;
}

function getInsertIndexInColumn<T>({
  pointerYViewport,
  columnItems,
  getItemId,
  itemNodesRef,
}: {
  pointerYViewport: number;
  columnItems: T[];
  getItemId: (item: T) => string;
  itemNodesRef: React.MutableRefObject<Map<string, HTMLDivElement>>;
}) {
  if (columnItems.length === 0) {
    return 0;
  }

  for (let index = 0; index < columnItems.length; index += 1) {
    const item = columnItems[index];
    const id = getItemId(item);
    const node = itemNodesRef.current.get(id);

    if (!node) continue;

    const rect = node.getBoundingClientRect();
    const midpoint = rect.top + rect.height / 2;

    if (pointerYViewport < midpoint) {
      return index;
    }
  }

  return columnItems.length;
}

function StaticColumnItem<T>({
  id,
  item,
  index,
  width,
  itemClassName,
  measureRef,
  renderItem,
}: {
  id: string;
  item: T;
  index: number;
  width: number;
  itemClassName?: string;
  measureRef: (node: HTMLDivElement | null) => void;
  renderItem: OrderedMasonryProps<T>["renderItem"];
}) {
  return (
    <div
      ref={measureRef}
      className={cn("w-full", itemClassName)}
      data-masonry-id={id}
    >
      {renderItem({
        item,
        index,
        width,
        isDragging: false,
        isDragOverlay: false,
      })}
    </div>
  );
}

function DraggableColumnItem<T>({
  id,
  item,
  index,
  width,
  itemClassName,
  measureRef,
  renderItem,
}: {
  id: string;
  item: T;
  index: number;
  width: number;
  itemClassName?: string;
  measureRef: (node: HTMLDivElement | null) => void;
  renderItem: OrderedMasonryProps<T>["renderItem"];
}) {
  const { setNodeRef, attributes, listeners, isDragging } = useDraggable({
    id,
  });

  const dragHandleProps: DragHandleProps = {
    attributes: attributes as Record<string, any>,
    listeners: (listeners ?? {}) as Record<string, any>,
  };

  return (
    <div
      ref={composeRefs<HTMLDivElement>(setNodeRef, measureRef)}
      className={cn(
        "w-full transition-opacity duration-200",
        isDragging ? "pointer-events-none opacity-0" : "opacity-100",
        itemClassName,
      )}
      data-masonry-id={id}
    >
      {renderItem({
        item,
        index,
        width,
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
  getItemColumn,
  setItemColumn,
  renderItem,
  gap = 16,
  className,
  itemClassName,
  getColumnCount = defaultGetColumnCount,
  sortable = false,
  onReorder,
}: OrderedMasonryProps<T>) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const itemNodesRef = useRef(new Map<string, HTMLDivElement>());
  const syncPendingRef = useRef(false);
  const draftItemsRef = useRef(items);
  const startItemsRef = useRef(items);
  const dragStartPointerRef = useRef<ClientPoint | null>(null);

  const [containerWidth, setContainerWidth] = useState(0);
  const [viewportWidth, setViewportWidth] = useState(0);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [draftItems, setDraftItems] = useState(items);
  const [overlayWidth, setOverlayWidth] = useState<number | null>(null);

  useEffect(() => {
    draftItemsRef.current = draftItems;
  }, [draftItems]);

  useEffect(() => {
    if (activeId !== null) return;

    const sameIdOrder = sameOrder(items, draftItemsRef.current, getItemId);

    if (syncPendingRef.current) {
      if (sameIdOrder) {
        syncPendingRef.current = false;

        if (draftItemsRef.current !== items) {
          draftItemsRef.current = items;
          setDraftItems(items);
        }
      }
      return;
    }

    if (draftItemsRef.current !== items) {
      draftItemsRef.current = items;
      setDraftItems(items);
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
      const width = Math.ceil(node.getBoundingClientRect().width);
      if (width > 0) {
        setContainerWidth(width);
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

  const registerItemNode = useCallback(
    (id: string) => (node: HTMLDivElement | null) => {
      if (!node) {
        itemNodesRef.current.delete(id);
        return;
      }

      itemNodesRef.current.set(id, node);
    },
    [],
  );

  const resolvedViewportWidth =
    viewportWidth > 0
      ? viewportWidth
      : typeof window !== "undefined"
        ? window.innerWidth
        : 0;

  const columnCount = Math.max(1, getColumnCount(resolvedViewportWidth || 0));

  const columnWidth =
    containerWidth > 0
      ? (containerWidth - gap * (columnCount - 1)) / columnCount
      : 0;

  const displayItems = sortable ? draftItems : items;

  const columns = useMemo(
    () =>
      groupItemsIntoColumns({
        items: displayItems,
        columnCount,
        getItemColumn,
      }),
    [columnCount, displayItems, getItemColumn],
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

  // Use both PointerSensor and TouchSensor for cross-platform support
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 5,
      },
    }),
  );

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

    const activeNode = itemNodesRef.current.get(nextActiveId);
    setOverlayWidth(
      activeNode
        ? Math.ceil(activeNode.getBoundingClientRect().width)
        : Math.ceil(columnWidth || 0),
    );
  }

  function handleDragMove(event: DragMoveEvent) {
    if (!containerRef.current || !activeId || containerWidth <= 0) return;

    const startPointer = dragStartPointerRef.current;
    if (!startPointer) return;

    const pointerXViewport = startPointer.x + event.delta.x;
    const pointerYViewport = startPointer.y + event.delta.y;

    const containerRect = containerRef.current.getBoundingClientRect();
    const pointerXLocal = pointerXViewport - containerRect.left;

    setDraftItems((current) => {
      const currentColumns = groupItemsIntoColumns({
        items: current,
        columnCount,
        getItemColumn,
      });

      let activeItemLocal: T | null = null;

      const columnsWithoutActive = currentColumns.map((columnItems) =>
        columnItems.filter((item) => {
          const isActive = getItemId(item) === activeId;
          if (isActive) {
            activeItemLocal = item;
          }
          return !isActive;
        }),
      );

      if (!activeItemLocal) {
        return current;
      }

      const targetColumn = findTargetColumn({
        pointerX: pointerXLocal,
        containerWidth,
        columnCount,
        gap,
      });

      const insertIndex = getInsertIndexInColumn({
        pointerYViewport,
        columnItems: columnsWithoutActive[targetColumn],
        getItemId,
        itemNodesRef,
      });

      const nextColumns = columnsWithoutActive.map((columnItems) => [
        ...columnItems,
      ]);

      nextColumns[targetColumn].splice(insertIndex, 0, activeItemLocal);

      const nextItems = flattenColumns({
        columns: nextColumns,
        setItemColumn,
      });

      if (sameOrder(current, nextItems, getItemId)) {
        return current;
      }

      draftItemsRef.current = nextItems;
      return nextItems;
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

  const content = (
    <div
      ref={containerRef}
      className={cn("w-full", className)}
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(${columnCount}, minmax(0, 1fr))`,
        columnGap: `${gap}px`,
        alignItems: "start",
        // Prevent touch scrolling during active drag on mobile
        touchAction: activeId ? "none" : undefined,
      }}
    >
      {columns.map((columnItems, columnIndex) => (
        <div
          key={`column-${columnIndex}`}
          className="flex min-w-0 flex-col"
          style={{ rowGap: `${gap}px` }}
        >
          {columnItems.map((item) => {
            const id = getItemId(item);
            const index = displayItems.findIndex(
              (entry) => getItemId(entry) === id,
            );

            if (sortable) {
              return (
                <DraggableColumnItem
                  key={id}
                  id={id}
                  item={item}
                  index={index}
                  width={columnWidth}
                  itemClassName={itemClassName}
                  measureRef={registerItemNode(id)}
                  renderItem={renderItem}
                />
              );
            }

            return (
              <StaticColumnItem
                key={id}
                id={id}
                item={item}
                index={index}
                width={columnWidth}
                itemClassName={itemClassName}
                measureRef={registerItemNode(id)}
                renderItem={renderItem}
              />
            );
          })}
        </div>
      ))}
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
