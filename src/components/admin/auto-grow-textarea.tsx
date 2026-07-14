"use client";

import { useEffect, useRef, useState } from "react";
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
    rect: DOMRect | null;
  }>({
    start: 0,
    end: 0,
    rect: null,
  });

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    element.style.height = "auto";
    element.style.height = `${Math.max(element.scrollHeight, 24)}px`;
  }, [value]);

  const handleSelectionChange = () => {
    const element = ref.current;
    if (!element || !enableFormatToolbar) return;

    const start = element.selectionStart;
    const end = element.selectionEnd;

    if (start !== end) {
      // Get textarea position
      const textareaRect = element.getBoundingClientRect();

      // Calculate position below the textarea
      const rect = {
        top: textareaRect.bottom + 8,
        left: textareaRect.left,
        width: end - start,
        height: 0,
        bottom: textareaRect.bottom,
        right: textareaRect.right,
        x: textareaRect.left,
        y: textareaRect.bottom + 8,
        toJSON: () => ({}),
      } as DOMRect;

      setSelectionInfo({ start, end, rect });
      setShowToolbar(true);
    } else {
      setShowToolbar(false);
    }
  };

  const handleFormat = (format: FormatType) => {
    const { start, end } = selectionInfo;
    const result = applyFormat(value, start, end, format);
    onChange(result.newValue);
    setShowToolbar(false);

    // Restore focus and set cursor position
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
    // Delay hiding to allow clicking toolbar buttons
    setTimeout(() => {
      setShowToolbar(false);
    }, 200);
  };

  // Render toolbar in a portal to avoid clipping issues
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
        onSelect={handleSelectionChange}
        onBlur={handleBlur}
        onMouseUp={handleSelectionChange}
        onKeyUp={handleSelectionChange}
        onTouchEnd={handleSelectionChange}
        placeholder={placeholder}
        className={className}
        style={{ ...style, overflow: "hidden", resize: "none" }}
      />
      {toolbarPortal}
    </div>
  );
}
