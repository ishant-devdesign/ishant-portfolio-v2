"use client";

import { motion } from "framer-motion";
import { usePathname } from "next/navigation";
import { useMemo } from "react";
import { useExperience } from "@/components/motion/experience-provider";
import { cn } from "@/lib/utils";

function splitName(text: string) {
  return Array.from(text).map((char, index) => ({
    id: `${char}-${index}`,
    char,
    isSpace: char === " ",
  }));
}

export function SiteNameMark({
  text,
  className,
}: {
  text: string;
  className?: string;
}) {
  const pathname = usePathname();
  const { introComplete, loaderWasVisible } = useExperience();
  const chars = useMemo(() => splitName(text), [text]);
  const shouldAnimateFromLoader = pathname === "/" && loaderWasVisible;

  return (
    <span
      className={cn("block overflow-hidden rounded-full", className)}
      aria-label={text}
    >
      <motion.span
        className="font-heading rounded-full inline-flex flex-wrap items-end justify-center gap-x-[0.055em] uppercase leading-none text-white/88"
        initial={
          shouldAnimateFromLoader
            ? { y: "115%", opacity: 0.36, filter: "blur(10px)" }
            : false
        }
        animate={
          shouldAnimateFromLoader
            ? introComplete
              ? { y: 0, opacity: 1, filter: "blur(0px)" }
              : { y: "115%", opacity: 0.36, filter: "blur(10px)" }
            : { y: 0, opacity: 1, filter: "blur(0px)" }
        }
        transition={{
          duration: 0.62,
          delay: shouldAnimateFromLoader ? 0.06 : 0,
          ease: [0.22, 1, 0.36, 1],
        }}
      >
        {chars.map((item) => (
          <span
            key={item.id}
            className={item.isSpace ? "w-[0.34em]" : "inline-block"}
          >
            {item.isSpace ? "\u00A0" : item.char}
          </span>
        ))}
      </motion.span>
    </span>
  );
}
