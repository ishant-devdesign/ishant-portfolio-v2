"use client";

import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { navLinks } from "@/lib/site-config";
import { SiteNameMark } from "@/components/nav/site-name-mark";
import { buttonClasses } from "@/components/ui/button";

export function TopNav() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50">
      <div className="mx-auto flex w-full max-w-[1600px] items-center justify-between h-12 sm:px-8 lg:px-10 px-4">
        <Link
          href="/"
          data-cursor="Home"
          data-cursor-position="top"
          className="flex items-center"
        >
          <SiteNameMark
            text="Ishant Kumar"
            className="text-sm tracking-none px-4 py-2 rounded-full text-white/52 transition-colors hover:text-white"
          />
        </Link>

        {/* Desktop navigation */}
        <nav className="hidden items-center md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm text-white/52 transition-colors hover:text-white px-4 py-2 rounded-full"
              data-cursor={`Open ${link.label}`}
              data-cursor-position="bottom"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Mobile hamburger button */}
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          className={buttonClasses({
            tone: "ghost",
            size: "icon",
            className: "md:hidden",
          })}
          aria-label={open ? "Close menu" : "Open menu"}
        >
          <AnimatePresence mode="wait" initial={false}>
            {open ? (
              <motion.div
                key="close"
                initial={{ opacity: 0, rotate: -90 }}
                animate={{ opacity: 1, rotate: 0 }}
                exit={{ opacity: 0, rotate: 90 }}
                transition={{ duration: 0.15 }}
              >
                <X className="size-5" />
              </motion.div>
            ) : (
              <motion.div
                key="menu"
                initial={{ opacity: 0, rotate: -90 }}
                animate={{ opacity: 1, rotate: 0 }}
                exit={{ opacity: 0, rotate: 90 }}
                transition={{ duration: 0.15 }}
              >
                <Menu className="size-5" />
              </motion.div>
            )}
          </AnimatePresence>
        </button>
      </div>

      {/* Mobile menu panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{
              opacity: 0,
              y: -12,
              scale: 0.98,
            }}
            animate={{
              opacity: 1,
              y: 0,
              scale: 1,
            }}
            exit={{
              opacity: 0,
              y: -12,
              scale: 0.98,
            }}
            transition={{
              duration: 0.24,
              ease: [0.22, 1, 0.36, 1],
            }}
            className="absolute left-4 right-4 top-full z-50 mt-2 overflow-hidden rounded-[1.5rem] border border-white/10 bg-[#050505]/95 backdrop-blur-xl md:hidden"
          >
            <div className="flex flex-col p-2">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="flex items-center justify-between rounded-xl px-4 py-3 text-sm text-white/64 transition-colors hover:bg-white/[0.04] hover:text-white"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
