"use client";

import { motion, useMotionValue, useSpring } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";

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

function parseRadius(value: string, fallback: number) {
  const radius = Number.parseFloat(value);
  if (Number.isNaN(radius)) return fallback;
  return radius;
}

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

  const dotX = useMotionValue(-100);
  const dotY = useMotionValue(-100);
  const orbTargetX = useMotionValue(-100);
  const orbTargetY = useMotionValue(-100);

  const orbX = useSpring(orbTargetX, {
    stiffness: 160,
    damping: 20,
    mass: 0.72,
  });
  const orbY = useSpring(orbTargetY, {
    stiffness: 160,
    damping: 20,
    mass: 0.72,
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

  // Minimum width for custom cursor (below this, use default cursor)
  const MIN_CURSOR_WIDTH = 768;

  useEffect(() => {
    if (typeof window === "undefined") return;

    const pointerFine = window.matchMedia("(pointer: fine)");
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");

    let lastX = -100;
    let lastY = -100;
    let rafId = 0;

    const isWideEnough = () => window.innerWidth >= MIN_CURSOR_WIDTH;

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
      orbTargetX.set(lastX);
      orbTargetY.set(lastY);
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
      const target = document.elementFromPoint(
        clientX,
        clientY,
      ) as HTMLElement | null;

      if (!target || target.closest('[data-cursor-hide="true"]')) {
        clearState(true);
        return;
      }

      const interactiveTarget = target.closest(
        "[data-cursor], button, input, textarea",
      ) as HTMLElement | null;
      const nextPreviewKind =
        (interactiveTarget?.dataset.cursorPreview as PreviewKind) ?? null;
      const nextTextMode = Boolean(target.closest("input, textarea"));
      const shouldSnap =
        Boolean(interactiveTarget) &&
        !nextPreviewKind &&
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
        active: Boolean(interactiveTarget),
        textMode: nextTextMode,
        previewTitle: interactiveTarget?.dataset.cursorTitle ?? "",
        previewKind: nextPreviewKind,
        previewImage: interactiveTarget?.dataset.cursorImage ?? "",
        snapWidth: nextSnapWidth,
        snapHeight: nextSnapHeight,
        snapRadius: nextSnapRadius,
      });
    };

    const onMove = (event: MouseEvent) => {
      lastX = event.clientX;
      lastY = event.clientY;
      dotX.set(lastX);
      dotY.set(lastY);
      syncFromPoint(lastX, lastY);
    };

    const onLeaveWindow = () => {
      clearState(true);
    };

    const tick = () => {
      if (lastX >= 0 && lastY >= 0) {
        syncFromPoint(lastX, lastY);
      }
      rafId = window.requestAnimationFrame(tick);
    };

    updateEnabled();
    pointerFine.addEventListener("change", updateEnabled);
    reduced.addEventListener("change", updateEnabled);
    window.addEventListener("resize", onResize);
    window.addEventListener("mousemove", onMove, { passive: true });
    window.addEventListener("blur", onLeaveWindow);
    window.addEventListener("mouseleave", onLeaveWindow);
    rafId = window.requestAnimationFrame(tick);

    return () => {
      pointerFine.removeEventListener("change", updateEnabled);
      reduced.removeEventListener("change", updateEnabled);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("blur", onLeaveWindow);
      window.removeEventListener("mouseleave", onLeaveWindow);
      window.cancelAnimationFrame(rafId);
      delete document.body.dataset.cursorEnabled;
    };
  }, [dotX, dotY, orbTargetX, orbTargetY]);

  const showPreview = active && !!previewKind && !!previewTitle;
  const orbUsesInstantPointer = textMode;

  const orbFrame = useMemo(() => {
    if (textMode) {
      return { width: 3, height: 24, radius: 999 };
    }

    if (showPreview) {
      return { width: 12, height: 12, radius: 999 };
    }

    if (active && snapWidth > 0 && snapHeight > 0) {
      return {
        width: snapWidth,
        height: snapHeight,
        radius: snapRadius,
      };
    }

    if (active) {
      return { width: 16, height: 16, radius: 999 };
    }

    return { width: 34, height: 34, radius: 999 };
  }, [active, showPreview, snapHeight, snapRadius, snapWidth, textMode]);

  if (!enabled) return null;

  return (
    <>
      <motion.div
        className="pointer-events-none fixed left-0 top-0 z-[360] hidden md:flex"
        style={{ x: dotX, y: dotY }}
        animate={{
          opacity: visible ? 1 : 0,
          scale: visible ? 1 : 0.72,
        }}
        transition={{ duration: 0.1, ease: [0.22, 1, 0.36, 1] }}
      >
        <motion.div
          className="bg-white/92"
          animate={{
            width: textMode ? 2 : 5,
            height: textMode ? 24 : 5,
            borderRadius: 999,
            x: textMode ? -1 : -2.5,
            y: textMode ? -12 : -2.5,
          }}
          transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
        />
      </motion.div>

      <motion.div
        className="pointer-events-none fixed left-0 top-0 z-[359] hidden md:flex"
        style={{
          x: orbUsesInstantPointer ? dotX : orbX,
          y: orbUsesInstantPointer ? dotY : orbY,
        }}
        animate={{
          opacity: visible && !textMode ? 1 : 0,
          scale: visible && !textMode ? 1 : 0.9,
        }}
        transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
      >
        <motion.div
          className="relative -translate-x-1/2 -translate-y-1/2 overflow-hidden border border-white/16 bg-white/10"
          animate={{
            width: orbFrame.width,
            height: orbFrame.height,
            borderRadius: orbFrame.radius,
            borderColor: active
              ? "rgba(255,255,255,0.24)"
              : "rgba(255,255,255,0.16)",
            backgroundColor: active
              ? "rgba(255,255,255,0.14)"
              : "rgba(255,255,255,0.1)",
            backdropFilter: active ? "blur(0px)" : "blur(4px)",
            opacity: showPreview ? 0.82 : 1,
          }}
          transition={{
            type: "spring",
            stiffness: 160,
            damping: 20,
            mass: 0.72,
          }}
        ></motion.div>
      </motion.div>

      <motion.div
        className="pointer-events-none fixed left-0 top-0 z-[362] hidden md:block"
        style={{ x: orbX, y: orbY }}
        animate={{
          opacity: visible && showPreview ? 1 : 0,
          scale: visible && showPreview ? 1 : 0.94,
          filter: visible && showPreview ? "blur(0px)" : "blur(16px)",
        }}
        transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="translate-x-5 -translate-y-[96px] overflow-hidden rounded-2xl border border-white/10 bg-[#111] shadow-[0_20px_60px_rgba(0,0,0,0.4)]">
          <div className="relative h-[110px] w-[180px] overflow-hidden bg-[#111]">
            {previewImage ? (
              <motion.img
                src={previewImage}
                alt=""
                className="absolute inset-0 h-full w-full object-cover"
                initial={{ filter: "blur(12px)", opacity: 0 }}
                animate={{
                  filter: showPreview ? "blur(0px)" : "blur(12px)",
                  opacity: showPreview ? 1 : 0,
                }}
                transition={{ duration: 0.36, ease: [0.22, 1, 0.36, 1] }}
              />
            ) : null}
            <motion.div
              className="absolute inset-0 bg-gradient-to-t from-black/82 via-black/36 to-transparent"
              initial={{ opacity: 0 }}
              animate={{ opacity: showPreview ? 1 : 0 }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            />
            <motion.div
              className="absolute inset-0 opacity-18 [background-image:linear-gradient(rgba(255,255,255,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.08)_1px,transparent_1px)] [background-size:24px_24px]"
              initial={{ opacity: 0 }}
              animate={{ opacity: showPreview ? 0.18 : 0 }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            />
            <motion.div
              className="absolute bottom-3 left-3 right-3"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: showPreview ? 1 : 0, y: showPreview ? 0 : 8 }}
              transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
            >
              <p className="text-[0.52rem] uppercase tracking-[0.28em] text-white/48">
                {previewKind}
              </p>
              <p className="mt-1 line-clamp-2 text-sm leading-5 text-white/88">
                {previewTitle}
              </p>
            </motion.div>
          </div>
        </div>
      </motion.div>
    </>
  );
}
