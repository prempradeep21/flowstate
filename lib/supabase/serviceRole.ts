import { createClient as createSupabaseClient } from "@supabase/supabase-js";
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
  };

  if (typeof window === "undefined") {
    // Node < 22 needs an explicit WebSocket implementation for auth.admin calls.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const WebSocket = require("ws") as typeof import("ws");
    options.realtime = { transport: WebSocket };
  }

  return createSupabaseClient<Database>(url, key, options);
}
