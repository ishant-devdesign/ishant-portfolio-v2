"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Plus } from "lucide-react";
import { useState } from "react";

export function AccordionBlock({
  items,
}: {
  items: Array<{ title?: string; content?: string }>;
}) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="space-y-3" data-cursor-enabled="false">
      {items.map((item, index) => {
        const open = openIndex === index;

        return (
          <motion.div
            key={`${item.title ?? "item"}-${index}`}
            layout
            transition={{
              layout: {
                duration: 0.45,
                ease: [0.22, 1, 0.36, 1],
              },
            }}
            className="overflow-hidden rounded-[1.4rem] border border-white/10 bg-white/[0.03]"
          >
            <div
              type="button"
              data-cursor-enabled="false"
              onClick={() =>
                setOpenIndex((current) => (current === index ? null : index))
              }
              className="flex w-full items-center justify-between gap-4 px-4 py-4 text-left transition-colors duration-300 hover:bg-white/[0.02]"
            >
              <span className="text-sm uppercase tracking-[0.18em] text-white/84">
                {item.title ?? `Item ${index + 1}`}
              </span>

              <motion.div
                animate={{
                  rotate: open ? 45 : 0,
                }}
                transition={{
                  duration: 0.35,
                  ease: [0.22, 1, 0.36, 1],
                }}
              >
                <Plus className="size-4 text-white/42" />
              </motion.div>
            </div>

            <AnimatePresence initial={false}>
              {open && (
                <motion.div
                  key="content"
                  initial={{
                    height: 0,
                    opacity: 0,
                  }}
                  animate={{
                    height: "auto",
                    opacity: 1,
                  }}
                  exit={{
                    height: 0,
                    opacity: 0,
                  }}
                  transition={{
                    height: {
                      duration: 0.45,
                      ease: [0.22, 1, 0.36, 1],
                    },
                    opacity: {
                      duration: 0.25,
                    },
                  }}
                  className="overflow-hidden"
                >
                  <motion.div
                    initial={{
                      y: -8,
                    }}
                    animate={{
                      y: 0,
                    }}
                    exit={{
                      y: -8,
                    }}
                    transition={{
                      duration: 0.35,
                      ease: [0.22, 1, 0.36, 1],
                    }}
                    className="border-t border-white/8 px-4 py-4 text-sm leading-7 text-white/58"
                  >
                    {item.content ?? ""}
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        );
      })}
    </div>
  );
}
