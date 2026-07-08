import { isAdminEmail } from "@/lib/adminAccess";
import { createClient } from "@/lib/supabase/server";
import type { User } from "@supabase/supabase-js";

export async function getAdminUser(): Promise<User | null> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user || !isAdminEmail(user.email)) {
      return null;
    }

    return user;
  } catch {
    return null;
  }
}
