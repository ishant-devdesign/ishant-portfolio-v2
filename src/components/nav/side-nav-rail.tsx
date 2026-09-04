"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronUp, Lock, LockOpen, X } from "lucide-react";
import type { HomeSectionItem } from "@/lib/site-config";
import { useExperience } from "@/components/motion/experience-provider";

type SideNavRailProps = {
  sections: HomeSectionItem[];
};

const ITEM_HEIGHT = 52;
const TOOLTIP_DELAY = 300;
const PEEK_MS = 2600;
const HOVER_CLOSE_DELAY_MS = 180; // grace period when the cursor leaves the rail
const SCROLL_TO_TOP_THRESHOLD = 380;
const TOGGLE_WIDTH = 44; // width of the vertical toggle pill
const TOGGLE_GAP = 18; // gap between the toggle and the menu

const EASE = [0.22, 1, 0.36, 1] as const;

function TruncatedSideNavLabel({
  label,
  visible,
}: {
  label: string;
  visible: boolean;
}) {
  const textRef = useRef<HTMLSpanElement | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [isTruncated, setIsTruncated] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);

  useEffect(() => {
    const element = textRef.current;
    if (!element) return;

    const checkTruncation = () => {
      setIsTruncated(element.scrollWidth > element.clientWidth + 1);
    };

    checkTruncation();

    if (typeof ResizeObserver === "undefined") return;

    const observer = new ResizeObserver(checkTruncation);
    observer.observe(element);

    return () => observer.disconnect();
  }, [label]);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  const handleMouseEnter = () => {
    if (!isTruncated || !visible) return;

    timerRef.current = setTimeout(() => {
      setShowTooltip(true);
    }, TOOLTIP_DELAY);
  };

  const handleMouseLeave = () => {
    setShowTooltip(false);

    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  return (
    <span
      className="relative z-10 inline-block w-fit pointer-events-auto"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <motion.span
        ref={textRef}
        className="block max-w-[132px] w-fit truncate px-4 py-2 text-right text-sm tracking-[-0.01em] whitespace-nowrap text-white"
        animate={{
          opacity: visible ? 1 : 0,
          filter: visible ? "blur(0px)" : "blur(10px)",
        }}
        transition={{ duration: 0.34, ease: EASE }}
      >
        {label}
      </motion.span>

      {isTruncated && (
        <motion.span
          aria-hidden="true"
          className="pointer-events-none w-fit absolute right-full top-1/2 mr-3 -translate-y-1/2 whitespace-nowrap rounded-full border border-white/10 bg-black/80 px-3 py-1.5 text-xs text-white shadow-2xl backdrop-blur-md"
          animate={{
            opacity: showTooltip && visible ? 1 : 0,
            x: showTooltip && visible ? 0 : 6,
            scale: showTooltip && visible ? 1 : 0.96,
          }}
          transition={{ duration: 0.22, ease: EASE }}
        >
          {label}
        </motion.span>
      )}
    </span>
  );
}

export function SideNavRail({ sections }: SideNavRailProps) {
  const { introComplete, reducedMotion } = useExperience();

  const [activeId, setActiveId] = useState(sections[0]?.id ?? "");
  const [pinned, setPinned] = useState(false); // lock open (click the pill)
  const [hovered, setHovered] = useState(false); // cursor over the rail (desktop)
  const [peekOpen, setPeekOpen] = useState(false); // brief auto-open on load
  const [canHover, setCanHover] = useState(false); // devices with a real pointer/hover
  const [isMobile, setIsMobile] = useState(false); // narrow viewports (phone/portrait)
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [viewportHeight, setViewportHeight] = useState(800);

  const hoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const peekTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const peeked = useRef(false);

  // Detect if this device supports hover — touch devices fall back to click only.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(hover: hover) and (pointer: fine)");
    const update = () => setCanHover(mq.matches);
    update();
    mq.addEventListener?.("change", update);
    return () => mq.removeEventListener?.("change", update);
  }, []);

  // Detect narrow "mobile" viewports (below the md breakpoint). These get a
  // compact bottom-anchored chevron button instead of the centred vertical pill.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(max-width: 767px)");
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener?.("change", update);
    return () => mq.removeEventListener?.("change", update);
  }, []);

  // Track the viewport height so we can fit the whole fan without cropping.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const update = () => setViewportHeight(window.innerHeight);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  // Auto-peek: briefly open once on load so visitors discover the control.
  useEffect(() => {
    if (isMobile || peeked.current || !introComplete || reducedMotion) return;

    peeked.current = true;
    setPeekOpen(true);
    peekTimer.current = setTimeout(() => setPeekOpen(false), PEEK_MS);

    return () => {
      if (peekTimer.current) {
        clearTimeout(peekTimer.current);
        peekTimer.current = null;
      }
    };
  }, [introComplete, reducedMotion, isMobile]);

  const cancelPeek = () => {
    if (peekTimer.current) {
      clearTimeout(peekTimer.current);
      peekTimer.current = null;
    }
    setPeekOpen(false);
  };

  const clearHoverTimer = () => {
    if (hoverTimer.current) {
      clearTimeout(hoverTimer.current);
      hoverTimer.current = null;
    }
  };

  // Hover open (desktop only) — wired to the PILL only. Opening cancels any
  // scheduled close so the pill doesn't flicker.
  const handleMouseEnter = () => {
    if (!canHover) return;
    clearHoverTimer();
    setHovered(true);
  };

  // Hovering the OPEN MENU never opens it — it only keeps it open by cancelling
  // a pending close (e.g. when moving from pill across to the items). It must
  // not set `hovered`, otherwise the menu region would trigger hover-open and
  // would also stay open after unpinning just by being hovered.
  const handleAreaEnter = () => {
    if (!canHover) return;
    clearHoverTimer();
  };

  const handleMouseLeave = () => {
    if (!canHover) return;
    clearHoverTimer();
    hoverTimer.current = setTimeout(
      () => setHovered(false),
      HOVER_CLOSE_DELAY_MS,
    );
  };

  // The menu is open when it's auto-peeked, pinned, or (on desktop) hovered.
  const open = peekOpen || pinned || (canHover && hovered);

  // Scroll-to-top visibility — independent of the menu open/closed state.
  useEffect(() => {
    if (typeof window === "undefined") return;

    const updateScrollPosition = () => {
      setShowScrollTop(window.scrollY > SCROLL_TO_TOP_THRESHOLD);
    };

    updateScrollPosition();
    window.addEventListener("scroll", updateScrollPosition, { passive: true });
    window.addEventListener("resize", updateScrollPosition);

    return () => {
      window.removeEventListener("scroll", updateScrollPosition);
      window.removeEventListener("resize", updateScrollPosition);
    };
  }, []);

  // Scroll-spy — keep the active section in sync.
  useEffect(() => {
    if (typeof window === "undefined") return;

    let frame = 0;

    const updateActiveSection = () => {
      const elements = sections
        .map((section) => ({
          id: section.id,
          element: document.getElementById(section.id),
        }))
        .filter((item) => item.element) as Array<{
        id: string;
        element: HTMLElement;
      }>;

      if (elements.length === 0) return;

      const scrollBottom = window.scrollY + window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;

      if (scrollBottom >= documentHeight - 2) {
        setActiveId(elements[elements.length - 1].id);
        return;
      }

      const viewportCenter = window.innerHeight / 2;
      let nextActiveId = elements[0].id;
      let nearestDistance = Number.POSITIVE_INFINITY;

      elements.forEach(({ id, element }) => {
        const rect = element.getBoundingClientRect();
        const sectionCenter = rect.top + rect.height / 2;
        const distance = Math.abs(sectionCenter - viewportCenter);

        if (distance < nearestDistance) {
          nearestDistance = distance;
          nextActiveId = id;
        }
      });

      setActiveId(nextActiveId);
    };

    const requestUpdate = () => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(updateActiveSection);
    };

    const delayed = window.setTimeout(requestUpdate, 120);
    requestUpdate();

    window.addEventListener("scroll", requestUpdate, { passive: true });
    window.addEventListener("resize", requestUpdate);
    window.addEventListener("load", requestUpdate);

    return () => {
      window.cancelAnimationFrame(frame);
      window.clearTimeout(delayed);
      window.removeEventListener("scroll", requestUpdate);
      window.removeEventListener("resize", requestUpdate);
      window.removeEventListener("load", requestUpdate);
    };
  }, [sections]);

  const activeIndex = useMemo(
    () =>
      Math.max(
        0,
        sections.findIndex((section) => section.id === activeId),
      ),
    [activeId, sections],
  );

  const active = sections[activeIndex];

  // Affordance states for the pill icon:
  //  - closed        → chevron (menu slides out to the left)
  //  - preview (open via hover, not pinned) → hollow pin + pulse ("click to pin")
  //  - pinned        → filled pin ("click to close / unpin")
  const isPreview = open && !pinned;
  const isPinned = pinned;

  // Items fan out around the active item (which stays centred), all rendered
  // with the original pill design — the active one is highlighted.
  //
  // The whole fan must fit inside the viewport so the top & bottom items are
  // never cropped. We shrink the row height when the section count is large
  // (or the screen is short), keeping a usable minimum.
  const VERTICAL_PADDING = 96; // breathing room at the very top & bottom
  const itemHeight = useMemo(() => {
    const count = Math.max(sections.length, 1);
    const available = Math.max(viewportHeight - VERTICAL_PADDING, 0);
    return Math.max(36, Math.min(ITEM_HEIGHT, Math.floor(available / count)));
  }, [sections.length, viewportHeight]);

  const fanItems = useMemo(
    () =>
      sections.map((section, index) => ({
        section,
        index,
        distance: Math.abs(index - activeIndex),
        offset: (index - activeIndex) * itemHeight,
      })),
    [sections, activeIndex, itemHeight],
  );

  const menuHeight = useMemo(
    () => `${fanItems.length * itemHeight}px`,
    [fanItems.length, itemHeight],
  );

  // Click: toggle the sticky (pinned) open state.
  // Unpinning does NOT force the menu closed. While the cursor is still over
  // the pill/area the menu stays open as a preview and only collapses once the
  // pointer leaves the nav area (the hover handlers decide that). So we leave
  // `hovered` untouched here.
  const handleToggle = () => {
    cancelPeek();
    clearHoverTimer();
    setPinned(!pinned);
  };

  // Selecting a section closes the menu — unless it's pinned, in which case
  // you can browse sections and the menu stays open.
  const handleSelect = () => {
    cancelPeek();
    clearHoverTimer();
    // Mobile: tapping a section always collapses the menu.
    // Desktop: keep it open when it's pinned (locked), otherwise collapse it.
    if (isMobile || !pinned) {
      setPinned(false);
      setHovered(false);
    }
  };

  return (
    <>
      {/* ── Right-edge rail (desktop: md and up) ── */}
      <aside className="pointer-events-none fixed inset-y-0 right-4 z-40 hidden items-center md:flex sm:right-6 xl:right-7 2xl:right-10">
        <div className="pointer-events-none relative flex h-screen w-[240px] items-center justify-end">
          {/* Hover zone: the pill + the open menu. Hover over the pill opens it;
              staying anywhere in this area keeps it open; leaving it closes. */}
          <div className="pointer-events-auto relative">
            {/* The section menu — opens on hover or click; sits to the LEFT of it */}
            <AnimatePresence>
              {open ? (
                <motion.div
                  key="menu"
                  className="pointer-events-auto absolute top-1/2 flex w-[220px] -translate-y-1/2 flex-col items-end"
                  style={{
                    right: TOGGLE_WIDTH + TOGGLE_GAP,
                    height: menuHeight,
                  }}
                  onMouseEnter={handleAreaEnter}
                  onMouseLeave={handleMouseLeave}
                  // Entrance is transform-only: animating `opacity` (<1) on this
                  // container turns it into a backdrop root, which would disable
                  // the item links' backdrop blur while they fade in. The container
                  // is an invisible positioning box, so it never carries opacity —
                  // the dissolve comes purely from the pills below.
                  initial={{ scale: 0.92 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0.92 }}
                  transition={{ duration: 0.26, ease: EASE }}
                >
                  {fanItems.map(({ section, distance, offset }) => {
                    const isActive = section.id === activeId;

                    return (
                      <motion.a
                        key={section.id}
                        href={`#${section.id}`}
                        className="group absolute right-0 flex items-center justify-end rounded-full px-3 w-fit"
                        style={{
                          top: `calc(50% - ${itemHeight / 2}px)`,
                          height: itemHeight,
                        }}
                        // Globule effect: items emerge from the pill's centre and
                        // settle into place, then merge back on close. Entrance is
                        // transform-only so the pill's backdrop blur keeps sampling
                        // the page. `animate` explicitly restores opacity to 1 and
                        // `exit` fades to 0, so if a node is reused (not fully
                        // unmounted) after a quick re-open it reliably returns to
                        // fully visible instead of staying transparent.
                        initial={{
                          y: 0,
                          scale: reducedMotion ? 1 : 0.4,
                        }}
                        animate={{
                          y: offset,
                          scale: 1,
                          opacity: 1,
                        }}
                        exit={{
                          y: 0,
                          scale: reducedMotion ? 1 : 0.4,
                          opacity: reducedMotion ? 1 : 0,
                        }}
                        transition={{
                          y: { type: "spring", stiffness: 150, damping: 20 },
                          scale: { duration: 0.34, ease: EASE },
                          opacity: { duration: 0.22, ease: EASE },
                          delay: reducedMotion ? 0 : distance * 0.02,
                        }}
                        onClick={handleSelect}
                      >
                        <div className="flex w-fit justify-end rounded-full">
                          <motion.div
                            className="relative inline-flex max-w-[156px] justify-end rounded-full p-2 w-fit"
                            whileHover={{ x: -4 }}
                            transition={{ duration: 0.18, ease: EASE }}
                            data-cursor="Open section"
                            data-cursor-position="left"
                          >
                            {/* Original pill glass background — brighter when active
                              (backdrop-filter lives here so it blurs the page) */}
                            <motion.span
                              aria-hidden="true"
                              className="absolute inset-0 rounded-full"
                              style={{
                                transformOrigin: "100% 50%",
                                backdropFilter: "blur(12px)",
                                WebkitBackdropFilter: "blur(12px)",
                              }}
                              animate={{
                                backgroundColor: isActive
                                  ? "rgba(255,255,255,0.09)"
                                  : "rgba(255,255,255,0.05)",
                              }}
                              transition={{ duration: 0.28, ease: EASE }}
                            />
                            <TruncatedSideNavLabel
                              label={section.label}
                              visible
                            />
                          </motion.div>
                        </div>

                        <motion.span
                          className="w-7 text-right text-[0.62rem] uppercase tracking-[0.34em] text-white"
                          animate={{
                            opacity: isActive ? 0.78 : 0.44,
                            filter: "blur(0.4px)",
                          }}
                          transition={{ duration: 0.28, ease: EASE }}
                        >
                          {section.index}
                        </motion.span>
                      </motion.a>
                    );
                  })}
                </motion.div>
              ) : null}
            </AnimatePresence>

            {/* ── The toggle pill — separate entity, vertical, floats on the edge ── */}
            <motion.button
              type="button"
              onClick={handleToggle}
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
              aria-expanded={open}
              aria-label={
                isPinned
                  ? "Collapse menu"
                  : open
                    ? "Pin menu open"
                    : "Open menu"
              }
              data-cursor={
                isPinned ? "Close menu" : open ? "Pin menu open" : "Open menu"
              }
              data-cursor-position="left"
              className="group pointer-events-auto relative flex w-[44px] flex-col items-center justify-center gap-3 rounded-full py-4 shadow-[0_14px_40px_rgba(0,0,0,0.35)]"
              style={{
                backgroundColor: isPinned
                  ? "rgba(255,255,255,0.09)"
                  : "rgba(255,255,255,0.05)",
                backdropFilter: "blur(12px)",
                WebkitBackdropFilter: "blur(12px)",
              }}
              layout
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, ease: EASE }}
              whileHover={{ scale: 1.04 }}
            >
              {/* state icon — communicates hover vs. click affordance */}
              <motion.span
                className="pointer-events-none flex size-7 items-center justify-center"
                key={isPinned ? "pinned" : isPreview ? "preview" : "closed"}
                initial={{ opacity: 0, scale: 0.8, rotate: -14 }}
                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                transition={{ duration: 0.24, ease: EASE }}
              >
                {isPinned ? (
                  /* Pinned open: line (outline) lock. Click to unlock/close. */
                  <Lock className="size-4 text-white" strokeWidth={1.75} />
                ) : isPreview ? (
                  /* Preview (opened by hover, not pinned): line open-lock — reads
                   as "click to lock (pin) it open". No highlight circle. */
                  <LockOpen
                    className="size-4 text-white/90"
                    strokeWidth={1.75}
                  />
                ) : (
                  /* Closed: chevron. The menu slides out to the left. */
                  <ChevronLeft
                    className="size-4 text-white/70"
                    strokeWidth={1.75}
                  />
                )}
              </motion.span>

              {/* vertical grip — the Android "home pill" handle */}
              <span
                aria-hidden="true"
                className="pointer-events-none h-7 w-[3px] rounded-full bg-white/20"
              />

              {/* active section label, reading bottom-to-top */}
              {active ? (
                <span
                  className="pointer-events-none text-[0.62rem] uppercase leading-tight tracking-[0.28em] text-white/68"
                  style={{
                    writingMode: "vertical-rl",
                    transform: "rotate(180deg)",
                  }}
                >
                  {active.label}
                </span>
              ) : null}
            </motion.button>
          </div>
        </div>
      </aside>

      {/* ── Mobile rail (below md): a compact button sitting just above the
           scroll-to-top control. Tapping it opens/closes the menu; the section
           links fan upward from the button. When closed it shows the ACTIVE
           section index; when open it shows an X to close. On touch there's no
           hover, so it never shows a lock / label / grip. When scroll-to-top
           is hidden the whole control slides DOWN to sit where it would. ── */}
      <div
        className="pointer-events-none fixed right-4 z-40 md:hidden sm:right-6"
        style={{
          bottom: showScrollTop ? "5.25rem" : "1.5rem",
          transition: "bottom 0.28s ease",
        }}
      >
        <div className="pointer-events-auto relative flex flex-col items-end gap-3">
          <AnimatePresence>
            {open ? (
              <motion.div
                key="mobile-menu"
                className="pointer-events-none flex flex-col items-end"
                // Transform-only entrance (see desktop note): keeps the item
                // pills' backdrop blur sampling the page as they appear. The
                // container is an invisible positioning box so it carries no
                // opacity — the dissolve comes from the pills below. It scales
                // down + drifts toward the toggle on close (mirrors the desktop
                // globule collapse); transform never breaks the pills' blur.
                initial={{ y: 10, scale: 0.96 }}
                animate={{ y: 0, scale: 1 }}
                exit={{ y: 16, scale: 0.97 }}
                transition={{ duration: 0.24, ease: EASE }}
              >
                {fanItems.map(({ section, index }) => {
                  const isActive = section.id === activeId;
                  return (
                    <motion.a
                      key={section.id}
                      href={`#${section.id}`}
                      onClick={handleSelect}
                      // Same pill look AND same exit behaviour as the desktop
                      // fan: pills grow out from the toggle (scale 0.4 -> 1) and,
                      // on close, shrink back toward it (scale -> 0.4) while
                      // fading. `animate` restores opacity to 1 so a node reused
                      // from a partially-run exit reliably reappears. Contiguous
                      // stacking (height = itemHeight, no gap) matches desktop
                      // pill spacing.
                      className="pointer-events-auto flex w-fit items-center justify-end rounded-full px-3"
                      style={{ height: itemHeight }}
                      initial={{ scale: reducedMotion ? 1 : 0.4 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{
                        scale: reducedMotion ? 1 : 0.4,
                        opacity: reducedMotion ? 1 : 0,
                      }}
                      transition={{
                        scale: {
                          duration: reducedMotion ? 0.2 : 0.34,
                          ease: EASE,
                        },
                        opacity: { duration: 0.22, ease: EASE },
                        delay: reducedMotion ? 0 : index * 0.04,
                      }}
                    >
                      <div className="flex w-fit justify-end rounded-full">
                        <motion.div className="relative inline-flex max-w-[156px] justify-end rounded-full p-2 w-fit">
                          <motion.span
                            aria-hidden="true"
                            className="absolute inset-0 rounded-full"
                            style={{
                              transformOrigin: "100% 50%",
                              backdropFilter: "blur(12px)",
                              WebkitBackdropFilter: "blur(12px)",
                            }}
                            animate={{
                              backgroundColor: isActive
                                ? "rgba(255,255,255,0.09)"
                                : "rgba(255,255,255,0.05)",
                            }}
                            transition={{ duration: 0.28, ease: EASE }}
                          />
                          <span className="relative z-10 block max-w-[132px] w-fit truncate px-4 py-2 text-right text-sm tracking-[-0.01em] whitespace-nowrap text-white">
                            {section.label}
                          </span>
                        </motion.div>
                      </div>
                      <motion.span
                        className="w-7 text-right text-[0.62rem] uppercase tracking-[0.34em] text-white"
                        animate={{ opacity: isActive ? 0.78 : 0.44 }}
                        transition={{ duration: 0.28, ease: EASE }}
                      >
                        {section.index}
                      </motion.span>
                    </motion.a>
                  );
                })}
              </motion.div>
            ) : null}
          </AnimatePresence>

          {/* Toggle: shows the active section index when closed, an X when open. */}
          <motion.button
            type="button"
            onClick={handleToggle}
            aria-expanded={open}
            aria-label={open ? "Close navigation menu" : "Open navigation menu"}
            className="pointer-events-auto relative flex size-11 items-center justify-center rounded-full shadow-[0_14px_40px_rgba(0,0,0,0.35)]"
            style={{
              backgroundColor: open
                ? "rgba(255,255,255,0.09)"
                : "rgba(255,255,255,0.05)",
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
            }}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, ease: EASE }}
          >
            <AnimatePresence mode="wait" initial={false}>
              {open ? (
                <motion.span
                  key="close"
                  className="flex items-center justify-center"
                  initial={{ opacity: 0, rotate: -90, scale: 0.7 }}
                  animate={{ opacity: 1, rotate: 0, scale: 1 }}
                  exit={{ opacity: 0, rotate: 90, scale: 0.7 }}
                  transition={{ duration: 0.2, ease: EASE }}
                >
                  <X className="size-5 text-white/85" strokeWidth={1.75} />
                </motion.span>
              ) : (
                <motion.span
                  key="index"
                  className="flex items-center justify-center"
                  initial={{ opacity: 0, rotate: 90, scale: 0.7 }}
                  animate={{ opacity: 1, rotate: 0, scale: 1 }}
                  exit={{ opacity: 0, rotate: -90, scale: 0.7 }}
                  transition={{ duration: 0.2, ease: EASE }}
                >
                  <span className="text-[0.62rem] font-semibold tabular-nums tracking-[0.12em] text-white/85">
                    {active?.index ?? "00"}
                  </span>
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>
        </div>
      </div>

      {/* ── Scroll to top — pinned to the bottom, independent of the menu state ── */}
      <div className="pointer-events-none fixed bottom-6 right-4 z-[245] flex items-start sm:right-6 xl:right-7 2xl:right-10">
        <AnimatePresence>
          {showScrollTop && (
            <motion.button
              type="button"
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              aria-label="Scroll to top"
              data-cursor="Scroll to top"
              data-cursor-position="top"
              className="pointer-events-auto flex size-11 items-center justify-center rounded-full border border-white/12 shadow-[0_14px_40px_rgba(0,0,0,0.35)]"
              style={{
                backgroundColor: "rgba(255,255,255,0.05)",
                backdropFilter: "blur(12px)",
                WebkitBackdropFilter: "blur(12px)",
                borderColor: "rgba(255,255,255,0.12)",
              }}
              initial={{ opacity: 0, y: 12, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.9 }}
              transition={{ duration: 0.28, ease: EASE }}
              whileHover={{ scale: 1.06 }}
            >
              <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 rounded-full bg-gradient-to-t from-white/[0.04] to-white/[0.09]"
              />
              <ChevronUp className="relative z-10 size-4 text-white/76" />
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}
