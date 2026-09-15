import type { User } from "@supabase/supabase-js";

/**
 * Resolves the signed-in user, or null.
 *
 * NEVER throws and never rejects a request. The prevailing convention in this
 * codebase is graceful degradation to anonymous rather than a 401 — guest mode
 * depends on it — so this is safe to add to any existing route purely to
 * attribute usage. It returns null when Supabase is unconfigured, when the
 * caller is a guest, or when anything at all goes wrong.
 */
export async function getCurrentUser(): Promise<User | null> {
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    return null;
  }
  try {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return user ?? null;
  } catch {
    return null;
  }
}
