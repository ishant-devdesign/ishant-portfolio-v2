import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { verifyAdminRequest } from "@/lib/auth/route-admin";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { slugify } from "@/lib/utils";
import { revalidatePath } from "next/cache";

const payloadSchema = z.object({
  slug: z.string().optional(),
  title: z.string(),
  summary: z.string(),
  sector: z.string(),
  yearLabel: z.string(),
  role: z.string(),
  stack: z.array(z.string()).default([]),
  tags: z.array(z.string()).default([]),
  featured: z.boolean().default(false),
  status: z.enum(["draft", "published"]).default("draft"),
  heroImage: z.string().default(""),
  publishedLabel: z.string(),
  contentBlocks: z.array(z.any()).default([]),
});

type AdminSupabaseClient = ReturnType<typeof createSupabaseAdminClient>;

async function syncTags(
  adminSupabase: AdminSupabaseClient,
  projectId: string,
  tags: string[],
) {
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

  // Parse "DD Mon YYYY" format (e.g., "15 Jan 2025")
  function parsePublishedAt(label: string): string | null {
    if (data.status !== "published" || !label) return null;

    const parts = label.trim().split(/\s+/);
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

  const { data: project, error } = await adminCheck.adminSupabase
    .from("projects")
    .insert({
      slug,
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
      sort_order: 999,
      published_at: publishedAt,
    })
    .select("id, slug")
    .single();

  if (error || !project) {
    return NextResponse.json({ error: error?.message ?? "create-failed" }, { status: 500 });
  }

  await syncTags(adminCheck.adminSupabase, project.id, parsed.data.tags);
  revalidatePath("/sitemap.xml");

  return NextResponse.json({ ok: true, slug: project.slug });
}
