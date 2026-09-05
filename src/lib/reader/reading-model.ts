/**
 * Builds a reading model from the rendered article DOM.
 *
 * Readable content is discovered via:
 *  - [data-tts-read]       → explicitly tagged elements (article title, excerpt)
 *  - [data-tts-read-root]  → container holding content blocks; inside it we
 *                            pick semantic text elements (headings, p, li, blockquote)
 *
 * Each segment maps to one rendered element and carries word tokens with DOM
 * Ranges (for highlighting) plus sentence groupings (for AI-voice playback).
 */

export type WordToken = {
  /** character offset of the word inside the segment's flattened text */
  start: number;
  end: number;
  range: Range;
  /** true when sentence-ending punctuation follows the word */
  sentenceEnd: boolean;
};

export type ReadSegment = {
  element: HTMLElement;
  /** flattened raw text of the element (offsets match word tokens) */
  text: string;
  /** speech-friendly version of the text with common symbols expanded */
  spokenText: string;
  /** maps a raw-text offset to its equivalent offset inside spokenText */
  rawToSpokenOffset: (offset: number) => number;
  /** maps a spokenText offset back to the closest raw-text offset */
  spokenToRawOffset: (offset: number) => number;
  words: WordToken[];
  /** sentence groups as [startWord, endWordInclusive] word indexes */
  sentences: Array<{ startWord: number; endWord: number }>;
};

export type ReadingModel = {
  segments: ReadSegment[];
  totalWords: number;
};

const READABLE_SELECTOR = "h2, h3, h4, h5, p, li, blockquote";
const SKIP_SELECTOR = "[data-tts-skip], pre, code, iframe, button, svg";

const SPEECH_REPLACEMENTS = [
  { raw: ">=", spoken: " greater than or equal to " },
  { raw: "<=", spoken: " less than or equal to " },
  { raw: "=>", spoken: " to " },
  { raw: "->", spoken: " to " },
  { raw: "→", spoken: " to " },
  { raw: "←", spoken: " from " },
  { raw: "↔", spoken: " back and forth with " },
  { raw: ">", spoken: " greater than " },
  { raw: "<", spoken: " less than " },
  { raw: "&", spoken: " and " },
  { raw: "+", spoken: " plus " },
  { raw: "=", spoken: " equals " },
  { raw: "%", spoken: " percent " },
  { raw: "@", spoken: " at " },
  { raw: "/", spoken: " slash " },
  { raw: "#", spoken: " hash " },
  { raw: "×", spoken: " times " },
  { raw: "÷", spoken: " divided by " },
] as const;

function clampOffset(offset: number, max: number) {
  return Math.max(0, Math.min(offset, max));
}

function matchSpeechReplacement(text: string, index: number) {
  return SPEECH_REPLACEMENTS.find((entry) => text.startsWith(entry.raw, index));
}

function buildSpeechText(rawText: string) {
  const rawToSpoken = new Array<number>(rawText.length + 1).fill(0);
  const spokenToRaw: number[] = [];

  let spokenText = "";
  let rawIndex = 0;

  while (rawIndex < rawText.length) {
    rawToSpoken[rawIndex] = spokenText.length;

    const replacement = matchSpeechReplacement(rawText, rawIndex);
    if (replacement) {
      const startRaw = rawIndex;
      const startSpoken = spokenText.length;

      for (let i = startRaw + 1; i < startRaw + replacement.raw.length; i++) {
        rawToSpoken[i] = startSpoken;
      }

      for (const char of replacement.spoken) {
        spokenToRaw[spokenText.length] = startRaw;
        spokenText += char;
      }

      rawIndex += replacement.raw.length;
      rawToSpoken[rawIndex] = spokenText.length;
      continue;
    }

    spokenToRaw[spokenText.length] = rawIndex;
    spokenText += rawText[rawIndex];
    rawIndex += 1;
    rawToSpoken[rawIndex] = spokenText.length;
  }

  spokenToRaw[spokenText.length] = rawText.length;

  return {
    spokenText,
    rawToSpokenOffset(offset: number) {
      return (
        rawToSpoken[clampOffset(offset, rawText.length)] ?? spokenText.length
      );
    },
    spokenToRawOffset(offset: number) {
      return (
        spokenToRaw[clampOffset(offset, spokenText.length)] ?? rawText.length
      );
    },
  };
}

function buildSentences(words: WordToken[]): ReadSegment["sentences"] {
  const sentences: ReadSegment["sentences"] = [];
  let startWord = 0;
  words.forEach((word, i) => {
    if (word.sentenceEnd) {
      sentences.push({ startWord, endWord: i });
      startWord = i + 1;
    }
  });
  if (startWord <= words.length - 1) {
    sentences.push({ startWord, endWord: words.length - 1 });
  }
  return sentences;
}

function collectElementText(el: HTMLElement): {
  text: string;
  spokenText: string;
  rawToSpokenOffset: (offset: number) => number;
  spokenToRawOffset: (offset: number) => number;
  words: WordToken[];
} {
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      let parent = (node as Text).parentElement;
      while (parent && parent !== el) {
        if (parent.matches(SKIP_SELECTOR)) return NodeFilter.FILTER_REJECT;
        parent = parent.parentElement;
      }
      return node.textContent && node.textContent.trim().length > 0
        ? NodeFilter.FILTER_ACCEPT
        : NodeFilter.FILTER_REJECT;
    },
  });

  const pieces: Array<{ node: Text; start: number }> = [];
  let text = "";
  let current: Node | null;
  while ((current = walker.nextNode())) {
    const node = current as Text;
    pieces.push({ node, start: text.length });
    text += node.textContent ?? "";
  }

  if (pieces.length === 0) {
    return {
      text: "",
      spokenText: "",
      rawToSpokenOffset: () => 0,
      spokenToRawOffset: () => 0,
      words: [],
    };
  }

  const locate = (offset: number) => {
    for (const piece of pieces) {
      if (offset <= piece.start + piece.node.length) {
        return {
          node: piece.node,
          offset: Math.max(0, offset - piece.start),
        };
      }
    }
    const last = pieces[pieces.length - 1];
    return { node: last.node, offset: last.node.length };
  };

  const words: WordToken[] = [];
  const wordRe = /[\p{L}\p{N}][\p{L}\p{N}'’\-]*/gu;
  let match: RegExpExecArray | null;
  while ((match = wordRe.exec(text))) {
    const start = match.index;
    const end = match.index + match[0].length;
    const trailing = text.slice(end, end + 3);
    const sentenceEnd = /^[.!?…]+/.test(trailing);

    const range = document.createRange();
    const s = locate(start);
    const e = locate(end);
    range.setStart(s.node, Math.min(s.offset, s.node.length));
    range.setEnd(e.node, Math.min(e.offset, e.node.length));

    words.push({ start, end, range, sentenceEnd });
  }

  const speechText = buildSpeechText(text);

  return {
    text,
    spokenText: speechText.spokenText,
    rawToSpokenOffset: speechText.rawToSpokenOffset,
    spokenToRawOffset: speechText.spokenToRawOffset,
    words,
  };
}

export function buildReadingModel(container: HTMLElement): ReadingModel {
  const elements: HTMLElement[] = [];

  container.querySelectorAll<HTMLElement>("[data-tts-read]").forEach((el) => {
    if (!el.closest("[data-tts-skip]")) elements.push(el);
  });

  container
    .querySelectorAll<HTMLElement>("[data-tts-read-root]")
    .forEach((root) => {
      root.querySelectorAll<HTMLElement>(READABLE_SELECTOR).forEach((el) => {
        if (el.closest("[data-tts-skip]")) return;
        elements.push(el);
      });
    });

  // DOM order + dedupe nested matches (e.g. <p> inside <blockquote>)
  elements.sort((a, b) =>
    a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1,
  );
  const topLevel = elements.filter(
    (el) => !elements.some((other) => other !== el && other.contains(el)),
  );

  const segments: ReadSegment[] = [];
  let totalWords = 0;

  for (const el of topLevel) {
    const { text, spokenText, rawToSpokenOffset, spokenToRawOffset, words } =
      collectElementText(el);
    if (words.length === 0 || text.trim().length === 0) continue;
    segments.push({
      element: el,
      text,
      spokenText,
      rawToSpokenOffset,
      spokenToRawOffset,
      words,
      sentences: buildSentences(words),
    });
    totalWords += words.length;
  }

  return { segments, totalWords };
}
