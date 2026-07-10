import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { verifyAdminRequest } from "@/lib/auth/route-admin";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { slugify } from "@/lib/utils";
import { revalidatePath } from "next/cache";

const payloadSchema = z.object({
  slug: z.string().optional(),
  title: z.string(),
  excerpt: z.string(),
  readingTime: z.string().default("5 min"),
  tags: z.array(z.string()).default([]),
  featured: z.boolean().default(false),
  status: z.enum(["draft", "published"]).default("draft"),
  heroImage: z.string().default(""),
  publishedLabel: z.string(),
  contentBlocks: z.array(z.any()).default([]),
});

type AdminSupabaseClient = ReturnType<typeof createSupabaseAdminClient>;

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

export async function POST(request: NextRequest) {
  const adminCheck = await verifyAdminRequest(request);
  if (!adminCheck.ok) return adminCheck.response;

  const json = await request.json();
  const parsed = payloadSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const slug = slugify(parsed.data.slug || parsed.data.title);
  const readingMinutes = parseInt(parsed.data.readingTime, 10) || 5;
  const publishedAt =
    parsed.data.status === "published"
      ? new Date(parsed.data.publishedLabel).toISOString()
      : null;

  const { data: blog, error } = await adminCheck.adminSupabase
    .from("blogs")
    .insert({
      slug,
      title: parsed.data.title,
      excerpt: parsed.data.excerpt,
      cover_image_url: parsed.data.heroImage,
      content_blocks: parsed.data.contentBlocks,
      featured: parsed.data.featured,
      status: parsed.data.status,
      reading_time_minutes: readingMinutes,
      published_at: publishedAt,
    })
    .select("id, slug")
    .single();

  if (error || !blog) {
    return NextResponse.json({ error: error?.message ?? "create-failed" }, { status: 500 });
  }

  await syncTags(adminCheck.adminSupabase, blog.id, parsed.data.tags);

  revalidatePath("/sitemap.xml");

  return NextResponse.json({ ok: true, slug: blog.slug });
}
