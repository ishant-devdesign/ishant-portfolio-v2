import { NextRequest, NextResponse } from "next/server";
import { createSupabaseRouteHandlerClient } from "@/lib/supabase/route";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function GET(request: NextRequest) {
  const origin = request.nextUrl.origin;
  const code = request.nextUrl.searchParams.get("code");
  const next = request.nextUrl.searchParams.get("next") || "/";

  if (!hasSupabaseEnv()) {
    return NextResponse.redirect(new URL("/auth?error=missing-env", origin));
  }

  const response = NextResponse.redirect(new URL(next, origin));
  const supabase = createSupabaseRouteHandlerClient(request, response);

  if (code) {
    console.info("[supabase:auth-callback] Exchanging code for session.");
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      return NextResponse.redirect(new URL(`/auth?error=${encodeURIComponent(error.message)}`, origin));
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user?.email) {
      console.info("[supabase:auth-callback] No user email returned after exchange.");
      return NextResponse.redirect(new URL("/auth?error=no-user", origin));
    }

    const adminSupabase = createSupabaseAdminClient();
    const { data: adminMatch } = await adminSupabase
      .from("allowed_admins")
      .select("email")
      .eq("email", user.email.toLowerCase())
      .eq("active", true)
      .maybeSingle();

    if (!adminMatch) {
      console.info("[supabase:auth-callback] Signed-in email is not in allowed_admins.", {
        email: user.email,
      });
      await supabase.auth.signOut();
      return NextResponse.redirect(new URL("/auth?error=not-authorized", origin));
    }

    console.info("[supabase:auth-callback] Admin email verified.", {
      email: user.email,
    });
  }

  return response;
}
