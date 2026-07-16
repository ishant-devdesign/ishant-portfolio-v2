"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

type CustomVideoPlayerProps = {
  src: string;
  className?: string;
  autoPlay?: boolean;
  onEnded?: () => void;
  controls?: boolean;
};

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

/** Shared glass pill chrome — cursor-none so only the custom cursor shows */
const pillClass = cn(
  "relative flex items-center cursor-none",
  "rounded-full border border-white/10",
  "bg-black/55 text-white",
  "shadow-[0_8px_28px_rgba(0,0,0,0.4)]",
  "backdrop-blur-xl backdrop-saturate-150",
  "transition-colors",
);

function getFullscreenElement(): Element | null {
  const doc = document as Document & {
    webkitFullscreenElement?: Element | null;
    mozFullScreenElement?: Element | null;
    msFullscreenElement?: Element | null;
  };
  return (
    doc.fullscreenElement ??
    doc.webkitFullscreenElement ??
    doc.mozFullScreenElement ??
    doc.msFullscreenElement ??
    null
  );
}

async function requestElementFullscreen(el: HTMLElement) {
  const anyEl = el as HTMLElement & {
    webkitRequestFullscreen?: () => void | Promise<void>;
    mozRequestFullScreen?: () => void | Promise<void>;
    msRequestFullscreen?: () => void | Promise<void>;
  };

  if (el.requestFullscreen) {
    await el.requestFullscreen();
  } else if (anyEl.webkitRequestFullscreen) {
    await anyEl.webkitRequestFullscreen();
  } else if (anyEl.mozRequestFullScreen) {
    await anyEl.mozRequestFullScreen();
  } else if (anyEl.msRequestFullscreen) {
    await anyEl.msRequestFullscreen();
  }
}

async function exitDocumentFullscreen() {
  const doc = document as Document & {
    webkitExitFullscreen?: () => void | Promise<void>;
    mozCancelFullScreen?: () => void | Promise<void>;
    msExitFullscreen?: () => void | Promise<void>;
  };

  if (document.exitFullscreen) {
    await document.exitFullscreen();
  } else if (doc.webkitExitFullscreen) {
    await doc.webkitExitFullscreen();
  } else if (doc.mozCancelFullScreen) {
    await doc.mozCancelFullScreen();
  } else if (doc.msExitFullscreen) {
    await doc.msExitFullscreen();
  }
}

export function CustomVideoPlayer({
  src,
  className,
  autoPlay = false,
  onEnded,
  controls = true,
}: CustomVideoPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [showControls, setShowControls] = useState(true);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [hoverVolume, setHoverVolume] = useState(false);
  const [isScrubbing, setIsScrubbing] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const updateTime = () => {
      if (!isScrubbing) setCurrentTime(video.currentTime);
    };
    const updateDuration = () => setDuration(video.duration || 0);
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    video.addEventListener("timeupdate", updateTime);
    video.addEventListener("loadedmetadata", updateDuration);
    video.addEventListener("durationchange", updateDuration);
    video.addEventListener("play", handlePlay);
    video.addEventListener("pause", handlePause);

    return () => {
      video.removeEventListener("timeupdate", updateTime);
      video.removeEventListener("loadedmetadata", updateDuration);
      video.removeEventListener("durationchange", updateDuration);
      video.removeEventListener("play", handlePlay);
      video.removeEventListener("pause", handlePause);
    };
  }, [isScrubbing]);

  useEffect(() => {
    const onFullscreenChange = () => {
      const active = getFullscreenElement() === containerRef.current;
      setIsFullscreen(active);
    };

    document.addEventListener("fullscreenchange", onFullscreenChange);
    document.addEventListener("webkitfullscreenchange", onFullscreenChange);
    document.addEventListener("mozfullscreenchange", onFullscreenChange);
    document.addEventListener("MSFullscreenChange", onFullscreenChange);

    return () => {
      document.removeEventListener("fullscreenchange", onFullscreenChange);
      document.removeEventListener(
        "webkitfullscreenchange",
        onFullscreenChange,
      );
      document.removeEventListener("mozfullscreenchange", onFullscreenChange);
      document.removeEventListener("MSFullscreenChange", onFullscreenChange);
    };
  }, []);

  const scheduleHide = useCallback(() => {
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    hideTimerRef.current = setTimeout(() => {
      if (isPlaying && !hoverVolume && !isScrubbing) {
        setShowControls(false);
      }
    }, 2500);
  }, [isPlaying, hoverVolume, isScrubbing]);

  const revealControls = useCallback(() => {
    setShowControls(true);
    scheduleHide();
  }, [scheduleHide]);

  useEffect(() => {
    if (isPlaying) scheduleHide();
    else {
      setShowControls(true);
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    }
    return () => {
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    };
  }, [isPlaying, scheduleHide]);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      void video.play();
    } else {
      video.pause();
    }
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;

    const next = !isMuted;
    video.muted = next;
    setIsMuted(next);
  };

  const changeVolume = (newVolume: number) => {
    const video = videoRef.current;
    if (!video) return;

    const clamped = Math.max(0, Math.min(1, newVolume));
    video.volume = clamped;
    setVolume(clamped);

    if (clamped > 0 && isMuted) {
      video.muted = false;
      setIsMuted(false);
    }
    if (clamped === 0) {
      video.muted = true;
      setIsMuted(true);
    }
  };

  const toggleFullscreen = async () => {
    const container = containerRef.current;
    if (!container) return;

    try {
      if (getFullscreenElement() === container) {
        await exitDocumentFullscreen();
      } else {
        await requestElementFullscreen(container);
      }
    } catch {
      // User denied
    }
  };

  const seek = (time: number) => {
    const video = videoRef.current;
    if (!video || !Number.isFinite(duration) || duration <= 0) return;
    const clamped = Math.max(0, Math.min(duration, time));
    video.currentTime = clamped;
    setCurrentTime(clamped);
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;
  const displayVolume = isMuted ? 0 : volume;

  return (
    <div
      ref={containerRef}
      className={cn(
        "group relative min-h-[12rem] w-full min-w-[20rem] overflow-hidden rounded-[1.6rem] bg-black/20 cursor-none sm:min-h-[16rem] sm:min-w-[28rem]",
        isFullscreen &&
          "flex h-screen w-screen min-h-screen items-center justify-center overflow-visible rounded-none bg-black",
        className,
      )}
      onMouseEnter={revealControls}
      onMouseMove={revealControls}
      onMouseLeave={() => {
        setHoverVolume(false);
        if (isPlaying) setShowControls(false);
      }}
    >
      <video
        ref={videoRef}
        src={src}
        muted={isMuted}
        autoPlay={autoPlay}
        playsInline
        className={cn(
          "block h-auto min-h-[12rem] w-full object-cover sm:min-h-[16rem]",
          isFullscreen && "h-full min-h-0 max-h-screen w-full object-contain",
        )}
        onEnded={onEnded}
        onClick={togglePlay}
      />

      <AnimatePresence>
        {!isPlaying && (
          <motion.div
            className="pointer-events-none absolute inset-0 flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <button
              type="button"
              onClick={togglePlay}
              className="pointer-events-auto flex h-16 w-16 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white shadow-lg backdrop-blur-xl"
            >
              <Play className="size-7 fill-white text-white" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {controls && (
        <AnimatePresence>
          {showControls && (
            <motion.div
              className="absolute inset-x-0 bottom-0 z-10 flex w-full min-w-0 items-center gap-2.5 p-3 sm:gap-3 sm:p-4"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
            >
              <button
                type="button"
                onClick={togglePlay}
                aria-label={isPlaying ? "Pause" : "Play"}
                className={cn(
                  pillClass,
                  "h-11 w-11 shrink-0 justify-center p-0 sm:h-12 sm:w-12",
                )}
              >
                {isPlaying ? (
                  <Pause className="size-5 fill-white text-white sm:size-[1.35rem]" />
                ) : (
                  <Play className="size-5 fill-white text-white sm:size-[1.35rem]" />
                )}
              </button>

              <div
                data-cursor
                className={cn(pillClass, "h-11 shrink-0 px-3 sm:h-12")}
                onMouseEnter={() => setHoverVolume(true)}
                onMouseLeave={() => setHoverVolume(false)}
              >
                <div
                  role="button"
                  tabIndex={0}
                  aria-label={isMuted || volume === 0 ? "Unmute" : "Mute"}
                  onClick={toggleMute}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      toggleMute();
                    }
                  }}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white outline-none transition-colors sm:h-9 sm:w-9"
                >
                  {isMuted || volume === 0 ? (
                    <VolumeX className="size-5 text-white sm:size-[1.35rem]" />
                  ) : (
                    <Volume2 className="size-5 text-white sm:size-[1.35rem]" />
                  )}
                </div>

                <AnimatePresence initial={false}>
                  {hoverVolume && (
                    <motion.div
                      className="relative mx-3 h-1.5 cursor-none"
                      initial={{ width: 0, opacity: 0 }}
                      animate={{ width: 80, opacity: 1 }}
                      exit={{ width: 0, opacity: 0 }}
                      transition={{ duration: 0.18 }}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        const sliderEl = e.currentTarget;
                        const updateVol = (clientX: number) => {
                          const rect = sliderEl.getBoundingClientRect();
                          const percent = Math.max(
                            0,
                            Math.min(1, (clientX - rect.left) / rect.width),
                          );
                          changeVolume(percent);
                        };
                        const handleMove = (moveEvent: MouseEvent) =>
                          updateVol(moveEvent.clientX);
                        const handleUp = () => {
                          document.removeEventListener("mousemove", handleMove);
                          document.removeEventListener("mouseup", handleUp);
                        };
                        updateVol(e.clientX);
                        document.addEventListener("mousemove", handleMove);
                        document.addEventListener("mouseup", handleUp);
                      }}
                    >
                      <div className="absolute inset-x-0 top-1/2 h-1.5 -translate-y-1/2 overflow-hidden rounded-full bg-white/25">
                        <div
                          className="h-full rounded-full bg-white"
                          style={{ width: `${displayVolume * 100}%` }}
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div
                data-cursor
                className={cn(
                  pillClass,
                  "h-11 min-w-[10rem] flex-1 basis-0 px-3.5 sm:h-12 sm:min-w-[14rem] sm:px-4",
                )}
              >
                <div
                  className="relative mx-2 h-6 min-w-[4rem] flex-1 cursor-none touch-none sm:mx-3 sm:min-w-[6rem]"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    const timelineEl = e.currentTarget;
                    setIsScrubbing(true);

                    const handleMove = (clientX: number) => {
                      const rect = timelineEl.getBoundingClientRect();
                      const percent = Math.max(
                        0,
                        Math.min(1, (clientX - rect.left) / rect.width),
                      );
                      seek(percent * duration);
                    };

                    const onMove = (moveEvent: MouseEvent) =>
                      handleMove(moveEvent.clientX);
                    const onUp = () => {
                      setIsScrubbing(false);
                      document.removeEventListener("mousemove", onMove);
                      document.removeEventListener("mouseup", onUp);
                      scheduleHide();
                    };

                    handleMove(e.clientX);
                    document.addEventListener("mousemove", onMove);
                    document.addEventListener("mouseup", onUp);
                  }}
                  onTouchStart={(e) => {
                    const timelineEl = e.currentTarget;
                    setIsScrubbing(true);
                    const touch = e.touches[0];
                    const handleMove = (clientX: number) => {
                      const rect = timelineEl.getBoundingClientRect();
                      const percent = Math.max(
                        0,
                        Math.min(1, (clientX - rect.left) / rect.width),
                      );
                      seek(percent * duration);
                    };
                    handleMove(touch.clientX);

                    const onMove = (ev: TouchEvent) => {
                      if (ev.touches[0]) handleMove(ev.touches[0].clientX);
                    };
                    const onUp = () => {
                      setIsScrubbing(false);
                      document.removeEventListener("touchmove", onMove);
                      document.removeEventListener("touchend", onUp);
                      scheduleHide();
                    };
                    document.addEventListener("touchmove", onMove, {
                      passive: true,
                    });
                    document.addEventListener("touchend", onUp);
                  }}
                >
                  <div className="absolute inset-x-0 top-1/2 h-1.5 -translate-y-1/2 overflow-hidden rounded-full bg-white/25">
                    <div
                      className="h-full rounded-full bg-white"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>

                <div className="ml-1 shrink-0 select-none whitespace-nowrap font-medium tabular-nums text-xs tracking-tight sm:ml-1.5 sm:text-[0.8125rem]">
                  <span className="text-white">{formatTime(currentTime)}</span>
                  <span className="text-white/45"> / </span>
                  <span className="text-white/70">{formatTime(duration)}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={toggleFullscreen}
                aria-label={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
                className={cn(
                  pillClass,
                  "h-11 w-11 shrink-0 justify-center p-0 sm:h-12 sm:w-12",
                )}
              >
                {isFullscreen ? (
                  <Minimize2
                    className="size-4 text-white sm:size-[1.15rem]"
                    strokeWidth={2.25}
                  />
                ) : (
                  <Maximize2
                    className="size-4 text-white sm:size-[1.15rem]"
                    strokeWidth={2.25}
                  />
                )}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </div>
  );
}
