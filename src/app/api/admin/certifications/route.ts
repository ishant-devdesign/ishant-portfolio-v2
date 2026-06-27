import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { verifyAdminRequest } from "@/lib/auth/route-admin";
import { slugify } from "@/lib/utils";

const payloadSchema = z.object({
  title: z.string().min(1),
  issuer: z.string().min(1),
  issueYear: z
    .string()
    .trim()
    .regex(/^\d{4}$/)
    .optional()
    .or(z.literal("")),
  note: z.string().min(1),
  credentialUrl: z.string().url().optional().or(z.literal("")),
});

export async function POST(request: NextRequest) {
  const adminCheck = await verifyAdminRequest(request);
  if (!adminCheck.ok) return adminCheck.response;

  const json = await request.json();
  const parsed = payloadSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const baseSlug = slugify(parsed.data.title) || "certification";
  const { data: slugMatches, error: slugError } = await adminCheck.adminSupabase
    .from("certifications")
    .select("slug")
    .like("slug", `${baseSlug}%`);

  if (slugError) {
    return NextResponse.json({ error: slugError.message }, { status: 500 });
  }

  const takenSlugs = new Set((slugMatches ?? []).map((item) => item.slug));
  let slug = baseSlug;
  let counter = 2;
  while (takenSlugs.has(slug)) {
    slug = `${baseSlug}-${counter}`;
    counter += 1;
  }

  const { data: lastCertification } = await adminCheck.adminSupabase
    .from("certifications")
    .select("sort_order")
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  const issueDate = parsed.data.issueYear ? `${parsed.data.issueYear}-01-01` : null;

  const { data: inserted, error: insertError } = await adminCheck.adminSupabase
    .from("certifications")
    .insert({
      slug,
      title: parsed.data.title,
      issuer: parsed.data.issuer,
      issue_date: issueDate,
      note: parsed.data.note,
      credential_url: parsed.data.credentialUrl || null,
      visible: true,
      featured: false,
      sort_order: (lastCertification?.sort_order ?? 0) + 1,
    })
    .select("slug, title, issuer, issue_date, note, credential_url")
    .single();

  if (insertError || !inserted) {
    return NextResponse.json({ error: insertError?.message ?? "insert-failed" }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    certification: {
      slug: inserted.slug,
      title: inserted.title,
      issuer: inserted.issuer,
      issueDate: inserted.issue_date ? String(inserted.issue_date).slice(0, 4) : "—",
      note: inserted.note ?? "",
      credentialUrl: inserted.credential_url ?? undefined,
    },
  });
}
