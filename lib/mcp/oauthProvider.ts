// OAuthClientProvider backed by mcp_oauth_connections. The SDK drives the
// whole OAuth 2.1 flow (RFC 9728 discovery, dynamic client registration,
// PKCE, refresh); this provider just persists every piece of state in
// Supabase so the flow survives serverless instance hops between
// /api/mcp/oauth/start and /api/mcp/oauth/callback.

import { randomUUID } from "node:crypto";
import type {
  OAuthClientInformationMixed,
  OAuthClientMetadata,
  OAuthTokens,
} from "@modelcontextprotocol/sdk/shared/auth.js";
import type { OAuthClientProvider } from "@modelcontextprotocol/sdk/client/auth.js";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import { decryptMcpSecret, encryptMcpSecret } from "@/lib/mcp/secrets";

type Supabase = SupabaseClient<Database>;
type ConnectionRow = Database["public"]["Tables"]["mcp_oauth_connections"]["Row"];

/** Thrown by redirectToAuthorization — routes catch it and hand the URL to the client. */
export class McpAuthRedirectError extends Error {
  constructor(public readonly authorizationUrl: string) {
    super("MCP authorization redirect required");
    this.name = "McpAuthRedirectError";
  }
}

export class SupabaseOAuthClientProvider implements OAuthClientProvider {
  private row: ConnectionRow | null = null;
  private loaded = false;

  constructor(
    private readonly supabase: Supabase,
    private readonly userId: string,
    private readonly serverId: string,
    private readonly origin: string,
  ) {}

  get redirectUrl(): string {
    return `${this.origin}/api/mcp/oauth/callback?serverId=${this.serverId}`;
  }

  get clientMetadata(): OAuthClientMetadata {
    return {
      client_name: "Flowstate",
      redirect_uris: [this.redirectUrl],
      grant_types: ["authorization_code", "refresh_token"],
      response_types: ["code"],
      token_endpoint_auth_method: "client_secret_post",
    };
  }

  private async load(): Promise<ConnectionRow | null> {
    if (this.loaded) return this.row;
    const { data } = await this.supabase
      .from("mcp_oauth_connections")
      .select("*")
      .eq("server_id", this.serverId)
      .maybeSingle();
    this.row = data ?? null;
    this.loaded = true;
    return this.row;
  }

  private async upsert(
    fields: Partial<Database["public"]["Tables"]["mcp_oauth_connections"]["Update"]>,
  ): Promise<void> {
    await this.supabase.from("mcp_oauth_connections").upsert({
      server_id: this.serverId,
      user_id: this.userId,
      ...fields,
    });
    this.loaded = false;
  }

  async state(): Promise<string> {
    const state = randomUUID();
    await this.upsert({ oauth_state: state });
    return state;
  }

  /** Validate the state param on callback (one-shot). */
  async consumeState(state: string): Promise<boolean> {
    const row = await this.load();
    if (!row?.oauth_state || row.oauth_state !== state) return false;
    await this.upsert({ oauth_state: null });
    return true;
  }

  async clientInformation(): Promise<OAuthClientInformationMixed | undefined> {
    const row = await this.load();
    if (!row?.client_info_encrypted) return undefined;
    try {
      return JSON.parse(decryptMcpSecret(row.client_info_encrypted));
    } catch {
      return undefined;
    }
  }

  async saveClientInformation(info: OAuthClientInformationMixed): Promise<void> {
    await this.upsert({ client_info_encrypted: encryptMcpSecret(JSON.stringify(info)) });
  }

  async tokens(): Promise<OAuthTokens | undefined> {
    const row = await this.load();
    if (!row?.access_token_encrypted) return undefined;
    try {
      const tokens = JSON.parse(decryptMcpSecret(row.access_token_encrypted)) as OAuthTokens;
      if (row.refresh_token_encrypted) {
        tokens.refresh_token = decryptMcpSecret(row.refresh_token_encrypted);
      }
      return tokens;
    } catch {
      return undefined;
    }
  }

  async saveTokens(tokens: OAuthTokens): Promise<void> {
    const { refresh_token, ...rest } = tokens;
    await this.upsert({
      access_token_encrypted: encryptMcpSecret(JSON.stringify(rest)),
      refresh_token_encrypted: refresh_token ? encryptMcpSecret(refresh_token) : null,
      expires_at: tokens.expires_in
        ? new Date(Date.now() + tokens.expires_in * 1000).toISOString()
        : null,
      scopes: tokens.scope ? tokens.scope.split(" ") : [],
    });
  }

  redirectToAuthorization(authorizationUrl: URL): void {
    throw new McpAuthRedirectError(authorizationUrl.toString());
  }

  async saveCodeVerifier(codeVerifier: string): Promise<void> {
    await this.upsert({ code_verifier_encrypted: encryptMcpSecret(codeVerifier) });
  }

  async codeVerifier(): Promise<string> {
    const row = await this.load();
    if (!row?.code_verifier_encrypted) {
      throw new Error("No PKCE verifier stored — restart the connect flow.");
    }
    return decryptMcpSecret(row.code_verifier_encrypted);
  }

  async invalidateCredentials(scope: "all" | "client" | "tokens" | "verifier" | "discovery"): Promise<void> {
    if (scope === "all") {
      await this.supabase
        .from("mcp_oauth_connections")
        .delete()
        .eq("server_id", this.serverId);
      this.loaded = false;
      return;
    }
    if (scope === "client") {
      await this.upsert({ client_info_encrypted: null });
    } else if (scope === "tokens") {
      await this.upsert({
        access_token_encrypted: null,
        refresh_token_encrypted: null,
        expires_at: null,
      });
    } else if (scope === "verifier") {
      await this.upsert({ code_verifier_encrypted: null });
    }
  }
}
