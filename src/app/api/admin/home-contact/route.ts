import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { verifyAdminRequest } from "@/lib/auth/route-admin";

const payloadSchema = z.object({
  cta: z.string().default(""),
  phone: z.string().default(""),
  email: z.string().default(""),
  whatsappUrl: z.string().default(""),
  gmailComposeUrl: z.string().default(""),
  resumeUrl: z.string().default(""),
  linkedinUrl: z.string().default(""),
  githubUrl: z.string().default(""),
  twitterUrl: z.string().default(""),
  instagramUrl: z.string().default(""),
  dribbbleUrl: z.string().default(""),
  behanceUrl: z.string().default(""),
});

export async function PATCH(request: NextRequest) {
  const adminCheck = await verifyAdminRequest(request);
  if (!adminCheck.ok) return adminCheck.response;

  const json = await request.json();
  const parsed = payloadSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid-contact-payload", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { data: existingSettings, error: settingsError } =
    await adminCheck.adminSupabase
      .from("site_settings")
      .select("id")
      .limit(1)
      .maybeSingle();

  if (settingsError || !existingSettings?.id) {
    return NextResponse.json(
      { error: "site-settings-missing" },
      { status: 500 },
    );
  }

  const { error: updateError } = await adminCheck.adminSupabase
    .from("site_settings")
    .update({
      contact_cta_text: parsed.data.cta,
      contact_phone: parsed.data.phone,
      contact_email: parsed.data.email,
      contact_whatsapp_url: parsed.data.whatsappUrl,
      contact_gmail_url: parsed.data.gmailComposeUrl,
      resume_external_url: parsed.data.resumeUrl,
      linkedin_url: parsed.data.linkedinUrl,
      github_url: parsed.data.githubUrl,
      twitter_url: parsed.data.twitterUrl,
      instagram_url: parsed.data.instagramUrl,
      dribbble_url: parsed.data.dribbbleUrl,
      behance_url: parsed.data.behanceUrl,
    })
    .eq("id", existingSettings.id);

  if (updateError) {
    const message = updateError.message.includes("contact_cta_text")
      ? "contact-schema-outdated-run-add-contact-editing-sql"
      : updateError.message;

    return NextResponse.json({ error: message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
