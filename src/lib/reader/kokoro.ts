/**
 * Kokoro-82M — open-source AI TTS running fully in the reader's browser.
 *
 * This module is a thin client around a dedicated Web Worker
 * (kokoro.worker.ts): the ~80MB model download, ONNX session setup, and all
 * inference happen off the main thread so the page never janks.
 *
 * Weight/device pairing is handled inside the worker:
 *   WebGPU → fp16 (fallback fp32), WASM → q8.
 * (q8 quantized models are unsupported by the WebGPU execution provider.)
 */

export const KOKORO_VOICES = [
  { id: "af_heart", label: "Ember — warm female" },
  { id: "af_bella", label: "Bella — bright female" },
  { id: "am_michael", label: "Michael — calm male" },
  { id: "am_adam", label: "Adam — deep male" },
] as const;

export type KokoroVoiceId = (typeof KOKORO_VOICES)[number]["id"];

export type KokoroReadyInfo = { device: string; dtype: string };

type WorkerReply =
  | { type: "progress"; pct: number }
  | { type: "ready"; device: string; dtype: string }
  | { type: "error"; scope: "load" | "generate"; id?: number; message: string }
  | { type: "audio"; id: number; wav: ArrayBuffer };

let worker: Worker | null = null;
let readyInfo: KokoroReadyInfo | null = null;
let readyPromise: Promise<KokoroReadyInfo> | null = null;
let readyResolve: ((info: KokoroReadyInfo) => void) | null = null;
let readyReject: ((error: Error) => void) | null = null;
let progressHandler: ((pct: number) => void) | null = null;
let nextRequestId = 1;

const pendingGenerations = new Map<
  number,
  { resolve: (wav: ArrayBuffer) => void; reject: (error: Error) => void }
>();

function getWorker(): Worker {
  if (!worker) {
    worker = new Worker(new URL("./kokoro.worker.ts", import.meta.url), {
      type: "module",
    });

    worker.onmessage = (event: MessageEvent<WorkerReply>) => {
      const data = event.data;

      if (data.type === "progress") {
        progressHandler?.(data.pct);
        return;
      }
      if (data.type === "ready") {
        readyInfo = { device: data.device, dtype: data.dtype };
        readyPromise = null;
        readyResolve?.(readyInfo);
        readyResolve = null;
        readyReject = null;
        return;
      }
      if (data.type === "audio") {
        pendingGenerations.get(data.id)?.resolve(data.wav);
        pendingGenerations.delete(data.id);
        return;
      }
      if (data.type === "error") {
        const error = new Error(data.message);
        if (data.scope === "load") {
          readyPromise = null;
          readyReject?.(error);
          readyResolve = null;
          readyReject = null;
        }
        if (typeof data.id === "number") {
          pendingGenerations.get(data.id)?.reject(error);
          pendingGenerations.delete(data.id);
        }
      }
    };

    worker.onerror = (event) => {
      const error = new Error(event.message || "kokoro-worker-error");
      readyPromise = null;
      readyReject?.(error);
      readyResolve = null;
      readyReject = null;
      pendingGenerations.forEach(({ reject }) => reject(error));
      pendingGenerations.clear();
    };
  }
  return worker;
}

export function getKokoroBackendInfo(): KokoroReadyInfo | null {
  return readyInfo;
}

export async function getKokoro(
  onProgress?: (pct: number) => void,
): Promise<KokoroReadyInfo> {
  if (readyInfo) return readyInfo;
  if (onProgress) progressHandler = onProgress;
  if (!readyPromise) {
    readyPromise = new Promise<KokoroReadyInfo>((resolve, reject) => {
      readyResolve = resolve;
      readyReject = reject;
    });
    getWorker().postMessage({ type: "load" });
  }
  return readyPromise;
}

export async function synthesizeSpeech(
  text: string,
  voice: KokoroVoiceId,
): Promise<ArrayBuffer> {
  await getKokoro();

  const id = nextRequestId++;
  return new Promise<ArrayBuffer>((resolve, reject) => {
    pendingGenerations.set(id, { resolve, reject });
    getWorker().postMessage({ type: "generate", id, text, voice });
  });
}
