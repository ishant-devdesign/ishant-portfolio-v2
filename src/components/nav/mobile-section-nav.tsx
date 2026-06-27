"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import type { HomeSectionItem } from "@/lib/site-config";
import { buttonClasses } from "@/components/ui/button";
import { ChevronUp } from "lucide-react";

export function MobileSectionNav({
  sections,
}: {
  sections: HomeSectionItem[];
}) {
  const [activeId, setActiveId] = useState(sections[0]?.id ?? "");
  const [open, setOpen] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    let timeout: NodeJS.Timeout | null = null;

    const updateScrollPosition = () => {
      const scrollBottom = window.scrollY + window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;

      const atBottom = scrollBottom >= documentHeight - 2;

      if (atBottom) {
        if (timeout) {
          clearTimeout(timeout);
          timeout = null;
        }
        setShowScrollTop(true);
      } else {
        if (timeout) clearTimeout(timeout);

        timeout = setTimeout(() => {
          setShowScrollTop(false);
        }, 450);
      }
    };

    updateScrollPosition();

    window.addEventListener("scroll", updateScrollPosition, {
      passive: true,
    });

    window.addEventListener("resize", updateScrollPosition);

    return () => {
      if (timeout) clearTimeout(timeout);

      window.removeEventListener("scroll", updateScrollPosition);
      window.removeEventListener("resize", updateScrollPosition);
    };
  }, []);

  useEffect(() => {
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

    requestUpdate();
    window.addEventListener("scroll", requestUpdate, { passive: true });
    window.addEventListener("resize", requestUpdate);

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", requestUpdate);
      window.removeEventListener("resize", requestUpdate);
    };
  }, [sections]);

  const active = useMemo(
    () => sections.find((section) => section.id === activeId) ?? sections[0],
    [activeId, sections],
  );

  if (!active) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 lg:hidden justify-end flex flex-col items-end">
      <AnimatePresence>
        {open ? (
          <motion.div
            initial={{ opacity: 0, y: 12, filter: "blur(12px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: 10, filter: "blur(12px)" }}
            transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
            className="mb-3 w-[220px] overflow-hidden rounded-[1.5rem] border border-white/10 bg-[#0b0b0b]/92 p-2 backdrop-blur-xl"
          >
            {sections.map((section) => {
              const isActive = section.id === activeId;
              return (
                <a
                  key={section.id}
                  href={`#${section.id}`}
                  className="flex items-center justify-between rounded-[1rem] px-3 py-2.5 text-sm text-white/64"
                  onClick={() => setOpen(false)}
                >
                  <span className={isActive ? "text-white" : "text-white/62"}>
                    {section.label}
                  </span>
                  <span className="text-[0.62rem] uppercase tracking-[0.32em] text-white/32">
                    {section.index}
                  </span>
                </a>
              );
            })}
          </motion.div>
        ) : null}
      </AnimatePresence>

      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className={buttonClasses({
          tone: "ghost",
          size: "sm",
          className:
            "min-w-12 bg-[#0b0b0b]/92 text-[0.68rem] uppercase tracking-[0.34em] backdrop-blur-xl",
        })}
      >
        Section {active.index}
      </button>

      <AnimatePresence initial={false}>
        {showScrollTop && (
          <motion.div
            initial={{
              opacity: 0,
              y: 8,
              height: 0,
              marginTop: 0,
            }}
            animate={{
              opacity: 1,
              y: 0,
              height: "auto",
              marginTop: 8,
            }}
            exit={{
              opacity: 0,
              y: 8,
              height: 0,
              marginTop: 0,
            }}
            transition={{
              duration: 0.28,
              ease: [0.22, 1, 0.36, 1],
            }}
            className="overflow-hidden"
          >
            <button
              type="button"
              onClick={() =>
                window.scrollTo({
                  top: 0,
                  behavior: "smooth",
                })
              }
              className={buttonClasses({
                tone: "ghost",
                size: "sm",
                className:
                  "min-w-12 bg-[#0b0b0b]/92 text-[0.68rem] uppercase tracking-[0.34em] backdrop-blur-xl flex items-center justify-center gap-1",
              })}
            >
              Scroll to Top
              <ChevronUp className="size-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
