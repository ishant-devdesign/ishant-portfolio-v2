"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  AudioLines,
  Loader2,
  Pause,
  Play,
  SkipBack,
  SkipForward,
  Sparkles,
  X,
} from "lucide-react";
import { AUTO_VOICE_KEY, useArticleReader } from "@/hooks/use-article-reader";
import { KOKORO_VOICES } from "@/lib/reader/kokoro";
import { DropdownSelect } from "@/components/ui/dropdown-select";
import { buttonClasses } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** Glass pill chrome shared with the custom video player */
const pillClass = cn(
  "relative flex items-center",
  "rounded-full border border-white/10",
  "bg-black/55 text-white",
  "shadow-[0_8px_28px_rgba(0,0,0,0.4)]",
  "backdrop-blur-xl backdrop-saturate-150",
  "transition-colors",
);

export function ArticleReader({
  containerRef,
}: {
  containerRef: React.RefObject<HTMLElement | null>;
}) {
  const reader = useArticleReader({ containerRef });
  const progressTrackRef = useRef<HTMLDivElement>(null);
  const [aiNoticeOpen, setAiNoticeOpen] = useState(false);
  const aiNoticeSeenRef = useRef(false);

  useEffect(() => {
    if (!aiNoticeOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setAiNoticeOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [aiNoticeOpen]);

  const {
    status,
    engine,
    voiceKey,
    rate,
    processing,
    progress,
    minutesLeft,
    totalMinutes,
    modelPct,
    notice,
    browserVoices,
    speechAvailable,
    playing,
    sessionActive,
    toggle,
    stop,
    next,
    prev,
    seekToPercent,
    cycleRate,
    selectVoice,
    currentLabel,
  } = reader;

  const busy = status === "loading-voice" || status === "processing";

  /** First AI-voice pick per visit → explain the processing lag up front */
  const handleVoiceChange = (value: string) => {
    if (
      KOKORO_VOICES.some((voice) => voice.id === value) &&
      !aiNoticeSeenRef.current
    ) {
      aiNoticeSeenRef.current = true;
      setAiNoticeOpen(true);
    }
    selectVoice(value);
  };

  const voiceOptions = useMemo(() => {
    const options = [
      { value: AUTO_VOICE_KEY, label: "Auto — best browser voice" },
    ];
    for (const voice of KOKORO_VOICES) {
      options.push({ value: voice.id, label: `✨ ${voice.label}` });
    }
    if (speechAvailable) {
      for (const voice of browserVoices) {
        options.push({ value: voice.voiceURI, label: voice.name });
      }
    }
    return options;
  }, [browserVoices, speechAvailable]);

  const statusLabel = (() => {
    if (notice) return notice;
    if (status === "loading-voice") {
      return modelPct > 0
        ? `Preparing AI voice… ${modelPct}%`
        : "Preparing AI voice…";
    }
    if (status === "processing" && processing) {
      return `Processing article… ${processing.done}/${processing.total}`;
    }
    if (status === "playing") {
      return minutesLeft > 0
        ? `Reading · ~${minutesLeft} min left`
        : "Reading…";
    }
    if (status === "paused") return "Paused";
    if (status === "error") return "Playback failed";
    return totalMinutes > 0 ? `≈ ${totalMinutes} min listen` : "Listen";
  })();

  /**
   * Scrubbing mirrors the custom video player (mousedown + drag). Unlike
   * video.currentTime, a TTS seek is expensive, so the fill previews the
   * drag position locally and the seek only commits on release.
   */
  const [scrubPct, setScrubPct] = useState<number | null>(null);

  const pctFromClientX = (clientX: number) => {
    const track = progressTrackRef.current;
    if (!track) return 0;
    const rect = track.getBoundingClientRect();
    return Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
  };

  const beginScrub = (clientX: number) => {
    if (!sessionActive || busy) return;
    setScrubPct(pctFromClientX(clientX));
    const onMove = (moveEvent: MouseEvent) =>
      setScrubPct(pctFromClientX(moveEvent.clientX));
    const onUp = (upEvent: MouseEvent) => {
      seekToPercent(pctFromClientX(upEvent.clientX));
      setScrubPct(null);
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
    };
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  };

  const beginTouchScrub = (event: React.TouchEvent) => {
    if (!sessionActive || busy) return;
    const touch = event.touches[0];
    if (!touch) return;
    setScrubPct(pctFromClientX(touch.clientX));
    const onMove = (moveEvent: TouchEvent) => {
      const t = moveEvent.touches[0];
      if (t) setScrubPct(pctFromClientX(t.clientX));
    };
    const onUp = (upEvent: TouchEvent) => {
      const t = upEvent.changedTouches[0];
      if (t) seekToPercent(pctFromClientX(t.clientX));
      setScrubPct(null);
      document.removeEventListener("touchmove", onMove);
      document.removeEventListener("touchend", onUp);
      document.removeEventListener("touchcancel", onUp);
    };
    document.addEventListener("touchmove", onMove, { passive: true });
    document.addEventListener("touchend", onUp);
    document.addEventListener("touchcancel", onUp);
  };

  const displayProgress = scrubPct ?? progress;

  /* ------------------------------ control pills ----------------------------- */

  const playPill = (
    <button
      type="button"
      onClick={toggle}
      aria-label={busy ? "Cancel" : playing ? "Pause reading" : "Play article"}
      data-cursor={busy ? "Cancel" : playing ? "Pause" : "Listen"}
      className={cn(
        pillClass,
        "h-11 w-11 shrink-0 justify-center p-0 sm:h-12 sm:w-12",
      )}
    >
      {busy ? (
        <Loader2 className="size-5 animate-spin text-white sm:size-[1.35rem]" />
      ) : playing ? (
        <Pause className="size-5 fill-white text-white sm:size-[1.35rem]" />
      ) : (
        <Play className="size-5 fill-white text-white sm:size-[1.35rem]" />
      )}
    </button>
  );

  const speedPill = (
    <button
      type="button"
      onClick={cycleRate}
      aria-label="Playback speed"
      title="Playback speed"
      className={cn(
        pillClass,
        "h-11 shrink-0 justify-center px-3 text-xs font-medium tabular-nums text-white/80 hover:text-white sm:h-12 sm:text-[0.8125rem]",
      )}
    >
      {rate}×
    </button>
  );

  const voicePill = (
    <div
      className={cn(
        pillClass,
        "h-11 w-44 shrink-0 sm:h-12 sm:w-56",
        busy && "pointer-events-none opacity-50",
      )}
      data-cursor
    >
      <DropdownSelect
        value={voiceKey}
        options={voiceOptions}
        onChange={handleVoiceChange}
        className="h-full w-full [&>button]:h-full [&>button]:rounded-full [&>button]:border-transparent [&>button]:bg-transparent [&>button]:px-3.5 [&>button]:py-0 [&>button]:text-[11px] [&>button]:text-white/80 sm:[&>button]:text-xs [&>button_span]:truncate"
      />
    </div>
  );

  const aiBadgePill =
    engine === "kokoro" && sessionActive ? (
      <div
        className={cn(
          pillClass,
          "h-11 shrink-0 items-center gap-1.5 border-amber-200/20 bg-amber-200/10 px-3 sm:h-12",
        )}
      >
        <Sparkles className="size-3.5 text-amber-100" />
        <span className="text-[11px] font-medium text-amber-100">AI</span>
      </div>
    ) : null;

  /* --------------------------- progress/track pill --------------------------- */

  const progressPill = (
    <div
      data-cursor
      className={cn(
        pillClass,
        "h-11 min-w-0 flex-1 basis-0 px-3.5 sm:h-12 sm:px-4",
      )}
    >
      <div
        ref={progressTrackRef}
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(displayProgress * 100)}
        title={sessionActive && currentLabel ? currentLabel : undefined}
        className="group relative h-6 min-w-[3rem] flex-1 cursor-none touch-none"
        onMouseDown={(event) => {
          event.preventDefault();
          beginScrub(event.clientX);
        }}
        onTouchStart={beginTouchScrub}
      >
        <div className="absolute inset-x-0 top-1/2 h-1.5 -translate-y-1/2 overflow-hidden rounded-full bg-white/25">
          <div
            className={cn(
              "h-full rounded-full bg-white",
              scrubPct === null && "transition-[width] duration-200",
            )}
            style={{ width: `${Math.round(displayProgress * 100)}%` }}
          />
        </div>
      </div>
      <div className="ml-2 hidden min-w-0 shrink-0 select-none whitespace-nowrap text-[11px] sm:block">
        <span
          className={cn(
            "tabular-nums",
            notice ? "text-amber-200/80" : "text-white/70",
          )}
        >
          {statusLabel}
        </span>
      </div>
    </div>
  );

  // The dock is the full command bar: visible the moment a session starts
  // (loading/processing/playing/paused), not only after scrolling past.
  const showDock = sessionActive;

  return (
    <>
      {/* ------------------------------- Inline bar ------------------------------ */}
      <div className="flex max-w-3xl flex-wrap items-center gap-2">
        {playPill}

        <div className={cn(pillClass, "h-11 min-w-0 px-3.5 sm:h-12")}>
          <AudioLines className="size-4 shrink-0 text-white/40" />
          <div className="ml-2 min-w-0">
            <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-white/40">
              Listen
            </p>
            <p
              className={cn(
                "max-w-[10rem] truncate text-[10px] sm:max-w-[13rem] sm:text-[11px]",
                notice ? "text-amber-200/80" : "text-white/40",
              )}
            >
              {busy && processing && status === "processing"
                ? `Processing article… ${processing.done}/${processing.total}`
                : statusLabel}
            </p>
          </div>
        </div>

        {voicePill}
        {speedPill}
        {aiBadgePill}
      </div>

      {/* ------------------------------ Floating dock ----------------------------- */}
      <AnimatePresence>
        {showDock ? (
          <motion.div
            key="article-reader-dock"
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.96 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="fixed bottom-5 left-4 right-24 z-[240] flex items-center gap-2 sm:left-1/2 sm:right-auto sm:w-[min(94vw,46rem)] sm:-translate-x-1/2"
          >
            {playPill}

            <div className={cn(pillClass, "h-11 shrink-0 px-1 sm:h-12")}>
              <button
                type="button"
                onClick={prev}
                disabled={busy}
                aria-label="Previous section"
                title="Previous section"
                className="flex h-8 w-8 items-center justify-center rounded-full text-white/70 transition-colors hover:bg-white/10 hover:text-white disabled:opacity-40 sm:h-9 sm:w-9"
              >
                <SkipBack className="size-4" />
              </button>
              <button
                type="button"
                onClick={next}
                disabled={busy}
                aria-label="Next section"
                title="Next section"
                className="flex h-8 w-8 items-center justify-center rounded-full text-white/70 transition-colors hover:bg-white/10 hover:text-white disabled:opacity-40 sm:h-9 sm:w-9"
              >
                <SkipForward className="size-4" />
              </button>
            </div>

            {progressPill}

            <div className="hidden sm:contents">
              {aiBadgePill}
              {speedPill}
            </div>

            <button
              type="button"
              onClick={stop}
              aria-label="Stop and close reader"
              title="Stop"
              className={cn(
                pillClass,
                "h-11 w-11 shrink-0 justify-center p-0 text-white/70 hover:text-white sm:h-12 sm:w-12",
              )}
            >
              <X className="size-4.5" />
            </button>
          </motion.div>
        ) : null}
      </AnimatePresence>

      {/* ----------------------- AI voice processing notice ---------------------- */}
      {typeof document !== "undefined" &&
        createPortal(
          <AnimatePresence>
            {aiNoticeOpen ? (
              <div className="fixed inset-0 z-[260] flex items-center justify-center">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                  onClick={() => setAiNoticeOpen(false)}
                />
                <motion.div
                  role="dialog"
                  aria-modal="true"
                  aria-label="About AI voice processing"
                  initial={{ opacity: 0, scale: 0.95, y: -10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 10 }}
                  transition={{ duration: 0.15 }}
                  className="relative z-[1] mx-4 w-full max-w-md rounded-[1.8rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.045),rgba(255,255,255,0.02))] bg-neutral-950 p-6"
                >
                  <div>
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-amber-200/15 bg-amber-200/10 text-amber-100">
                      <Sparkles className="size-5" />
                    </div>
                    <h3 className="mt-4 text-lg font-medium text-white">
                      AI voice runs on your device
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-white/64">
                      This voice is generated entirely in your browser — the
                      first run downloads the model (cached afterwards), and
                      while sections are being processed the tab can lag or feel
                      heavy. That&apos;s normal: reading starts as soon as the
                      first few sections are ready, and the rest keep processing
                      in the background.
                    </p>
                  </div>

                  <div className="mt-6 flex justify-end">
                    <button
                      type="button"
                      onClick={() => setAiNoticeOpen(false)}
                      className={buttonClasses({
                        tone: "inverted",
                        size: "sm",
                      })}
                    >
                      Got it
                    </button>
                  </div>
                </motion.div>
              </div>
            ) : null}
          </AnimatePresence>,
          document.body,
        )}
    </>
  );
}
