"use client";

import { useState } from "react";
import { ImagePlus, Link2, Upload } from "lucide-react";
import { cn } from "@/lib/utils";
import { buttonClasses } from "@/components/ui/button";

type MediaAssetFieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  bucket: string;
  accept: string;
  className?: string;
};

export function MediaAssetField({
  label,
  value,
  onChange,
  bucket,
  accept,
  className,
}: MediaAssetFieldProps) {
  const [mode, setMode] = useState<"url" | "upload">("url");
  const [status, setStatus] = useState<string>("");

  async function handleFile(file: File | null) {
    if (!file) return;

    const MAX_CLIENT_FILE_SIZE = 4.4 * 1024 * 1024; // Vercel default body limit is ~4.5MB
    if (file.size > MAX_CLIENT_FILE_SIZE) {
      setStatus(`File too large (Vercel upload limit: 4.5MB)`);
      return;
    }

    setStatus("Uploading…");

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("bucket", bucket);

      const response = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
      });

      let data: { error?: string; publicUrl?: string } | null = null;
      try {
        data = await response.json();
      } catch {
        // Response was not JSON (likely HTML error from Vercel)
        data = { error: `Upload failed (status ${response.status})` };
      }
      if (!response.ok) {
        throw new Error(data?.error ?? "upload-failed");
      }

      onChange(data?.publicUrl || "");
      setStatus("Uploaded");
      window.setTimeout(() => setStatus(""), 1200);
    } catch (error) {
      console.error("[media-upload] upload failed", error);
      setStatus("Upload failed");
    }
  }

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center justify-between gap-3">
        <p className="text-[0.58rem] uppercase tracking-[0.28em] text-white/28">{label}</p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setMode("url")}
            className={cn(
              buttonClasses({
                tone: mode === "url" ? "selected" : "muted",
                size: "xs",
              }),
            )}
          >
            <Link2 className="size-3.5" />
            URL
          </button>
          <button
            type="button"
            onClick={() => setMode("upload")}
            className={cn(
              buttonClasses({
                tone: mode === "upload" ? "selected" : "muted",
                size: "xs",
              }),
            )}
          >
            <Upload className="size-3.5" />
            Upload
          </button>
        </div>
      </div>

      {mode === "url" ? (
        <input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="https://…"
          className="w-full rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2 text-sm text-white outline-none"
        />
      ) : (
        <label className="flex cursor-pointer items-center justify-center gap-3 rounded-[1.2rem] border border-dashed border-white/12 bg-white/[0.02] px-4 py-6 text-sm text-white/68">
          <ImagePlus className="size-4" />
          <span>Choose file</span>
          <input
            type="file"
            accept={accept}
            className="hidden"
            onChange={(event) => void handleFile(event.target.files?.[0] ?? null)}
          />
        </label>
      )}

      {value ? <p className="break-all text-xs text-white/36">{value}</p> : null}
      {status ? <p className="text-xs text-white/52">{status}</p> : null}
    </div>
  );
}
