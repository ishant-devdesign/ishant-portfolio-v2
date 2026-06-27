"use client";

import { motion, useInView, type HTMLMotionProps } from "framer-motion";
import { useRef, type ReactNode } from "react";
import { cn } from "@/lib/utils";

type RevealInViewProps = Omit<HTMLMotionProps<"div">, "children"> & {
  children: ReactNode;
  delay?: number;
  y?: number;
  blur?: number;
  once?: boolean;
};

export function RevealInView({
  children,
  className,
  delay = 0,
  y = 28,
  blur = 10,
  once = false,
  ...rest
}: RevealInViewProps) {
  const ref = useRef<HTMLDivElement>(null);

  const isInView = useInView(ref, {
    once,
    margin: "0px 0px -200px 0px",
  });

  return (
    <motion.div
      ref={ref}
      className={cn(className)}
      initial={{
        opacity: 0,
        y: y * 0.8,
        scale: 0.985,
        filter: `blur(${blur}px)`,
      }}
      animate={
        isInView
          ? {
              opacity: 1,
              y: 0,
              scale: 1,
              filter: "blur(0px)",
            }
          : {
              opacity: 0,
              y: y * 0.8,
              scale: 0.985,
              filter: `blur(${blur}px)`,
            }
      }
      transition={{
        duration: 0.8,
        delay,
        ease: [0.16, 1, 0.3, 1],
      }}
      {...rest}
    >
      {children}
    </motion.div>
  );
}
