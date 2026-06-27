import { type NextRequest, NextResponse } from "next/server";
import { createSupabaseRouteHandlerClient } from "@/lib/supabase/route";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function verifyAdminRequest(request: NextRequest) {
  const response = NextResponse.next();
  const supabase = createSupabaseRouteHandlerClient(request, response);
  const adminSupabase = createSupabaseAdminClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    return {
      ok: false as const,
      response: NextResponse.json({ error: "unauthenticated" }, { status: 401 }),
      user: null,
      adminSupabase,
    };
  }

  const { data: adminMatch } = await adminSupabase
    .from("allowed_admins")
    .select("email")
    .eq("email", user.email.toLowerCase())
    .eq("active", true)
    .maybeSingle();

  if (!adminMatch) {
    return {
      ok: false as const,
      response: NextResponse.json({ error: "forbidden" }, { status: 403 }),
      user,
      adminSupabase,
    };
  }

  return {
    ok: true as const,
    response,
    user,
    adminSupabase,
  };
}
