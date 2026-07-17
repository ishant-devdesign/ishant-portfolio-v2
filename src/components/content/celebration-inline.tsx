"use client";

import { motion, useInView } from "framer-motion";
import { Fragment, useLayoutEffect, useRef, useMemo, useState } from "react";

function extractText(nodes: React.ReactNode): string {
  if (typeof nodes === "string") return nodes;
  if (Array.isArray(nodes)) return nodes.map(extractText).join("");
  // @ts-ignore
  if (nodes && typeof nodes === "object" && "props" in nodes) {
    // @ts-ignore
    return extractText(nodes.props.children);
  }
  return "";
}

type Props = { children: React.ReactNode };
type Dot = {
  id: number;
  leftPercent: number;
  x: number;
  y: number;
  size: number;
  delay: number;
  bg: string;
  shadow: string;
};

const DOT_STYLES = [
  { bg: "radial-gradient(circle at 32% 28%, #fef08a 0%, #facc15 38%, #eab308 100%)", shadow: "0 0 10px rgba(250,204,21,0.6)" },
  { bg: "radial-gradient(circle at 32% 28%, #fed7aa 0%, #fb923c 42%, #ea580c 100%)", shadow: "0 0 10px rgba(251,146,60,0.6)" },
  { bg: "radial-gradient(circle at 32% 28%, #fbcfe8 0%, #ec4899 45%, #be185d 100%)", shadow: "0 0 10px rgba(236,72,153,0.6)" },
  { bg: "radial-gradient(circle at 32% 28%, #a5f3fc 0%, #06b6d4 45%, #0891b2 100%)", shadow: "0 0 10px rgba(6,182,214,0.55)" },
  { bg: "radial-gradient(circle at 32% 28%, #c4b5fd 0%, #a855f7 48%, #7e22ce 100%)", shadow: "0 0 10px rgba(168,85,247,0.55)" },
  { bg: "radial-gradient(circle at 32% 28%, #bbf7d0 0%, #4ade80 45%, #16a34a 100%)", shadow: "0 0 10px rgba(74,222,128,0.5)" },
];

const GRADIENT = "linear-gradient(90deg, #06b6d4 0%, #facc15 22%, #fb923c 42%, #f43f5e 68%, #a855f7 88%, #ec4899 100%)";

export function PopCelebration({ children }: Props) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: "0px 0px -12% 0px" });

  const plain = useMemo(() => extractText(children), [children]);

  // Split into words so the text can wrap between words on narrow screens.
  // Each word keeps per-letter animation and its own confetti dots, while
  // gradient positions and cascade delays stay global across the full phrase.
  const words = useMemo(() => {
    const total = plain.length;
    let dotId = 0;
    let offset = 0;

    return plain
      .split(" ")
      .map((word) => {
        const start = offset;
        offset += word.length + 1; // +1 accounts for the consumed space
        if (!word) return null;

        const letters = word.split("").map((letter, li) => {
          const globalIndex = start + li;
          return {
            letter,
            bgPos: total > 1 ? (globalIndex / (total - 1)) * 100 : 0,
            delay: globalIndex * 0.04,
          };
        });

        const dots: Dot[] = [];
        letters.forEach((l, li) => {
          const count = Math.random() > 0.5 ? 2 : 1;
          const basePercent =
            letters.length > 1 ? (li / (letters.length - 1)) * 100 : 50;
          for (let j = 0; j < count; j++) {
            const style =
              DOT_STYLES[Math.floor(Math.random() * DOT_STYLES.length)];
            dots.push({
              id: dotId++,
              leftPercent: Math.max(
                3,
                Math.min(97, basePercent + (Math.random() - 0.5) * 8),
              ),
              x: (Math.random() - 0.5) * 36,
              y: -(14 + Math.random() * 28),
              size: 5 + Math.random() * 3.2,
              delay: l.delay + 0.18 + Math.random() * 0.04,
              bg: style.bg,
              shadow: style.shadow,
            });
          }
        });
        while (dots.length < 2) {
          const style =
            DOT_STYLES[Math.floor(Math.random() * DOT_STYLES.length)];
          dots.push({
            id: dotId++,
            leftPercent: 10 + Math.random() * 80,
            x: (Math.random() - 0.5) * 30,
            y: -(12 + Math.random() * 24),
            size: 4 + Math.random() * 2.5,
            delay: 0.18 + Math.random() * 0.2,
            bg: style.bg,
            shadow: style.shadow,
          });
        }

        return { letters, dots };
      })
      .filter((w): w is NonNullable<typeof w> => w !== null);
  }, [plain]);

  return (
    <span ref={ref} className="relative overflow-visible">
      {plain ? (
        words.map((word, wi) => (
          <Fragment key={wi}>
            {wi > 0 ? " " : null}
            <span className="relative inline-block">
              {word.letters.map((l, li) => (
                <motion.span
                  key={`${l.letter}-${li}`}
                  className="inline-block will-change-transform bg-clip-text text-transparent"
                  style={{
                    backgroundImage: GRADIENT,
                    backgroundSize: `${Math.max(100, plain.length * 100)}% 100%`,
                    backgroundPosition: `${l.bgPos}% 0%`,
                    WebkitBackgroundClip: "text",
                    backgroundClip: "text",
                  }}
                  initial={{ y: 0, scale: 1 }}
                  animate={isInView ? { y: [0, -12, 0], scale: [1, 1.18, 1] } : {}}
                  transition={{
                    delay: l.delay,
                    duration: 0.46,
                    ease: [0.25, 0.46, 0.45, 0.94] as any,
                  }}
                >
                  {l.letter}
                </motion.span>
              ))}

              {/* Glossy 3D confetti dots, positioned within this word */}
              {word.dots.map((d) => (
                <motion.span
                  key={d.id}
                  className="pointer-events-none absolute z-10 rounded-full"
                  style={{
                    left: `${d.leftPercent}%`,
                    top: "20%",
                    width: d.size,
                    height: d.size,
                    background: d.bg,
                    boxShadow: d.shadow,
                  }}
                  initial={{ x: 0, y: 0, scale: 0, opacity: 0 }}
                  animate={
                    isInView
                      ? { x: d.x, y: d.y, scale: [0, 1.2, 0], opacity: [0, 1, 0] }
                      : { x: 0, y: 0, scale: 0, opacity: 0 }
                  }
                  transition={{
                    delay: d.delay,
                    duration: 0.72,
                    ease: [0.22, 1, 0.36, 1] as any,
                  }}
                >
                  {/* inner glossy highlight */}
                  <span className="absolute left-[22%] top-[18%] size-[38%] rounded-full bg-white/75 blur-[0.2px]" />
                </motion.span>
              ))}
            </span>
          </Fragment>
        ))
      ) : (
        <motion.span
          className="inline-block bg-clip-text text-transparent"
          style={{
            backgroundImage: GRADIENT,
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
          }}
          initial={{ y: 0, scale: 1 }}
          animate={isInView ? { y: [0, -12, 0], scale: [1, 1.18, 1] } : {}}
          transition={{ duration: 0.46, ease: [0.25, 0.46, 0.45, 0.94] as any }}
        >
          {children}
        </motion.span>
      )}
    </span>
  );
}

// Random organic wave path, freshly generated per line underline.
function generateWavyPath() {
  const segments = 18;
  let d = `M0 5`;
  const basePhase = Math.random() * Math.PI * 2;
  for (let i = 1; i <= segments; i++) {
    const t = i / segments;
    const x = t * 100;
    const freqBase = 2.5 + Math.sin(t * 3.2 + basePhase * 0.7) * 1.2 + Math.random() * 0.8;
    const ampEnvelope = 2.0 + Math.sin(t * Math.PI * 1.8 + basePhase) * 1.1 + Math.sin(t * Math.PI * 0.7) * 0.8;
    const amp = ampEnvelope + (Math.random() - 0.5) * 0.9;
    const phaseJitter = (Math.random() - 0.5) * 0.8 + basePhase;
    const y = 5 + Math.sin(t * freqBase + phaseJitter) * amp + (Math.random() - 0.5) * 0.4;
    const prevX = ((i - 1) / segments) * 100;
    const cx = (prevX + x) / 2 + (Math.random() - 0.5) * 0.6;
    const cy = y + (Math.random() - 0.5) * 0.5;
    d += ` Q ${cx.toFixed(2)} ${cy.toFixed(2)} ${x.toFixed(2)} ${y.toFixed(2)}`;
  }
  return d;
}

export function WavyCelebration({ children }: Props) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: "0px 0px -10% 0px" });

  // One rect per wrapped line box of this inline span.
  const [lines, setLines] = useState<
    Array<{ left: number; top: number; width: number }>
  >([]);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;

    let raf = 0;
    const measure = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const rects = Array.from(el.getClientRects()).filter(
          (r) => r.width > 2,
        );
        if (rects.length === 0) {
          setLines((prev) => (prev.length === 0 ? prev : []));
          return;
        }
        // Absolutely positioned children of an inline element are positioned
        // relative to its first line box, so use it as the origin.
        const originLeft = rects[0].left;
        const originTop = rects[0].top;
        const next = rects.map((r) => ({
          left: r.left - originLeft,
          top: r.bottom - originTop + 2, // hang just below the line box
          width: r.width,
        }));
        setLines((prev) => {
          const same =
            prev.length === next.length &&
            prev.every(
              (l, i) =>
                Math.abs(l.left - next[i].left) < 0.5 &&
                Math.abs(l.top - next[i].top) < 0.5 &&
                Math.abs(l.width - next[i].width) < 0.5,
            );
          return same ? prev : next;
        });
      });
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    window.addEventListener("resize", measure);
    document.fonts?.ready.then(measure).catch(() => undefined);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [children]);

  const lineCount = lines.length;
  const paths = useMemo(
    () => Array.from({ length: lineCount }, () => generateWavyPath()),
    [lineCount],
  );

  return (
    <span ref={ref} className="relative">
      {children}
      {lines.map((line, i) => (
        <span
          key={i}
          aria-hidden
          className="pointer-events-none absolute"
          style={{ left: line.left, top: line.top, width: line.width, height: 8 }}
        >
          <motion.svg
            className="block size-full overflow-visible"
            viewBox="0 0 100 10"
            preserveAspectRatio="none"
          >
            <motion.path
              d={paths[i] ?? ""}
              fill="none"
              stroke="rgba(255,255,255,0.78)"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={
                isInView
                  ? { pathLength: 1, opacity: 1 }
                  : { pathLength: 0, opacity: 0 }
              }
              transition={{
                duration: 0.92,
                delay: i * 0.12,
                ease: [1, 0, 0.39, 0.91] as any,
              }}
            />
          </motion.svg>
        </span>
      ))}
    </span>
  );
}
