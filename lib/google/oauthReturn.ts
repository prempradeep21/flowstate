import { GOOGLE_OAUTH_COMPLETE_PATH } from "@/lib/google/oauthMessages";



/** HttpOnly cookie storing where to land after Google OAuth completes. */

export const GOOGLE_OAUTH_RETURN_COOKIE = "google_oauth_return";



export type GoogleOAuthIntent = "picker" | "none";



export interface GoogleOAuthReturnPayload {

  /** Same-origin path + search, e.g. `/` or `/dev/artifact-catalog`. */

  path: string;

  intent: GoogleOAuthIntent;

  artifactId?: string;

}



const MAX_PATH_LEN = 512;



/** Reject open redirects — only same-origin relative paths. */

export function sanitizeOAuthReturnPath(raw: string | null | undefined): string {

  const path = (raw ?? "/").trim();

  if (!path.startsWith("/") || path.startsWith("//")) return "/";

  return path.slice(0, MAX_PATH_LEN);

}



export function parseOAuthIntent(

  raw: string | null | undefined,

): GoogleOAuthIntent {

  return raw === "picker" ? "picker" : "none";

}



export function encodeOAuthReturnPayload(

  payload: GoogleOAuthReturnPayload,

): string {

  return JSON.stringify({

    path: sanitizeOAuthReturnPath(payload.path),

    intent: payload.intent === "picker" ? "picker" : "none",

    artifactId:

      typeof payload.artifactId === "string" && payload.artifactId.trim()

        ? payload.artifactId.trim().slice(0, 128)

        : undefined,

  });

}



export function decodeOAuthReturnPayload(

  raw: string | undefined,

): GoogleOAuthReturnPayload | null {

  if (!raw) return null;

  try {

    const data = JSON.parse(raw) as Partial<GoogleOAuthReturnPayload>;

    return {

      path: sanitizeOAuthReturnPath(data.path),

      intent: parseOAuthIntent(data.intent),

      artifactId:

        typeof data.artifactId === "string" && data.artifactId.trim()

          ? data.artifactId.trim()

          : undefined,

    };

  } catch {

    return null;

  }

}



export function buildOAuthReturnUrl(

  origin: string,

  payload: GoogleOAuthReturnPayload,

  result: { ok: true } | { ok: false; error: string },

): string {

  const url = new URL(GOOGLE_OAUTH_COMPLETE_PATH, origin);

  url.searchParams.set("returnTo", payload.path);

  if (result.ok) {

    url.searchParams.set("google_connected", "1");

    if (payload.intent === "picker") {

      url.searchParams.set("google_intent", "picker");

    }

    if (payload.artifactId) {

      url.searchParams.set("google_artifact_id", payload.artifactId);

    }

  } else {

    url.searchParams.set("google_error", result.error);

  }

  return url.toString();

}



export function buildConnectUrl(opts?: {

  intent?: GoogleOAuthIntent;

  artifactId?: string;

}): string {

  if (typeof window === "undefined") return "/api/google/connect";

  const params = new URLSearchParams();

  params.set(

    "returnTo",

    `${window.location.pathname}${window.location.search}`,

  );

  if (opts?.intent === "picker") params.set("intent", "picker");

  if (opts?.artifactId?.trim()) params.set("artifactId", opts.artifactId.trim());

  return `/api/google/connect?${params.toString()}`;

}



export const GOOGLE_OAUTH_POPUP_NAME = "flowstate_google_oauth";


