import type { GoogleOAuthIntent } from "@/lib/google/oauthReturn";



export const GOOGLE_OAUTH_COMPLETE_PATH = "/google/oauth-complete";



export const GOOGLE_OAUTH_MESSAGE_TYPE = "flowstate:google-oauth-complete";



export interface GoogleOAuthCompleteMessage {

  type: typeof GOOGLE_OAUTH_MESSAGE_TYPE;

  connected: boolean;

  error?: string;

  intent?: GoogleOAuthIntent;

  artifactId?: string;

}



export function isGoogleOAuthCompleteMessage(

  data: unknown,

): data is GoogleOAuthCompleteMessage {

  if (!data || typeof data !== "object") return false;

  const msg = data as Partial<GoogleOAuthCompleteMessage>;

  return msg.type === GOOGLE_OAUTH_MESSAGE_TYPE && typeof msg.connected === "boolean";

}



/** Map stored-token failures to actionable copy for the UI. */

export function friendlyGoogleOAuthError(code: string): string {

  const lower = code.toLowerCase();

  if (

    lower.includes("google_connections") ||

    lower.includes("schema cache") ||

    lower.includes("pgrst205")

  ) {

    return (

      "The google_connections table is missing on your Supabase project. " +

      "Apply migration supabase/migrations/20260609120000_google_connections.sql " +

      "(Supabase Dashboard → SQL, or supabase db push)."

    );

  }

  if (code === "sign_in_required") {

    return "Sign in to Flowstate first, then connect Google Drive again.";

  }

  if (code === "invalid_state") {

    return "OAuth session expired. Close the popup and try Connect again.";

  }

  if (code === "missing_refresh_token") {

    return "Google did not return a refresh token. Disconnect the app in your Google Account and retry.";

  }

  return code;

}


