"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle } from "lucide-react";
import { buttonClasses } from "./button";

type ConfirmOptions = {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
};

type ConfirmDialogContextValue = {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
};

const ConfirmDialogContext = createContext<ConfirmDialogContextValue | null>(
  null,
);

export function useConfirm() {
  const context = useContext(ConfirmDialogContext);
  if (!context) {
    throw new Error("useConfirm must be used within a ConfirmDialogProvider");
  }
  return context.confirm;
}

export function ConfirmDialogProvider({ children }: { children: ReactNode }) {
  const [options, setOptions] = useState<ConfirmOptions | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [resolve, setResolve] = useState<(value: boolean) => void>();

  const confirm = useCallback((options: ConfirmOptions) => {
    setOptions(options);
    setIsOpen(true);
    return new Promise<boolean>((res) => {
      setResolve(() => res);
    });
  }, []);

  const handleConfirm = useCallback(() => {
    setIsOpen(false);
    resolve?.(true);
  }, [resolve]);

  const handleCancel = useCallback(() => {
    setIsOpen(false);
    resolve?.(false);
  }, [resolve]);

  // Handle escape key
  useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        handleCancel();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, handleCancel]);

  return (
    <ConfirmDialogContext.Provider value={{ confirm }}>
      {children}
      {typeof document !== "undefined" &&
        createPortal(
          <AnimatePresence>
            {isOpen && options && (
              <div className="fixed inset-0 z-[100] flex items-center justify-center">
                {/* Backdrop */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                  onClick={handleCancel}
                />

                {/* Dialog */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 10 }}
                  transition={{ duration: 0.15 }}
                  className="relative z-[1] mx-4 w-full max-w-md rounded-[1.8rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.045),rgba(255,255,255,0.02))] bg-neutral-950 p-6"
                >
                  <div>
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-rose-300/15 bg-rose-300/10 text-rose-300">
                      <AlertTriangle className="size-5" />
                    </div>
                    <h3 className="mt-4 text-lg font-medium text-white">
                      {options.title}
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-white/64">
                      {options.message}
                    </p>
                  </div>

                  <div className="mt-6 flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={handleCancel}
                      className={buttonClasses({ tone: "muted", size: "sm" })}
                    >
                      {options.cancelLabel ?? "Cancel"}
                    </button>
                    <button
                      type="button"
                      onClick={handleConfirm}
                      className={buttonClasses({ tone: "danger", size: "sm" })}
                    >
                      {options.confirmLabel ?? "Delete"}
                    </button>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>,
          document.body,
        )}
    </ConfirmDialogContext.Provider>
  );
}
