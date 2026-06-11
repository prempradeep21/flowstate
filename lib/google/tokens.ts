import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import { decryptSecret, encryptSecret } from "@/lib/google/crypto";
import { refreshGoogleAccessToken } from "@/lib/google/oauth";

type DbClient = SupabaseClient<Database>;

export interface GoogleConnectionRow {
  user_id: string;
  google_email: string;
  access_token_encrypted: string;
  refresh_token_encrypted: string;
  expires_at: string;
  scopes: string[];
}

export interface GoogleConnectionStatus {
  connected: boolean;
  email?: string;
}

const REFRESH_BUFFER_MS = 60_000;

export async function getGoogleConnectionStatus(
  supabase: DbClient,
  userId: string,
): Promise<GoogleConnectionStatus> {
  const { data, error } = await supabase
    .from("google_connections")
    .select("google_email")
    .eq("user_id", userId)
    .maybeSingle();

  if (error || !data) {
    return { connected: false };
  }

  return { connected: true, email: data.google_email };
}

async function readConnectionRow(
  supabase: DbClient,
  userId: string,
): Promise<GoogleConnectionRow | null> {
  const { data, error } = await supabase
    .from("google_connections")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (error || !data) return null;
  return data as GoogleConnectionRow;
}

export async function upsertGoogleConnection(
  supabase: DbClient,
  userId: string,
  input: {
    googleEmail: string;
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
    scopes: string[];
  },
): Promise<void> {
  const expiresAt = new Date(Date.now() + input.expiresIn * 1000).toISOString();
  const row = {
    user_id: userId,
    google_email: input.googleEmail,
    access_token_encrypted: encryptSecret(input.accessToken),
    refresh_token_encrypted: encryptSecret(input.refreshToken),
    expires_at: expiresAt,
    scopes: input.scopes,
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase.from("google_connections").upsert(row);
  if (error) {
    const detail = error.message?.trim() || error.code || "unknown";
    throw new Error(`Failed to store Google connection: ${detail}`);
  }
}

export async function deleteGoogleConnection(
  supabase: DbClient,
  userId: string,
): Promise<void> {
  const { error } = await supabase
    .from("google_connections")
    .delete()
    .eq("user_id", userId);
  if (error) {
    throw new Error(`Failed to delete Google connection: ${error.message}`);
  }
}

/** Returns a valid Google access token for API calls, refreshing when needed. */
export async function getValidGoogleAccessToken(
  supabase: DbClient,
  userId: string,
): Promise<string | null> {
  const row = await readConnectionRow(supabase, userId);
  if (!row) return null;

  const expiresAt = new Date(row.expires_at).getTime();
  if (expiresAt - Date.now() > REFRESH_BUFFER_MS) {
    return decryptSecret(row.access_token_encrypted);
  }

  const refreshToken = decryptSecret(row.refresh_token_encrypted);
  const refreshed = await refreshGoogleAccessToken(refreshToken);
  const nextRefresh = refreshed.refresh_token ?? refreshToken;
  const scopes = refreshed.scope
    ? refreshed.scope.split(" ").filter(Boolean)
    : row.scopes;

  await upsertGoogleConnection(supabase, userId, {
    googleEmail: row.google_email,
    accessToken: refreshed.access_token,
    refreshToken: nextRefresh,
    expiresIn: refreshed.expires_in,
    scopes,
  });

  return refreshed.access_token;
}

export async function readGoogleRefreshTokenForRevoke(
  supabase: DbClient,
  userId: string,
): Promise<string | null> {
  const row = await readConnectionRow(supabase, userId);
  if (!row) return null;
  return decryptSecret(row.refresh_token_encrypted);
}
