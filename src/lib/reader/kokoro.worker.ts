/// <reference lib="webworker" />
/**
 * Kokoro-82M synthesis worker.
 *
 * Runs model download + inference off the main thread so the UI never janks.
 * Execution-provider fallback chain matters: quantized (q8) weights are NOT
 * supported by the WebGPU execution provider, so:
 *   WebGPU → fp16 (then fp32), WASM → q8.
 */

import { KokoroTTS } from "kokoro-js";

const MODEL_ID = "onnx-community/Kokoro-82M-v1.0-ONNX";

type Generated = {
  audio: Float32Array;
  sampling_rate: number;
  toWav: () => ArrayBuffer;
};

type LoadedModel = {
  generate: (text: string, options: { voice: string }) => Promise<Generated>;
};

type Attempt = {
  device: "webgpu" | "wasm";
  dtype: "fp16" | "fp32" | "q8";
};

const ctx = self as unknown as {
  postMessage: (
    message: unknown,
    options?: { transfer: Transferable[] },
  ) => void;
  onmessage: ((event: MessageEvent) => void) | null;
};

let modelPromise: Promise<LoadedModel> | null = null;
let attemptIndex = 0;

function reportProgress(pct: number) {
  ctx.postMessage({ type: "progress", pct });
}

function buildAttempts(): Attempt[] {
  const hasWebGPU =
    typeof (self as unknown as { navigator?: { gpu?: unknown } }).navigator
      ?.gpu !== "undefined";
  // fp16 on WebGPU is knowingly risky (silent/NaN output on some GPU drivers)
  // and q8 is unsupported by the WebGPU execution provider, so:
  //   WebGPU → fp32, then WASM → q8.
  return [
    ...(hasWebGPU ? ([{ device: "webgpu", dtype: "fp32" }] as Attempt[]) : []),
    { device: "wasm", dtype: "q8" },
  ];
}

const ATTEMPTS = buildAttempts();

/**
 * Guards against degenerate output: some GPU/driver combos run the model to
 * completion but emit silence or NaNs. A valid spoken sample always has a
 * comfortably larger peak amplitude than this threshold.
 */
function isHealthyAudio(samples: Float32Array): boolean {
  let maxAbs = 0;
  const stride = Math.max(1, Math.floor(samples.length / 4096));
  for (let i = 0; i < samples.length; i += stride) {
    const value = samples[i];
    if (Number.isNaN(value) || !Number.isFinite(value)) return false;
    const abs = Math.abs(value);
    if (abs > maxAbs) maxAbs = abs;
  }
  return maxAbs > 1e-3;
}

async function loadModel(): Promise<LoadedModel> {
  const fileProgress = new Map<string, { loaded: number; total: number }>();
  const progress_callback = (progress: {
    status?: string;
    file?: string;
    loaded?: number;
    total?: number;
  }) => {
    if (progress.status !== "progress" || !progress.file) return;
    fileProgress.set(progress.file, {
      loaded: progress.loaded ?? 0,
      total: progress.total ?? 0,
    });
    let loaded = 0;
    let total = 0;
    fileProgress.forEach((f) => {
      loaded += f.loaded;
      total += f.total;
    });
    if (total > 0) {
      reportProgress(Math.min(99, Math.round((loaded / total) * 100)));
    }
  };

  let lastError: unknown = null;
  for (let i = attemptIndex; i < ATTEMPTS.length; i++) {
    attemptIndex = i;
    const attempt = ATTEMPTS[i];
    try {
      const model = (await KokoroTTS.from_pretrained(MODEL_ID, {
        dtype: attempt.dtype,
        device: attempt.device,
        progress_callback,
      })) as unknown as LoadedModel;
      ctx.postMessage({
        type: "ready",
        device: attempt.device,
        dtype: attempt.dtype,
      });
      return model;
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError instanceof Error
    ? lastError
    : new Error("kokoro-model-load-failed");
}

function ensureModel(): Promise<LoadedModel> {
  if (!modelPromise) {
    modelPromise = loadModel();
    modelPromise.catch(() => {
      modelPromise = null;
    });
  }
  return modelPromise;
}

/**
 * Discard the current model and retry with the next backend/weights attempt.
 * Used when generation produced degenerate (silent/NaN) audio.
 */
async function reloadWithNextAttempt(): Promise<void> {
  if (attemptIndex >= ATTEMPTS.length - 1) {
    throw new Error("kokoro-silent-output");
  }
  attemptIndex += 1;
  modelPromise = null;
  await ensureModel();
}

async function generateValidated(
  text: string,
  voice: string,
  retriesLeft: number,
): Promise<Generated> {
  const model = await ensureModel();
  const output = await model.generate(text, { voice });
  if (isHealthyAudio(output.audio)) return output;

  if (retriesLeft > 0) {
    await reloadWithNextAttempt();
    return generateValidated(text, voice, retriesLeft - 1);
  }
  throw new Error("kokoro-produced-silent-audio");
}

ctx.onmessage = async (event: MessageEvent) => {
  const data = event.data as
    | { type: "load" }
    | { type: "generate"; id: number; text: string; voice: string };

  if (data.type === "load") {
    try {
      await ensureModel();
    } catch (error) {
      ctx.postMessage({
        type: "error",
        scope: "load",
        message: error instanceof Error ? error.message : String(error),
      });
    }
    return;
  }

  if (data.type === "generate") {
    const { id, text, voice } = data;
    try {
      const audio = await generateValidated(text, voice, ATTEMPTS.length - 1);
      const wav = audio.toWav();
      ctx.postMessage({ type: "audio", id, wav }, { transfer: [wav] });
    } catch (error) {
      ctx.postMessage({
        type: "error",
        scope: "generate",
        id,
        message: error instanceof Error ? error.message : String(error),
      });
    }
  }
};
