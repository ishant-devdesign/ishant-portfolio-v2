"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";

type IntroLoaderProps = {
  name?: string;
  onComplete: () => void;
  preloadImages?: string[];
};

const LOGO_I_PATH =
  "M10.496 0V10.496H0V0H10.496ZM10.496 17.472V73.472H0V17.472H10.496Z";

const LOGO_K_PATH =
  "M69.6875 17.472V28.032H27.6395V31.488L69.6875 73.472H55.6715L24.1835 41.984V73.472H13.6875V28.032H20.6635V24.512H24.1835V20.992H20.6635V17.472H13.6875V0H24.1835V14.016H27.6395V17.472H69.6875ZM27.6395 28.032H24.1835V24.512C24.1835 26.432 22.5835 28.032 20.6635 28.032H24.1835V31.488C24.1835 30.528 24.5675 29.632 25.1435 28.992C25.7835 28.416 26.6795 28.032 27.6395 28.032ZM24.1835 20.992V17.472H20.6635C22.5835 17.472 24.1835 19.072 24.1835 20.992Z";

// Timeline: content fully revealed by ~1.4s, hairline completes ~2.0s.
// The exit is load-aware: it fires once the display font and every
// preload image have settled, but never before EXIT_AT (so the intro
// composition always completes) and never after MAX_WAIT (so a stalled
// asset can never hold the page hostage).
const EXIT_AT = 2050;
const EXIT_DURATION = 0.9;
const EXIT_COMPLETE_DELAY = EXIT_DURATION * 1000 + 90;
const MAX_WAIT = 4500;

function LogoDraw() {
  return (
    <motion.svg
      viewBox="-6 -6 82 86"
      className="h-14 w-auto overflow-visible sm:h-16"
      fill="none"
      aria-hidden="true"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
    >
      {/* solid mark fades in over the drawn stroke */}
      <motion.g
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.95 }}
        transition={{ duration: 0.7, delay: 1.05, ease: [0.22, 1, 0.36, 1] }}
      >
        <path d={LOGO_I_PATH} fill="white" />
        <path d={LOGO_K_PATH} fill="white" />
      </motion.g>

      <motion.path
        d={LOGO_I_PATH}
        fill="none"
        stroke="white"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
        initial={{ pathLength: 0, opacity: 0.85 }}
        animate={{ pathLength: 1, opacity: 0 }}
        transition={{
          pathLength: { duration: 0.95, delay: 0.15, ease: [0.65, 0, 0.35, 1] },
          opacity: { duration: 0.5, delay: 1.15, ease: [0.65, 0, 0.35, 1] },
        }}
      />

      <motion.path
        d={LOGO_K_PATH}
        fill="none"
        stroke="white"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
        initial={{ pathLength: 0, opacity: 0.85 }}
        animate={{ pathLength: 1, opacity: 0 }}
        transition={{
          pathLength: { duration: 1.15, delay: 0.3, ease: [0.65, 0, 0.35, 1] },
          opacity: { duration: 0.5, delay: 1.25, ease: [0.65, 0, 0.35, 1] },
        }}
      />
    </motion.svg>
  );
}

export function IntroLoader({
  name = "ISHANT KUMAR",
  onComplete,
  preloadImages = [],
}: IntroLoaderProps) {
  const [isExiting, setIsExiting] = useState(false);
  const [startTime] = useState(() => Date.now());

  const shouldReduceMotion = useReducedMotion();

  const exitTimerRef = useRef<number | null>(null);
  const completeTimerRef = useRef<number | null>(null);
  const capTimerRef = useRef<number | null>(null);
  const exitStartedRef = useRef(false);
  const didCompleteRef = useRef(false);
  const onCompleteRef = useRef(onComplete);

  // Prevent scrolling while loading
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    const originalPaddingRight = document.body.style.paddingRight;

    // Get scrollbar width to prevent layout shift
    const scrollbarWidth =
      window.innerWidth - document.documentElement.clientWidth;

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

  const nameWords = useMemo(
    () => normalizedName.split(/\s+/).filter(Boolean),
    [normalizedName],
  );

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  const clearLoaderTimers = () => {
    if (exitTimerRef.current !== null) {
      window.clearTimeout(exitTimerRef.current);
      exitTimerRef.current = null;
    }

    if (completeTimerRef.current !== null) {
      window.clearTimeout(completeTimerRef.current);
      completeTimerRef.current = null;
    }

    if (capTimerRef.current !== null) {
      window.clearTimeout(capTimerRef.current);
      capTimerRef.current = null;
    }
  };

  const completeOnce = () => {
    if (didCompleteRef.current) return;

    didCompleteRef.current = true;
    onCompleteRef.current();
  };

  // Exit driven by real readiness: fonts + preload images settled,
  // held to a minimum dwell and a hard maximum wait.
  useEffect(() => {
    if (shouldReduceMotion) {
      completeOnce();
      return;
    }

    let cancelled = false;

    const requestExit = () => {
      if (cancelled || exitStartedRef.current) return;

      const remaining = Math.max(0, EXIT_AT - (Date.now() - startTime));

      if (exitTimerRef.current !== null) {
        window.clearTimeout(exitTimerRef.current);
      }

      exitTimerRef.current = window.setTimeout(() => {
        exitTimerRef.current = null;

        if (exitStartedRef.current) return;
        exitStartedRef.current = true;

        setIsExiting(true);

        if (completeTimerRef.current !== null) {
          window.clearTimeout(completeTimerRef.current);
        }

        completeTimerRef.current = window.setTimeout(() => {
          completeOnce();
        }, EXIT_COMPLETE_DELAY);
      }, remaining);
    };

    const fontReady: Promise<unknown> =
      typeof document !== "undefined" && document.fonts
        ? document.fonts.ready
        : Promise.resolve();

    const imagesReady = preloadImages.map(
      (src) =>
        new Promise<void>((resolve) => {
          const img = new Image();
          img.onload = () => resolve();
          img.onerror = () => resolve();
          img.src = src;
        }),
    );

    Promise.all([fontReady, ...imagesReady]).then(requestExit);

    capTimerRef.current = window.setTimeout(requestExit, MAX_WAIT);

    return () => {
      cancelled = true;
      clearLoaderTimers();
    };
  }, [shouldReduceMotion, preloadImages, startTime]);

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
        duration: EXIT_DURATION,
        ease: [0.77, 0, 0.18, 1],
      }}
    >
      <motion.div
        className="relative flex w-full max-w-5xl flex-col items-center px-6 text-center sm:px-10"
        initial={{ opacity: 1, y: 0 }}
        animate={{
          opacity: isExiting ? 0 : 1,
          y: isExiting ? -14 : 0,
        }}
        transition={{
          duration: 0.35,
          ease: [0.65, 0, 0.35, 1],
        }}
      >
        <LogoDraw />

        <h1 className="font-heading mt-7 flex flex-wrap items-baseline justify-center gap-x-[0.3em] text-[clamp(1.9rem,6.5vw,4.4rem)] uppercase leading-[1.04] tracking-[0.12em] text-white/92">
          {nameWords.map((word, index) => (
            <span
              key={`${word}-${index}`}
              className="inline-block overflow-hidden"
            >
              <motion.span
                className="inline-block"
                initial={{ y: "115%", opacity: 0.36, filter: "blur(10px)" }}
                animate={{ y: 0, opacity: 1, filter: "blur(0px)" }}
                transition={{
                  duration: 0.72,
                  delay: 0.42 + index * 0.09,
                  ease: [0.22, 1, 0.36, 1],
                }}
              >
                {word}
              </motion.span>
            </span>
          ))}
        </h1>

        <div className="mt-9 h-px w-full overflow-hidden bg-white/10">
          <motion.div
            className="h-full w-full origin-left bg-white/55"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{
              duration: 1.5,
              delay: 0.5,
              ease: [0.65, 0, 0.35, 1],
            }}
          />
        </div>

        <motion.p
          className="mt-5 font-mono text-[10px] uppercase tracking-[0.42em] text-white/32"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.6,
            delay: 0.95,
            ease: [0.22, 1, 0.36, 1],
          }}
        >
          Precision / Design Thinking / Engineering
        </motion.p>
      </motion.div>
    </motion.div>
  );
}
