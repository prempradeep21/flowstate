import { GOOGLE_WORKSPACE_SCOPES } from "@/lib/google/constants";

function requireClientId(): string {
  const id = process.env.GOOGLE_OAUTH_CLIENT_ID?.trim();
  if (!id) throw new Error("Missing GOOGLE_OAUTH_CLIENT_ID");
  return id;
}

function requireClientSecret(): string {
  const secret = process.env.GOOGLE_OAUTH_CLIENT_SECRET?.trim();
  if (!secret) throw new Error("Missing GOOGLE_OAUTH_CLIENT_SECRET");
  return secret;
}

export function googleOAuthRedirectUri(origin: string): string {
  return `${origin}/api/google/callback`;
}

export function buildGoogleOAuthUrl(origin: string, state: string): string {
  const params = new URLSearchParams({
    client_id: requireClientId(),
    redirect_uri: googleOAuthRedirectUri(origin),
    response_type: "code",
    scope: GOOGLE_WORKSPACE_SCOPES.join(" "),
    access_type: "offline",
    prompt: "consent",
    include_granted_scopes: "true",
    state,
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

export interface GoogleTokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  scope?: string;
  token_type?: string;
}

export async function exchangeGoogleCode(
  origin: string,
  code: string,
): Promise<GoogleTokenResponse> {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: requireClientId(),
      client_secret: requireClientSecret(),
      redirect_uri: googleOAuthRedirectUri(origin),
      grant_type: "authorization_code",
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Google token exchange failed: ${text.slice(0, 200)}`);
  }

  return (await res.json()) as GoogleTokenResponse;
}

export async function refreshGoogleAccessToken(
  refreshToken: string,
): Promise<GoogleTokenResponse> {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: requireClientId(),
      client_secret: requireClientSecret(),
      grant_type: "refresh_token",
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Google token refresh failed: ${text.slice(0, 200)}`);
  }

  return (await res.json()) as GoogleTokenResponse;
}

export async function revokeGoogleToken(token: string): Promise<void> {
  await fetch(
    `https://oauth2.googleapis.com/revoke?token=${encodeURIComponent(token)}`,
    { method: "POST" },
  );
}

export async function fetchGoogleUserEmail(
  accessToken: string,
): Promise<string> {
  const res = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    throw new Error("Failed to fetch Google profile");
  }
  const data = (await res.json()) as { email?: string };
  const email = data.email?.trim();
  if (!email) throw new Error("Google profile missing email");
  return email;
}
