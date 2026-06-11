import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { GOOGLE_OAUTH_STATE_COOKIE, GOOGLE_WORKSPACE_SCOPES } from "@/lib/google/constants";
import {
  buildOAuthReturnUrl,
  decodeOAuthReturnPayload,
  GOOGLE_OAUTH_RETURN_COOKIE,
  type GoogleOAuthReturnPayload,
} from "@/lib/google/oauthReturn";
import {
  exchangeGoogleCode,
  fetchGoogleUserEmail,
} from "@/lib/google/oauth";
import { upsertGoogleConnection } from "@/lib/google/tokens";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

function readReturnPayload(cookieStore: Awaited<ReturnType<typeof cookies>>): GoogleOAuthReturnPayload {
  const raw = cookieStore.get(GOOGLE_OAUTH_RETURN_COOKIE)?.value;
  cookieStore.delete(GOOGLE_OAUTH_RETURN_COOKIE);
  return (
    decodeOAuthReturnPayload(raw) ?? {
      path: "/",
      intent: "none",
    }
  );
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const oauthError = searchParams.get("error");

  const cookieStore = await cookies();
  const returnPayload = readReturnPayload(cookieStore);

  if (oauthError) {
    return NextResponse.redirect(
      buildOAuthReturnUrl(origin, returnPayload, { ok: false, error: oauthError }),
    );
  }

  const expectedState = cookieStore.get(GOOGLE_OAUTH_STATE_COOKIE)?.value;
  cookieStore.delete(GOOGLE_OAUTH_STATE_COOKIE);

  if (!code || !state || !expectedState || state !== expectedState) {
    return NextResponse.redirect(
      buildOAuthReturnUrl(origin, returnPayload, { ok: false, error: "invalid_state" }),
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.redirect(
      buildOAuthReturnUrl(origin, returnPayload, {
        ok: false,
        error: "sign_in_required",
      }),
    );
  }

  try {
    const tokens = await exchangeGoogleCode(origin, code);
    if (!tokens.refresh_token) {
      return NextResponse.redirect(
        buildOAuthReturnUrl(origin, returnPayload, {
          ok: false,
          error: "missing_refresh_token",
        }),
      );
    }

    const email = await fetchGoogleUserEmail(tokens.access_token);
    await upsertGoogleConnection(supabase, user.id, {
      googleEmail: email,
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiresIn: tokens.expires_in,
      scopes: tokens.scope
        ? tokens.scope.split(" ").filter(Boolean)
        : [...GOOGLE_WORKSPACE_SCOPES],
    });

    return NextResponse.redirect(
      buildOAuthReturnUrl(origin, returnPayload, { ok: true }),
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "connect_failed";
    return NextResponse.redirect(
      buildOAuthReturnUrl(origin, returnPayload, {
        ok: false,
        error: message.slice(0, 120),
      }),
    );
  }
}
