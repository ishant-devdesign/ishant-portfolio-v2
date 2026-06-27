import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseRouteHandlerClient } from "@/lib/supabase/route";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { hasSupabaseEnv } from "@/lib/supabase/env";

const payloadSchema = z.object({
  heroHeading: z.string().min(1),
  heroSubheading: z.string().min(1),
  heroIntro: z.string().min(1),
  roleLabel: z.string().min(1),
  location: z.string().min(1),
  availability: z.string().min(1),
  howText: z.string().min(1),
  spotifyEmbedUrl: z.string().url(),
  spotifyTitle: z.string().min(1).default("Listen with me"),
});

export async function PATCH(request: NextRequest) {
  if (!hasSupabaseEnv()) {
    return NextResponse.json({ error: "missing-env" }, { status: 500 });
  }

  const response = NextResponse.json({ ok: true });
  const supabase = createSupabaseRouteHandlerClient(request, response);
  const adminSupabase = createSupabaseAdminClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }

  const { data: adminMatch } = await adminSupabase
    .from("allowed_admins")
    .select("email")
    .eq("email", user.email.toLowerCase())
    .eq("active", true)
    .maybeSingle();

  if (!adminMatch) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const json = await request.json();
  const parsed = payloadSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 },
    );
  }

  console.info("[supabase:admin-home-hero] Saving hero payload.", parsed.data);

  const { data: existingSettings, error: settingsError } = await adminSupabase
    .from("site_settings")
    .select("id")
    .limit(1)
    .maybeSingle();

  if (settingsError || !existingSettings?.id) {
    return NextResponse.json({ error: "site-settings-missing" }, { status: 500 });
  }

  const { error: updateSettingsError } = await adminSupabase
    .from("site_settings")
    .update({
      hero_heading: parsed.data.heroHeading,
      hero_subheading: parsed.data.heroSubheading,
      hero_intro: parsed.data.heroIntro,
      hero_how_text: parsed.data.howText,
      site_tagline: parsed.data.roleLabel,
      location_label: parsed.data.location,
      availability_label: parsed.data.availability,
      spotify_embed_url: parsed.data.spotifyEmbedUrl,
      spotify_title: parsed.data.spotifyTitle,
    })
    .eq("id", existingSettings.id);

  if (updateSettingsError) {
    return NextResponse.json(
      { error: updateSettingsError.message },
      { status: 500 },
    );
  }

  return response;
}
