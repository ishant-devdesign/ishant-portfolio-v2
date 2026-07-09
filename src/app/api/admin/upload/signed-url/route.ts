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

// Signed URL uploads bypass Vercel's body size limit entirely
// Supabase has a 50MB limit
const MAX_FILE_SIZE = 50 * 1024 * 1024;

export async function POST(request: NextRequest) {
  const adminCheck = await verifyAdminRequest(request);
  if (!adminCheck.ok) return adminCheck.response;

  const body = (await request.json()) as {
    fileName: string;
    contentType: string;
    bucket: string;
    size: number;
    fileHash?: string; // Optional SHA-256 hash for duplicate detection
  };

  const { fileName, bucket, size, fileHash } = body;

  if (!allowedBuckets.has(bucket)) {
    return NextResponse.json({ error: "invalid-bucket" }, { status: 400 });
  }

  // Check for duplicate in archive_items (for archive-media bucket)
  if (fileHash && bucket === "archive-media") {
    const { data: existing } = await adminCheck.adminSupabase
      .from("archive_items")
      .select("media_url")
      .eq("file_hash", fileHash)
      .maybeSingle();

    if (existing?.media_url) {
      return NextResponse.json({
        ok: true,
        duplicate: true,
        publicUrl: existing.media_url,
      });
    }
  }

  if (size > MAX_FILE_SIZE) {
    return NextResponse.json(
      { error: "file-too-large", message: "File must be under 50MB" },
      { status: 413 },
    );
  }

  const extension = fileName.includes(".") ? fileName.split(".").pop() : "bin";
  const baseName = slugify(fileName.replace(/\.[^.]+$/, "")) || "asset";
  const path = `${Date.now()}-${baseName}.${extension}`;

  const { data, error } = await adminCheck.adminSupabase.storage
    .from(bucket)
    .createSignedUploadUrl(path);

  if (error) {
    console.error("[signed-upload] failed to create signed URL", {
      message: error.message,
      bucket,
      path,
      size,
    });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Return the public URL that will be used after upload
  const { data: urlData } = adminCheck.adminSupabase.storage.from(bucket).getPublicUrl(path);

  return NextResponse.json({
    ok: true,
    signedUrl: data.signedUrl,
    publicUrl: urlData.publicUrl,
    path,
    bucket,
  });
}