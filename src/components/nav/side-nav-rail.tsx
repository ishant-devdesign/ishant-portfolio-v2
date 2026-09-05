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
const HOVER_CLOSE_DELAY_MS = 180;
const SCROLL_TO_TOP_THRESHOLD = 380;
const TOGGLE_WIDTH = 44;
const TOGGLE_GAP = 18;
const ACTIVE_SECTION_THRESHOLD = 132;
const MOBILE_ACTIVE_SECTION_THRESHOLD = 112;
const MANUAL_ACTIVE_HOLD_MS = 900;
const SIDE_NAV_LOCK_STORAGE_KEY = "portfolio-side-nav-locked";

const EASE = [0.22, 1, 0.36, 1] as const;

function readStoredSideNavLockPreference(): "locked" | "unlocked" | null {
  if (typeof window === "undefined") return null;

  try {
    const stored = window.localStorage.getItem(SIDE_NAV_LOCK_STORAGE_KEY);
    return stored === "locked" || stored === "unlocked" ? stored : null;
  } catch {
    return null;
  }
}

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
      className="relative z-10 inline-block w-fit"
      style={{ pointerEvents: visible ? "auto" : "none" }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <motion.span
        ref={textRef}
        className="block max-w-[132px] w-fit truncate px-4 py-2 text-right text-sm tracking-[-0.01em] whitespace-nowrap text-white"
        animate={{
          opacity: visible ? 1 : 0,
          filter: visible ? "blur(0px)" : "blur(10px)",
          pointerEvents: visible ? "auto" : "none",
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
  const [desktopPinned, setDesktopPinned] = useState(
    () => readStoredSideNavLockPreference() === "locked",
  );
  const [mobileOpen, setMobileOpen] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [peekOpen, setPeekOpen] = useState(false);
  const [areaHovered, setAreaHovered] = useState(false);
  const [canHover, setCanHover] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [hasStoredPinPreference, setHasStoredPinPreference] = useState(
    () => readStoredSideNavLockPreference() !== null,
  );
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [viewportHeight, setViewportHeight] = useState(800);

  const hoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const peekTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const peeked = useRef(false);
  const manualActiveIdRef = useRef<string | null>(null);
  const manualActiveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(hover: hover) and (pointer: fine)");
    const update = () => setCanHover(mq.matches);
    update();
    mq.addEventListener?.("change", update);
    return () => mq.removeEventListener?.("change", update);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(max-width: 767px)");
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener?.("change", update);
    return () => mq.removeEventListener?.("change", update);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleStorage = (event: StorageEvent) => {
      if (event.key !== SIDE_NAV_LOCK_STORAGE_KEY) return;
      const stored = readStoredSideNavLockPreference();
      setDesktopPinned(stored === "locked");
      setHasStoredPinPreference(stored !== null);
    };

    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const update = () => setViewportHeight(window.innerHeight);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  useEffect(() => {
    if (
      isMobile ||
      peeked.current ||
      !introComplete ||
      reducedMotion ||
      hasStoredPinPreference
    ) {
      return;
    }

    peeked.current = true;
    setPeekOpen(true);
    peekTimer.current = setTimeout(() => setPeekOpen(false), PEEK_MS);

    return () => {
      if (peekTimer.current) {
        clearTimeout(peekTimer.current);
        peekTimer.current = null;
      }
    };
  }, [introComplete, reducedMotion, isMobile, hasStoredPinPreference]);

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

  const handleMouseEnter = () => {
    if (!canHover) return;
    clearHoverTimer();
    setHovered(true);
  };

  const handleAreaEnter = () => {
    if (!canHover) return;
    clearHoverTimer();
    setAreaHovered(true);
  };

  const handleMouseLeave = () => {
    if (!canHover) return;
    clearHoverTimer();
    setAreaHovered(false);
    hoverTimer.current = setTimeout(() => {
      setHovered(false);
      setAreaHovered(false);
    }, HOVER_CLOSE_DELAY_MS);
  };

  const open = isMobile
    ? mobileOpen
    : peekOpen || desktopPinned || (canHover && hovered);
  const showExpandedItems = isMobile ? open : areaHovered || peekOpen;

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

  useEffect(() => {
    if (typeof window === "undefined") return;

    let frame = 0;

    const updateActiveSection = () => {
      if (manualActiveIdRef.current) {
        setActiveId(manualActiveIdRef.current);
        return;
      }

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

      const threshold = isMobile
        ? MOBILE_ACTIVE_SECTION_THRESHOLD
        : ACTIVE_SECTION_THRESHOLD;

      const startedSections = elements.filter(
        ({ element }) => element.getBoundingClientRect().top <= threshold,
      );

      if (startedSections.length > 0) {
        setActiveId(startedSections[startedSections.length - 1].id);
        return;
      }

      setActiveId(elements[0].id);
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
  }, [isMobile, sections]);

  const activeIndex = useMemo(
    () =>
      Math.max(
        0,
        sections.findIndex((section) => section.id === activeId),
      ),
    [activeId, sections],
  );

  const active = sections[activeIndex];
  const isPreview = !isMobile && open && !desktopPinned;
  const isPinned = desktopPinned;

  const verticalPadding = 96;
  const itemHeight = useMemo(() => {
    const count = Math.max(sections.length, 1);
    const available = Math.max(viewportHeight - verticalPadding, 0);
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

  const savePinnedPreference = (nextPinned: boolean) => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(
        SIDE_NAV_LOCK_STORAGE_KEY,
        nextPinned ? "locked" : "unlocked",
      );
      setHasStoredPinPreference(true);
    } catch {
      // Ignore storage failures; the nav still works for the current session.
    }
  };

  const handleToggle = () => {
    cancelPeek();
    clearHoverTimer();

    if (isMobile) {
      setHovered(false);
      setAreaHovered(false);
      setPeekOpen(false);
      setMobileOpen((current) => !current);
      return;
    }

    if (desktopPinned) {
      setDesktopPinned(false);
      savePinnedPreference(false);
      setHovered(false);
      setAreaHovered(false);
      return;
    }

    setDesktopPinned(true);
    savePinnedPreference(true);
  };

  const handleSelect = (id: string) => {
    cancelPeek();
    clearHoverTimer();

    manualActiveIdRef.current = id;
    setActiveId(id);

    if (manualActiveTimerRef.current) {
      clearTimeout(manualActiveTimerRef.current);
    }

    manualActiveTimerRef.current = setTimeout(() => {
      manualActiveIdRef.current = null;
      manualActiveTimerRef.current = null;
    }, MANUAL_ACTIVE_HOLD_MS);

    if (isMobile) {
      setMobileOpen(false);
      setHovered(false);
      setAreaHovered(false);
      return;
    }

    if (!desktopPinned) {
      setHovered(false);
      setAreaHovered(false);
    }
  };

  useEffect(() => {
    return () => {
      if (hoverTimer.current) clearTimeout(hoverTimer.current);
      if (peekTimer.current) clearTimeout(peekTimer.current);
      if (manualActiveTimerRef.current)
        clearTimeout(manualActiveTimerRef.current);
    };
  }, []);

  return (
    <>
      <aside className="pointer-events-none fixed inset-y-0 right-4 z-40 hidden items-center md:flex sm:right-6 xl:right-7 2xl:right-10">
        <div className="pointer-events-none relative flex h-screen w-[240px] items-center justify-end">
          <div className="pointer-events-auto relative">
            <motion.div
              initial={false}
              className="pointer-events-none absolute flex flex-col items-end justify-end overflow-visible"
              style={{
                top: `calc(50% - ${ITEM_HEIGHT / 2}px)`,
                right: TOGGLE_WIDTH + TOGGLE_GAP,
              }}
              animate={{
                y: -(activeIndex * ITEM_HEIGHT),
                width: showExpandedItems ? 220 : 0,
              }}
              transition={{
                y: { duration: 0.55, ease: EASE },
                width: { duration: 0.22, ease: EASE },
              }}
              onMouseEnter={handleAreaEnter}
              onMouseLeave={handleMouseLeave}
            >
              {sections.map((section) => {
                const active = section.id === activeId;
                const pillVisible = open && (showExpandedItems || active);
                const indexVisible =
                  open && (showExpandedItems || desktopPinned || active);

                return (
                  <a
                    key={section.id}
                    href={`#${section.id}`}
                    className="group flex h-[52px] w-fit items-center justify-end rounded-full px-3"
                    style={{ pointerEvents: pillVisible ? "auto" : "none" }}
                    onClick={() => handleSelect(section.id)}
                    onMouseEnter={handleAreaEnter}
                    onMouseLeave={handleMouseLeave}
                  >
                    <div className="flex w-fit justify-end rounded-full">
                      <motion.div
                        className="relative inline-flex max-w-[156px] w-fit justify-end rounded-full p-2"
                        style={{ pointerEvents: pillVisible ? "auto" : "none" }}
                        whileHover={{ x: -4 }}
                        transition={{ duration: 0.18, ease: EASE }}
                        data-cursor="Open section"
                        data-cursor-position="left"
                      >
                        <motion.span
                          aria-hidden="true"
                          className="absolute inset-0 flex flex-col justify-end rounded-full bg-white/[0.055]"
                          animate={{
                            opacity: pillVisible ? 1 : 0,
                            filter: pillVisible ? "blur(0px)" : "blur(12px)",
                            scaleX: pillVisible ? 1 : 0.78,
                            pointerEvents: pillVisible ? "auto" : "none",
                          }}
                          style={{
                            transformOrigin: "100% 50%",
                            backdropFilter: "blur(12px)",
                            WebkitBackdropFilter: "blur(12px)",
                          }}
                          transition={{ duration: 0.34, ease: EASE }}
                        />

                        <TruncatedSideNavLabel
                          label={section.label}
                          visible={pillVisible}
                        />
                      </motion.div>
                    </div>

                    <motion.span
                      className="w-7 text-right text-[0.62rem] uppercase tracking-[0.34em] text-white"
                      animate={{
                        opacity: indexVisible
                          ? active
                            ? 0.78
                            : showExpandedItems
                              ? 0.54
                              : 0.34
                          : 0,
                        filter: indexVisible
                          ? active
                            ? "blur(0px)"
                            : "blur(0.4px)"
                          : "blur(10px)",
                        pointerEvents: pillVisible ? "auto" : "none",
                      }}
                      transition={{ duration: 0.28, ease: EASE }}
                    >
                      {section.index}
                    </motion.span>
                  </a>
                );
              })}
            </motion.div>

            <motion.button
              type="button"
              onClick={handleToggle}
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
              aria-expanded={open}
              aria-label={
                isPinned ? "Unlock menu" : open ? "Pin menu open" : "Open menu"
              }
              data-cursor={
                isPinned ? "Unlock menu" : open ? "Pin menu open" : "Open menu"
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
              <AnimatePresence mode="wait" initial={false}>
                {isPinned ? (
                  <motion.span
                    key="unlock-only"
                    className="pointer-events-none flex size-7 items-center justify-center"
                    initial={{ opacity: 0, scale: 0.8, rotate: -14 }}
                    animate={{ opacity: 1, scale: 1, rotate: 0 }}
                    exit={{ opacity: 0, scale: 0.8, rotate: 14 }}
                    transition={{ duration: 0.24, ease: EASE }}
                  >
                    <LockOpen
                      className="size-4 text-white"
                      strokeWidth={1.75}
                    />
                  </motion.span>
                ) : (
                  <motion.div
                    key="title-and-icon"
                    className="pointer-events-none flex flex-col items-center justify-center gap-3"
                    initial={{ opacity: 0, scale: 0.92, y: 6 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.92, y: -6 }}
                    transition={{ duration: 0.24, ease: EASE }}
                  >
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

                    <motion.span
                      className="pointer-events-none flex size-7 items-center justify-center"
                      key={isPreview ? "lock-hover" : "closed-chevron"}
                      initial={{ opacity: 0, scale: 0.8, rotate: -14 }}
                      animate={{ opacity: 1, scale: 1, rotate: 0 }}
                      exit={{ opacity: 0, scale: 0.8, rotate: 14 }}
                      transition={{ duration: 0.24, ease: EASE }}
                    >
                      {isPreview ? (
                        <Lock
                          className="size-4 text-white/90"
                          strokeWidth={1.75}
                        />
                      ) : (
                        <ChevronLeft
                          className="size-4 text-white/70"
                          strokeWidth={1.75}
                        />
                      )}
                    </motion.span>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.button>
          </div>
        </div>
      </aside>

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
                      onClick={() => handleSelect(section.id)}
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

      <div className="pointer-events-none fixed bottom-6 right-4 z-[245] flex items-start sm:right-6 xl:right-7 2xl:right-10">
        <AnimatePresence>
          {showScrollTop && (
            <motion.button
              type="button"
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              aria-label="Scroll to top"
              data-cursor="Scroll to top"
              data-cursor-position="top"
              className="pointer-events-auto relative flex size-11 items-center justify-center rounded-full border border-white/10 bg-black/55 text-white shadow-[0_8px_28px_rgba(0,0,0,0.4)] backdrop-blur-xl backdrop-saturate-150 sm:size-12"
              initial={{ opacity: 0, y: 12, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.9 }}
              transition={{ duration: 0.28, ease: EASE }}
            >
              <motion.span
                className="relative z-10 flex size-7 items-center justify-center rounded-full"
                whileHover={{ y: -1 }}
                transition={{ duration: 0.18, ease: EASE }}
              >
                <ChevronUp className="size-4 text-white/76" />
              </motion.span>
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}
