"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  buildReadingModel,
  type ReadingModel,
} from "@/lib/reader/reading-model";
import {
  clearReaderHighlights,
  setSegmentHighlight,
  setWordHighlight,
  highlightsSupported,
} from "@/lib/reader/highlight";
import {
  loadBrowserVoices,
  sortVoicesByQuality,
  speechSupported,
} from "@/lib/reader/voices";
import {
  getKokoro,
  synthesizeSpeech,
  KOKORO_VOICES,
  type KokoroVoiceId,
} from "@/lib/reader/kokoro";

export type ReaderStatus =
  | "idle"
  | "playing"
  | "paused"
  | "loading-voice"
  | "processing"
  | "error";

export type ReaderEngine = "browser" | "kokoro";

export const READER_RATES = [0.75, 1, 1.25, 1.5, 2] as const;
export const AUTO_VOICE_KEY = "auto";

const WORDS_PER_MINUTE = 165;

/** Segments pre-synthesized before speaking; the rest stream in the background */
const UPFRONT_PROCESS_COUNT = 10;

function isKokoroVoiceKey(key: string): key is KokoroVoiceId {
  return KOKORO_VOICES.some((v) => v.id === key);
}

type Props = {
  containerRef: React.RefObject<HTMLElement | null>;
};

export function useArticleReader({ containerRef }: Props) {
  const [status, setStatus] = useState<ReaderStatus>("idle");
  const [engine, setEngine] = useState<ReaderEngine>("browser");
  const [voiceKey, setVoiceKey] = useState<string>(AUTO_VOICE_KEY);
  const [rate, setRate] = useState<number>(1);
  const [segmentIndex, setSegmentIndex] = useState(0);
  const [segmentCount, setSegmentCount] = useState(0);
  const [totalWords, setTotalWords] = useState(0);
  const [wordsDone, setWordsDone] = useState(0);
  const [modelPct, setModelPct] = useState(0);
  const [notice, setNotice] = useState<string | null>(null);
  const [browserVoices, setBrowserVoices] = useState<SpeechSynthesisVoice[]>(
    [],
  );
  const [currentLabel, setCurrentLabel] = useState("");
  const [processing, setProcessing] = useState<{
    done: number;
    total: number;
  } | null>(null);

  const modelRef = useRef<ReadingModel | null>(null);
  const wordPrefixRef = useRef<number[]>([]);
  const sessionRef = useRef(0);
  const statusRef = useRef<ReaderStatus>("idle");
  const engineRef = useRef<ReaderEngine>("browser");
  const rateRef = useRef(rate);
  const voiceKeyRef = useRef(voiceKey);
  const cursorRef = useRef({ segment: 0, offset: 0 });
  const kokoroReadyRef = useRef(false);
  const voicesRef = useRef<SpeechSynthesisVoice[]>([]);

  // Web Audio playback (AI engine): decoded buffers → source → gain → out.
  // Explicitly state-checked — every failure surfaces as a visible notice.
  const audioCtxRef = useRef<AudioContext | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const activeSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const sourceStartAtRef = useRef(0);
  const sourceOffsetRef = useRef(0);
  const progressTickerRef = useRef<number | null>(null);

  // Caches for the AI engine
  const wavCacheRef = useRef<Map<number, ArrayBuffer>>(new Map());
  const decodedCacheRef = useRef<Map<number, AudioBuffer>>(new Map());
  const inFlightSynthRef = useRef<Map<number, Promise<ArrayBuffer>>>(new Map());

  useEffect(() => {
    statusRef.current = status;
  }, [status]);
  useEffect(() => {
    rateRef.current = rate;
  }, [rate]);
  useEffect(() => {
    voiceKeyRef.current = voiceKey;
  }, [voiceKey]);

  const highlightCapable = highlightsSupported();

  /* ---------------------------------- model --------------------------------- */

  const ensureModel = useCallback((): ReadingModel | null => {
    if (modelRef.current) return modelRef.current;
    const container = containerRef.current;
    if (!container) return null;
    const model = buildReadingModel(container);
    if (model.segments.length === 0) return null;
    modelRef.current = model;
    wordPrefixRef.current = model.segments.reduce<number[]>((acc, seg, i) => {
      acc.push(i === 0 ? 0 : acc[i - 1] + model.segments[i - 1].words.length);
      return acc;
    }, []);
    setSegmentCount(model.segments.length);
    setTotalWords(model.totalWords);
    return model;
  }, [containerRef]);

  /* ------------------------------- voice setup ------------------------------ */

  useEffect(() => {
    let cancelled = false;
    loadBrowserVoices().then((voices) => {
      if (cancelled) return;
      const sorted = sortVoicesByQuality(voices);
      voicesRef.current = sorted;
      setBrowserVoices(sorted);
    });
    const refresh = () => {
      const sorted = sortVoicesByQuality(speechSynthesis.getVoices());
      voicesRef.current = sorted;
      setBrowserVoices(sorted);
    };
    if (speechSupported()) {
      speechSynthesis.addEventListener?.("voiceschanged", refresh);
    }
    return () => {
      cancelled = true;
      if (speechSupported()) {
        speechSynthesis.removeEventListener?.("voiceschanged", refresh);
      }
    };
  }, []);

  const resolveBrowserVoice = useCallback(():
    | SpeechSynthesisVoice
    | undefined => {
    const voices = voicesRef.current;
    if (voices.length === 0) return undefined;
    if (voiceKeyRef.current === AUTO_VOICE_KEY) return voices[0];
    return voices.find((v) => v.voiceURI === voiceKeyRef.current) ?? voices[0];
  }, []);

  /* ------------------------------ audio context ----------------------------- */

  function getAudioContextCtor(): typeof AudioContext | undefined {
    if (typeof window === "undefined") return undefined;
    return (
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext
    );
  }

  /**
   * Creates (if needed) and resumes the AudioContext. Returns false when the
   * browser refuses to run it — callers must surface this to the user instead
   * of playing silently into a suspended context.
   */
  async function ensureAudioContextRunning(): Promise<boolean> {
    if (!audioCtxRef.current) {
      const AC = getAudioContextCtor();
      if (!AC) return false;
      const audioCtx = new AC({ latencyHint: "interactive" });
      const gain = audioCtx.createGain();
      gain.gain.value = 1;
      gain.connect(audioCtx.destination);
      audioCtxRef.current = audioCtx;
      gainNodeRef.current = gain;
    }
    const audioCtx = audioCtxRef.current;
    if (audioCtx.state !== "running") {
      try {
        await audioCtx.resume();
      } catch {
        /* checked via state below */
      }
    }
    return audioCtx.state === "running";
  }

  function teardownAudioContext() {
    const ctx = audioCtxRef.current;
    audioCtxRef.current = null;
    gainNodeRef.current = null;
    ctx?.close().catch(() => undefined);
  }

  /* --------------------------------- kokoro -------------------------------- */

  const loadKokoro = useCallback(async () => {
    if (kokoroReadyRef.current) return;
    setModelPct(0);
    await getKokoro((pct) => setModelPct(pct));
    kokoroReadyRef.current = true;
    setModelPct(100);
  }, []);

  const synthSegment = useCallback(async (index: number) => {
    const cache = wavCacheRef.current;
    const cached = cache.get(index);
    if (cached) return cached;

    const inFlight = inFlightSynthRef.current.get(index);
    if (inFlight) return inFlight;

    const model = modelRef.current;
    if (!model) throw new Error("kokoro-not-ready");

    const promise = synthesizeSpeech(
      model.segments[index].text.trim(),
      voiceKeyRef.current as KokoroVoiceId,
    )
      .then((wav) => {
        cache.set(index, wav);
        return wav;
      })
      .finally(() => {
        inFlightSynthRef.current.delete(index);
      });

    inFlightSynthRef.current.set(index, promise);
    return promise;
  }, []);

  const prefetchSegment = useCallback(
    (index: number) => {
      const model = modelRef.current;
      if (!model || index >= model.segments.length) return;
      synthSegment(index).catch(() => undefined);
    },
    [synthSegment],
  );

  function getDecodedSegment(index: number, wav: ArrayBuffer) {
    const cached = decodedCacheRef.current.get(index);
    if (cached) return Promise.resolve(cached);
    const ctx = audioCtxRef.current;
    if (!ctx) return Promise.reject(new Error("audio-context-missing"));
    // decodeAudioData detaches its input — pass a copy so the cache survives.
    return ctx.decodeAudioData(wav.slice(0)).then((buffer) => {
      decodedCacheRef.current.set(index, buffer);
      return buffer;
    });
  }

  function clearKokoroCaches() {
    wavCacheRef.current.clear();
    decodedCacheRef.current.clear();
    inFlightSynthRef.current.clear();
  }

  const cancelBrowserSpeech = useCallback(() => {
    if (speechSupported()) speechSynthesis.cancel();
  }, []);

  const markWordsDone = useCallback((segIdx: number, wordIdx: number) => {
    const prefix = wordPrefixRef.current[segIdx] ?? 0;
    setWordsDone(prefix + wordIdx);
  }, []);

  function stopProgressTicker() {
    if (progressTickerRef.current !== null) {
      window.clearInterval(progressTickerRef.current);
      progressTickerRef.current = null;
    }
  }

  function stopActiveSource() {
    stopProgressTicker();
    const source = activeSourceRef.current;
    if (!source) return;
    activeSourceRef.current = null;
    source.onended = null;
    try {
      source.stop();
    } catch {
      /* already stopped */
    }
    try {
      source.disconnect();
    } catch {
      /* already disconnected */
    }
  }

  /* ------------------------------ playback core ----------------------------- */

  function playSegment(segIdx: number, offset: number, session: number) {
    const model = modelRef.current;
    if (!model) return;

    if (segIdx >= model.segments.length) {
      cursorRef.current = { segment: 0, offset: 0 };
      setSegmentIndex(0);
      setWordsDone(0);
      setNotice(null);
      clearReaderHighlights();
      setStatus("idle");
      return;
    }

    const segment = model.segments[segIdx];
    cursorRef.current = { segment: segIdx, offset };
    setSegmentIndex(segIdx);
    // Move the bar to the segment start immediately — skip/seek must be
    // reflected now, not when the first word/audio callback eventually fires.
    markWordsDone(segIdx, 0);
    setCurrentLabel(segment.text.trim().slice(0, 64));
    setSegmentHighlight(segment.element);

    // Keep the current paragraph in view while reading
    segment.element.scrollIntoView({ behavior: "smooth", block: "center" });

    if (engineRef.current === "kokoro") {
      setWordHighlight(null);
      void (async () => {
        if (!(await ensureAudioContextRunning())) {
          if (sessionRef.current !== session) return;
          setNotice(
            "Audio output is blocked by the browser — press play again to allow sound.",
          );
          setStatus("paused");
          return;
        }

        let buffer: AudioBuffer;
        try {
          const wav = await synthSegment(segIdx);
          if (sessionRef.current !== session) return;
          buffer = await getDecodedSegment(segIdx, wav);
        } catch (error) {
          if (sessionRef.current !== session) return;
          setNotice(
            error instanceof Error && error.name === "EncodingError"
              ? "This browser cannot decode the generated audio."
              : "The AI voice failed for this section.",
          );
          setStatus("paused");
          return;
        }
        if (sessionRef.current !== session) return;

        const audioCtx = audioCtxRef.current;
        const gain = gainNodeRef.current;
        if (!audioCtx || !gain) return;

        stopActiveSource();

        const source = audioCtx.createBufferSource();
        source.buffer = buffer;
        source.playbackRate.value = rateRef.current;
        source.connect(gain);

        const safeOffset = Math.max(
          0,
          Math.min(offset, buffer.duration - 0.05),
        );
        sourceOffsetRef.current = safeOffset;
        sourceStartAtRef.current = audioCtx.currentTime;
        activeSourceRef.current = source;

        source.onended = () => {
          if (activeSourceRef.current !== source) return; // manual stop/jump
          if (sessionRef.current !== session) return;
          activeSourceRef.current = null;
          const prefix = wordPrefixRef.current[segIdx] ?? 0;
          setWordsDone(prefix + segment.words.length);
          playSegment(segIdx + 1, 0, session);
        };

        source.start(0, safeOffset);

        // No word events exist for AI audio — crawl the bar within the
        // segment by approximating word progress from the audio clock.
        const segmentWords = segment.words.length;
        progressTickerRef.current = window.setInterval(() => {
          const tickerCtx = audioCtxRef.current;
          if (
            !tickerCtx ||
            activeSourceRef.current !== source ||
            sessionRef.current !== session
          ) {
            return;
          }
          const elapsedSeconds =
            (tickerCtx.currentTime - sourceStartAtRef.current) *
            source.playbackRate.value;
          const fraction = Math.min(
            1,
            Math.max(
              0,
              (sourceOffsetRef.current + elapsedSeconds) / buffer.duration,
            ),
          );
          const target =
            (wordPrefixRef.current[segIdx] ?? 0) +
            Math.floor(fraction * segmentWords);
          setWordsDone((previous) => (target > previous ? target : previous));
        }, 250);

        prefetchSegment(segIdx + 1);
      })();
      return;
    }

    // Browser speechSynthesis engine — word-level highlighting via boundary events
    if (!speechSupported()) return;
    const utterance = new SpeechSynthesisUtterance(segment.text.slice(offset));
    const voice = resolveBrowserVoice();
    if (voice) utterance.voice = voice;
    utterance.rate = rateRef.current;
    utterance.pitch = 1;
    utterance.volume = 1;

    utterance.onboundary = (event: SpeechSynthesisEvent) => {
      if (sessionRef.current !== session) return;
      const absoluteIndex = offset + event.charIndex;
      let wordIdx = segment.words.findIndex(
        (w) => absoluteIndex >= w.start && absoluteIndex < w.end,
      );
      if (wordIdx === -1) {
        wordIdx = segment.words.findIndex((w) => absoluteIndex < w.start);
      }
      if (wordIdx === -1) return;
      const word = segment.words[wordIdx];
      cursorRef.current = { segment: segIdx, offset: word.start };
      setWordHighlight(word.range);
      markWordsDone(segIdx, wordIdx);
    };

    utterance.onend = () => {
      if (sessionRef.current !== session) return;
      const prefix = wordPrefixRef.current[segIdx] ?? 0;
      setWordsDone(prefix + segment.words.length);
      playSegment(segIdx + 1, 0, session);
    };

    utterance.onerror = (event: SpeechSynthesisErrorEvent) => {
      if (event.error === "canceled" || event.error === "interrupted") return;
      if (sessionRef.current !== session) return;
      setNotice("Speech playback failed in this browser.");
      setStatus("error");
    };

    speechSynthesis.speak(utterance);
  }

  /* --------------------------------- actions -------------------------------- */

  /**
   * AI engine: pre-synthesize the first `maxCount` segments (with live
   * progress) before speaking. The remainder streams in the background.
   */
  async function processArticle(
    session: number,
    maxCount: number,
  ): Promise<boolean> {
    const model = modelRef.current;
    if (!model) return false;

    const target = Math.min(maxCount, model.segments.length);
    let done = 0;
    for (let i = 0; i < target; i++) {
      if (wavCacheRef.current.has(i)) done++;
    }
    setProcessing({ done, total: target });

    for (let i = 0; i < target; i++) {
      if (sessionRef.current !== session) {
        setProcessing(null);
        return false;
      }
      if (!wavCacheRef.current.has(i)) {
        try {
          await synthSegment(i);
        } catch {
          setProcessing(null);
          setNotice("The AI voice failed while processing the article.");
          setStatus("error");
          return false;
        }
        done++;
        setProcessing({ done, total: target });
      }
    }

    setProcessing(null);
    return sessionRef.current === session;
  }

  /** Synthesize everything not yet cached, silently, in the background. */
  async function processRemainingInBackground(
    session: number,
    fromIndex: number,
  ) {
    const model = modelRef.current;
    if (!model) return;
    for (let i = fromIndex; i < model.segments.length; i++) {
      if (sessionRef.current !== session) return;
      await synthSegment(i).catch(() => undefined);
    }
  }

  function start() {
    const model = ensureModel();
    if (!model) {
      setNotice("Nothing readable found on this page.");
      return;
    }
    setNotice(null);
    setWordHighlight(null);

    // Warm the AudioContext while the click gesture is still fresh.
    if (engineRef.current === "kokoro") void ensureAudioContextRunning();

    const begin = async () => {
      if (engineRef.current === "kokoro" && !kokoroReadyRef.current) {
        setStatus("loading-voice");
        try {
          await loadKokoro();
        } catch {
          setNotice("AI voice unavailable — using the browser voice instead.");
          engineRef.current = "browser";
          setEngine("browser");
          setVoiceKey(AUTO_VOICE_KEY);
          voiceKeyRef.current = AUTO_VOICE_KEY;
        }
      }

      const session = ++sessionRef.current;
      cursorRef.current = { segment: 0, offset: 0 };
      setWordsDone(0);

      if (engineRef.current === "kokoro") {
        setStatus("processing");
        const ok = await processArticle(session, UPFRONT_PROCESS_COUNT);
        if (!ok) return;
      }

      setStatus("playing");
      playSegment(0, 0, session);

      if (engineRef.current === "kokoro") {
        void processRemainingInBackground(session, UPFRONT_PROCESS_COUNT);
      }
    };
    void begin();
  }

  function pause() {
    if (engineRef.current === "kokoro") {
      // Persist the exact playback position (seconds into the segment)
      const ctx = audioCtxRef.current;
      const source = activeSourceRef.current;
      if (ctx && source) {
        const elapsed = ctx.currentTime - sourceStartAtRef.current;
        cursorRef.current = {
          segment: cursorRef.current.segment,
          offset: sourceOffsetRef.current + elapsed * source.playbackRate.value,
        };
      }
      stopActiveSource();
    } else {
      sessionRef.current += 1; // invalidate in-flight callbacks
      cancelBrowserSpeech();
    }
    setStatus("paused");
  }

  function resume() {
    const session = ++sessionRef.current;
    setStatus("playing");
    playSegment(cursorRef.current.segment, cursorRef.current.offset, session);
  }

  function toggle() {
    if (statusRef.current === "playing") {
      pause();
    } else if (statusRef.current === "paused") {
      resume();
    } else if (
      statusRef.current === "processing" ||
      statusRef.current === "loading-voice"
    ) {
      stop();
    } else if (statusRef.current === "idle" || statusRef.current === "error") {
      start();
    }
  }

  function stop() {
    sessionRef.current += 1;
    cancelBrowserSpeech();
    stopActiveSource();
    clearKokoroCaches();
    clearReaderHighlights();
    cursorRef.current = { segment: 0, offset: 0 };
    setSegmentIndex(0);
    setWordsDone(0);
    setCurrentLabel("");
    setNotice(null);
    setProcessing(null);
    setStatus("idle");
  }

  function jumpToSegment(index: number) {
    const model = modelRef.current;
    if (!model) return;
    const clamped = Math.max(0, Math.min(index, model.segments.length - 1));
    sessionRef.current += 1;
    cancelBrowserSpeech();
    stopActiveSource();
    const session = ++sessionRef.current;
    setStatus("playing");
    playSegment(clamped, 0, session);
  }

  function next() {
    jumpToSegment(cursorRef.current.segment + 1);
  }

  function prev() {
    jumpToSegment(cursorRef.current.segment - 1);
  }

  function seekToPercent(pct: number) {
    const model = modelRef.current;
    if (!model) return;
    jumpToSegment(Math.floor(pct * model.segments.length));
  }

  function cycleRate() {
    const currentIdx = READER_RATES.findIndex((r) => r === rateRef.current);
    const nextRate = READER_RATES[(currentIdx + 1) % READER_RATES.length];
    setRate(nextRate);
    rateRef.current = nextRate;

    if (statusRef.current !== "playing") return;
    if (engineRef.current === "kokoro") {
      const source = activeSourceRef.current;
      const ctx = audioCtxRef.current;
      if (source && ctx) {
        // Keep position accounting correct, then change the rate live
        const elapsed = ctx.currentTime - sourceStartAtRef.current;
        sourceOffsetRef.current += elapsed * source.playbackRate.value;
        sourceStartAtRef.current = ctx.currentTime;
        source.playbackRate.setTargetAtTime(nextRate, ctx.currentTime, 0.02);
      }
    } else {
      // speechSynthesis has no live rate change; restart at the cursor
      const { segment, offset } = cursorRef.current;
      cancelBrowserSpeech();
      const session = ++sessionRef.current;
      playSegment(segment, offset, session);
    }
  }

  function selectVoice(key: string) {
    const nextEngine: ReaderEngine = isKokoroVoiceKey(key)
      ? "kokoro"
      : "browser";
    const engineChanged = nextEngine !== engineRef.current;

    voiceKeyRef.current = key;
    engineRef.current = nextEngine;
    setVoiceKey(key);
    setEngine(nextEngine);

    if (engineChanged || statusRef.current !== "idle") {
      clearKokoroCaches();
    }

    if (statusRef.current !== "playing" && statusRef.current !== "paused") {
      return;
    }

    // Restart at the cursor with the new voice
    sessionRef.current += 1;
    cancelBrowserSpeech();
    stopActiveSource();
    const { segment, offset } = cursorRef.current;
    const session = ++sessionRef.current;

    if (nextEngine === "kokoro") {
      void ensureAudioContextRunning();
      const restartKokoro = async () => {
        if (!kokoroReadyRef.current) {
          setStatus("loading-voice");
          try {
            await loadKokoro();
          } catch {
            if (sessionRef.current !== session) return;
            setNotice(
              "AI voice unavailable — using the browser voice instead.",
            );
            engineRef.current = "browser";
            voiceKeyRef.current = AUTO_VOICE_KEY;
            setEngine("browser");
            setVoiceKey(AUTO_VOICE_KEY);
            setStatus("playing");
            playSegment(segment, offset, session);
            return;
          }
        }
        if (sessionRef.current !== session) return;
        setStatus("processing");
        const ok = await processArticle(
          session,
          segment + UPFRONT_PROCESS_COUNT,
        );
        if (!ok) return;
        setStatus("playing");
        playSegment(segment, offset, session);
        void processRemainingInBackground(
          session,
          segment + UPFRONT_PROCESS_COUNT,
        );
      };
      void restartKokoro();
      return;
    }
    setStatus("playing");
    playSegment(segment, offset, session);
  }

  /* ------------------------------- lifecycle -------------------------------- */

  useEffect(() => {
    return () => {
      sessionRef.current += 1;
      if (speechSupported()) speechSynthesis.cancel();
      stopActiveSource();
      teardownAudioContext();
      clearReaderHighlights();
    };
  }, []);

  // Pre-build the reading model shortly after mount so the duration estimate
  // is visible before the first play click.
  useEffect(() => {
    const timer = window.setTimeout(() => ensureModel(), 500);
    return () => window.clearTimeout(timer);
  }, [ensureModel]);

  /* --------------------------------- derived -------------------------------- */

  const progress = totalWords > 0 ? Math.min(1, wordsDone / totalWords) : 0;
  const minutesLeft =
    totalWords > 0
      ? Math.max(
          0,
          Math.ceil((totalWords - wordsDone) / (WORDS_PER_MINUTE * rate)),
        )
      : 0;
  const totalMinutes =
    totalWords > 0 ? Math.max(1, Math.round(totalWords / WORDS_PER_MINUTE)) : 0;

  return {
    status,
    engine,
    voiceKey,
    rate,
    processing,
    segmentIndex,
    segmentCount,
    progress,
    minutesLeft,
    totalMinutes,
    totalWords,
    modelPct,
    notice,
    currentLabel,
    browserVoices,
    speechAvailable: speechSupported(),
    highlightCapable,
    playing: status === "playing",
    sessionActive: status !== "idle",
    toggle,
    stop,
    next,
    prev,
    seekToPercent,
    cycleRate,
    selectVoice,
  };
}

export type ArticleReader = ReturnType<typeof useArticleReader>;
