"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";

type IntroLoaderProps = {
  name?: string;
  onComplete: () => void;
  preloadImages?: string[];
};

const PHASE_TIMING: Array<{ phase: LoaderPhase; at: number }> = [
  { phase: "canvas", at: 420 },
  { phase: "construct", at: 1350 },
  { phase: "discover", at: 3800 },
  { phase: "clean", at: 6000 },
  { phase: "hold", at: 7600 },
  { phase: "exit", at: 8750 },
];

type LoaderPhase =
  | "empty"
  | "canvas"
  | "construct"
  | "discover"
  | "clean"
  | "hold"
  | "exit";

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

function useIsMobile(breakpoint = 640) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(`(max-width: ${breakpoint - 1}px)`);

    const update = () => {
      setIsMobile(media.matches);
    };

    update();

    if (media.addEventListener) {
      media.addEventListener("change", update);
    } else {
      media.addListener(update);
    }

    return () => {
      if (media.removeEventListener) {
        media.removeEventListener("change", update);
      } else {
        media.removeListener(update);
      }
    };
  }, [breakpoint]);

  return isMobile;
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
        delay: visible ? delay : delay * 0.2,
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
          delay: visible ? delay : delay * 0.2,
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

function ArcGuide({
  cx,
  cy,
  r,
  startAngle,
  endAngle,
  phase,
  showAt = "construct",
  hideAt = "hold",
  delay = 0,
  opacity = 0.16,
  label,
  labelX,
  labelY,
}: {
  cx: number;
  cy: number;
  r: number;
  startAngle: number;
  endAngle: number;
  phase: LoaderPhase;
  showAt?: LoaderPhase;
  hideAt?: LoaderPhase;
  delay?: number;
  opacity?: number;
  label?: string;
  labelX?: number;
  labelY?: number;
}) {
  const visible = hasReached(phase, showAt) && isBefore(phase, hideAt);

  const start = {
    x: cx + r * Math.cos((startAngle * Math.PI) / 180),
    y: cy + r * Math.sin((startAngle * Math.PI) / 180),
  };

  const end = {
    x: cx + r * Math.cos((endAngle * Math.PI) / 180),
    y: cy + r * Math.sin((endAngle * Math.PI) / 180),
  };

  const largeArcFlag = Math.abs(endAngle - startAngle) > 180 ? 1 : 0;

  const path = `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArcFlag} 1 ${end.x} ${end.y}`;

  return (
    <g>
      <motion.path
        d={path}
        fill="none"
        stroke="white"
        strokeWidth="1"
        strokeLinecap="round"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{
          pathLength: visible ? 1 : 0,
          opacity: visible ? opacity : 0,
        }}
        transition={{
          duration: visible ? 0.85 : 0.5,
          delay: visible ? delay : delay * 0.2,
          ease: [0.65, 0, 0.35, 1],
        }}
      />

      {label && labelX !== undefined && labelY !== undefined ? (
        <ConstructionLabel
          x={labelX}
          y={labelY}
          phase={phase}
          showAt={showAt}
          hideAt={hideAt}
          delay={delay + 0.18}
          opacity={0.38}
        >
          {label}
        </ConstructionLabel>
      ) : null}
    </g>
  );
}

function RulerTicks({
  x1,
  x2,
  y,
  phase,
  count = 12,
  direction = "down",
  delay = 0,
}: {
  x1: number;
  x2: number;
  y: number;
  phase: LoaderPhase;
  count?: number;
  direction?: "up" | "down";
  delay?: number;
}) {
  const ticks = Array.from({ length: count + 1 }).map((_, index) => {
    const x = x1 + ((x2 - x1) / count) * index;
    const isMajor = index % 4 === 0;
    const length = isMajor ? 10 : 5;

    return {
      x,
      length,
      isMajor,
      index,
    };
  });

  return (
    <g>
      {ticks.map((tick) => (
        <ConstructionLine
          key={`tick-${x1}-${x2}-${y}-${tick.index}`}
          x1={tick.x}
          y1={y}
          x2={tick.x}
          y2={direction === "down" ? y + tick.length : y - tick.length}
          phase={phase}
          showAt="construct"
          hideAt="hold"
          delay={delay + tick.index * 0.018}
          opacity={tick.isMajor ? 0.22 : 0.12}
        />
      ))}
    </g>
  );
}

function CornerRegistration({
  x,
  y,
  phase,
  corner,
  delay = 0,
}: {
  x: number;
  y: number;
  phase: LoaderPhase;
  corner: "tl" | "tr" | "bl" | "br";
  delay?: number;
}) {
  const horizontalDirection = corner === "tl" || corner === "bl" ? 1 : -1;
  const verticalDirection = corner === "tl" || corner === "tr" ? 1 : -1;

  return (
    <g>
      <ConstructionLine
        x1={x}
        y1={y}
        x2={x + horizontalDirection * 38}
        y2={y}
        phase={phase}
        showAt="canvas"
        hideAt="hold"
        delay={delay}
        opacity={0.16}
      />
      <ConstructionLine
        x1={x}
        y1={y}
        x2={x}
        y2={y + verticalDirection * 38}
        phase={phase}
        showAt="canvas"
        hideAt="hold"
        delay={delay + 0.04}
        opacity={0.16}
      />
      <ConstructionCircle
        cx={x}
        cy={y}
        r={3}
        phase={phase}
        showAt="canvas"
        hideAt="hold"
        delay={delay + 0.08}
        opacity={0.28}
      />
    </g>
  );
}

function TangentPoint({
  x,
  y,
  phase,
  delay = 0,
}: {
  x: number;
  y: number;
  phase: LoaderPhase;
  delay?: number;
}) {
  return (
    <g>
      <ConstructionCircle
        cx={x}
        cy={y}
        r={4}
        phase={phase}
        showAt="construct"
        hideAt="hold"
        delay={delay}
        opacity={0.32}
      />
      <ConstructionLine
        x1={x - 12}
        y1={y}
        x2={x + 12}
        y2={y}
        phase={phase}
        showAt="construct"
        hideAt="hold"
        delay={delay + 0.05}
        opacity={0.16}
      />
      <ConstructionLine
        x1={x}
        y1={y - 12}
        x2={x}
        y2={y + 12}
        phase={phase}
        showAt="construct"
        hideAt="hold"
        delay={delay + 0.08}
        opacity={0.16}
      />
    </g>
  );
}

function BracketMeasure({
  x1,
  x2,
  y,
  label,
  phase,
  delay = 0,
}: {
  x1: number;
  x2: number;
  y: number;
  label: string;
  phase: LoaderPhase;
  delay?: number;
}) {
  return (
    <g>
      <ConstructionLine
        x1={x1}
        y1={y}
        x2={x2}
        y2={y}
        phase={phase}
        showAt="construct"
        hideAt="hold"
        delay={delay}
        opacity={0.2}
      />
      <ConstructionLine
        x1={x1}
        y1={y - 8}
        x2={x1}
        y2={y + 8}
        phase={phase}
        showAt="construct"
        hideAt="hold"
        delay={delay + 0.04}
        opacity={0.2}
      />
      <ConstructionLine
        x1={x2}
        y1={y - 8}
        x2={x2}
        y2={y + 8}
        phase={phase}
        showAt="construct"
        hideAt="hold"
        delay={delay + 0.08}
        opacity={0.2}
      />
      <ConstructionLabel
        x={(x1 + x2) / 2}
        y={y - 13}
        phase={phase}
        showAt="construct"
        hideAt="hold"
        delay={delay + 0.16}
        opacity={0.42}
      >
        {label}
      </ConstructionLabel>
    </g>
  );
}

function CanvasGrid({
  phase,
  isMobile,
}: {
  phase: LoaderPhase;
  isMobile: boolean;
}) {
  const columns = isMobile
    ? [320, 380, 440, 500, 560, 620, 680, 740, 800, 860]
    : [210, 300, 390, 480, 570, 660, 750, 840, 930, 1020];

  const baselines = isMobile
    ? [178, 208, 238, 268, 298, 328, 358, 388, 418, 448]
    : [154, 186, 218, 250, 282, 314, 346, 378, 410, 442, 474];

  const margin = isMobile
    ? { x1: 285, x2: 915, y1: 165, y2: 470 }
    : { x1: 110, x2: 1090, y1: 95, y2: 525 };

  return (
    <g>
      <ConstructionLine
        x1={margin.x1}
        y1={margin.y1}
        x2={margin.x2}
        y2={margin.y1}
        phase={phase}
        showAt="canvas"
        hideAt="hold"
        delay={0.12}
        opacity={0.08}
      />
      <ConstructionLine
        x1={margin.x1}
        y1={margin.y2}
        x2={margin.x2}
        y2={margin.y2}
        phase={phase}
        showAt="canvas"
        hideAt="hold"
        delay={0.15}
        opacity={0.08}
      />
      <ConstructionLine
        x1={margin.x1}
        y1={margin.y1}
        x2={margin.x1}
        y2={margin.y2}
        phase={phase}
        showAt="canvas"
        hideAt="hold"
        delay={0.18}
        opacity={0.08}
      />
      <ConstructionLine
        x1={margin.x2}
        y1={margin.y1}
        x2={margin.x2}
        y2={margin.y2}
        phase={phase}
        showAt="canvas"
        hideAt="hold"
        delay={0.21}
        opacity={0.08}
      />

      {columns.map((x, index) => (
        <ConstructionLine
          key={`column-${x}`}
          x1={x}
          y1={margin.y1}
          x2={x}
          y2={margin.y2}
          phase={phase}
          showAt="canvas"
          hideAt="hold"
          delay={0.25 + index * 0.035}
          opacity={0.055}
        />
      ))}

      {baselines.map((y, index) => (
        <ConstructionLine
          key={`baseline-${y}`}
          x1={margin.x1}
          y1={y}
          x2={margin.x2}
          y2={y}
          phase={phase}
          showAt="canvas"
          hideAt="hold"
          delay={0.22 + index * 0.026}
          opacity={0.045}
        />
      ))}

      <ConstructionLine
        x1={600}
        y1={isMobile ? 150 : 72}
        x2={600}
        y2={isMobile ? 492 : 548}
        phase={phase}
        showAt="canvas"
        hideAt="hold"
        delay={0.42}
        opacity={0.12}
      />
      <ConstructionLine
        x1={isMobile ? 260 : 74}
        y1={310}
        x2={isMobile ? 940 : 1126}
        y2={310}
        phase={phase}
        showAt="canvas"
        hideAt="hold"
        delay={0.48}
        opacity={0.12}
      />

      <ConstructionLabel
        x={600}
        y={isMobile ? 158 : 74}
        phase={phase}
        showAt="canvas"
        hideAt="hold"
        delay={0.72}
        opacity={0.28}
      >
        optical center
      </ConstructionLabel>
    </g>
  );
}

/* Your logo paths */
const LOGO_I_PATH =
  "M10.496 0V10.496H0V0H10.496ZM10.496 17.472V73.472H0V17.472H10.496Z";

const LOGO_K_PATH =
  "M69.6875 17.472V28.032H27.6395V31.488L69.6875 73.472H55.6715L24.1835 41.984V73.472H13.6875V28.032H20.6635V24.512H24.1835V20.992H20.6635V17.472H13.6875V0H24.1835V14.016H27.6395V17.472H69.6875ZM27.6395 28.032H24.1835V24.512C24.1835 26.432 22.5835 28.032 20.6635 28.032H24.1835V31.488C24.1835 30.528 24.5675 29.632 25.1435 28.992C25.7835 28.416 26.6795 28.032 27.6395 28.032ZM24.1835 20.992V17.472H20.6635C22.5835 17.472 24.1835 19.072 24.1835 20.992Z";

function LogoAnchorPoint({
  x,
  y,
  visible,
  delay = 0,
  opacity = 0.42,
}: {
  x: number;
  y: number;
  visible: boolean;
  delay?: number;
  opacity?: number;
}) {
  return (
    <motion.g
      initial={{ opacity: 0, scale: 0.82 }}
      animate={{
        opacity: visible ? opacity : 0,
        scale: visible ? 1 : 0.82,
      }}
      transition={{
        duration: visible ? 0.45 : 0.28,
        delay: visible ? delay : 0,
        ease: [0.65, 0, 0.35, 1],
      }}
      style={{ transformOrigin: `${x}px ${y}px` }}
    >
      <circle
        cx={x}
        cy={y}
        r="1.6"
        fill="none"
        stroke="white"
        strokeWidth="0.65"
        opacity="0.72"
        vectorEffect="non-scaling-stroke"
      />
      <circle
        cx={x}
        cy={y}
        r="3.8"
        fill="none"
        stroke="white"
        strokeWidth="0.65"
        opacity="0.34"
        vectorEffect="non-scaling-stroke"
      />
    </motion.g>
  );
}

function LogoConstructionLine({
  x1,
  y1,
  x2,
  y2,
  visible,
  delay = 0,
  opacity = 0.14,
  dashed = false,
}: {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  visible: boolean;
  delay?: number;
  opacity?: number;
  dashed?: boolean;
}) {
  return (
    <motion.line
      x1={x1}
      y1={y1}
      x2={x2}
      y2={y2}
      stroke="white"
      strokeWidth="0.8"
      strokeLinecap="round"
      strokeDasharray={dashed ? "2 3" : undefined}
      vectorEffect="non-scaling-stroke"
      initial={{ pathLength: 0, opacity: 0 }}
      animate={{
        pathLength: visible ? 1 : 0,
        opacity: visible ? opacity : 0,
      }}
      transition={{
        duration: visible ? 0.85 : 0.42,
        delay: visible ? delay : delay * 0.12,
        ease: [0.65, 0, 0.35, 1],
      }}
    />
  );
}

function LogoConstructionCircle({
  cx,
  cy,
  r,
  visible,
  delay = 0,
  opacity = 0.13,
  dashed = false,
}: {
  cx: number;
  cy: number;
  r: number;
  visible: boolean;
  delay?: number;
  opacity?: number;
  dashed?: boolean;
}) {
  return (
    <motion.circle
      cx={cx}
      cy={cy}
      r={r}
      fill="none"
      stroke="white"
      strokeWidth="0.8"
      strokeLinecap="round"
      strokeDasharray={dashed ? "2 3" : undefined}
      vectorEffect="non-scaling-stroke"
      initial={{ pathLength: 0, opacity: 0 }}
      animate={{
        pathLength: visible ? 1 : 0,
        opacity: visible ? opacity : 0,
      }}
      transition={{
        duration: visible ? 0.95 : 0.45,
        delay: visible ? delay : delay * 0.12,
        ease: [0.65, 0, 0.35, 1],
      }}
    />
  );
}

function LogoArcGuide({
  cx,
  cy,
  r,
  startAngle,
  endAngle,
  visible,
  delay = 0,
  opacity = 0.16,
}: {
  cx: number;
  cy: number;
  r: number;
  startAngle: number;
  endAngle: number;
  visible: boolean;
  delay?: number;
  opacity?: number;
}) {
  const start = {
    x: cx + r * Math.cos((startAngle * Math.PI) / 180),
    y: cy + r * Math.sin((startAngle * Math.PI) / 180),
  };

  const end = {
    x: cx + r * Math.cos((endAngle * Math.PI) / 180),
    y: cy + r * Math.sin((endAngle * Math.PI) / 180),
  };

  const largeArcFlag = Math.abs(endAngle - startAngle) > 180 ? 1 : 0;

  return (
    <motion.path
      d={`M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArcFlag} 1 ${end.x} ${end.y}`}
      fill="none"
      stroke="white"
      strokeWidth="0.8"
      strokeLinecap="round"
      vectorEffect="non-scaling-stroke"
      initial={{ pathLength: 0, opacity: 0 }}
      animate={{
        pathLength: visible ? 1 : 0,
        opacity: visible ? opacity : 0,
      }}
      transition={{
        duration: visible ? 0.9 : 0.42,
        delay: visible ? delay : delay * 0.12,
        ease: [0.65, 0, 0.35, 1],
      }}
    />
  );
}

function LogoConstructionLayer({
  phase,
  isMobile,
}: {
  phase: LoaderPhase;
  isMobile: boolean;
}) {
  const constructionVisible =
    hasReached(phase, "canvas") && isBefore(phase, "clean");

  const logoDraftVisible =
    hasReached(phase, "construct") && isBefore(phase, "hold");

  const finalLogoVisible = hasReached(phase, "discover");

  const anchorVisible =
    hasReached(phase, "construct") && isBefore(phase, "clean");

  const logoBox = isMobile
    ? {
        x: 444,
        y: 176,
        width: 312,
        height: 328,
        finalOpacity: 0.08,
      }
    : {
        x: 384,
        y: 90,
        width: 432,
        height: 456,
        finalOpacity: 0.065,
      };

  const verticalGuides = [
    0, 10.496, 13.6875, 20.6635, 24.1835, 27.6395, 55.6715, 69.6875,
  ];

  const horizontalGuides = [
    0, 10.496, 14.016, 17.472, 20.992, 24.512, 28.032, 31.488, 41.984, 73.472,
  ];

  const anchors = [
    { x: 0, y: 0 },
    { x: 10.496, y: 0 },
    { x: 10.496, y: 10.496 },
    { x: 0, y: 10.496 },
    { x: 0, y: 17.472 },
    { x: 10.496, y: 17.472 },
    { x: 10.496, y: 73.472 },
    { x: 0, y: 73.472 },

    { x: 13.6875, y: 0 },
    { x: 24.1835, y: 0 },
    { x: 24.1835, y: 14.016 },
    { x: 27.6395, y: 17.472 },
    { x: 69.6875, y: 17.472 },
    { x: 69.6875, y: 28.032 },
    { x: 27.6395, y: 28.032 },
    { x: 27.6395, y: 31.488 },
    { x: 69.6875, y: 73.472 },
    { x: 55.6715, y: 73.472 },
    { x: 24.1835, y: 41.984 },
    { x: 24.1835, y: 73.472 },
    { x: 13.6875, y: 73.472 },
    { x: 13.6875, y: 28.032 },
    { x: 20.6635, y: 28.032 },
    { x: 24.1835, y: 24.512 },
    { x: 24.1835, y: 20.992 },
    { x: 20.6635, y: 17.472 },
  ];

  return (
    <svg
      x={logoBox.x}
      y={logoBox.y}
      width={logoBox.width}
      height={logoBox.height}
      viewBox="-8 -8 86 90"
      fill="none"
      overflow="visible"
      aria-hidden="true"
    >
      <motion.g
        initial={{ opacity: 0, scale: 0.985 }}
        animate={{
          opacity: hasReached(phase, "canvas") ? 1 : 0,
          scale: hasReached(phase, "discover") ? 1 : 0.985,
        }}
        transition={{
          duration: 1.1,
          ease: [0.65, 0, 0.35, 1],
        }}
        style={{ transformOrigin: "35px 37px" }}
      >
        <LogoConstructionLine
          x1={0}
          y1={0}
          x2={69.6875}
          y2={0}
          visible={constructionVisible}
          delay={0.05}
          opacity={0.12}
        />
        <LogoConstructionLine
          x1={69.6875}
          y1={0}
          x2={69.6875}
          y2={73.472}
          visible={constructionVisible}
          delay={0.1}
          opacity={0.12}
        />
        <LogoConstructionLine
          x1={69.6875}
          y1={73.472}
          x2={0}
          y2={73.472}
          visible={constructionVisible}
          delay={0.15}
          opacity={0.12}
        />
        <LogoConstructionLine
          x1={0}
          y1={73.472}
          x2={0}
          y2={0}
          visible={constructionVisible}
          delay={0.2}
          opacity={0.12}
        />

        {verticalGuides.map((x, index) => (
          <LogoConstructionLine
            key={`logo-v-${x}`}
            x1={x}
            y1={-4}
            x2={x}
            y2={77.5}
            visible={constructionVisible}
            delay={0.24 + index * 0.035}
            opacity={index % 2 === 0 ? 0.105 : 0.065}
            dashed={index % 2 !== 0}
          />
        ))}

        {horizontalGuides.map((y, index) => (
          <LogoConstructionLine
            key={`logo-h-${y}`}
            x1={-4}
            y1={y}
            x2={73.5}
            y2={y}
            visible={constructionVisible}
            delay={0.34 + index * 0.028}
            opacity={index % 2 === 0 ? 0.1 : 0.06}
            dashed={index % 2 !== 0}
          />
        ))}

        <LogoConstructionLine
          x1={24.1835}
          y1={41.984}
          x2={55.6715}
          y2={73.472}
          visible={constructionVisible}
          delay={0.68}
          opacity={0.18}
        />
        <LogoConstructionLine
          x1={27.6395}
          y1={31.488}
          x2={69.6875}
          y2={73.472}
          visible={constructionVisible}
          delay={0.76}
          opacity={0.18}
        />
        <LogoConstructionLine
          x1={13.6875}
          y1={28.032}
          x2={27.6395}
          y2={17.472}
          visible={constructionVisible}
          delay={0.84}
          opacity={0.12}
          dashed
        />

        <LogoConstructionCircle
          cx={20.6635}
          cy={24.512}
          r={4.95}
          visible={constructionVisible}
          delay={0.9}
          opacity={0.18}
        />
        <LogoConstructionCircle
          cx={24.1835}
          cy={28.032}
          r={6.2}
          visible={constructionVisible}
          delay={0.98}
          opacity={0.14}
          dashed
        />
        <LogoConstructionCircle
          cx={27.6395}
          cy={28.032}
          r={3.45}
          visible={constructionVisible}
          delay={1.06}
          opacity={0.18}
        />
        <LogoConstructionCircle
          cx={24.1835}
          cy={20.992}
          r={3.55}
          visible={constructionVisible}
          delay={1.14}
          opacity={0.14}
          dashed
        />

        <LogoArcGuide
          cx={24.1835}
          cy={28.032}
          r={9.5}
          startAngle={205}
          endAngle={320}
          visible={constructionVisible}
          delay={1.2}
          opacity={0.16}
        />
        <LogoArcGuide
          cx={24.1835}
          cy={20.992}
          r={8.2}
          startAngle={20}
          endAngle={145}
          visible={constructionVisible}
          delay={1.28}
          opacity={0.13}
        />

        {anchors.map((point, index) => (
          <LogoAnchorPoint
            key={`logo-anchor-${point.x}-${point.y}-${index}`}
            x={point.x}
            y={point.y}
            visible={anchorVisible}
            delay={0.78 + index * 0.025}
            opacity={index % 3 === 0 ? 0.48 : 0.36}
          />
        ))}

        <motion.path
          d={LOGO_I_PATH}
          fill="none"
          stroke="white"
          strokeWidth="1.25"
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{
            pathLength: logoDraftVisible ? 1 : 0,
            opacity: logoDraftVisible ? 0.5 : 0,
          }}
          transition={{
            duration: 1.45,
            delay: 0.55,
            ease: [0.65, 0, 0.35, 1],
          }}
        />

        <motion.path
          d={LOGO_K_PATH}
          fill="none"
          stroke="white"
          strokeWidth="1.25"
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{
            pathLength: logoDraftVisible ? 1 : 0,
            opacity: logoDraftVisible ? 0.5 : 0,
          }}
          transition={{
            duration: 1.85,
            delay: 0.82,
            ease: [0.65, 0, 0.35, 1],
          }}
        />

        <motion.g
          initial={{ opacity: 0 }}
          animate={{
            opacity: finalLogoVisible ? logoBox.finalOpacity : 0,
          }}
          transition={{
            duration: 1.35,
            delay: 0.7,
            ease: [0.65, 0, 0.35, 1],
          }}
        >
          <path d={LOGO_I_PATH} fill="white" />
          <path d={LOGO_K_PATH} fill="white" />
        </motion.g>

        <motion.g
          initial={{ opacity: 0 }}
          animate={{
            opacity: finalLogoVisible ? 0.055 : 0,
          }}
          transition={{
            duration: 1.35,
            delay: 0.9,
            ease: [0.65, 0, 0.35, 1],
          }}
        >
          <path
            d={LOGO_I_PATH}
            fill="none"
            stroke="white"
            strokeWidth="0.8"
            vectorEffect="non-scaling-stroke"
          />
          <path
            d={LOGO_K_PATH}
            fill="none"
            stroke="white"
            strokeWidth="0.8"
            vectorEffect="non-scaling-stroke"
          />
        </motion.g>
      </motion.g>
    </svg>
  );
}

function TypographyConstruction({
  phase,
  isMobile,
}: {
  phase: LoaderPhase;
  isMobile: boolean;
}) {
  const rows = isMobile
    ? [
        {
          id: "ishant",
          x1: 315,
          x2: 885,
          cap: 205,
          xHeight: 246,
          baseline: 285,
          descender: 318,
          labelX: 300,
        },
        {
          id: "kumar",
          x1: 315,
          x2: 885,
          cap: 314,
          xHeight: 353,
          baseline: 394,
          descender: 426,
          labelX: 300,
        },
      ]
    : [
        {
          id: "full",
          x1: 150,
          x2: 1050,
          cap: 244,
          xHeight: 286,
          baseline: 346,
          descender: 382,
          labelX: 142,
        },
      ];

  const verticalGuides = isMobile
    ? [350, 405, 460, 520, 580, 640, 700, 760, 820]
    : [192, 248, 304, 366, 426, 486, 558, 642, 704, 764, 832, 902, 972];

  const circles = isMobile
    ? [
        { cx: 390, cy: 246, r: 42, delay: 0.62 },
        { cx: 520, cy: 246, r: 38, delay: 0.76 },
        { cx: 650, cy: 246, r: 40, delay: 0.9 },
        { cx: 775, cy: 246, r: 36, delay: 1.04 },
        { cx: 405, cy: 354, r: 40, delay: 1.18 },
        { cx: 535, cy: 354, r: 42, delay: 1.32 },
        { cx: 665, cy: 354, r: 38, delay: 1.46 },
        { cx: 795, cy: 354, r: 40, delay: 1.6 },
      ]
    : [
        { cx: 264, cy: 294, r: 52, delay: 0.62 },
        { cx: 516, cy: 296, r: 50, delay: 0.82 },
        { cx: 750, cy: 296, r: 51, delay: 1.02 },
        { cx: 918, cy: 296, r: 48, delay: 1.22 },
      ];

  return (
    <g>
      {rows.map((row, rowIndex) => (
        <g key={row.id}>
          <ConstructionLine
            x1={row.x1}
            y1={row.cap}
            x2={row.x2}
            y2={row.cap}
            phase={phase}
            showAt="construct"
            hideAt="hold"
            delay={0.05 + rowIndex * 0.08}
            opacity={0.2}
          />

          <ConstructionLine
            x1={row.x1}
            y1={row.xHeight}
            x2={row.x2}
            y2={row.xHeight}
            phase={phase}
            showAt="construct"
            hideAt="hold"
            delay={0.12 + rowIndex * 0.08}
            opacity={0.14}
            strokeDasharray="5 8"
          />

          <ConstructionLine
            x1={row.x1}
            y1={row.baseline}
            x2={row.x2}
            y2={row.baseline}
            phase={phase}
            showAt="construct"
            hideAt="hold"
            delay={0.19 + rowIndex * 0.08}
            opacity={0.22}
          />

          <ConstructionLine
            x1={row.x1}
            y1={row.descender}
            x2={row.x2}
            y2={row.descender}
            phase={phase}
            showAt="construct"
            hideAt="hold"
            delay={0.26 + rowIndex * 0.08}
            opacity={0.1}
            strokeDasharray="5 8"
          />

          <ConstructionLabel
            x={row.labelX}
            y={row.cap + 3}
            phase={phase}
            delay={0.18 + rowIndex * 0.08}
            opacity={0.42}
            anchor="end"
          >
            cap height
          </ConstructionLabel>

          <ConstructionLabel
            x={row.labelX}
            y={row.xHeight + 3}
            phase={phase}
            delay={0.26 + rowIndex * 0.08}
            opacity={0.34}
            anchor="end"
          >
            x-height
          </ConstructionLabel>

          <ConstructionLabel
            x={row.labelX}
            y={row.baseline + 3}
            phase={phase}
            delay={0.34 + rowIndex * 0.08}
            opacity={0.42}
            anchor="end"
          >
            baseline
          </ConstructionLabel>

          {verticalGuides.map((x, index) => (
            <ConstructionLine
              key={`${row.id}-v-${x}`}
              x1={x}
              y1={row.cap - 24}
              x2={x}
              y2={row.descender + 20}
              phase={phase}
              showAt="construct"
              hideAt="hold"
              delay={0.34 + rowIndex * 0.12 + index * 0.035}
              opacity={index % 2 === 0 ? 0.15 : 0.08}
            />
          ))}
        </g>
      ))}

      {circles.map((circle, index) => (
        <g key={`circle-${index}`}>
          <ConstructionCircle
            cx={circle.cx}
            cy={circle.cy}
            r={circle.r}
            phase={phase}
            delay={circle.delay}
            opacity={0.16}
          />

          <ConstructionCircle
            cx={circle.cx}
            cy={circle.cy}
            r={Math.round(circle.r * 0.62)}
            phase={phase}
            delay={circle.delay + 0.12}
            opacity={0.1}
            dashed
          />

          <CenterMark
            x={circle.cx}
            y={circle.cy}
            phase={phase}
            delay={circle.delay + 0.22}
          />
        </g>
      ))}

      {isMobile ? (
        <>
          <ConstructionLine
            x1={350}
            y1={285}
            x2={430}
            y2={205}
            phase={phase}
            showAt="construct"
            hideAt="hold"
            delay={1.15}
            opacity={0.16}
          />

          <ConstructionLine
            x1={615}
            y1={394}
            x2={700}
            y2={314}
            phase={phase}
            showAt="construct"
            hideAt="hold"
            delay={1.28}
            opacity={0.16}
          />

          <ConstructionLabel
            x={448}
            y={218}
            phase={phase}
            delay={1.36}
            opacity={0.4}
          >
            45°
          </ConstructionLabel>

          <ConstructionLabel
            x={720}
            y={326}
            phase={phase}
            delay={1.46}
            opacity={0.4}
          >
            tangent
          </ConstructionLabel>

          <MeasurementArrow
            x1={350}
            y1={456}
            x2={420}
            y2={456}
            label="24px"
            labelX={385}
            labelY={475}
            phase={phase}
            delay={1.48}
          />

          <MeasurementArrow
            x1={470}
            y1={456}
            x2={535}
            y2={456}
            label="8px"
            labelX={502}
            labelY={475}
            phase={phase}
            delay={1.6}
          />

          <MeasurementArrow
            x1={705}
            y1={456}
            x2={800}
            y2={456}
            label="spacing"
            labelX={752}
            labelY={475}
            phase={phase}
            delay={1.72}
          />

          <ConstructionLabel
            x={838}
            y={354}
            phase={phase}
            delay={1.85}
            opacity={0.42}
          >
            R32
          </ConstructionLabel>
        </>
      ) : (
        <>
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
        </>
      )}

      <ConstructionLine
        x1={isMobile ? 815 : 842}
        y1={isMobile ? 330 : 258}
        x2={isMobile ? 850 : 796}
        y2={isMobile ? 292 : 216}
        phase={phase}
        showAt="construct"
        hideAt="hold"
        delay={1.9}
        opacity={0.14}
      />

      <ConstructionLine
        x1={isMobile ? 815 : 842}
        y1={isMobile ? 382 : 334}
        x2={isMobile ? 852 : 794}
        y2={isMobile ? 424 : 378}
        phase={phase}
        showAt="construct"
        hideAt="hold"
        delay={1.98}
        opacity={0.14}
      />

      <ConstructionCircle
        cx={isMobile ? 850 : 796}
        cy={isMobile ? 292 : 216}
        r={3}
        phase={phase}
        delay={2.06}
        opacity={0.34}
      />

      <ConstructionCircle
        cx={isMobile ? 852 : 794}
        cy={isMobile ? 424 : 378}
        r={3}
        phase={phase}
        delay={2.14}
        opacity={0.34}
      />

      <ConstructionLabel
        x={isMobile ? 850 : 798}
        y={isMobile ? 282 : 205}
        phase={phase}
        delay={2.22}
        opacity={0.32}
      >
        bezier handle
      </ConstructionLabel>
    </g>
  );
}

function ConstructionDetailLayer({
  phase,
  isMobile,
}: {
  phase: LoaderPhase;
  isMobile: boolean;
}) {
  if (isMobile) {
    return (
      <g>
        <CornerRegistration
          x={315}
          y={176}
          phase={phase}
          corner="tl"
          delay={0.16}
        />
        <CornerRegistration
          x={885}
          y={176}
          phase={phase}
          corner="tr"
          delay={0.2}
        />
        <CornerRegistration
          x={315}
          y={452}
          phase={phase}
          corner="bl"
          delay={0.24}
        />
        <CornerRegistration
          x={885}
          y={452}
          phase={phase}
          corner="br"
          delay={0.28}
        />

        <RulerTicks
          x1={315}
          x2={885}
          y={205}
          phase={phase}
          count={16}
          direction="up"
          delay={0.92}
        />
        <RulerTicks
          x1={315}
          x2={885}
          y={285}
          phase={phase}
          count={16}
          direction="down"
          delay={1.02}
        />
        <RulerTicks
          x1={315}
          x2={885}
          y={314}
          phase={phase}
          count={16}
          direction="up"
          delay={1.12}
        />
        <RulerTicks
          x1={315}
          x2={885}
          y={394}
          phase={phase}
          count={16}
          direction="down"
          delay={1.22}
        />

        <ArcGuide
          cx={390}
          cy={246}
          r={58}
          startAngle={205}
          endAngle={318}
          phase={phase}
          delay={1.32}
          opacity={0.18}
          label="R42"
          labelX={346}
          labelY={238}
        />
        <ArcGuide
          cx={535}
          cy={354}
          r={60}
          startAngle={28}
          endAngle={146}
          phase={phase}
          delay={1.44}
          opacity={0.18}
          label="R40"
          labelX={574}
          labelY={342}
        />
        <ArcGuide
          cx={795}
          cy={354}
          r={54}
          startAngle={220}
          endAngle={330}
          phase={phase}
          delay={1.56}
          opacity={0.16}
          label="opt."
          labelX={835}
          labelY={384}
        />

        <TangentPoint x={430} y={205} phase={phase} delay={1.64} />
        <TangentPoint x={700} y={314} phase={phase} delay={1.72} />
        <TangentPoint x={775} y={246} phase={phase} delay={1.8} />

        <BracketMeasure
          x1={315}
          x2={885}
          y={184}
          label="composition width"
          phase={phase}
          delay={1.86}
        />
        <BracketMeasure
          x1={315}
          x2={885}
          y={444}
          label="shared measure"
          phase={phase}
          delay={1.98}
        />

        <ConstructionLine
          x1={600}
          y1={176}
          x2={600}
          y2={452}
          phase={phase}
          showAt="construct"
          hideAt="hold"
          delay={2.08}
          opacity={0.18}
          strokeDasharray="2 7"
        />

        <ConstructionLabel
          x={613}
          y={197}
          phase={phase}
          showAt="construct"
          hideAt="hold"
          delay={2.16}
          opacity={0.38}
          anchor="start"
        >
          optical axis
        </ConstructionLabel>

        <ConstructionLabel
          x={872}
          y={229}
          phase={phase}
          showAt="construct"
          hideAt="hold"
          delay={2.26}
          opacity={0.32}
          anchor="end"
        >
          +2px overshoot
        </ConstructionLabel>

        <ConstructionLabel
          x={328}
          y={405}
          phase={phase}
          showAt="construct"
          hideAt="hold"
          delay={2.34}
          opacity={0.32}
          anchor="start"
        >
          baseline lock
        </ConstructionLabel>
      </g>
    );
  }

  return (
    <g>
      <CornerRegistration
        x={150}
        y={210}
        phase={phase}
        corner="tl"
        delay={0.16}
      />
      <CornerRegistration
        x={1050}
        y={210}
        phase={phase}
        corner="tr"
        delay={0.2}
      />
      <CornerRegistration
        x={150}
        y={410}
        phase={phase}
        corner="bl"
        delay={0.24}
      />
      <CornerRegistration
        x={1050}
        y={410}
        phase={phase}
        corner="br"
        delay={0.28}
      />

      <RulerTicks
        x1={150}
        x2={1050}
        y={244}
        phase={phase}
        count={24}
        direction="up"
        delay={0.92}
      />
      <RulerTicks
        x1={150}
        x2={1050}
        y={346}
        phase={phase}
        count={24}
        direction="down"
        delay={1.04}
      />

      <ArcGuide
        cx={264}
        cy={294}
        r={68}
        startAngle={198}
        endAngle={322}
        phase={phase}
        delay={1.18}
        opacity={0.17}
        label="R52"
        labelX={214}
        labelY={286}
      />
      <ArcGuide
        cx={516}
        cy={296}
        r={66}
        startAngle={28}
        endAngle={150}
        phase={phase}
        delay={1.32}
        opacity={0.17}
        label="R50"
        labelX={566}
        labelY={286}
      />
      <ArcGuide
        cx={750}
        cy={296}
        r={67}
        startAngle={210}
        endAngle={336}
        phase={phase}
        delay={1.46}
        opacity={0.17}
        label="R51"
        labelX={798}
        labelY={327}
      />

      <TangentPoint x={302} y={346} phase={phase} delay={1.56} />
      <TangentPoint x={558} y={244} phase={phase} delay={1.66} />
      <TangentPoint x={796} y={244} phase={phase} delay={1.76} />

      <BracketMeasure
        x1={150}
        x2={1050}
        y={196}
        label="wordmark measure"
        phase={phase}
        delay={1.84}
      />
      <BracketMeasure
        x1={426}
        x2={558}
        y={438}
        label="letter group"
        phase={phase}
        delay={1.96}
      />
      <BracketMeasure
        x1={642}
        x2={832}
        y={148}
        label="optical spacing"
        phase={phase}
        delay={2.08}
      />

      <ConstructionLine
        x1={600}
        y1={210}
        x2={600}
        y2={410}
        phase={phase}
        showAt="construct"
        hideAt="hold"
        delay={2.16}
        opacity={0.18}
        strokeDasharray="2 7"
      />

      <ConstructionLabel
        x={613}
        y={200}
        phase={phase}
        showAt="construct"
        hideAt="hold"
        delay={2.24}
        opacity={0.38}
        anchor="start"
      >
        optical axis
      </ConstructionLabel>

      <ConstructionLabel
        x={1038}
        y={236}
        phase={phase}
        showAt="construct"
        hideAt="hold"
        delay={2.34}
        opacity={0.32}
        anchor="end"
      >
        +2px overshoot
      </ConstructionLabel>

      <ConstructionLabel
        x={162}
        y={365}
        phase={phase}
        showAt="construct"
        hideAt="hold"
        delay={2.42}
        opacity={0.32}
        anchor="start"
      >
        baseline lock
      </ConstructionLabel>
    </g>
  );
}

function WordmarkReveal({
  phase,
  isMobile,
  normalizedName,
}: {
  phase: LoaderPhase;
  isMobile: boolean;
  normalizedName: string;
}) {
  const wordmarkVisible = hasReached(phase, "discover");
  const helperVisible =
    hasReached(phase, "construct") && isBefore(phase, "hold");

  const nameParts = normalizedName.split(/\s+/);
  const firstLine = nameParts[0] || "ISHANT";
  const secondLine = nameParts.slice(1).join(" ") || "KUMAR";

  const rows = isMobile
    ? [
        {
          text: firstLine,
          y: 285,
          fontSize: 86,
          textLength: 520,
        },
        {
          text: secondLine,
          y: 394,
          fontSize: 86,
          textLength: 500,
        },
      ]
    : [
        {
          text: normalizedName,
          y: 346,
          fontSize: 82,
          textLength: 820,
        },
      ];

  return (
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
      {rows.map((row, index) => (
        <g key={`${row.text}-${index}`}>
          <motion.text
            x="600"
            y={row.y}
            textAnchor="middle"
            dominantBaseline="alphabetic"
            fill="none"
            stroke="white"
            strokeWidth="1"
            strokeOpacity={helperVisible ? 0.16 : 0}
            fontSize={row.fontSize}
            fontFamily="var(--font-display-name), ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Helvetica Neue', Arial, sans-serif"
            fontWeight="500"
            letterSpacing="0.13em"
            lengthAdjust="spacing"
            textLength={row.textLength}
            initial={{ opacity: 0, y: 4 }}
            animate={{
              opacity: wordmarkVisible && helperVisible ? 1 : 0,
              y: wordmarkVisible ? 0 : 4,
            }}
            transition={{
              duration: 1.4,
              delay: 0.15 + index * 0.12,
              ease: [0.65, 0, 0.35, 1],
            }}
          >
            {row.text}
          </motion.text>

          <motion.text
            x="600"
            y={row.y}
            textAnchor="middle"
            dominantBaseline="alphabetic"
            fill="white"
            fontSize={row.fontSize}
            fontFamily="var(--font-display-name), ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Helvetica Neue', Arial, sans-serif"
            fontWeight="500"
            letterSpacing="0.13em"
            lengthAdjust="spacing"
            textLength={row.textLength}
            initial={{ opacity: 0, y: 4 }}
            animate={{
              opacity: wordmarkVisible ? 0.92 : 0,
              y: wordmarkVisible ? 0 : 4,
            }}
            transition={{
              duration: 1.2,
              delay: 0.55 + index * 0.12,
              ease: [0.65, 0, 0.35, 1],
            }}
          >
            {row.text}
          </motion.text>
        </g>
      ))}
    </motion.g>
  );
}

function SkipIntroButton({
  isMobile,
  isVisible,
  onSkip,
}: {
  isMobile: boolean;
  isVisible: boolean;
  onSkip: () => void;
}) {
  return (
    <motion.button
      type="button"
      aria-label="Skip intro animation"
      onClick={onSkip}
      disabled={!isVisible}
      className="absolute bottom-6 left-1/2 z-20 -translate-x-1/2 rounded-full border border-white/10 bg-[#050505]/70 px-4 py-2 text-[10px] uppercase tracking-[0.22em] text-white/55 backdrop-blur-md transition-colors hover:border-white/20 hover:text-white/80 focus:outline-none focus:ring-1 focus:ring-white/30 disabled:cursor-default"
      style={{
        pointerEvents: isVisible ? "auto" : "none",
      }}
      initial={{ opacity: 0, y: 6 }}
      animate={{
        opacity: isVisible ? 1 : 0,
        y: isVisible ? 0 : 6,
      }}
      transition={{
        duration: 0.45,
        delay: isVisible ? 0.9 : 0,
        ease: [0.65, 0, 0.35, 1],
      }}
    >
      Skip
    </motion.button>
  );
}

export function IntroLoader({
  name = "ISHANT KUMAR",
  onComplete,
  preloadImages = [],
}: IntroLoaderProps) {
  const [phase, setPhase] = useState<LoaderPhase>("empty");
  const [hasSkipped, setHasSkipped] = useState(false);
  const [preloaded, setPreloaded] = useState(false);

  const shouldReduceMotion = useReducedMotion();
  const isMobile = useIsMobile();

  const timersRef = useRef<number[]>([]);
  const completeTimerRef = useRef<number | null>(null);
  const didCompleteRef = useRef(false);
  const onCompleteRef = useRef(onComplete);

  // Prevent scrolling while loading
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    const originalPaddingRight = document.body.style.paddingRight;

    // Get scrollbar width to prevent layout shift
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;

    document.body.style.overflow = "hidden";
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }

    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.paddingRight = originalPaddingRight;
    };
  }, []);

  const normalizedName = useMemo(
    () => name.trim().toUpperCase() || "ISHANT KUMAR",
    [name],
  );

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  // Preload images when component mounts
  useEffect(() => {
    if (preloadImages.length === 0) {
      setPreloaded(true);
      return;
    }

    let loadedCount = 0;
    const total = preloadImages.length;

    const onImageLoad = () => {
      loadedCount++;
      if (loadedCount >= total) {
        setPreloaded(true);
      }
    };

    const onImageError = () => {
      loadedCount++;
      if (loadedCount >= total) {
        setPreloaded(true);
      }
    };

    preloadImages.forEach((src) => {
      const img = new Image();
      img.onload = onImageLoad;
      img.onerror = onImageError;
      img.src = src;
    });
  }, [preloadImages]);

  const clearLoaderTimers = () => {
    timersRef.current.forEach((timer) => {
      window.clearTimeout(timer);
    });

    timersRef.current = [];

    if (completeTimerRef.current !== null) {
      window.clearTimeout(completeTimerRef.current);
      completeTimerRef.current = null;
    }
  };

  const completeOnce = () => {
    if (didCompleteRef.current) return;

    didCompleteRef.current = true;
    onCompleteRef.current();
  };

  const handleSkip = () => {
    if (didCompleteRef.current || phase === "exit") return;

    clearLoaderTimers();

    setHasSkipped(true);
    setPhase("exit");

    completeTimerRef.current = window.setTimeout(() => {
      completeOnce();
    }, 720);
  };

  useEffect(() => {
    if (shouldReduceMotion) {
      completeOnce();
      return;
    }

    timersRef.current = PHASE_TIMING.map(({ phase: nextPhase, at }) =>
      window.setTimeout(() => {
        setPhase(nextPhase);
      }, at),
    );

    completeTimerRef.current = window.setTimeout(() => {
      completeOnce();
    }, 9700);

    return () => {
      clearLoaderTimers();
    };
     
  }, [shouldReduceMotion]);

  const isExiting = phase === "exit";
  // Skip button visible when preloading is done and not exiting
  const showSkip = preloaded && !isExiting;

  return (
    <motion.div
      role="presentation"
      className="fixed inset-0 z-[120] flex h-[100dvh] w-screen items-center justify-center overflow-hidden bg-[#050505]"
      initial={{
        y: 0,
        filter: "blur(0px)",
      }}
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
        duration: hasSkipped ? 0.62 : 0.92,
        ease: [0.77, 0, 0.18, 1],
      }}
    >
      <motion.svg
        viewBox={isMobile ? "235 145 730 360" : "0 0 1200 620"}
        preserveAspectRatio="xMidYMid meet"
        className="h-auto w-[118vw] max-w-none overflow-visible sm:w-[min(94vw,1180px)]"
        initial={{
          opacity: 1,
          scale: 1.015,
        }}
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

        <CenterMark
          x={600}
          y={310}
          phase={phase}
          showAt="canvas"
          hideAt="exit"
          delay={0}
        />

        <CanvasGrid phase={phase} isMobile={isMobile} />

        <TypographyConstruction phase={phase} isMobile={isMobile} />

        <ConstructionDetailLayer phase={phase} isMobile={isMobile} />

        <LogoConstructionLayer phase={phase} isMobile={isMobile} />

        <WordmarkReveal
          phase={phase}
          isMobile={isMobile}
          normalizedName={normalizedName}
        />

        <motion.text
          x="600"
          y={isMobile ? 490 : 474}
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

      <SkipIntroButton
        isMobile={isMobile}
        isVisible={showSkip}
        onSkip={handleSkip}
      />
    </motion.div>
  );
}
