"use client";

import {
  AnimatePresence,
  motion,
  useMotionValue,
  useSpring,
} from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

type PreviewKind = "blog" | "project" | null;

type CursorSnapshot = {
  visible: boolean;
  active: boolean;
  textMode: boolean;
  previewTitle: string;
  previewKind: PreviewKind;
  previewImage: string;
  snapWidth: number;
  snapHeight: number;
  snapRadius: number;
};

type PreviewPayload = {
  title: string;
  kind: NonNullable<PreviewKind>;
  image: string;
};

function parseRadius(value: string, fallback: number) {
  const radius = Number.parseFloat(value);
  if (Number.isNaN(radius)) return fallback;
  return radius;
}

function getFullscreenElement(): Element | null {
  const doc = document as Document & {
    webkitFullscreenElement?: Element | null;
    mozFullScreenElement?: Element | null;
    msFullscreenElement?: Element | null;
  };
  return (
    doc.fullscreenElement ??
    doc.webkitFullscreenElement ??
    doc.mozFullScreenElement ??
    doc.msFullscreenElement ??
    null
  );
}

const EASE_OUT = [0.16, 1, 0.3, 1] as const;
const EASE_SOFT = [0.33, 1, 0.68, 1] as const;

const PREVIEW_ENTER_DELAY_MS = 40;
const PREVIEW_EXIT_MS = 220;

export function CustomCursor() {
  const [enabled, setEnabled] = useState(false);
  const [visible, setVisible] = useState(false);
  const [active, setActive] = useState(false);
  const [textMode, setTextMode] = useState(false);
  const [previewTitle, setPreviewTitle] = useState("");
  const [previewKind, setPreviewKind] = useState<PreviewKind>(null);
  const [previewImage, setPreviewImage] = useState("");
  const [snapWidth, setSnapWidth] = useState(0);
  const [snapHeight, setSnapHeight] = useState(0);
  const [snapRadius, setSnapRadius] = useState(999);
  const [portalHost, setPortalHost] = useState<Element | null>(null);

  const [previewShown, setPreviewShown] = useState(false);
  const [previewData, setPreviewData] = useState<PreviewPayload | null>(null);

  const enterTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const exitTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const previewShownRef = useRef(false);
  const pointerRef = useRef({ x: -100, y: -100 });

  const dotX = useMotionValue(-100);
  const dotY = useMotionValue(-100);
  const orbTargetX = useMotionValue(-100);
  const orbTargetY = useMotionValue(-100);

  const orbX = useSpring(orbTargetX, {
    stiffness: 170,
    damping: 24,
    mass: 0.7,
  });

  const orbY = useSpring(orbTargetY, {
    stiffness: 170,
    damping: 24,
    mass: 0.7,
  });

  const cursorStateRef = useRef<CursorSnapshot>({
    visible: false,
    active: false,
    textMode: false,
    previewTitle: "",
    previewKind: null,
    previewImage: "",
    snapWidth: 0,
    snapHeight: 0,
    snapRadius: 999,
  });

  const MIN_CURSOR_WIDTH = 768;

  useEffect(() => {
    previewShownRef.current = previewShown;
  }, [previewShown]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const pointerFine = window.matchMedia("(pointer: fine)");
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");

    let rafId = 0;

    const isWideEnough = () => window.innerWidth >= MIN_CURSOR_WIDTH;

    const resolvePortalHost = () => {
      const fs = getFullscreenElement();
      setPortalHost(fs ?? document.body);
    };

    const updateEnabled = () => {
      const nextEnabled =
        pointerFine.matches && !reduced.matches && isWideEnough();
      setEnabled(nextEnabled);
      document.body.dataset.cursorEnabled = String(nextEnabled);
    };

    const onResize = () => {
      updateEnabled();
    };

    const applySnapshot = (next: CursorSnapshot) => {
      const previous = cursorStateRef.current;
      if (previous.visible !== next.visible) setVisible(next.visible);
      if (previous.active !== next.active) setActive(next.active);
      if (previous.textMode !== next.textMode) setTextMode(next.textMode);
      if (previous.previewTitle !== next.previewTitle)
        setPreviewTitle(next.previewTitle);
      if (previous.previewKind !== next.previewKind)
        setPreviewKind(next.previewKind);
      if (previous.previewImage !== next.previewImage)
        setPreviewImage(next.previewImage);
      if (previous.snapWidth !== next.snapWidth) setSnapWidth(next.snapWidth);
      if (previous.snapHeight !== next.snapHeight)
        setSnapHeight(next.snapHeight);
      if (previous.snapRadius !== next.snapRadius)
        setSnapRadius(next.snapRadius);
      cursorStateRef.current = next;
    };

    const clearState = (hide = false) => {
      const { x, y } = pointerRef.current;
      orbTargetX.set(x);
      orbTargetY.set(y);
      applySnapshot({
        visible: hide ? false : cursorStateRef.current.visible,
        active: false,
        textMode: false,
        previewTitle: "",
        previewKind: null,
        previewImage: "",
        snapWidth: 0,
        snapHeight: 0,
        snapRadius: 999,
      });
    };

    const syncFromPoint = (clientX: number, clientY: number) => {
      pointerRef.current = { x: clientX, y: clientY };

      const target = document.elementFromPoint(
        clientX,
        clientY,
      ) as HTMLElement | null;

      if (!target || target.closest('[data-cursor-hide="true"]')) {
        clearState(true);
        return;
      }

      const previewHost = target.closest(
        "[data-cursor-preview]",
      ) as HTMLElement | null;
      const interactiveTarget =
        previewHost ??
        (target.closest(
          "[data-cursor], button, input, textarea",
        ) as HTMLElement | null);

      const nextPreviewKind =
        (previewHost?.dataset.cursorPreview as PreviewKind) ??
        (interactiveTarget?.dataset.cursorPreview as PreviewKind) ??
        null;

      const nextTextMode = Boolean(
        target.closest(
          "input, textarea, [contenteditable='true'], [contenteditable='']",
        ),
      );

      const previewLock = Boolean(nextPreviewKind) || previewShownRef.current;

      const shouldSnap =
        Boolean(interactiveTarget) &&
        !previewLock &&
        !nextTextMode &&
        !interactiveTarget?.closest("[data-cursor-no-snap='true']");

      let nextSnapWidth = 0;
      let nextSnapHeight = 0;
      let nextSnapRadius = 999;

      if (shouldSnap && interactiveTarget) {
        const rect = interactiveTarget.getBoundingClientRect();
        const computed = window.getComputedStyle(interactiveTarget);
        orbTargetX.set(rect.left + rect.width / 2);
        orbTargetY.set(rect.top + rect.height / 2);
        nextSnapWidth = Math.max(rect.width, 16);
        nextSnapHeight = Math.max(rect.height, 16);
        nextSnapRadius = parseRadius(
          computed.borderTopLeftRadius || computed.borderRadius,
          Math.min(nextSnapWidth, nextSnapHeight) / 2,
        );
      } else {
        orbTargetX.set(clientX);
        orbTargetY.set(clientY);
      }

      applySnapshot({
        visible: true,
        active: Boolean(interactiveTarget) && !nextTextMode,
        textMode: nextTextMode,
        previewTitle:
          previewHost?.dataset.cursorTitle ??
          interactiveTarget?.dataset.cursorTitle ??
          "",
        previewKind: nextPreviewKind,
        previewImage:
          previewHost?.dataset.cursorImage ??
          interactiveTarget?.dataset.cursorImage ??
          "",
        snapWidth: nextSnapWidth,
        snapHeight: nextSnapHeight,
        snapRadius: nextSnapRadius,
      });
    };

    const onMove = (event: MouseEvent) => {
      pointerRef.current = { x: event.clientX, y: event.clientY };
      dotX.set(event.clientX);
      dotY.set(event.clientY);
      syncFromPoint(event.clientX, event.clientY);
    };

    const onLeaveWindow = () => {
      clearState(true);
    };

    const tick = () => {
      const { x, y } = pointerRef.current;
      if (x >= 0 && y >= 0) {
        syncFromPoint(x, y);
      }
      rafId = window.requestAnimationFrame(tick);
    };

    resolvePortalHost();
    updateEnabled();
    pointerFine.addEventListener("change", updateEnabled);
    reduced.addEventListener("change", updateEnabled);
    window.addEventListener("resize", onResize);
    window.addEventListener("mousemove", onMove, { passive: true });
    window.addEventListener("blur", onLeaveWindow);
    window.addEventListener("mouseleave", onLeaveWindow);
    document.addEventListener("fullscreenchange", resolvePortalHost);
    document.addEventListener("webkitfullscreenchange", resolvePortalHost);
    document.addEventListener("mozfullscreenchange", resolvePortalHost);
    document.addEventListener("MSFullscreenChange", resolvePortalHost);
    rafId = window.requestAnimationFrame(tick);

    return () => {
      pointerFine.removeEventListener("change", updateEnabled);
      reduced.removeEventListener("change", updateEnabled);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("blur", onLeaveWindow);
      window.removeEventListener("mouseleave", onLeaveWindow);
      document.removeEventListener("fullscreenchange", resolvePortalHost);
      document.removeEventListener("webkitfullscreenchange", resolvePortalHost);
      document.removeEventListener("mozfullscreenchange", resolvePortalHost);
      document.removeEventListener("MSFullscreenChange", resolvePortalHost);
      window.cancelAnimationFrame(rafId);
      delete document.body.dataset.cursorEnabled;
    };
  }, [dotX, dotY, orbTargetX, orbTargetY]);

  const previewLive = active && !!previewKind && !!previewTitle;

  useEffect(() => {
    if (enterTimer.current) {
      clearTimeout(enterTimer.current);
      enterTimer.current = null;
    }
    if (exitTimer.current) {
      clearTimeout(exitTimer.current);
      exitTimer.current = null;
    }

    if (previewLive && previewKind) {
      const next: PreviewPayload = {
        title: previewTitle,
        kind: previewKind,
        image: previewImage,
      };

      if (previewShown) {
        setPreviewData(next);
        return;
      }

      enterTimer.current = setTimeout(() => {
        setPreviewData(next);
        setPreviewShown(true);
        enterTimer.current = null;
      }, PREVIEW_ENTER_DELAY_MS);

      return () => {
        if (enterTimer.current) {
          clearTimeout(enterTimer.current);
          enterTimer.current = null;
        }
      };
    }

    exitTimer.current = setTimeout(() => {
      setPreviewShown(false);
      exitTimer.current = null;
    }, PREVIEW_EXIT_MS);

    return () => {
      if (exitTimer.current) {
        clearTimeout(exitTimer.current);
        exitTimer.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [previewLive, previewTitle, previewKind, previewImage]);

  const handlePreviewExitComplete = () => {
    if (!previewLive) setPreviewData(null);
  };

  const cardOpen = visible && previewShown && !!previewData;

  const orbFrame = useMemo(() => {
    if (textMode) {
      return { width: 3, height: 24, radius: 999, kind: "text" as const };
    }
    if (previewLive || previewShown) {
      return { width: 12, height: 12, radius: 999, kind: "preview" as const };
    }
    if (active && snapWidth > 0 && snapHeight > 0) {
      return {
        width: snapWidth,
        height: snapHeight,
        radius: snapRadius,
        kind: "snap" as const,
      };
    }
    if (active) {
      return { width: 16, height: 16, radius: 999, kind: "active" as const };
    }
    return { width: 34, height: 34, radius: 999, kind: "idle" as const };
  }, [
    active,
    previewLive,
    previewShown,
    snapHeight,
    snapRadius,
    snapWidth,
    textMode,
  ]);

  if (!enabled || !portalHost) return null;

  const isText = orbFrame.kind === "text";
  const isSnap = orbFrame.kind === "snap" || orbFrame.kind === "active";
  const isPreviewOrb = orbFrame.kind === "preview";

  const cursorTree = (
    <>
      {/* ── Center dot (instant pointer) z=9999 ── */}
      <motion.div
        className="pointer-events-none fixed left-0 top-0 z-[9999] hidden md:block"
        style={{ x: dotX, y: dotY }}
        animate={{ opacity: visible ? 1 : 0 }}
        transition={{ duration: 0.12, ease: EASE_OUT }}
      >
        <motion.div
          className="box-border"
          style={{ marginLeft: isText ? -1 : -3, marginTop: isText ? -11 : -3 }}
          animate={{
            width: isText ? 2 : 6,
            height: isText ? 22 : 6,
            borderRadius: 999,
            backgroundColor: "rgba(255,255,255,0.96)",
            borderWidth: isText ? 0 : 1.5,
            borderStyle: "solid",
            borderColor: "rgba(0,0,0,0.55)",
            boxShadow: isText
              ? "0 0 0 1px rgba(0,0,0,0.35)"
              : "0 0 0 1px rgba(0,0,0,0.18), 0 1px 3px rgba(0,0,0,0.25)",
          }}
          transition={{ duration: 0.2, ease: EASE_OUT }}
        />
      </motion.div>

      {/* ── Outer orb / ring z=9998 ── */}
      <motion.div
        className="pointer-events-none fixed left-0 top-0 z-[9998] hidden md:block"
        style={{ x: orbX, y: orbY }}
        animate={{ opacity: visible ? 1 : 0 }}
        transition={{ duration: 0.2, ease: EASE_OUT }}
      >
        <motion.div
          className="box-border"
          style={{
            x: "-50%",
            y: "-50%",
            transformOrigin: "center center",
          }}
          animate={{
            width: orbFrame.width,
            height: orbFrame.height,
            borderRadius: orbFrame.radius,
            borderWidth: 1.5,
            borderStyle: "solid",
            borderColor: isText
              ? "rgba(0,0,0,0.45)"
              : isSnap
                ? "rgba(0,0,0,0.35)"
                : "rgba(0,0,0,0.28)",
            backgroundColor: "rgba(255,255,255,0.01)",
            boxShadow: isText
              ? "0 0 0 1px rgba(255,255,255,0.55), 0 1px 4px rgba(0,0,0,0.2)"
              : "0 0 0 1px rgba(255,255,255,0.45), 0 2px 10px rgba(0,0,0,0.12)",
            backdropFilter: isText
              ? "blur(0px)"
              : isSnap
                ? "blur(0px)"
                : "blur(3px)",
            opacity: isPreviewOrb ? 0.55 : 1,
          }}
          transition={{
            type: "spring",
            stiffness: 160,
            damping: 22,
            mass: 0.72,
          }}
        />
      </motion.div>

      {/* ── Preview card z=9998 (under dot, over toolbar) ── */}
      <motion.div
        className="pointer-events-none fixed left-0 top-0 z-[9998] hidden md:block"
        style={{ x: orbX, y: orbY }}
      >
        <div
          className="pointer-events-none"
          style={{
            transform: "translate(20px, -108px)",
            transformOrigin: "bottom left",
          }}
        >
          <AnimatePresence onExitComplete={handlePreviewExitComplete}>
            {cardOpen && previewData ? (
              <motion.div
                key="preview-card"
                initial={{ opacity: 0, scale: 0.94, filter: "blur(12px)" }}
                animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                exit={{
                  opacity: 0,
                  scale: 0.96,
                  filter: "blur(12px)",
                  transition: {
                    opacity: { duration: 0.18, ease: EASE_SOFT },
                    scale: { duration: 0.18, ease: EASE_SOFT },
                    filter: { duration: 0.2 },
                  },
                }}
                transition={{
                  opacity: { duration: 0.2, ease: EASE_SOFT },
                  scale: {
                    type: "spring",
                    stiffness: 380,
                    damping: 30,
                    mass: 0.7,
                  },
                  filter: { duration: 0.25 },
                }}
                style={{ transformOrigin: "bottom left" }}
              >
                <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#111] shadow-[0_28px_80px_rgba(0,0,0,0.5)]">
                  <div className="relative h-[110px] w-[180px] overflow-hidden bg-[#111]">
                    <AnimatePresence mode="sync" initial={false}>
                      {previewData.image ? (
                        <motion.img
                          key={previewData.image}
                          src={previewData.image}
                          alt=""
                          className="absolute inset-0 h-full w-full object-cover"
                          initial={{
                            opacity: 0,
                            scale: 1.04,
                            filter: "blur(12px)",
                          }}
                          animate={{
                            opacity: 1,
                            scale: 1,
                            filter: "blur(0px)",
                          }}
                          exit={{
                            opacity: 0,
                            filter: "blur(8px)",
                            transition: { duration: 0.22, ease: EASE_SOFT },
                          }}
                          transition={{ duration: 0.4, ease: EASE_OUT }}
                        />
                      ) : null}
                    </AnimatePresence>

                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/85 via-black/36 to-transparent" />
                    <div className="pointer-events-none absolute inset-0 opacity-[0.14] [background-image:linear-gradient(rgba(255,255,255,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.08)_1px,transparent_1px)] [background-size:24px_24px]" />

                    <div className="absolute bottom-3 left-3 right-3">
                      <AnimatePresence mode="wait" initial={false}>
                        <motion.div
                          key={`${previewData.kind}-${previewData.title}`}
                          initial={{ opacity: 0, y: 6, filter: "blur(8px)" }}
                          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                          exit={{
                            opacity: 0,
                            y: -3,
                            filter: "blur(6px)",
                            transition: { duration: 0.16, ease: EASE_SOFT },
                          }}
                          transition={{
                            duration: 0.3,
                            ease: EASE_OUT,
                            delay: 0.04,
                          }}
                        >
                          <p className="text-[0.52rem] uppercase tracking-[0.28em] text-white/48">
                            {previewData.kind}
                          </p>
                          <p className="mt-1 line-clamp-2 text-sm leading-5 text-white/88">
                            {previewData.title}
                          </p>
                        </motion.div>
                      </AnimatePresence>
                    </div>
                  </div>
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>
      </motion.div>
    </>
  );

  return createPortal(cursorTree, portalHost);
}
