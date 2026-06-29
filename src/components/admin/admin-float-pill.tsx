"use client";

import Link from "next/link";
import { animate, motion, useMotionValue, AnimatePresence } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { Eye, EyeOff, Grip, Settings2, ShieldCheck, CheckCircle2 } from "lucide-react";
import { useAdminSession } from "@/components/admin/admin-session-provider";
import { buttonClasses } from "@/components/ui/button";

export function AdminFloatPill() {
  const { isAllowedAdmin, user, viewMode, toggleViewMode } = useAdminSession();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const x = useMotionValue(24);
  const y = useMotionValue(24);
  const [showStatus, setShowStatus] = useState(true);

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;

    const rect = element.getBoundingClientRect();
    x.set(24);
    y.set(Math.max(24, window.innerHeight - rect.height - 24));
  }, [x, y]);

  // Auto-hide status after 5 seconds
  useEffect(() => {
    if (isAllowedAdmin && user?.email) {
      const timer = setTimeout(() => setShowStatus(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [isAllowedAdmin, user?.email]);

  if (!isAllowedAdmin || !user?.email) return null;

  return (
    <motion.div
      ref={containerRef}
      drag
      dragMomentum={false}
      dragElastic={0.04}
      data-cursor-no-snap="true"
      style={{ x, y }}
      onDragEnd={() => {
        const rect = containerRef.current?.getBoundingClientRect();
        if (!rect) return;

        const margin = 24;
        const targets = [
          { x: margin, y: margin },
          { x: window.innerWidth - rect.width - margin, y: margin },
          { x: margin, y: window.innerHeight - rect.height - margin },
          {
            x: window.innerWidth - rect.width - margin,
            y: window.innerHeight - rect.height - margin,
          },
        ];

        const nearest = targets
          .map((target) => ({
            ...target,
            distance: Math.hypot(rect.left - target.x, rect.top - target.y),
          }))
          .sort((a, b) => a.distance - b.distance)[0];

        animate(x, nearest.x, { type: "spring", stiffness: 420, damping: 36 });
        animate(y, nearest.y, { type: "spring", stiffness: 420, damping: 36 });
      }}
      data-cursor="Move panel"
      data-cursor-position="top"
      className="fixed left-0 top-0 z-[120] w-[340px]"
      initial={{ opacity: 0, scale: 0.98, filter: "blur(12px)" }}
      animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="overflow-hidden rounded-[1.6rem] border border-white/10 bg-[#0a0a0a]/92 p-3 backdrop-blur-xl shadow-[0_14px_40px_rgba(0,0,0,0.35)]">
        <div className="flex items-center justify-between gap-3 rounded-[1.1rem] border border-white/8 bg-white/[0.03] px-3 py-2">
          <div className="flex min-w-0 items-center gap-3">
            <Grip
              className="size-4 shrink-0 text-white/26"
              data-cursor="Move panel"
              data-cursor-position="top"
            />
            <div className="min-w-0">
              <p className="text-[0.58rem] uppercase tracking-[0.3em] text-white/34">
                Admin panel
              </p>
              <p className="truncate text-sm text-white/78">{user.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-emerald-300/85">
            <ShieldCheck className="size-4" />
          </div>
        </div>

        <AnimatePresence>
          {showStatus && (
            <motion.div
              initial={{ opacity: 0, height: 0, marginTop: 0 }}
              animate={{ opacity: 1, height: "auto", marginTop: 12 }}
              exit={{ opacity: 0, height: 0, marginTop: 0 }}
              transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
              className="overflow-hidden rounded-[1rem] border border-emerald-400/18 bg-emerald-500/8 px-3 py-2.5"
            >
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="size-4 text-emerald-300/90" />
                <p className="text-xs text-emerald-200/88">
                  Signed in successfully. Admin access is active.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="mt-3 grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={toggleViewMode}
            className={buttonClasses({ tone: "ghost", size: "sm" })}
            data-cursor={viewMode === "admin" ? "Switch public" : "Switch admin"}
            data-cursor-position="top"
          >
            {viewMode === "admin" ? (
              <>
                <EyeOff className="size-4" />
                Public
              </>
            ) : (
              <>
                <Eye className="size-4" />
                Admin
              </>
            )}
          </button>

          <Link
            href="/auth"
            className={buttonClasses({ tone: "muted", size: "sm" })}
            data-cursor="Open auth"
            data-cursor-position="top"
          >
            <Settings2 className="size-4" />
            Auth
          </Link>

          <button
            type="button"
            onClick={() => {
              window.location.assign("/auth/sign-out");
            }}
            className={buttonClasses({ tone: "muted", size: "sm" })}
            data-cursor="Sign out"
            data-cursor-position="top"
          >
            Logout
          </button>
        </div>
      </div>
    </motion.div>
  );
}
