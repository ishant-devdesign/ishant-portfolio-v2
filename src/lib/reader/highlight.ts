/**
 * Zero-DOM-mutation highlighting via the CSS Custom Highlight API.
 * Ranges are styled through ::highlight() rules in globals.css.
 */

export const TTS_WORD_HIGHLIGHT = "tts-word";
export const TTS_SEGMENT_HIGHLIGHT = "tts-segment";

// Minimal structural types for the CSS Custom Highlight API (lib.dom may not
// include them yet in all TS versions).
type HighlightLike = new (...ranges: Range[]) => object;
interface HighlightRegistryLike {
  set(name: string, highlight: object): void;
  delete(name: string): void;
}

function getHighlightRegistry(): HighlightRegistryLike | undefined {
  return (CSS as unknown as { highlights?: HighlightRegistryLike }).highlights;
}

function getHighlightCtor(): HighlightLike | undefined {
  return (window as unknown as { Highlight?: HighlightLike }).Highlight;
}

export function highlightsSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof CSS !== "undefined" &&
    typeof getHighlightRegistry() !== "undefined" &&
    typeof getHighlightCtor() === "function"
  );
}

function setNamedHighlight(name: string, ranges: Range[]): void {
  if (!highlightsSupported()) return;
  const registry = getHighlightRegistry();
  const HighlightCtor = getHighlightCtor();
  if (!registry || !HighlightCtor) return;
  if (ranges.length === 0) {
    registry.delete(name);
    return;
  }
  registry.set(name, new HighlightCtor(...ranges));
}

export function setSegmentHighlight(element: HTMLElement | null): void {
  if (!element) {
    setNamedHighlight(TTS_SEGMENT_HIGHLIGHT, []);
    return;
  }
  const range = document.createRange();
  range.selectNodeContents(element);
  setNamedHighlight(TTS_SEGMENT_HIGHLIGHT, [range]);
}

export function setWordHighlight(range: Range | null): void {
  setNamedHighlight(TTS_WORD_HIGHLIGHT, range ? [range] : []);
}

export function clearReaderHighlights(): void {
  setNamedHighlight(TTS_WORD_HIGHLIGHT, []);
  setNamedHighlight(TTS_SEGMENT_HIGHLIGHT, []);
}
