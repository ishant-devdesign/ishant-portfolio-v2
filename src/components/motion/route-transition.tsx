"use client";

import { AnimatePresence, motion } from "framer-motion";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

function formatPathname(pathname: string) {
  if (pathname === "/") return "Home";
  const cleaned = pathname
    .split("/")
    .filter(Boolean)
    .slice(-1)[0]
    ?.replace(/[-_]/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());

  return cleaned || "Page";
}

function normalizeHref(href: string) {
  try {
    const url = new URL(href, window.location.origin);
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return href;
  }
}

export function RouteTransition() {
  const pathname = usePathname();
  const router = useRouter();
  const mountedRef = useRef(false);
  const pendingHrefRef = useRef<string | null>(null);
  const pushTimeoutRef = useRef<number | null>(null);
  const [visible, setVisible] = useState(false);
  const [label, setLabel] = useState(formatPathname(pathname));

  useEffect(() => {
    return () => {
      if (pushTimeoutRef.current) {
        window.clearTimeout(pushTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!mountedRef.current) {
      mountedRef.current = true;
      return;
    }

    if (pendingHrefRef.current) {
      pendingHrefRef.current = null;
      setVisible(false);
      return;
    }

    setLabel(formatPathname(pathname));
  }, [pathname]);

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented) return;
      if (event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey)
        return;

      const target = event.target as HTMLElement | null;
      const anchor = target?.closest("a") as HTMLAnchorElement | null;
      if (!anchor) return;
      if (anchor.target === "_blank" || anchor.hasAttribute("download")) return;
      if (anchor.origin !== window.location.origin) return;

      const href = normalizeHref(anchor.href);
      const current = `${window.location.pathname}${window.location.search}${window.location.hash}`;
      if (!href || href === current || href.startsWith("#")) return;
      if (href.includes("#") && href.split("#")[0] === window.location.pathname)
        return;

      event.preventDefault();
      pendingHrefRef.current = href;
      setLabel(formatPathname(new URL(anchor.href).pathname));
      setVisible(true);

      if (pushTimeoutRef.current) {
        window.clearTimeout(pushTimeoutRef.current);
      }

      pushTimeoutRef.current = window.setTimeout(() => {
        router.push(href);
      }, 220);
    };

    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [router]);

  return (
    <AnimatePresence>
      {visible ? (
        <motion.div
          key={`route-transition-${label}`}
          data-cursor-hide="true"
          className="pointer-events-auto fixed inset-0 z-[350] flex items-center justify-center overflow-hidden bg-[#050505] backdrop-blur-2xl"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
        >
          <motion.div
            className="relative px-8 text-center"
            initial={{ opacity: 0, y: 16, filter: "blur(14px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: -10, filter: "blur(12px)" }}
            transition={{ duration: 0.34, ease: [0.22, 1, 0.36, 1] }}
          >
            <p className="text-[0.66rem] uppercase tracking-[0.42em] text-white/36">
              entering
            </p>
            <h2 className="mt-4 text-4xl tracking-[-0.06em] text-white sm:text-6xl">
              {label}
            </h2>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
