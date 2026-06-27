import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { verifyAdminRequest } from "@/lib/auth/route-admin";

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

  const issueDate = parsed.data.issueYear ? `${parsed.data.issueYear}-01-01` : null;

  const { data: updated, error: updateError } = await adminCheck.adminSupabase
    .from("certifications")
    .update({
      title: parsed.data.title,
      issuer: parsed.data.issuer,
      issue_date: issueDate,
      note: parsed.data.note,
      credential_url: parsed.data.credentialUrl || null,
    })
    .eq("slug", slug)
    .select("slug, title, issuer, issue_date, note, credential_url")
    .maybeSingle();

  if (updateError || !updated) {
    return NextResponse.json({ error: updateError?.message ?? "certification-not-found" }, { status: updateError ? 500 : 404 });
  }

  return NextResponse.json({
    ok: true,
    certification: {
      slug: updated.slug,
      title: updated.title,
      issuer: updated.issuer,
      issueDate: updated.issue_date ? String(updated.issue_date).slice(0, 4) : "—",
      note: updated.note ?? "",
      credentialUrl: updated.credential_url ?? undefined,
    },
  });
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> },
) {
  const adminCheck = await verifyAdminRequest(request);
  if (!adminCheck.ok) return adminCheck.response;

  const { slug } = await context.params;

  const { data: existingCertification, error: lookupError } = await adminCheck.adminSupabase
    .from("certifications")
    .select("id, slug")
    .eq("slug", slug)
    .maybeSingle();

  if (lookupError || !existingCertification?.id) {
    return NextResponse.json({ error: "certification-not-found" }, { status: 404 });
  }

  const { error: deleteError } = await adminCheck.adminSupabase
    .from("certifications")
    .delete()
    .eq("id", existingCertification.id);

  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, slug: existingCertification.slug });
}
