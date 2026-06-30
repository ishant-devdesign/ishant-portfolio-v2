import { NextRequest, NextResponse } from "next/server";
import { verifyAdminRequest } from "@/lib/auth/route-admin";
import { slugify } from "@/lib/utils";

const allowedBuckets = new Set([
  "site-assets",
  "project-media",
  "blog-media",
  "certification-badges",
  "pet-media",
  "archive-media",
]);

// Max file size: 50MB (matches Supabase bucket limit)
const MAX_FILE_SIZE = 50 * 1024 * 1024;

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  const adminCheck = await verifyAdminRequest(request);
  if (!adminCheck.ok) return adminCheck.response;

  const formData = await request.formData();
  const file = formData.get("file");
  const bucket = String(formData.get("bucket") ?? "");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "missing-file" }, { status: 400 });
  }

  if (!allowedBuckets.has(bucket)) {
    return NextResponse.json({ error: "invalid-bucket" }, { status: 400 });
  }

  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json(
      { error: "file-too-large", message: "File must be under 50MB" },
      { status: 413 },
    );
  }

  const extension = file.name.includes(".") ? file.name.split(".").pop() : "bin";
  const baseName = slugify(file.name.replace(/\.[^.]+$/, "")) || "asset";
  const path = `${Date.now()}-${baseName}.${extension}`;

  const { error } = await adminCheck.adminSupabase.storage.from(bucket).upload(path, file, {
    upsert: true,
    contentType: file.type || undefined,
  });

  if (error) {
    console.error("[media-upload] server upload failed", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const {
    data: { publicUrl },
  } = adminCheck.adminSupabase.storage.from(bucket).getPublicUrl(path);

  return NextResponse.json({ ok: true, publicUrl, path, bucket });
}
