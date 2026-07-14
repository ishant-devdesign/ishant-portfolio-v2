"use client";

import { motion, useInView } from "framer-motion";
import { useRef, useMemo } from "react";

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

const DOT_COLORS = [
  "bg-white",
  "bg-amber-300",
  "bg-yellow-200",
  "bg-amber-200",
];
const GRADIENT =
  "linear-gradient(90deg, #fef3c7 0%, #fde68a 25%, #fbbf24 55%, #f59e0b 85%, #d97706 100%)";

// POP - single gradient across whole text, dots follow each jumping letter
export function PopCelebration({ children }: Props) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: "0px 0px -12% 0px" });

  const plain = useMemo(() => extractText(children), [children]);
  const letters = plain.split("");

  return (
    <span ref={ref} className="relative inline-block">
      <span className="inline-block">
        {plain ? (
          letters.map((letter, i) => {
            if (letter === " ") {
              return (
                <span key={`sp-${i}`} className="inline-block">
                  {"\u00A0"}
                </span>
              );
            }
            const bgPos =
              letters.length > 1 ? (i / (letters.length - 1)) * 100 : 0;
            // 1-2 dots per letter, moves with that letter
            const dotsForLetter = letter === " " ? 0 : i % 3 === 0 ? 2 : 1;

            return (
              <span key={`${letter}-${i}`} className="relative inline-block">
                <motion.span
                  className="inline-block will-change-transform bg-clip-text text-transparent"
                  style={{
                    backgroundImage: GRADIENT,
                    backgroundSize: `${Math.max(100, letters.length * 100)}% 100%`,
                    backgroundPosition: `${bgPos}% 0%`,
                    WebkitBackgroundClip: "text",
                    backgroundClip: "text",
                  }}
                  initial={{ y: 0, scale: 1 }}
                  animate={
                    isInView ? { y: [0, -14, 0], scale: [1, 1.2, 1] } : {}
                  }
                  transition={{
                    delay: i * 0.04,
                    duration: 0.52,
                    ease: [0.34, 1.56, 0.64, 1],
                  }}
                >
                  {letter}
                </motion.span>

                {/* Dots that follow this letter's jump */}
                {Array.from({ length: dotsForLetter }).map((_, dotIdx) => {
                  const color =
                    DOT_COLORS[Math.floor(Math.random() * DOT_COLORS.length)];
                  const x = (Math.random() - 0.5) * 32;
                  const y = -(Math.random() * 28 + 8);
                  const size = Math.random() * 2.4 + 1.4;
                  return (
                    <motion.span
                      key={`dot-${i}-${dotIdx}`}
                      className={`pointer-events-none absolute z-10 rounded-full ${color}`}
                      style={{
                        left: "50%",
                        top: "8%",
                        width: size,
                        height: size,
                        marginLeft: -size / 2,
                      }}
                      initial={{ x: 0, y: 0, scale: 0, opacity: 0 }}
                      animate={
                        isInView
                          ? {
                              x: x,
                              y: y,
                              scale: [0, 1.2, 0],
                              opacity: [0, 1, 0],
                            }
                          : { x: 0, y: 0, scale: 0, opacity: 0 }
                      }
                      transition={{
                        // Sync with letter jump: same delay as letter
                        delay: i * 0.04 + 0.12 + dotIdx * 0.04,
                        duration: 0.6,
                        ease: [0.22, 1, 0.36, 1],
                      }}
                    />
                  );
                })}
              </span>
            );
          })
        ) : (
          <span className="relative inline-block">
            <motion.span
              className="inline-block bg-clip-text text-transparent"
              style={{
                backgroundImage: GRADIENT,
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
              }}
              initial={{ y: 0, scale: 1 }}
              animate={isInView ? { y: [0, -14, 0], scale: [1, 1.2, 1] } : {}}
              transition={{ duration: 0.52, ease: [0.34, 1.56, 0.64, 1] }}
            >
              {children}
            </motion.span>
            {/* Fallback single dot */}
            <motion.span
              className="pointer-events-none absolute left-1/2 top-[10%] size-2 rounded-full bg-amber-200"
              initial={{ x: 0, y: 0, scale: 0, opacity: 0 }}
              animate={
                isInView
                  ? { x: 0, y: -20, scale: [0, 1, 0], opacity: [0, 1, 0] }
                  : {}
              }
              transition={{ delay: 0.2, duration: 0.6 }}
            />
          </span>
        )}
      </span>
    </span>
  );
}

// WAVY - single line, really wavy with random highs/lows/phases/frequency, organic pen, ease [1,0,0.39,0.91]
export function WavyCelebration({ children }: Props) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: "0px 0px -10% 0px" });

  const path = useMemo(() => {
    const segments = 18;
    let d = `M0 5`;
    const basePhase = Math.random() * Math.PI * 2;
    for (let i = 1; i <= segments; i++) {
      const t = i / segments;
      const x = t * 100;
      const freqBase =
        2.5 + Math.sin(t * 3.2 + basePhase * 0.7) * 1.2 + Math.random() * 0.8;
      const ampEnvelope =
        2.0 +
        Math.sin(t * Math.PI * 1.8 + basePhase) * 1.1 +
        Math.sin(t * Math.PI * 0.7) * 0.8;
      const amp = ampEnvelope + (Math.random() - 0.5) * 0.9;
      const phaseJitter = (Math.random() - 0.5) * 0.8 + basePhase;
      const y =
        5 +
        Math.sin(t * freqBase + phaseJitter) * amp +
        (Math.random() - 0.5) * 0.4;
      const prevX = ((i - 1) / segments) * 100;
      const cx = (prevX + x) / 2 + (Math.random() - 0.5) * 0.6;
      const cy = y + (Math.random() - 0.5) * 0.5;
      d += ` Q ${cx.toFixed(2)} ${cy.toFixed(2)} ${x.toFixed(2)} ${y.toFixed(2)}`;
    }
    return d;
  }, []);

  return (
    <span ref={ref} className="relative inline-block pb-[7px]">
      <span className="relative z-10">{children}</span>
      <svg
        className="pointer-events-none absolute bottom-0 left-0 h-[8px] w-full overflow-visible"
        viewBox="0 0 100 10"
        preserveAspectRatio="none"
      >
        <motion.path
          d={path}
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
          transition={{ duration: 0.92, ease: [1, 0, 0.39, 0.91] as any }}
        />
      </svg>
    </span>
  );
}
