/**
 * Automatic reading-time calculation from content blocks.
 * ~220 wpm is the standard adult silent-reading pace used by
 * Medium-style estimates.
 */

export const READING_WPM = 220;

/** Keys whose values are never prose (embed addresses, ids, config…). */
const NON_TEXT_KEYS = new Set([
  "id",
  "type",
  "slug",
  "url",
  "src",
  "href",
  "poster",
  "alt",
  "language",
  "icon",
  "variant",
  "theme",
]);

function collectText(value: unknown, parts: string[]): void {
  if (typeof value === "string") {
    parts.push(value);
    return;
  }
  if (Array.isArray(value)) {
    for (const item of value) collectText(item, parts);
    return;
  }
  if (value && typeof value === "object") {
    for (const [key, nested] of Object.entries(
      value as Record<string, unknown>,
    )) {
      if (NON_TEXT_KEYS.has(key)) continue;
      collectText(nested, parts);
    }
  }
}

/** Words across every text-ish field of the given content blocks. */
export function countWordsInBlocks(blocks: unknown): number {
  const parts: string[] = [];
  collectText(blocks, parts);
  const text = parts.join(" ").trim();
  if (!text) return 0;
  return text.split(/\s+/).filter((token) => /[\p{L}\p{N}]/u.test(token))
    .length;
}

export function readingTimeMinutes(blocks: unknown): number {
  const words = countWordsInBlocks(blocks);
  if (words === 0) return 0;
  return Math.max(1, Math.ceil(words / READING_WPM));
}

/**
 * "N min" label. When blocks contain no countable text (edge cases),
 * falls back to the stored manual minutes, then to "—".
 */
export function readingTimeLabel(
  blocks: unknown,
  fallbackMinutes?: number | null,
): string {
  const minutes = readingTimeMinutes(blocks);
  if (minutes > 0) return `${minutes} min`;
  return fallbackMinutes ? `${fallbackMinutes} min` : "—";
}
