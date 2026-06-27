"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseEnv, hasSupabaseEnv } from "@/lib/supabase/env";

let browserClient: SupabaseClient | null = null;

export function createSupabaseBrowserClient() {
  if (!hasSupabaseEnv()) {
    throw new Error("Supabase browser client requested before environment variables were configured.");
  }

  if (browserClient) return browserClient;

  const { supabaseUrl, supabaseAnonKey } = getSupabaseEnv();

  browserClient = createBrowserClient(supabaseUrl, supabaseAnonKey);
  return browserClient;
}
