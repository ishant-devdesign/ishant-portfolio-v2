"use client";

import { Fragment, type ReactNode } from "react";

type InlineContentRendererProps = {
  text: string;
  className?: string;
};

/**
 * Renders text with inline formatting markers:
 * - **text** → bold
 * - *text* → italic
 * - `text` → code in pill
 */
export function InlineContentRenderer({ text, className }: InlineContentRendererProps) {
  if (!text) return null;

  const segments = parseInlineText(text);

  return (
    <span className={className}>
      {segments.map((segment, index) => {
        if (typeof segment === "string") {
          return <Fragment key={index}>{segment}</Fragment>;
        }
        return segment;
      })}
    </span>
  );
}

function parseInlineText(text: string): ReactNode[] {
  const segments: ReactNode[] = [];
  const combinedPattern = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g;

  let match;
  let lastIndex = 0;
  let keyCounter = 0;

  while ((match = combinedPattern.exec(text)) !== null) {
    // Add text before the match
    if (match.index > lastIndex) {
      const beforeText = text.substring(lastIndex, match.index);
      if (beforeText) {
        segments.push(beforeText);
      }
    }

    const matched = match[0];

    // Determine format type
    if (matched.startsWith("**") && matched.endsWith("**")) {
      const content = matched.slice(2, -2);
      segments.push(
        <strong key={`bold-${keyCounter++}`} className="font-bold">
          {content}
        </strong>,
      );
    } else if (matched.startsWith("*") && matched.endsWith("*")) {
      const content = matched.slice(1, -1);
      segments.push(
        <em key={`italic-${keyCounter++}`} className="italic">
          {content}
        </em>,
      );
    } else if (matched.startsWith("`") && matched.endsWith("`")) {
      const content = matched.slice(1, -1);
      segments.push(
        <code
          key={`code-${keyCounter++}`}
          className="rounded bg-white/10 px-1.5 py-0.5 font-mono text-sm"
        >
          {content}
        </code>,
      );
    }

    lastIndex = match.index + matched.length;
  }

  // Add remaining text after last match
  if (lastIndex < text.length) {
    const afterText = text.substring(lastIndex);
    if (afterText) {
      segments.push(afterText);
    }
  }

  return segments.length > 0 ? segments : [text];
}