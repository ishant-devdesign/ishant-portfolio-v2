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

  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const data = parsed.data;

  const slug = slugify(data.slug || data.title);
  const readingMinutes = parseInt(data.readingTime, 10) || 5;

  // Parse "DD Mon YYYY" format (e.g., "10 Jul 2026") or single-part day format
  function parsePublishedAt(label: string): string | null {
    if (data.status !== "published" || !label) return null;

    const parts = label.trim().split(/\s+/);

    // Handle single-part format (e.g., just "10")
    if (parts.length === 1) {
      const day = parseInt(parts[0], 10);
      if (!isNaN(day)) {
        const today = new Date();
        return new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), day, 12, 0, 0)).toISOString();
      }
      return null;
    }

    if (parts.length !== 3) return null;

    const day = parseInt(parts[0], 10);
    const monthName = parts[1];
    const year = parseInt(parts[2], 10);

    if (isNaN(day) || isNaN(year)) return null;

    const monthIndex = months.indexOf(monthName);
    if (monthIndex === -1) return null;

    // Create date at noon UTC to avoid timezone issues
    const date = new Date(Date.UTC(year, monthIndex, day, 12, 0, 0));
    if (isNaN(date.getTime())) return null;

    return date.toISOString();
  }

  const publishedAt = parsePublishedAt(data.publishedLabel);

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
