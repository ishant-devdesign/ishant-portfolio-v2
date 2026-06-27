import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { AdminContext } from "@/lib/auth/types";

export async function getAdminContext(): Promise<AdminContext> {
  const supabase = await createSupabaseServerClient();
  console.info("[supabase:auth] Resolving admin context.");

  if (!supabase) {
    console.info("[supabase:auth] No server client available for admin context.");
    return {
      user: null,
      isAllowedAdmin: false,
      authEnabled: false,
    };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    console.info("[supabase:auth] No signed-in user found.");
    return {
      user: null,
      isAllowedAdmin: false,
      authEnabled: true,
    };
  }

  const adminSupabase = createSupabaseAdminClient();
  const { data: adminMatch } = await adminSupabase
    .from("allowed_admins")
    .select("email, active")
    .eq("email", user.email.toLowerCase())
    .eq("active", true)
    .maybeSingle();

  console.info("[supabase:auth] Admin context resolved.", {
    email: user.email,
    isAllowedAdmin: Boolean(adminMatch),
  });

  return {
    user: {
      id: user.id,
      email: user.email,
    },
    isAllowedAdmin: Boolean(adminMatch),
    authEnabled: true,
  };
}
