export type FormatType =
  | "bold"
  | "italic"
  | "code"
  | "highlight"
  | "pop"
  | "wavy";

export type FormatConfig = {
  open: string;
  close: string;
  label: string;
};

export const FORMAT_CONFIG: Record<FormatType, FormatConfig> = {
  bold: { open: "**", close: "**", label: "Bold" },
  italic: { open: "*", close: "*", label: "Italic" },
  code: { open: "`", close: "`", label: "Code" },
  highlight: { open: "==", close: "==", label: "Highlight" },
  pop: { open: "@@", close: "@@", label: "Pop" },
  wavy: { open: "__", close: "__", label: "Wavy" },
};

export const FORMAT_MARKERS: Record<FormatType, string> = {
  bold: "**",
  italic: "*",
  code: "`",
  highlight: "==",
  pop: "@@",
  wavy: "__",
};

export function applyFormat(
  value: string,
  selectionStart: number,
  selectionEnd: number,
  format: FormatType,
): { newValue: string; newSelectionStart: number; newSelectionEnd: number } {
  const { open, close } = FORMAT_CONFIG[format];
  const selected = value.substring(selectionStart, selectionEnd);

  if (
    selected.startsWith(open) &&
    selected.endsWith(close) &&
    selected.length > open.length + close.length
  ) {
    const unwrapped = selected.slice(open.length, -close.length);
    return {
      newValue:
        value.substring(0, selectionStart) +
        unwrapped +
        value.substring(selectionEnd),
      newSelectionStart: selectionStart,
      newSelectionEnd: selectionStart + unwrapped.length,
    };
  }

  const wrapped = `${open}${selected}${close}`;
  return {
    newValue:
      value.substring(0, selectionStart) +
      wrapped +
      value.substring(selectionEnd),
    newSelectionStart: selectionStart,
    newSelectionEnd: selectionStart + wrapped.length,
  };
}
