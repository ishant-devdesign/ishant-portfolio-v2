"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";

export function ArchiveCard() {
  const [hovered, setHovered] = useState(false);

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
        hover:border-amber-700/30
        hover:bg-[rgba(55,35,18,0.22)]
      "
    >
      {/* Amber ambient glow */}
      <motion.div
        className="
          pointer-events-none
          absolute
          inset-0
          bg-[radial-gradient(circle_at_30%_20%,rgba(180,120,70,0.18),transparent_55%)]
        "
        animate={{
          opacity: hovered ? 1 : 0,
        }}
        transition={{
          duration: 0.4,
        }}
      />

      {/* Secondary glow */}
      <motion.div
        className="
          pointer-events-none
          absolute
          -right-20
          -top-20
          h-64
          w-64
          rounded-full
          bg-amber-600/10
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
      <div className="relative z-10 mt-6 flex items-center justify-between">
        <span className="text-sm text-white/74">
          Open archive
        </span>

        <div
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
        >
          <ArrowUpRight size={16} />
        </div>
      </div>
    </Link>
  );
}