"use client";

import { Fragment, type ReactNode } from "react";
import type { FormatType } from "@/lib/text-format";
import { PopCelebration, WavyCelebration } from "./celebration-inline";

type InlineContentRendererProps = {
  text: string;
  className?: string;
};

type MarkerDef = {
  type: FormatType;
  open: string;
  close: string;
  allowNesting: boolean;
};

// 6 total: 4 classic static + 2 animated
const MARKERS: MarkerDef[] = [
  { type: "bold", open: "**", close: "**", allowNesting: true },
  { type: "highlight", open: "==", close: "==", allowNesting: true },
  { type: "pop", open: "@@", close: "@@", allowNesting: true },
  { type: "wavy", open: "__", close: "__", allowNesting: true },
  { type: "code", open: "`", close: "`", allowNesting: false },
  { type: "italic", open: "*", close: "*", allowNesting: true },
];

/**
 * Supports nesting: **set of *repeatable* patterns.**
 * Classic static: bold, italic, code, highlight
 * Animated once: pop (jump + dots + gradient final), wavy (organic pen, ease [1,0,0,1])
 */
export function InlineContentRenderer({ text, className }: InlineContentRendererProps) {
  if (!text) return null;
  const segments = parseNested(text, 0);
  return (
    <span className={className}>
      {segments.map((segment, index) =>
        typeof segment === "string" ? (
          <Fragment key={index}>{segment}</Fragment>
        ) : (
          <Fragment key={index}>{segment}</Fragment>
        ),
      )}
    </span>
  );
}

function parseNested(input: string, depth: number): ReactNode[] {
  if (depth > 20) return [input];
  const result: ReactNode[] = [];
  let pos = 0;

  while (pos < input.length) {
    let earliest: { def: MarkerDef; index: number } | null = null;
    for (const def of MARKERS) {
      const idx = findOpen(input, def, pos);
      if (idx !== -1) {
        if (!earliest || idx < earliest.index || (idx === earliest.index && def.open.length > earliest.def.open.length)) {
          earliest = { def, index: idx };
        }
      }
    }

    if (!earliest) {
      const remaining = input.slice(pos);
      if (remaining) result.push(remaining);
      break;
    }

    if (earliest.index > pos) result.push(input.slice(pos, earliest.index));

    const def = earliest.def;
    const openIdx = earliest.index;
    const closeIdx = findClose(input, def, openIdx + def.open.length);

    if (closeIdx === -1) {
      result.push(def.open);
      pos = openIdx + def.open.length;
      continue;
    }

    const innerContent = input.slice(openIdx + def.open.length, closeIdx);
    if (!innerContent) {
      result.push(input.slice(openIdx, closeIdx + def.close.length));
      pos = closeIdx + def.close.length;
      continue;
    }

    const innerNodes: ReactNode[] = def.allowNesting ? parseNested(innerContent, depth + 1) : [innerContent];
    result.push(renderWrapped(def.type, innerNodes, `${def.type}-${openIdx}-${depth}`));
    pos = closeIdx + def.close.length;
  }

  return result;
}

function findOpen(text: string, def: MarkerDef, from: number): number {
  if (def.type === "italic") return findSingleStarOpen(text, from);
  return text.indexOf(def.open, from);
}
function findClose(text: string, def: MarkerDef, from: number): number {
  if (def.type === "italic") return findSingleStarClose(text, from);
  return text.indexOf(def.close, from);
}
function findSingleStarOpen(text: string, from: number): number {
  for (let i = from; i < text.length; i++) {
    if (text[i] !== "*") continue;
    const prevIsStar = i > 0 && text[i - 1] === "*";
    const nextIsStar = i + 1 < text.length && text[i + 1] === "*";
    if (prevIsStar || nextIsStar) continue;
    return i;
  }
  return -1;
}
function findSingleStarClose(text: string, from: number): number {
  for (let i = from; i < text.length; i++) {
    if (text[i] !== "*") continue;
    const prevIsStar = i > 0 && text[i - 1] === "*";
    const nextIsStar = i + 1 < text.length && text[i + 1] === "*";
    if (prevIsStar || nextIsStar) continue;
    return i;
  }
  return -1;
}

function renderWrapped(type: FormatType, children: ReactNode[], key: string): ReactNode {
  const content = <>{children.map((c, i) => <Fragment key={i}>{c}</Fragment>)}</>;
  switch (type) {
    case "bold":
      return (
        <strong key={key} className="font-bold text-white/90">
          {content}
        </strong>
      );
    case "italic":
      return (
        <em key={key} className="italic text-white/80">
          {content}
        </em>
      );
    case "code":
      return (
        <code
          key={key}
          className="rounded-full border border-white/10 bg-white/[0.06] px-2 py-0.5 font-mono text-[0.9em] text-white/80"
        >
          {content}
        </code>
      );
    case "highlight":
      return (
        <mark key={key} className="rounded-[0.3em] bg-amber-200/20 px-1 py-0.5 text-amber-100/90">
          {content}
        </mark>
      );
    case "pop":
      return <PopCelebration key={key}>{children}</PopCelebration>;
    case "wavy":
      return <WavyCelebration key={key}>{children}</WavyCelebration>;
    default:
      return <span key={key}>{content}</span>;
  }
}
