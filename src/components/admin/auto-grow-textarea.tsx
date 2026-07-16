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
  enableFormatToolbar?: boolean;
};

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

  div.style.width = `${element.offsetWidth}px`;
  div.style.height = "auto";

  div.textContent = element.value.substring(0, position);

  const span = document.createElement("span");
  span.textContent = element.value.substring(position) || ".";
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

  const lastMousePosRef = useRef<{ x: number; y: number } | null>(null);
  const isMouseDownRef = useRef(false);
  const mouseDownTimeRef = useRef<number>(0);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    element.style.height = "auto";
    element.style.height = `${Math.max(element.scrollHeight, 24)}px`;
  }, [value]);

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
        top = lastMousePosRef.current.y;
        left = lastMousePosRef.current.x;
      } else {
        try {
          const caret = getCaretCoordinates(element, end);
          const textareaRect = element.getBoundingClientRect();
          top = textareaRect.top + caret.top - element.scrollTop + caret.height;
          left = textareaRect.left + caret.left - element.scrollLeft;
        } catch {
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
    setShowToolbar(false);
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLTextAreaElement>) => {
    isMouseDownRef.current = false;
    lastMousePosRef.current = { x: e.clientX, y: e.clientY };
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
    if (isMouseDownRef.current) return;
    if (lastMousePosRef.current && Date.now() - mouseDownTimeRef.current < 300) {
      return;
    }
    updateToolbarPosition(false);
  };

  const handleKeyUp = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const isSelectionKey =
      e.shiftKey ||
      ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End"].includes(e.key);

    if (!isSelectionKey) {
      const el = ref.current;
      if (el && el.selectionStart === el.selectionEnd) {
        setShowToolbar(false);
      }
      return;
    }
    lastMousePosRef.current = null;
    updateToolbarPosition(false);
  };

  const handleFormat = (format: FormatType) => {
    const { start, end } = selectionInfo;
    const result = applyFormat(value, start, end, format);
    onChange(result.newValue);
    lastMousePosRef.current = null;
    setShowToolbar(false);

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
    setTimeout(() => {
      setShowToolbar(false);
      lastMousePosRef.current = null;
    }, 200);
  };

  const toolbarPortal =
    typeof document !== "undefined" && showToolbar && selectionInfo.rect ? (
      createPortal(
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
    ) : null;

  return (
    <div className="relative w-full flex-1 min-w-0">
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
