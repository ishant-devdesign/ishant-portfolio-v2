"use client";

import Link from "next/link";
import { ArrowUpRight, SwatchBook } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";

interface ArchiveIcon {
  id: string;
  left: number;
  drift: number;
  rotate: number;
  duration: number;
  size: number;
}

export function ArchiveCard() {
  const [hovered, setHovered] = useState(false);
  const [icons, setIcons] = useState<ArchiveIcon[]>([]);

  useEffect(() => {
    if (!hovered) {
      setIcons([]);
      return;
    }

    const interval = setInterval(() => {
      const icon: ArchiveIcon = {
        id: crypto.randomUUID(),
        left: Math.random() * 90,
        drift: (Math.random() - 0.5) * 120,
        rotate: (Math.random() - 0.5) * 60,
        duration: 2.5 + Math.random() * 2,
        size: 14 + Math.random() * 12,
      };

      setIcons((prev) => [...prev, icon]);
    }, 220);

    return () => clearInterval(interval);
  }, [hovered]);

  return (
    <Link
      href="/archive"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="
        group
        relative
        block
        rounded-[1.6rem]
        border
        border-white/10
        bg-white/[0.03]
        p-5
        transition-all
        duration-500
        hover:border-cyan-700/30
        hover:bg-[rgba(0,35,55,0.22)]
        overflow-hidden
      "
    >
      {/* Cyan ambient glow */}
      <motion.div
        className="
          pointer-events-none
          absolute
          inset-0
          bg-[radial-gradient(circle_at_30%_20%,rgba(80,180,220,0.18),transparent_55%)]
        "
        animate={{
          opacity: hovered ? 1 : 0,
        }}
        transition={{
          duration: 0.4,
        }}
      />

      {/* Secondary cyan glow */}
      <motion.div
        className="
          pointer-events-none
          absolute
          -right-20
          -top-20
          h-64
          w-64
          rounded-full
          bg-cyan-600/10
          blur-3xl
        "
        animate={{
          opacity: hovered ? 1 : 0,
          scale: hovered ? 1 : 0.8,
        }}
        transition={{
          duration: 0.5,
        }}
      />

      {/* Icon rain */}
      <AnimatePresence>
        {icons.map((icon) => (
          <motion.div
            key={icon.id}
            className="pointer-events-none absolute z-[1]"
            style={{
              left: `${icon.left}%`,
            }}
            initial={{
              y: -50,
              x: 0,
              opacity: 0,
              rotate: icon.rotate,
              scale: 0.8,
            }}
            animate={{
              y: 520,
              x: icon.drift,
              opacity: [0, 0.3, 0.12, 0],
              rotate: icon.rotate + 35,
              scale: [0.8, 1, 0.95],
            }}
            exit={{
              opacity: 0,
            }}
            transition={{
              duration: icon.duration,
              ease: "linear",
            }}
            onAnimationComplete={() => {
              setIcons((prev) => prev.filter((i) => i.id !== icon.id));
            }}
          >
            <SwatchBook
              size={icon.size}
              className="
                text-cyan-200/20
                drop-shadow-[0_0_8px_rgba(120,220,255,0.15)]
              "
            />
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Content */}
      <div className="relative z-10">
        <p className="text-[0.62rem] uppercase tracking-[0.3em] text-white/30">
          Archive
        </p>

        <motion.h3
          className="mt-4 text-3xl tracking-[-0.04em] text-white"
          transition={{
            duration: 0.3,
          }}
        >
          Browse creative archive.
        </motion.h3>

        <p className="mt-4 text-sm leading-6 text-white/56">
          Graphic design, branding, posters, motion graphics, 3D renders, and
          visual experiments collected over the years.
        </p>
      </div>

      {/* Footer CTA */}
      <motion.div className="relative z-10 mt-6 flex items-center justify-between">
        <motion.span className="text-sm text-white/74">
          Open archive
        </motion.span>

        <motion.div
          className="
            flex
            h-10
            w-10
            items-center
            justify-center
            rounded-full
            border
            border-white/10
            bg-white/[0.02]
          "
          animate={{
            rotate: hovered ? 45 : 0,
            backgroundColor: hovered
              ? "rgba(100,220,255,0.08)"
              : "rgba(255,255,255,0.02)",
          }}
          transition={{
            duration: 0.3,
          }}
        >
          <ArrowUpRight size={16} />
        </motion.div>
      </motion.div>
    </Link>
  );
}
