"use client";

import { AnimatePresence, motion } from "framer-motion";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

const LOGO_I_PATH =
  "M10.496 0V10.496H0V0H10.496ZM10.496 17.472V73.472H0V17.472H10.496Z";

const LOGO_K_PATH =
  "M69.6875 17.472V28.032H27.6395V31.488L69.6875 73.472H55.6715L24.1835 41.984V73.472H13.6875V28.032H20.6635V24.512H24.1835V20.992H20.6635V17.472H13.6875V0H24.1835V14.016H27.6395V17.472H69.6875ZM27.6395 28.032H24.1835V24.512C24.1835 26.432 22.5835 28.032 20.6635 28.032H24.1835V31.488C24.1835 30.528 24.5675 29.632 25.1435 28.992C25.7835 28.416 26.6795 28.032 27.6395 28.032ZM24.1835 20.992V17.472H20.6635C22.5835 17.472 24.1835 19.072 24.1835 20.992Z";

const ROUTE_PUSH_DELAY = 420;

function formatPathname(pathname: string) {
  if (pathname === "/") return "Home";

  const cleaned = pathname
    .split("/")
    .filter(Boolean)
    .slice(-1)[0]
    ?.replace(/[-_]/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());

  return cleaned || "Page";
}

function normalizeHref(href: string) {
  try {
    const url = new URL(href, window.location.origin);
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return href;
  }
}

function RouteLogoConstructionLine({
  x1,
  y1,
  x2,
  y2,
  delay = 0,
  opacity = 0.12,
  dashed = false,
}: {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
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
      strokeDasharray={dashed ? "2 4" : undefined}
      vectorEffect="non-scaling-stroke"
      initial={{ pathLength: 0, opacity: 0 }}
      animate={{ pathLength: 1, opacity }}
      transition={{
        duration: 0.75,
        delay,
        ease: [0.65, 0, 0.35, 1],
      }}
    />
  );
}

function RouteLogoConstructionCircle({
  cx,
  cy,
  r,
  delay = 0,
  opacity = 0.14,
  dashed = false,
}: {
  cx: number;
  cy: number;
  r: number;
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
      strokeDasharray={dashed ? "2 4" : undefined}
      vectorEffect="non-scaling-stroke"
      initial={{ pathLength: 0, opacity: 0 }}
      animate={{ pathLength: 1, opacity }}
      transition={{
        duration: 0.85,
        delay,
        ease: [0.65, 0, 0.35, 1],
      }}
    />
  );
}

function RouteLogoAnchorPoint({
  x,
  y,
  delay = 0,
  opacity = 0.38,
}: {
  x: number;
  y: number;
  delay?: number;
  opacity?: number;
}) {
  return (
    <motion.g
      initial={{ opacity: 0, scale: 0.82 }}
      animate={{ opacity, scale: 1 }}
      transition={{
        duration: 0.42,
        delay,
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

function RouteTransitionLogo() {
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
    <motion.svg
      className="pointer-events-none absolute left-1/2 top-1/2 h-[min(66vw,520px)] w-[min(66vw,520px)] -translate-x-1/2 -translate-y-1/2 overflow-visible"
      viewBox="-12 -12 94 98"
      fill="none"
      aria-hidden="true"
      initial={{ opacity: 0, scale: 1 }}
      animate={{ opacity: 0.25, scale: 1 }}
      exit={{ opacity: 0, scale: 1 }}
      transition={{
        duration: 0.45,
        ease: [0.22, 1, 0.36, 1],
      }}
    >
      {/* faint static watermark */}
      <motion.g
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{
          duration: 0.45,
          delay: 0.08,
          ease: [0.22, 1, 0.36, 1],
        }}
      >
        <path d={LOGO_I_PATH} fill="white" opacity="0.018" />
        <path d={LOGO_K_PATH} fill="white" opacity="0.018" />

        <path
          d={LOGO_I_PATH}
          fill="none"
          stroke="white"
          strokeWidth="1.2"
          opacity="0.18"
          vectorEffect="non-scaling-stroke"
        />
        <path
          d={LOGO_K_PATH}
          fill="none"
          stroke="white"
          strokeWidth="1.2"
          opacity="0.18"
          vectorEffect="non-scaling-stroke"
        />
      </motion.g>

      {/* construction frame */}
      <g opacity="0.85">
        <RouteLogoConstructionLine
          x1={0}
          y1={0}
          x2={69.6875}
          y2={0}
          delay={0.04}
          opacity={0.1}
        />
        <RouteLogoConstructionLine
          x1={69.6875}
          y1={0}
          x2={69.6875}
          y2={73.472}
          delay={0.08}
          opacity={0.1}
        />
        <RouteLogoConstructionLine
          x1={69.6875}
          y1={73.472}
          x2={0}
          y2={73.472}
          delay={0.12}
          opacity={0.1}
        />
        <RouteLogoConstructionLine
          x1={0}
          y1={73.472}
          x2={0}
          y2={0}
          delay={0.16}
          opacity={0.1}
        />

        {verticalGuides.map((x, index) => (
          <RouteLogoConstructionLine
            key={`route-logo-v-${x}`}
            x1={x}
            y1={-5}
            x2={x}
            y2={78.5}
            delay={0.16 + index * 0.025}
            opacity={index % 2 === 0 ? 0.09 : 0.055}
            dashed={index % 2 !== 0}
          />
        ))}

        {horizontalGuides.map((y, index) => (
          <RouteLogoConstructionLine
            key={`route-logo-h-${y}`}
            x1={-5}
            y1={y}
            x2={74.5}
            y2={y}
            delay={0.18 + index * 0.022}
            opacity={index % 2 === 0 ? 0.085 : 0.05}
            dashed={index % 2 !== 0}
          />
        ))}

        <RouteLogoConstructionLine
          x1={24.1835}
          y1={41.984}
          x2={55.6715}
          y2={73.472}
          delay={0.32}
          opacity={0.15}
        />
        <RouteLogoConstructionLine
          x1={27.6395}
          y1={31.488}
          x2={69.6875}
          y2={73.472}
          delay={0.36}
          opacity={0.15}
        />
        <RouteLogoConstructionLine
          x1={13.6875}
          y1={28.032}
          x2={27.6395}
          y2={17.472}
          delay={0.4}
          opacity={0.11}
          dashed
        />

        <RouteLogoConstructionCircle
          cx={20.6635}
          cy={24.512}
          r={4.95}
          delay={0.42}
          opacity={0.15}
        />
        <RouteLogoConstructionCircle
          cx={24.1835}
          cy={28.032}
          r={6.2}
          delay={0.46}
          opacity={0.12}
          dashed
        />
        <RouteLogoConstructionCircle
          cx={27.6395}
          cy={28.032}
          r={3.45}
          delay={0.5}
          opacity={0.15}
        />
        <RouteLogoConstructionCircle
          cx={24.1835}
          cy={20.992}
          r={3.55}
          delay={0.54}
          opacity={0.12}
          dashed
        />

        {anchors.map((point, index) => (
          <RouteLogoAnchorPoint
            key={`route-logo-anchor-${point.x}-${point.y}-${index}`}
            x={point.x}
            y={point.y}
            delay={0.28 + index * 0.012}
            opacity={index % 3 === 0 ? 0.42 : 0.32}
          />
        ))}
      </g>

      {/* fixed logo outline + travelling stroke, not rotating the whole logo */}
      <g>
        {/* fixed prominent outline */}
        <motion.path
          d={LOGO_I_PATH}
          fill="none"
          stroke="white"
          strokeWidth="1.25"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.24"
          vectorEffect="non-scaling-stroke"
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.24 }}
          transition={{
            duration: 0.45,
            delay: 0.12,
            ease: [0.22, 1, 0.36, 1],
          }}
        />

        <motion.path
          d={LOGO_K_PATH}
          fill="none"
          stroke="white"
          strokeWidth="1.25"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.24"
          vectorEffect="non-scaling-stroke"
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.24 }}
          transition={{
            duration: 0.45,
            delay: 0.16,
            ease: [0.22, 1, 0.36, 1],
          }}
        />

        {/* travelling outline segment */}
        <motion.path
          d={LOGO_I_PATH}
          pathLength={1}
          fill="none"
          stroke="white"
          strokeWidth="1.65"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray="0.18 0.82"
          vectorEffect="non-scaling-stroke"
          initial={{
            strokeDashoffset: 1,
            opacity: 0,
          }}
          animate={{
            strokeDashoffset: [1, 0, 0],
            opacity: [0, 0.72, 0.72, 0],
          }}
          transition={{
            duration: 2.4,
            times: [0, 0.78, 1],
            repeat: Infinity,
            repeatDelay: 0.2,
            ease: [0.65, 0, 0.35, 1],
          }}
        />

        <motion.path
          d={LOGO_K_PATH}
          pathLength={1}
          fill="none"
          stroke="white"
          strokeWidth="1.65"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray="0.14 0.86"
          vectorEffect="non-scaling-stroke"
          initial={{
            strokeDashoffset: 1,
            opacity: 0,
          }}
          animate={{
            strokeDashoffset: [1, 0, 0],
            opacity: [0, 0.78, 0.78, 0],
          }}
          transition={{
            duration: 2.4,
            times: [0, 0.78, 1],
            repeat: Infinity,
            repeatDelay: 0.2,
            ease: [0.65, 0, 0.35, 1],
          }}
        />
      </g>

      {/* subtle moving technical dash outline */}
      <motion.g
        initial={{ opacity: 0 }}
        animate={{ opacity: [0.14, 0.32, 0.14] }}
        transition={{
          duration: 2.4,
          repeat: Infinity,
          repeatDelay: 0.2,
          ease: [0.65, 0, 0.35, 1],
        }}
      >
        <motion.path
          d={LOGO_I_PATH}
          fill="none"
          stroke="white"
          strokeWidth="0.75"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray="7 12"
          vectorEffect="non-scaling-stroke"
          animate={{ strokeDashoffset: [0, -38, -38] }}
          transition={{
            duration: 2.4,
            times: [0, 0.78, 1],
            repeat: Infinity,
            repeatDelay: 0.2,
            ease: [0.65, 0, 0.35, 1],
          }}
        />

        <motion.path
          d={LOGO_K_PATH}
          fill="none"
          stroke="white"
          strokeWidth="0.75"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray="9 14"
          vectorEffect="non-scaling-stroke"
          animate={{ strokeDashoffset: [0, -56, -56] }}
          transition={{
            duration: 2.4,
            times: [0, 0.78, 1],
            repeat: Infinity,
            repeatDelay: 0.2,
            ease: [0.65, 0, 0.35, 1],
          }}
        />
      </motion.g>
    </motion.svg>
  );
}

export function RouteTransition() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();

  const mountedRef = useRef(false);
  const pendingHrefRef = useRef<string | null>(null);
  const pushTimeoutRef = useRef<number | null>(null);

  const [visible, setVisible] = useState(false);
  const [label, setLabel] = useState(formatPathname(pathname));

  const search = searchParams.toString();
  const currentRoute = search ? `${pathname}?${search}` : pathname;

  useEffect(() => {
    return () => {
      if (pushTimeoutRef.current) {
        window.clearTimeout(pushTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!mountedRef.current) {
      mountedRef.current = true;
      return;
    }

    if (pendingHrefRef.current) {
      pendingHrefRef.current = null;
      setVisible(false);
    }

    setLabel(formatPathname(pathname));
  }, [currentRoute, pathname]);

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented) return;
      if (event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
        return;
      }

      const target = event.target as HTMLElement | null;
      const anchor = target?.closest("a") as HTMLAnchorElement | null;

      if (!anchor) return;

      if (anchor.target === "_blank") return;
      if (anchor.hasAttribute("download")) return;
      if (anchor.origin !== window.location.origin) return;

      const targetUrl = new URL(anchor.href);

      const currentPath = window.location.pathname + window.location.search;
      const targetPath = targetUrl.pathname + targetUrl.search;

      // Ignore hash-only changes / same-page navigation.
      if (currentPath === targetPath) return;

      const href = normalizeHref(anchor.href);

      if (!href) return;

      event.preventDefault();

      pendingHrefRef.current = href;
      setLabel(formatPathname(targetUrl.pathname));
      setVisible(true);

      if (pushTimeoutRef.current) {
        window.clearTimeout(pushTimeoutRef.current);
      }

      pushTimeoutRef.current = window.setTimeout(() => {
        router.push(href);
      }, ROUTE_PUSH_DELAY);
    };

    document.addEventListener("click", onClick, true);

    return () => {
      document.removeEventListener("click", onClick, true);
    };
  }, [router]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key={`route-transition-${label}`}
          data-cursor-hide="true"
          className="pointer-events-auto fixed inset-0 z-[350] flex items-center justify-center overflow-hidden bg-[#050505] backdrop-blur-2xl"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{
            duration: 0.18,
            ease: [0.22, 1, 0.36, 1],
          }}
        >
          <RouteTransitionLogo />

          <motion.div
            className="relative z-10 w-full max-w-5xl px-8 text-center"
            initial={{
              opacity: 0,
              y: 16,
              filter: "blur(14px)",
            }}
            animate={{
              opacity: 1,
              y: 0,
              filter: "blur(0px)",
            }}
            exit={{
              opacity: 0,
              y: -10,
              filter: "blur(12px)",
            }}
            transition={{
              duration: 0.34,
              ease: [0.22, 1, 0.36, 1],
            }}
          >
            <p className="text-[0.66rem] uppercase tracking-[0.42em] text-white/36">
              entering
            </p>

            <h2 className="mt-4 text-4xl tracking-[-0.06em] text-white sm:text-6xl">
              {label}
            </h2>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
