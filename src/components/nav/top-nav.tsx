"use client";

import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { navLinks } from "@/lib/site-config";
import { SiteNameMark } from "@/components/nav/site-name-mark";
import { buttonClasses } from "@/components/ui/button";

export function TopNav() {
  const [open, setOpen] = useState(false);

  // Lock the page behind the full-screen menu so it doesn't scroll underneath.
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  return (
    <>
      <header className="sticky top-0 z-[250]">
        <div className="mx-auto flex w-full max-w-[1600px] items-center justify-between h-12 sm:px-8 lg:px-10 px-4">
          <Link
            href="/"
            data-cursor="Home"
            data-cursor-position="top"
            className="flex items-center -ml-4"
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
      </header>

      {/* Mobile menu — full-page overlay. Rendered OUTSIDE the header (which has
          its own z-250 stacking context) so it becomes a root-level fixed layer
          at z-300 and genuinely sits above EVERYTHING — the sticky header, the
          side nav (z-40), the reader dock (z-240), and the AI/media modals. */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-0 z-[300] flex flex-col bg-[#050505]/[0.985] backdrop-blur-2xl md:hidden"
          >
            {/* Overlay header — repeats the brand + close so the user can exit */}
            <div className="flex h-12 items-center justify-between px-4 sm:px-8">
              <Link
                href="/"
                data-cursor="Home"
                data-cursor-position="top"
                className="flex items-center -ml-4"
                onClick={() => setOpen(false)}
              >
                <SiteNameMark
                  text="Ishant Kumar"
                  className="text-sm tracking-none px-4 py-2 rounded-full text-white/52 transition-colors hover:text-white"
                />
              </Link>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className={buttonClasses({
                  tone: "ghost",
                  size: "icon",
                })}
                aria-label="Close menu"
              >
                <X className="size-5" />
              </button>
            </div>

            {/* Nav links — centred vertically, large + tappable */}
            <nav className="flex flex-1 flex-col justify-center gap-1 px-6 pb-16">
              {navLinks.map((link, index) => (
                <motion.div
                  key={link.href}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    delay: 0.06 + index * 0.05,
                    duration: 0.3,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                >
                  <Link
                    href={link.href}
                    onClick={() => setOpen(false)}
                    className="flex items-center justify-between rounded-2xl px-4 py-4 text-2xl font-medium text-white/64 transition-colors hover:bg-white/[0.04] hover:text-white"
                  >
                    {link.label}
                  </Link>
                </motion.div>
              ))}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
