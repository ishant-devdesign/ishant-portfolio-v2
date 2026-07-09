import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { verifyAdminRequest } from "@/lib/auth/route-admin";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { slugify } from "@/lib/utils";
import { revalidatePath } from "next/cache";

const payloadSchema = z.object({
  title: z.string().min(1),
  summary: z.string().min(1),
  sector: z.string().min(1),
  yearLabel: z.string().min(1),
  role: z.string().min(1),
  stack: z.array(z.string()).default([]),
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

async function syncTags(adminSupabase: AdminSupabaseClient, projectId: string, tags: string[]) {
  const normalized = [...new Set(tags.map((tag) => slugify(tag)).filter(Boolean))];
  await adminSupabase.from("project_tags").delete().eq("project_id", projectId);

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
      .from("project_tags")
      .insert({ project_id: projectId, tag_id: tagRow.id });

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
    .from("projects")
    .select("id, hero_image_url, content_blocks")
    .eq("slug", slug)
    .maybeSingle();

  if (existingError || !existing?.id) {
    return NextResponse.json({ error: "project-not-found" }, { status: 404 });
  }

  const previousPaths = collectUploadedAssetPaths([existing.hero_image_url, existing.content_blocks], "project-media");
  const nextPaths = collectUploadedAssetPaths([parsed.data.heroImage, parsed.data.contentBlocks], "project-media");
  const removedPaths = [...previousPaths].filter((path) => !nextPaths.has(path));

  const nextSlug = slugify(parsed.data.title);
  const publishedAt =
    parsed.data.status === "published"
      ? new Date(parsed.data.publishedLabel).toISOString()
      : null;

  const { error } = await adminCheck.adminSupabase
    .from("projects")
    .update({
      slug: nextSlug,
      title: parsed.data.title,
      summary: parsed.data.summary,
      sector: parsed.data.sector,
      year_label: parsed.data.yearLabel,
      role: parsed.data.role,
      stack_text: parsed.data.stack.join(", "),
      hero_image_url: parsed.data.heroImage,
      featured: parsed.data.featured,
      status: parsed.data.status,
      content_blocks: parsed.data.contentBlocks,
      published_at: publishedAt,
    })
    .eq("id", existing.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await syncTags(adminCheck.adminSupabase, existing.id, parsed.data.tags);
  await deleteUploadedAssets(adminCheck.adminSupabase, "project-media", removedPaths);
  revalidatePath("/sitemap.xml");

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
    .from("projects")
    .select("id, slug, hero_image_url, content_blocks")
    .eq("slug", slug)
    .maybeSingle();

  if (existingError || !existing?.id) {
    return NextResponse.json({ error: "project-not-found" }, { status: 404 });
  }

  const removedPaths = collectUploadedAssetPaths([existing.hero_image_url, existing.content_blocks], "project-media");

  const { error } = await adminCheck.adminSupabase
    .from("projects")
    .delete()
    .eq("id", existing.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await deleteUploadedAssets(adminCheck.adminSupabase, "project-media", removedPaths);
  revalidatePath("/sitemap.xml");

  return NextResponse.json({ ok: true, slug: existing.slug });
}
