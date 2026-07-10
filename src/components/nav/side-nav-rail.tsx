"use client";

import { motion } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronUp } from "lucide-react";
import type { HomeSectionItem } from "@/lib/site-config";

type SideNavRailProps = {
  sections: HomeSectionItem[];
};

const ITEM_HEIGHT = 52;
const TOOLTIP_DELAY = 300;

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
    if (!visible) {
      setShowTooltip(false);

      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    }
  }, [visible]);

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
        transition={{ duration: 0.34, ease: [0.22, 1, 0.36, 1] }}
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
          transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
        >
          {label}
        </motion.span>
      )}
    </span>
  );
}

export function SideNavRail({ sections }: SideNavRailProps) {
  const [activeId, setActiveId] = useState(sections[0]?.id ?? "");
  const [hovered, setHovered] = useState(false);
  const [atBottom, setAtBottom] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const updateScrollPosition = () => {
      const scrollBottom = window.scrollY + window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;

      setAtBottom(scrollBottom >= documentHeight - 2);
    };

    updateScrollPosition();

    window.addEventListener("scroll", updateScrollPosition, {
      passive: true,
    });

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

  return (
    <aside className="pointer-events-none fixed inset-y-0 right-7 z-40 hidden items-center xl:flex 2xl:right-10">
      <div
        className="pointer-events-auto relative h-screen w-[240px]"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <motion.div
          className="absolute inset-x-0 justify-end flex flex-col items-end"
          style={{ top: `calc(50% - ${ITEM_HEIGHT / 2}px)` }}
          animate={{ y: -(activeIndex * ITEM_HEIGHT) }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        >
          {sections.map((section) => {
            const active = section.id === activeId;
            const textVisible = hovered || active;

            return (
              <a
                key={section.id}
                href={`#${section.id}`}
                className="group flex h-[52px] items-center justify-end rounded-full px-3 w-fit"
              >
                <div className="flex w-fit justify-end rounded-full">
                  <motion.div
                    className="relative inline-flex max-w-[156px] justify-end rounded-full p-2 w-fit"
                    whileHover={{ x: -4 }}
                    transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
                    data-cursor="Open section"
                    data-cursor-position="left"
                  >
                    <motion.span
                      aria-hidden="true"
                      className="absolute inset-0 rounded-full bg-white/[0.055] flex flex-col justify-end"
                      animate={{
                        opacity: textVisible ? 1 : 0,
                        filter: textVisible ? "blur(0px)" : "blur(12px)",
                        scaleX: textVisible ? 1 : 0.78,
                      }}
                      style={{
                        transformOrigin: "100% 50%",
                        backdropFilter: "blur(12px)",
                      }}
                      transition={{
                        duration: 0.34,
                        ease: [0.22, 1, 0.36, 1],
                      }}
                    />

                    <TruncatedSideNavLabel
                      label={section.label}
                      visible={textVisible}
                    />
                  </motion.div>
                </div>

                <motion.span
                  className="w-7 text-right text-[0.62rem] uppercase tracking-[0.34em] text-white"
                  animate={{
                    opacity: active ? 0.78 : hovered ? 0.54 : 0.34,
                    filter: active ? "blur(0px)" : "blur(0.4px)",
                  }}
                  transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                >
                  {section.index}
                </motion.span>
              </a>
            );
          })}

          {/* Scroll to top button */}
          <a
            className="group flex h-[52px] items-center justify-end rounded-full px-3"
            href="#"
            onClick={(event) => {
              event.preventDefault();
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
          >
            <div
              className="group flex h-[52px] items-center justify-end rounded-full px-3"
              aria-label="Scroll to top"
            >
              <motion.div
                className="relative inline-flex max-w-[156px] justify-end rounded-full p-2"
                whileHover={{ x: -4 }}
                transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
                data-cursor="Scroll to top"
                data-cursor-position="left"
              >
                <motion.span
                  aria-hidden="true"
                  className="absolute inset-0 rounded-full bg-white/[0.055]"
                  animate={{
                    opacity: hovered || atBottom ? 1 : 0,
                    filter: hovered || atBottom ? "blur(0px)" : "blur(12px)",
                    scaleX: hovered || atBottom ? 1 : 0.78,
                  }}
                  style={{
                    transformOrigin: "100% 50%",
                    backdropFilter: "blur(12px)",
                  }}
                  transition={{ duration: 0.34, ease: [0.22, 1, 0.36, 1] }}
                />

                <motion.span
                  className="relative z-10 max-w-[132px] truncate px-4 py-2 text-right text-sm tracking-[-0.01em] whitespace-nowrap text-white"
                  animate={{
                    opacity: hovered || atBottom ? 1 : 0,
                    filter: hovered || atBottom ? "blur(0px)" : "blur(10px)",
                  }}
                  transition={{ duration: 0.34, ease: [0.22, 1, 0.36, 1] }}
                >
                  Scroll to Top
                </motion.span>
              </motion.div>
            </div>

            <motion.div
              className="flex w-4 justify-end"
              animate={{
                opacity: atBottom ? 0.78 : hovered ? 0.54 : 0.34,
                filter: atBottom ? "blur(0px)" : "blur(0.4px)",
              }}
              transition={{
                duration: 0.28,
                ease: [0.22, 1, 0.36, 1],
              }}
            >
              <ChevronUp className="size-4 text-white" />
            </motion.div>
          </a>
        </motion.div>
      </div>
    </aside>
  );
}
