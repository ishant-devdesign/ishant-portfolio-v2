/**
 * Zero-DOM-mutation highlighting via the CSS Custom Highlight API.
 * The ::highlight() rules are injected at runtime (not in globals.css)
 * because build-time CSS optimizers don't parse that pseudo-element yet.
 */

export const TTS_WORD_HIGHLIGHT = "tts-word";
export const TTS_SEGMENT_HIGHLIGHT = "tts-segment";

let stylesInjected = false;

function ensureHighlightStyles(): void {
  if (stylesInjected || typeof document === "undefined") return;
  stylesInjected = true;
  const style = document.createElement("style");
  style.dataset.ttsHighlights = "true";
  style.textContent = `
::highlight(${TTS_WORD_HIGHLIGHT}) {
  background-color: rgba(250, 204, 21, 0.28);
  color: #ffffff;
  border-radius: 3px;
  text-decoration: underline rgba(250, 204, 21, 0.55) 2px;
  text-underline-offset: 3px;
}
::highlight(${TTS_SEGMENT_HIGHLIGHT}) {
  background-color: rgba(250, 204, 21, 0.14);
  border-radius: 6px;
}
`;
  document.head.appendChild(style);
}

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
  ensureHighlightStyles();
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
