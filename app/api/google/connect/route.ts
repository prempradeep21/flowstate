import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { randomBytes } from "crypto";
import { GOOGLE_OAUTH_STATE_COOKIE } from "@/lib/google/constants";
import {
  encodeOAuthReturnPayload,
  GOOGLE_OAUTH_RETURN_COOKIE,
  parseOAuthIntent,
  sanitizeOAuthReturnPath,
} from "@/lib/google/oauthReturn";
import { buildGoogleOAuthUrl } from "@/lib/google/oauth";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  if (
    !process.env.GOOGLE_OAUTH_CLIENT_ID?.trim() ||
    !process.env.GOOGLE_OAUTH_CLIENT_SECRET?.trim()
  ) {
    return NextResponse.json(
      { error: "Google Workspace is not configured on this server" },
      { status: 503 },
    );
  }

  const { origin, searchParams } = new URL(request.url);
  const state = randomBytes(24).toString("hex");
  const cookieStore = await cookies();
  const secure = process.env.NODE_ENV === "production";
  cookieStore.set(GOOGLE_OAUTH_STATE_COOKIE, state, {
    httpOnly: true,
    secure,
    sameSite: "lax",
    path: "/",
    maxAge: 600,
  });
  cookieStore.set(
    GOOGLE_OAUTH_RETURN_COOKIE,
    encodeOAuthReturnPayload({
      path: sanitizeOAuthReturnPath(searchParams.get("returnTo")),
      intent: parseOAuthIntent(searchParams.get("intent")),
      artifactId: searchParams.get("artifactId") ?? undefined,
    }),
    {
      httpOnly: true,
      secure,
      sameSite: "lax",
      path: "/",
      maxAge: 600,
    },
  );

  const url = buildGoogleOAuthUrl(origin, state);
  return NextResponse.redirect(url);
}
