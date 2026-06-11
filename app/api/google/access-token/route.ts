import { NextResponse } from "next/server";
import { getValidGoogleAccessToken } from "@/lib/google/tokens";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/** Short-lived access token for the Google Picker (client-side only). */
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const accessToken = await getValidGoogleAccessToken(supabase, user.id);
  if (!accessToken) {
    return NextResponse.json({ error: "Not connected" }, { status: 403 });
  }

  const clientId = process.env.NEXT_PUBLIC_GOOGLE_OAUTH_CLIENT_ID?.trim();
  const pickerKey = process.env.NEXT_PUBLIC_GOOGLE_PICKER_API_KEY?.trim();
  if (!clientId || !pickerKey) {
    return NextResponse.json(
      { error: "Google Picker is not configured" },
      { status: 503 },
    );
  }

  return NextResponse.json({
    accessToken,
    clientId,
    pickerApiKey: pickerKey,
  });
}
