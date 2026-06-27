"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";

type IntroLoaderProps = {
  name?: string;
  onComplete: () => void;
};

type LoaderPhase =
  | "empty"
  | "canvas"
  | "construct"
  | "discover"
  | "clean"
  | "hold"
  | "exit";

const PHASE_TIMING: Array<{ phase: LoaderPhase; at: number }> = [
  { phase: "canvas", at: 420 },
  { phase: "construct", at: 1350 },
  { phase: "discover", at: 3800 },
  { phase: "clean", at: 6000 },
  { phase: "hold", at: 7600 },
  { phase: "exit", at: 8750 },
];

function phaseIndex(phase: LoaderPhase) {
  return [
    "empty",
    "canvas",
    "construct",
    "discover",
    "clean",
    "hold",
    "exit",
  ].indexOf(phase);
}

function hasReached(current: LoaderPhase, target: LoaderPhase) {
  return phaseIndex(current) >= phaseIndex(target);
}

function isBefore(current: LoaderPhase, target: LoaderPhase) {
  return phaseIndex(current) < phaseIndex(target);
}

function ConstructionLine({
  x1,
  y1,
  x2,
  y2,
  phase,
  showAt = "canvas",
  hideAt = "clean",
  delay = 0,
  opacity = 0.12,
  strokeDasharray,
}: {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  phase: LoaderPhase;
  showAt?: LoaderPhase;
  hideAt?: LoaderPhase;
  delay?: number;
  opacity?: number;
  strokeDasharray?: string;
}) {
  const visible = hasReached(phase, showAt) && isBefore(phase, hideAt);

  return (
    <motion.line
      x1={x1}
      y1={y1}
      x2={x2}
      y2={y2}
      stroke="white"
      strokeWidth="1"
      strokeLinecap="round"
      strokeDasharray={strokeDasharray}
      initial={{ pathLength: 0, opacity: 0 }}
      animate={{
        pathLength: visible ? 1 : 0,
        opacity: visible ? opacity : 0,
      }}
      transition={{
        duration: visible ? 0.9 : 0.65,
        delay: visible ? delay : delay * 0.25,
        ease: [0.65, 0, 0.35, 1],
      }}
    />
  );
}

function ConstructionCircle({
  cx,
  cy,
  r,
  phase,
  showAt = "construct",
  hideAt = "clean",
  delay = 0,
  opacity = 0.13,
  dashed = false,
}: {
  cx: number;
  cy: number;
  r: number;
  phase: LoaderPhase;
  showAt?: LoaderPhase;
  hideAt?: LoaderPhase;
  delay?: number;
  opacity?: number;
  dashed?: boolean;
}) {
  const visible = hasReached(phase, showAt) && isBefore(phase, hideAt);

  return (
    <motion.circle
      cx={cx}
      cy={cy}
      r={r}
      fill="none"
      stroke="white"
      strokeWidth="1"
      strokeLinecap="round"
      strokeDasharray={dashed ? "4 8" : undefined}
      initial={{ pathLength: 0, opacity: 0 }}
      animate={{
        pathLength: visible ? 1 : 0,
        opacity: visible ? opacity : 0,
      }}
      transition={{
        duration: visible ? 1.15 : 0.7,
        delay: visible ? delay : delay * 0.2,
        ease: [0.65, 0, 0.35, 1],
      }}
    />
  );
}

function ConstructionLabel({
  x,
  y,
  children,
  phase,
  showAt = "construct",
  hideAt = "clean",
  delay = 0,
  opacity = 0.38,
  anchor = "middle",
}: {
  x: number;
  y: number;
  children: string;
  phase: LoaderPhase;
  showAt?: LoaderPhase;
  hideAt?: LoaderPhase;
  delay?: number;
  opacity?: number;
  anchor?: "start" | "middle" | "end";
}) {
  const visible = hasReached(phase, showAt) && isBefore(phase, hideAt);

  return (
    <motion.text
      x={x}
      y={y}
      fill="white"
      fontSize="10"
      fontFamily="ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace"
      letterSpacing="0.08em"
      textAnchor={anchor}
      initial={{ opacity: 0 }}
      animate={{ opacity: visible ? opacity : 0 }}
      transition={{
        duration: visible ? 0.55 : 0.35,
        delay: visible ? delay : delay * 0.15,
        ease: [0.65, 0, 0.35, 1],
      }}
    >
      {children}
    </motion.text>
  );
}

function CenterMark({
  x,
  y,
  phase,
  showAt = "construct",
  hideAt = "clean",
  delay = 0,
}: {
  x: number;
  y: number;
  phase: LoaderPhase;
  showAt?: LoaderPhase;
  hideAt?: LoaderPhase;
  delay?: number;
}) {
  return (
    <g>
      <ConstructionLine
        x1={x - 7}
        y1={y}
        x2={x + 7}
        y2={y}
        phase={phase}
        showAt={showAt}
        hideAt={hideAt}
        delay={delay}
        opacity={0.28}
      />
      <ConstructionLine
        x1={x}
        y1={y - 7}
        x2={x}
        y2={y + 7}
        phase={phase}
        showAt={showAt}
        hideAt={hideAt}
        delay={delay + 0.03}
        opacity={0.28}
      />
    </g>
  );
}

function MeasurementArrow({
  x1,
  y1,
  x2,
  y2,
  label,
  labelX,
  labelY,
  phase,
  delay = 0,
}: {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  label: string;
  labelX: number;
  labelY: number;
  phase: LoaderPhase;
  delay?: number;
}) {
  const visible = hasReached(phase, "construct") && isBefore(phase, "clean");

  return (
    <g>
      <motion.line
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        stroke="white"
        strokeWidth="1"
        strokeLinecap="round"
        markerStart="url(#arrow)"
        markerEnd="url(#arrow)"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{
          pathLength: visible ? 1 : 0,
          opacity: visible ? 0.22 : 0,
        }}
        transition={{
          duration: visible ? 0.75 : 0.45,
          delay,
          ease: [0.65, 0, 0.35, 1],
        }}
      />

      <ConstructionLabel
        x={labelX}
        y={labelY}
        phase={phase}
        delay={delay + 0.18}
        opacity={0.44}
      >
        {label}
      </ConstructionLabel>
    </g>
  );
}

export function IntroLoader({
  name = "ISHANT KUMAR",
  onComplete,
}: IntroLoaderProps) {
  const [phase, setPhase] = useState<LoaderPhase>("empty");
  const shouldReduceMotion = useReducedMotion();

  const normalizedName = useMemo(() => name.trim().toUpperCase(), [name]);

  useEffect(() => {
    if (shouldReduceMotion) {
      onComplete();
      return;
    }

    const timers = PHASE_TIMING.map(({ phase: nextPhase, at }) =>
      window.setTimeout(() => {
        setPhase(nextPhase);
      }, at),
    );

    const done = window.setTimeout(() => {
      onComplete();
    }, 9700);

    return () => {
      timers.forEach(window.clearTimeout);
      window.clearTimeout(done);
    };
  }, [onComplete, shouldReduceMotion]);

  const wordmarkVisible = hasReached(phase, "discover");
  const helperVisible =
    hasReached(phase, "construct") && isBefore(phase, "hold");
  const isExiting = phase === "exit";

  return (
    <motion.div
      aria-hidden="true"
      className="fixed inset-0 z-[120] flex h-[100dvh] w-screen items-center justify-center overflow-hidden bg-[#050505]"
      initial={{ y: 0, filter: "blur(0px)" }}
      animate={
        isExiting
          ? {
              y: "-104%",
              filter: "blur(3px)",
            }
          : {
              y: 0,
              filter: "blur(0px)",
            }
      }
      transition={{
        duration: 0.92,
        ease: [0.77, 0, 0.18, 1],
      }}
    >
      <motion.svg
        viewBox="0 0 1200 620"
        preserveAspectRatio="xMidYMid meet"
        className="h-auto w-[min(94vw,1180px)] overflow-visible"
        initial={{ opacity: 1, scale: 1.015 }}
        animate={{
          scale: hasReached(phase, "discover") ? 1 : 1.015,
        }}
        transition={{
          duration: 1.8,
          ease: [0.65, 0, 0.35, 1],
        }}
      >
        <defs>
          <marker
            id="arrow"
            markerWidth="8"
            markerHeight="8"
            refX="4"
            refY="4"
            orient="auto"
            markerUnits="strokeWidth"
          >
            <path d="M 0 0 L 8 4 L 0 8 L 2.5 4 Z" fill="white" opacity="0.32" />
          </marker>
        </defs>

        {/* Scene 1 — Empty canvas center cross */}
        <CenterMark
          x={600}
          y={310}
          phase={phase}
          showAt="canvas"
          hideAt="exit"
          delay={0}
        />

        {/* Scene 1 — Professional design workspace grid */}
        <g>
          {/* Outer artboard margin */}
          <ConstructionLine
            x1={110}
            y1={95}
            x2={1090}
            y2={95}
            phase={phase}
            showAt="canvas"
            hideAt="hold"
            delay={0.12}
            opacity={0.08}
          />
          <ConstructionLine
            x1={110}
            y1={525}
            x2={1090}
            y2={525}
            phase={phase}
            showAt="canvas"
            hideAt="hold"
            delay={0.15}
            opacity={0.08}
          />
          <ConstructionLine
            x1={110}
            y1={95}
            x2={110}
            y2={525}
            phase={phase}
            showAt="canvas"
            hideAt="hold"
            delay={0.18}
            opacity={0.08}
          />
          <ConstructionLine
            x1={1090}
            y1={95}
            x2={1090}
            y2={525}
            phase={phase}
            showAt="canvas"
            hideAt="hold"
            delay={0.21}
            opacity={0.08}
          />

          {/* Column guides */}
          {[210, 300, 390, 480, 570, 660, 750, 840, 930, 1020].map(
            (x, index) => (
              <ConstructionLine
                key={`column-${x}`}
                x1={x}
                y1={95}
                x2={x}
                y2={525}
                phase={phase}
                showAt="canvas"
                hideAt="hold"
                delay={0.25 + index * 0.035}
                opacity={0.055}
              />
            ),
          )}

          {/* Baseline grid */}
          {[154, 186, 218, 250, 282, 314, 346, 378, 410, 442, 474].map(
            (y, index) => (
              <ConstructionLine
                key={`baseline-${y}`}
                x1={110}
                y1={y}
                x2={1090}
                y2={y}
                phase={phase}
                showAt="canvas"
                hideAt="hold"
                delay={0.22 + index * 0.026}
                opacity={0.045}
              />
            ),
          )}

          {/* Primary axes */}
          <ConstructionLine
            x1={600}
            y1={72}
            x2={600}
            y2={548}
            phase={phase}
            showAt="canvas"
            hideAt="hold"
            delay={0.42}
            opacity={0.12}
          />
          <ConstructionLine
            x1={74}
            y1={310}
            x2={1126}
            y2={310}
            phase={phase}
            showAt="canvas"
            hideAt="hold"
            delay={0.48}
            opacity={0.12}
          />

          <ConstructionLabel
            x={600}
            y={74}
            phase={phase}
            showAt="canvas"
            hideAt="hold"
            delay={0.72}
            opacity={0.28}
          >
            optical center
          </ConstructionLabel>
        </g>

        {/* Scene 2 — Typography construction sheet */}
        <g>
          {/* Typography horizontal guides */}
          <ConstructionLine
            x1={150}
            y1={244}
            x2={1050}
            y2={244}
            phase={phase}
            showAt="construct"
            hideAt="hold"
            delay={0.05}
            opacity={0.2}
          />
          <ConstructionLine
            x1={150}
            y1={286}
            x2={1050}
            y2={286}
            phase={phase}
            showAt="construct"
            hideAt="hold"
            delay={0.12}
            opacity={0.14}
            strokeDasharray="5 8"
          />
          <ConstructionLine
            x1={150}
            y1={346}
            x2={1050}
            y2={346}
            phase={phase}
            showAt="construct"
            hideAt="hold"
            delay={0.19}
            opacity={0.22}
          />
          <ConstructionLine
            x1={150}
            y1={382}
            x2={1050}
            y2={382}
            phase={phase}
            showAt="construct"
            hideAt="hold"
            delay={0.26}
            opacity={0.1}
            strokeDasharray="5 8"
          />

          <ConstructionLabel
            x={142}
            y={247}
            phase={phase}
            delay={0.18}
            opacity={0.42}
            anchor="end"
          >
            cap height
          </ConstructionLabel>
          <ConstructionLabel
            x={142}
            y={289}
            phase={phase}
            delay={0.26}
            opacity={0.34}
            anchor="end"
          >
            x-height
          </ConstructionLabel>
          <ConstructionLabel
            x={142}
            y={349}
            phase={phase}
            delay={0.34}
            opacity={0.42}
            anchor="end"
          >
            baseline
          </ConstructionLabel>
          <ConstructionLabel
            x={142}
            y={385}
            phase={phase}
            delay={0.42}
            opacity={0.3}
            anchor="end"
          >
            descender
          </ConstructionLabel>

          {/* Vertical letter construction zones */}
          {[
            192, 248, 304, 366, 426, 486, 558, 642, 704, 764, 832, 902, 972,
          ].map((x, index) => (
            <ConstructionLine
              key={`letter-guide-${x}`}
              x1={x}
              y1={220}
              x2={x}
              y2={382}
              phase={phase}
              showAt="construct"
              hideAt="hold"
              delay={0.34 + index * 0.035}
              opacity={index % 2 === 0 ? 0.15 : 0.09}
            />
          ))}

          {/* Construction circles that become counters / curves */}
          <ConstructionCircle
            cx={264}
            cy={294}
            r={52}
            phase={phase}
            delay={0.62}
            opacity={0.17}
          />
          <ConstructionCircle
            cx={264}
            cy={294}
            r={32}
            phase={phase}
            delay={0.75}
            opacity={0.12}
            dashed
          />
          <ConstructionCircle
            cx={516}
            cy={296}
            r={50}
            phase={phase}
            delay={0.82}
            opacity={0.16}
          />
          <ConstructionCircle
            cx={516}
            cy={296}
            r={32}
            phase={phase}
            delay={0.95}
            opacity={0.12}
            dashed
          />
          <ConstructionCircle
            cx={750}
            cy={296}
            r={51}
            phase={phase}
            delay={1.02}
            opacity={0.16}
          />
          <ConstructionCircle
            cx={750}
            cy={296}
            r={32}
            phase={phase}
            delay={1.15}
            opacity={0.12}
            dashed
          />
          <ConstructionCircle
            cx={918}
            cy={296}
            r={48}
            phase={phase}
            delay={1.22}
            opacity={0.15}
          />

          {/* Tangent and angle guides */}
          <ConstructionLine
            x1={226}
            y1={244}
            x2={302}
            y2={346}
            phase={phase}
            showAt="construct"
            hideAt="hold"
            delay={1.04}
            opacity={0.16}
          />
          <ConstructionLine
            x1={474}
            y1={346}
            x2={558}
            y2={244}
            phase={phase}
            showAt="construct"
            hideAt="hold"
            delay={1.12}
            opacity={0.16}
          />
          <ConstructionLine
            x1={704}
            y1={346}
            x2={796}
            y2={244}
            phase={phase}
            showAt="construct"
            hideAt="hold"
            delay={1.2}
            opacity={0.16}
          />

          <ConstructionLabel
            x={313}
            y={257}
            phase={phase}
            delay={1.18}
            opacity={0.4}
          >
            45°
          </ConstructionLabel>
          <ConstructionLabel
            x={555}
            y={251}
            phase={phase}
            delay={1.26}
            opacity={0.4}
          >
            tangent
          </ConstructionLabel>

          {/* Center marks */}
          <CenterMark x={264} y={294} phase={phase} delay={1.16} />
          <CenterMark x={516} y={296} phase={phase} delay={1.24} />
          <CenterMark x={750} y={296} phase={phase} delay={1.32} />
          <CenterMark x={918} y={296} phase={phase} delay={1.4} />

          {/* Measurement arrows and labels */}
          <MeasurementArrow
            x1={192}
            y1={408}
            x2={248}
            y2={408}
            label="24px"
            labelX={220}
            labelY={427}
            phase={phase}
            delay={1.35}
          />
          <MeasurementArrow
            x1={248}
            y1={408}
            x2={304}
            y2={408}
            label="8px"
            labelX={276}
            labelY={427}
            phase={phase}
            delay={1.48}
          />
          <MeasurementArrow
            x1={642}
            y1={408}
            x2={704}
            y2={408}
            label="spacing"
            labelX={673}
            labelY={427}
            phase={phase}
            delay={1.61}
          />
          <MeasurementArrow
            x1={862}
            y1={220}
            x2={862}
            y2={346}
            label="R32"
            labelX={884}
            labelY={286}
            phase={phase}
            delay={1.74}
          />

          {/* Bezier handles */}
          <ConstructionLine
            x1={842}
            y1={258}
            x2={796}
            y2={216}
            phase={phase}
            showAt="construct"
            hideAt="hold"
            delay={1.72}
            opacity={0.14}
          />
          <ConstructionLine
            x1={842}
            y1={334}
            x2={794}
            y2={378}
            phase={phase}
            showAt="construct"
            hideAt="hold"
            delay={1.79}
            opacity={0.14}
          />
          <ConstructionCircle
            cx={796}
            cy={216}
            r={3}
            phase={phase}
            delay={1.86}
            opacity={0.34}
          />
          <ConstructionCircle
            cx={794}
            cy={378}
            r={3}
            phase={phase}
            delay={1.93}
            opacity={0.34}
          />

          <ConstructionLabel
            x={798}
            y={205}
            phase={phase}
            delay={2}
            opacity={0.32}
          >
            bezier handle
          </ConstructionLabel>

          {/* Small alignment ticks */}
          {[192, 304, 426, 558, 704, 832, 972].map((x, index) => (
            <g key={`tick-${x}`}>
              <ConstructionLine
                x1={x - 8}
                y1={236}
                x2={x + 8}
                y2={236}
                phase={phase}
                showAt="construct"
                hideAt="hold"
                delay={1.9 + index * 0.04}
                opacity={0.24}
              />
              <ConstructionLine
                x1={x - 8}
                y1={354}
                x2={x + 8}
                y2={354}
                phase={phase}
                showAt="construct"
                hideAt="hold"
                delay={1.96 + index * 0.04}
                opacity={0.24}
              />
            </g>
          ))}
        </g>

        {/* Scene 3 / 4 — wordmark discovery and reveal */}
        <motion.g
          initial={{ opacity: 0 }}
          animate={{
            opacity: wordmarkVisible ? 1 : 0,
          }}
          transition={{
            duration: 1.35,
            ease: [0.65, 0, 0.35, 1],
          }}
        >
          {/* faint construction ghost behind final type */}
          <motion.text
            x="600"
            y="346"
            textAnchor="middle"
            dominantBaseline="alphabetic"
            fill="none"
            stroke="white"
            strokeWidth="1"
            strokeOpacity={helperVisible ? 0.16 : 0}
            fontSize="86"
            fontFamily="var(--font-display-name), ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Helvetica Neue', Arial, sans-serif"
            fontWeight="500"
            letterSpacing="0.13em"
            lengthAdjust="spacing"
            textLength="850"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{
              pathLength: wordmarkVisible ? 1 : 0,
              opacity: wordmarkVisible && helperVisible ? 1 : 0,
            }}
            transition={{
              duration: 1.4,
              delay: 0.15,
              ease: [0.65, 0, 0.35, 1],
            }}
          >
            {normalizedName}
          </motion.text>

          {/* final typography */}
          <motion.text
            x="600"
            y="346"
            textAnchor="middle"
            dominantBaseline="alphabetic"
            fill="white"
            fontSize="86"
            fontFamily="var(--font-display-name), ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Helvetica Neue', Arial, sans-serif"
            fontWeight="500"
            letterSpacing="0.13em"
            lengthAdjust="spacing"
            textLength="850"
            initial={{ opacity: 0, y: 4 }}
            animate={{
              opacity: wordmarkVisible ? 0.92 : 0,
              y: wordmarkVisible ? 0 : 4,
            }}
            transition={{
              duration: 1.2,
              delay: 0.55,
              ease: [0.65, 0, 0.35, 1],
            }}
          >
            {normalizedName}
          </motion.text>
        </motion.g>

        {/* Scene 5 — quiet editorial caption, disappears before hold */}
        <motion.text
          x="600"
          y="474"
          textAnchor="middle"
          fill="white"
          fontSize="10"
          fontFamily="ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace"
          letterSpacing="0.18em"
          initial={{ opacity: 0 }}
          animate={{
            opacity:
              hasReached(phase, "discover") && isBefore(phase, "hold")
                ? 0.32
                : 0,
          }}
          transition={{
            duration: 0.75,
            ease: [0.65, 0, 0.35, 1],
          }}
        >
          PRECISION / DESIGN THINKING / ENGINEERING
        </motion.text>
      </motion.svg>
    </motion.div>
  );
}
