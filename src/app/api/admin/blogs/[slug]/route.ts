import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { verifyAdminRequest } from "@/lib/auth/route-admin";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { slugify } from "@/lib/utils";

const payloadSchema = z.object({
  title: z.string().min(1),
  excerpt: z.string().min(1),
  readingTime: z.string().default("5 min"),
  tags: z.array(z.string()).default([]),
  featured: z.boolean().default(false),
  status: z.enum(["draft", "published"]).default("draft"),
  heroImage: z.string().default(""),
  publishedLabel: z.string().min(1),
  contentBlocks: z.array(z.any()).default([]),
});

type AdminSupabaseClient = ReturnType<typeof createSupabaseAdminClient>;

type UploadedAsset = {
  bucket: string;
  path: string;
};

function extractUploadedAsset(url: string, bucket: string): UploadedAsset | null {
  try {
    const parsed = new URL(url);
    const marker = `/storage/v1/object/public/${bucket}/`;
    const index = parsed.pathname.indexOf(marker);
    if (index === -1) return null;

    const path = decodeURIComponent(parsed.pathname.slice(index + marker.length));
    if (!path) return null;

    return { bucket, path };
  } catch {
    return null;
  }
}

function collectUploadedAssetPaths(value: unknown, bucket: string, paths = new Set<string>()) {
  if (typeof value === "string") {
    const asset = extractUploadedAsset(value, bucket);
    if (asset) paths.add(asset.path);
    return paths;
  }

  if (Array.isArray(value)) {
    value.forEach((item) => collectUploadedAssetPaths(item, bucket, paths));
    return paths;
  }

  if (value && typeof value === "object") {
    Object.values(value).forEach((item) => collectUploadedAssetPaths(item, bucket, paths));
  }

  return paths;
}

async function deleteUploadedAssets(
  adminSupabase: AdminSupabaseClient,
  bucket: string,
  paths: Iterable<string>,
) {
  const uniquePaths = [...new Set([...paths].filter(Boolean))];
  if (uniquePaths.length === 0) return;

  const { error } = await adminSupabase.storage.from(bucket).remove(uniquePaths);
  if (error) {
    console.error(`[${bucket}] storage remove failed`, { paths: uniquePaths, error: error.message });
  }
}

async function syncTags(adminSupabase: AdminSupabaseClient, blogId: string, tags: string[]) {
  const normalized = [...new Set(tags.map((tag) => slugify(tag)).filter(Boolean))];
  await adminSupabase.from("blog_tags").delete().eq("blog_id", blogId);

  for (const slug of normalized) {
    const name = slug
      .split("-")
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ");

    const { data: tagRow, error: tagError } = await adminSupabase
      .from("tags")
      .upsert({ slug, name }, { onConflict: "slug" })
      .select("id")
      .single();

    if (tagError) throw tagError;

    const { error: linkError } = await adminSupabase
      .from("blog_tags")
      .insert({ blog_id: blogId, tag_id: tagRow.id });

    if (linkError) throw linkError;
  }
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> },
) {
  const adminCheck = await verifyAdminRequest(request);
  if (!adminCheck.ok) return adminCheck.response;

  const { slug } = await context.params;
  const json = await request.json();
  const parsed = payloadSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { data: existing, error: existingError } = await adminCheck.adminSupabase
    .from("blogs")
    .select("id, cover_image_url, content_blocks")
    .eq("slug", slug)
    .maybeSingle();

  if (existingError || !existing?.id) {
    return NextResponse.json({ error: "blog-not-found" }, { status: 404 });
  }

  const previousPaths = collectUploadedAssetPaths([existing.cover_image_url, existing.content_blocks], "blog-media");
  const nextPaths = collectUploadedAssetPaths([parsed.data.heroImage, parsed.data.contentBlocks], "blog-media");
  const removedPaths = [...previousPaths].filter((path) => !nextPaths.has(path));

  const nextSlug = slugify(parsed.data.title);
  const readingMinutes = parseInt(parsed.data.readingTime, 10) || 5;
  const publishedAt =
    parsed.data.status === "published"
      ? new Date(`1 ${parsed.data.publishedLabel}`).toISOString()
      : null;

  const { error } = await adminCheck.adminSupabase
    .from("blogs")
    .update({
      slug: nextSlug,
      title: parsed.data.title,
      excerpt: parsed.data.excerpt,
      cover_image_url: parsed.data.heroImage,
      content_blocks: parsed.data.contentBlocks,
      featured: parsed.data.featured,
      status: parsed.data.status,
      reading_time_minutes: readingMinutes,
      published_at: publishedAt,
    })
    .eq("id", existing.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await syncTags(adminCheck.adminSupabase, existing.id, parsed.data.tags);
  await deleteUploadedAssets(adminCheck.adminSupabase, "blog-media", removedPaths);

  return NextResponse.json({ ok: true, slug: nextSlug });
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> },
) {
  const adminCheck = await verifyAdminRequest(request);
  if (!adminCheck.ok) return adminCheck.response;

  const { slug } = await context.params;

  const { data: existing, error: existingError } = await adminCheck.adminSupabase
    .from("blogs")
    .select("id, slug, cover_image_url, content_blocks")
    .eq("slug", slug)
    .maybeSingle();

  if (existingError || !existing?.id) {
    return NextResponse.json({ error: "blog-not-found" }, { status: 404 });
  }

  const removedPaths = collectUploadedAssetPaths([existing.cover_image_url, existing.content_blocks], "blog-media");

  const { error } = await adminCheck.adminSupabase
    .from("blogs")
    .delete()
    .eq("id", existing.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await deleteUploadedAssets(adminCheck.adminSupabase, "blog-media", removedPaths);

  return NextResponse.json({ ok: true, slug: existing.slug });
}
