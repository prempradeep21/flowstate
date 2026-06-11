import { NextResponse } from "next/server";
import { revokeGoogleToken } from "@/lib/google/oauth";
import {
  deleteGoogleConnection,
  getValidGoogleAccessToken,
  readGoogleRefreshTokenForRevoke,
} from "@/lib/google/tokens";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const refreshToken = await readGoogleRefreshTokenForRevoke(supabase, user.id);
  if (refreshToken) {
    try {
      await revokeGoogleToken(refreshToken);
    } catch {
      /* best effort revoke */
    }
  } else {
    const accessToken = await getValidGoogleAccessToken(supabase, user.id);
    if (accessToken) {
      try {
        await revokeGoogleToken(accessToken);
      } catch {
        /* best effort revoke */
      }
    }
  }

  await deleteGoogleConnection(supabase, user.id);
  return NextResponse.json({ ok: true });
}
