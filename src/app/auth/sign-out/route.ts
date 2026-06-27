import { NextRequest, NextResponse } from "next/server";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { createSupabaseRouteHandlerClient } from "@/lib/supabase/route";

export async function GET(request: NextRequest) {
  const origin = request.nextUrl.origin;
  const response = NextResponse.redirect(
    new URL("/auth?signed-out=true", origin),
  );

  if (!hasSupabaseEnv()) {
    return response;
  }

  const supabase = createSupabaseRouteHandlerClient(request, response);
  await supabase.auth.signOut();

  return response;
}
