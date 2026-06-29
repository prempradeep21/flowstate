import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import WebSocket from "ws";
import type { Database } from "@/lib/supabase/database.types";

export function isServiceRoleConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.SUPABASE_SERVICE_ROLE_KEY,
  );
}

export function createServiceRoleClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY",
    );
  }

  const options: Parameters<typeof createSupabaseClient<Database>>[2] = {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    realtime: { transport: WebSocket },
  };

  return createSupabaseClient<Database>(url, key, options);
}
