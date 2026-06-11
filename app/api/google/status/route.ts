import { NextResponse } from "next/server";
import { getGoogleConnectionStatus } from "@/lib/google/tokens";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return NextResponse.json({ connected: false, signedIn: false });
  }

  const status = await getGoogleConnectionStatus(supabase, user.id);
  return NextResponse.json({ ...status, signedIn: true });
}
