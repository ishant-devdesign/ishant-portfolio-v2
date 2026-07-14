"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { TextFormatToolbar } from "@/components/editor/text-format-toolbar";
import { applyFormat, type FormatType } from "@/lib/text-format";

type AutoGrowTextareaProps = {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  placeholder?: string;
  style?: React.CSSProperties;
  /** Enable formatting toolbar (admin mode) */
  enableFormatToolbar?: boolean;
};

/**
 * Get caret coordinates inside a textarea, accounting for wrapping, padding, borders, scroll.
 * Based on the classic textarea-caret-position technique.
 */
function getCaretCoordinates(element: HTMLTextAreaElement, position: number) {
  const div = document.createElement("div");
  const computed = window.getComputedStyle(element);

  const props: (keyof CSSStyleDeclaration)[] = [
    "direction",
    "boxSizing",
    "width",
    "height",
    "overflowX",
    "overflowY",
    "borderTopWidth",
    "borderRightWidth",
    "borderBottomWidth",
    "borderLeftWidth",
    "borderStyle",
    "paddingTop",
    "paddingRight",
    "paddingBottom",
    "paddingLeft",
    "fontStyle",
    "fontVariant",
    "fontWeight",
    "fontStretch",
    "fontSize",
    "fontSizeAdjust",
    "lineHeight",
    "fontFamily",
    "textAlign",
    "textTransform",
    "textIndent",
    "textDecoration",
    "letterSpacing",
    "wordSpacing",
    "tabSize",
  ] as any;

  // Off-screen mirror
  div.style.position = "absolute";
  div.style.visibility = "hidden";
  div.style.whiteSpace = "pre-wrap";
  div.style.wordWrap = "break-word";
  div.style.wordBreak = "break-word";
  div.style.top = "0";
  div.style.left = "-9999px";
  div.style.overflow = "hidden";
  div.style.pointerEvents = "none";

  props.forEach((prop) => {
    div.style[prop as any] = computed[prop as any];
  });

  // Use offsetWidth for accurate wrapping (width includes padding + border when box-sizing is border-box)
  div.style.width = `${element.offsetWidth}px`;
  // Reset height - let it auto-grow to match content wrapping
  div.style.height = "auto";

  // Text up to caret
  div.textContent = element.value.substring(0, position);

  const span = document.createElement("span");
  // Use the next char or a dot placeholder at end of text to get height
  const remaining = element.value.substring(position);
  span.textContent = remaining[0] || ".";
  // Preserve line breaks visualization
  span.style.whiteSpace = "pre-wrap";

  div.appendChild(span);
  document.body.appendChild(div);

  const top = span.offsetTop;
  const left = span.offsetLeft;
  const height = span.offsetHeight || parseInt(computed.lineHeight) || 20;

  document.body.removeChild(div);

  return {
    top: top + (parseInt(computed.borderTopWidth) || 0),
    left: left + (parseInt(computed.borderLeftWidth) || 0),
    height,
  };
}

export function AutoGrowTextarea({
  value,
  onChange,
  className,
  placeholder,
  style,
  enableFormatToolbar = false,
}: AutoGrowTextareaProps) {
  const ref = useRef<HTMLTextAreaElement | null>(null);
  const [showToolbar, setShowToolbar] = useState(false);
  const [selectionInfo, setSelectionInfo] = useState<{
    start: number;
    end: number;
    rect: { top: number; left: number; width: number } | null;
  }>({
    start: 0,
    end: 0,
    rect: null,
  });

  // Track mouse interaction for precise positioning
  const lastMousePosRef = useRef<{ x: number; y: number } | null>(null);
  const isMouseDownRef = useRef(false);
  const mouseDownTimeRef = useRef<number>(0);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    element.style.height = "auto";
    element.style.height = `${Math.max(element.scrollHeight, 24)}px`;
  }, [value]);

  // Hide toolbar on scroll / resize - prevents detached floating
  useEffect(() => {
    if (!showToolbar) return;

    const hide = () => setShowToolbar(false);

    window.addEventListener("scroll", hide, true);
    window.addEventListener("resize", hide);
    return () => {
      window.removeEventListener("scroll", hide, true);
      window.removeEventListener("resize", hide);
    };
  }, [showToolbar]);

  const updateToolbarPosition = useCallback(
    (useMousePos: boolean) => {
      const element = ref.current;
      if (!element || !enableFormatToolbar) return;

      const start = element.selectionStart;
      const end = element.selectionEnd;

      if (start === end) {
        setShowToolbar(false);
        return;
      }

      let top: number;
      let left: number;

      const now = Date.now();
      const recentMouse =
        useMousePos &&
        lastMousePosRef.current &&
        now - mouseDownTimeRef.current < 800;

      if (recentMouse && lastMousePosRef.current) {
        // === MOUSE MODE: pill appears right where mouse-up happened ===
        top = lastMousePosRef.current.y;
        left = lastMousePosRef.current.x;
      } else {
        // === KEYBOARD / PROGRAMMATIC MODE: calculate caret position accounting for wrapping ===
        try {
          const caret = getCaretCoordinates(element, end);
          const textareaRect = element.getBoundingClientRect();

          // caret is relative to textarea's internal layout
          top = textareaRect.top + caret.top - element.scrollTop + caret.height;
          left = textareaRect.left + caret.left - element.scrollLeft;
        } catch {
          // Fallback below textarea if caret calculation fails
          const r = element.getBoundingClientRect();
          top = r.bottom + 8;
          left = r.left + 20;
        }
      }

      setSelectionInfo({
        start,
        end,
        rect: { top, left, width: end - start },
      });
      setShowToolbar(true);
    },
    [enableFormatToolbar],
  );

  const handleMouseDown = () => {
    isMouseDownRef.current = true;
    mouseDownTimeRef.current = Date.now();
    // Start of new selection - hide old toolbar immediately
    setShowToolbar(false);
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLTextAreaElement>) => {
    isMouseDownRef.current = false;
    lastMousePosRef.current = { x: e.clientX, y: e.clientY };
    // Let browser finalize selectionStart/End first
    requestAnimationFrame(() => {
      updateToolbarPosition(true);
    });
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLTextAreaElement>) => {
    isMouseDownRef.current = false;
    const touch = e.changedTouches?.[0];
    if (touch) {
      lastMousePosRef.current = { x: touch.clientX, y: touch.clientY };
    } else {
      lastMousePosRef.current = null;
    }
    requestAnimationFrame(() => {
      updateToolbarPosition(!!touch);
    });
  };

  const handleSelect = () => {
    // If mouse is still down, we're in the middle of drag - wait for mouseUp
    if (isMouseDownRef.current) return;
    // If we just had a mouseUp, that handler already positioned it - don't override
    if (
      lastMousePosRef.current &&
      Date.now() - mouseDownTimeRef.current < 300
    ) {
      return;
    }
    updateToolbarPosition(false);
  };

  const handleKeyUp = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Only show for selection-modifying keys
    const isSelectionKey =
      e.shiftKey ||
      [
        "ArrowLeft",
        "ArrowRight",
        "ArrowUp",
        "ArrowDown",
        "Home",
        "End",
      ].includes(e.key);

    if (!isSelectionKey) {
      // If user types, hide toolbar if selection collapses
      const el = ref.current;
      if (el && el.selectionStart === el.selectionEnd) {
        setShowToolbar(false);
      }
      return;
    }

    // Keyboard selection -> clear mouse pos so caret is used
    lastMousePosRef.current = null;
    updateToolbarPosition(false);
  };

  const handleFormat = (format: FormatType) => {
    const { start, end } = selectionInfo;
    const result = applyFormat(value, start, end, format);
    onChange(result.newValue);
    lastMousePosRef.current = null;
    setShowToolbar(false);

    // Restore focus and set cursor after formatting
    setTimeout(() => {
      const element = ref.current;
      if (element) {
        element.focus();
        element.setSelectionRange(
          result.newSelectionStart,
          result.newSelectionEnd,
        );
      }
    }, 0);
  };

  const handleBlur = () => {
    // Delay hiding to allow clicking toolbar buttons (toolbar is in portal)
    setTimeout(() => {
      // If toolbar is being interacted with, don't hide yet - toolbar handles outside clicks
      setShowToolbar(false);
      lastMousePosRef.current = null;
    }, 200);
  };

  const toolbarPortal =
    typeof document !== "undefined" && showToolbar && selectionInfo.rect
      ? createPortal(
          <TextFormatToolbar
            textareaRef={ref}
            visible={showToolbar}
            selectionRect={{
              top: selectionInfo.rect.top,
              left: selectionInfo.rect.left,
              width: selectionInfo.rect.width,
            }}
            onFormat={handleFormat}
          />,
          document.body,
        )
      : null;

  return (
    <div className="relative">
      <textarea
        ref={ref}
        rows={1}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onSelect={handleSelect}
        onBlur={handleBlur}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onKeyUp={handleKeyUp}
        onTouchStart={handleMouseDown}
        onTouchEnd={handleTouchEnd}
        placeholder={placeholder}
        className={className}
        style={{ ...style, overflow: "hidden", resize: "none" }}
      />
      {toolbarPortal}
    </div>
  );
}
