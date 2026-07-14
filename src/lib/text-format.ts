export type FormatType = "bold" | "italic" | "code";

// Markers for each format type
const FORMAT_MARKERS: Record<FormatType, string> = {
  bold: "**",
  italic: "*",
  code: "`",
};

/**
 * Apply formatting to a text selection by wrapping with markers
 */
export function applyFormat(
  value: string,
  selectionStart: number,
  selectionEnd: number,
  format: FormatType,
): { newValue: string; newSelectionStart: number; newSelectionEnd: number } {
  const marker = FORMAT_MARKERS[format];
  const selectedText = value.substring(selectionStart, selectionEnd);

  // Check if the selected text is already wrapped with this format
  if (
    selectedText.startsWith(marker) &&
    selectedText.endsWith(marker) &&
    selectedText.length > marker.length * 2
  ) {
    // Remove the format
    const unwrapped = selectedText.slice(marker.length, -marker.length);
    const newValue =
      value.substring(0, selectionStart) + unwrapped + value.substring(selectionEnd);
    return { newValue, newSelectionStart: selectionStart, newSelectionEnd: newValue.length };
  }

  // Apply the format
  const wrapped = `${marker}${selectedText}${marker}`;
  const newValue =
    value.substring(0, selectionStart) + wrapped + value.substring(selectionEnd);

  // Move cursor to after the closing marker
  const cursorPosition = selectionStart + wrapped.length;
  return {
    newValue,
    newSelectionStart: cursorPosition,
    newSelectionEnd: cursorPosition,
  };
}