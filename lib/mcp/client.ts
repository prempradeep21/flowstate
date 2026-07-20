// Server-only MCP client connections. Streamable HTTP with SSE fallback,
// SSRF-guarded fetch, and a per-process warm pool so repeated tool calls in
// one lambda/dev-server instance reuse the session. Never assume the pool
// survives across requests — cold instances just reconnect.

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import type { OAuthClientProvider } from "@modelcontextprotocol/sdk/client/auth.js";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import { SupabaseOAuthClientProvider } from "@/lib/mcp/oauthProvider";
import { decryptHeaderMap } from "@/lib/mcp/secrets";
import { assertSafeMcpUrl, guardedFetch } from "@/lib/mcp/urlGuard";

export type McpServerRow = Database["public"]["Tables"]["mcp_servers"]["Row"];

/** Context for building an OAuth provider for oauth-type servers. */
export interface McpAuthContext {
  supabase: SupabaseClient<Database>;
  userId: string;
  /** App origin used for the OAuth redirect URL; falls back to env/localhost. */
  origin?: string;
}

export function resolveAppOrigin(origin?: string): string {
  return (
    origin ??
    process.env.NEXT_PUBLIC_SITE_URL ??
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000")
  );
}

const CONNECT_TIMEOUT_MS = 8_000;
const POOL_IDLE_MS = 5 * 60 * 1000;

interface PooledClient {
  client: Client;
  lastUsed: number;
}

const pool = new Map<string, PooledClient>();

function sweepPool(): void {
  const now = Date.now();
  for (const [key, entry] of pool) {
    if (now - entry.lastUsed > POOL_IDLE_MS) {
      pool.delete(key);
      void entry.client.close().catch(() => {});
    }
  }
}

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms),
    ),
  ]);
}

export interface ConnectOptions {
  authProvider?: OAuthClientProvider;
  /** Builds an OAuth provider automatically for auth_type "oauth" servers. */
  authCtx?: McpAuthContext;
  /** Skip the warm pool (used by one-shot flows like OAuth finish). */
  fresh?: boolean;
}

/**
 * Connect to a remote MCP server (or reuse a pooled session). Tries
 * Streamable HTTP first, falls back to SSE on 4xx — the documented pattern
 * for supporting older servers.
 */
export async function connectMcpServer(
  row: McpServerRow,
  options: ConnectOptions = {},
): Promise<Client> {
  sweepPool();

  if (!options.fresh) {
    const pooled = pool.get(row.id);
    if (pooled) {
      pooled.lastUsed = Date.now();
      return pooled.client;
    }
  }

  if (row.transport !== "http" || !row.url) {
    throw new Error("Only remote (http) MCP servers are supported.");
  }
  const url = await assertSafeMcpUrl(row.url);
  const headers = decryptHeaderMap(row.headers_encrypted);
  const requestInit: RequestInit | undefined =
    Object.keys(headers).length > 0 ? { headers } : undefined;

  let authProvider = options.authProvider;
  if (!authProvider && row.auth_type === "oauth" && options.authCtx) {
    authProvider = new SupabaseOAuthClientProvider(
      options.authCtx.supabase,
      options.authCtx.userId,
      row.id,
      resolveAppOrigin(options.authCtx.origin),
    );
  }

  const makeClient = () =>
    new Client({ name: "flowstate", version: "1.0.0" }, { capabilities: {} });

  let client = makeClient();
  try {
    const transport = new StreamableHTTPClientTransport(url, {
      fetch: guardedFetch,
      requestInit,
      authProvider,
    });
    await withTimeout(client.connect(transport), CONNECT_TIMEOUT_MS, "MCP connect");
  } catch (err) {
    // Auth-required failures must bubble up untouched so callers can flag
    // the server as needs-auth / start the OAuth flow — an SSE retry against
    // a 401 is pointless and masks the real cause.
    if (isAuthRequiredError(err)) throw err;
    const status = extractHttpStatus(err);
    if (status !== null && status >= 400 && status < 500) {
      client = makeClient();
      const sseTransport = new SSEClientTransport(url, {
        fetch: guardedFetch,
        requestInit,
        authProvider,
      });
      await withTimeout(client.connect(sseTransport), CONNECT_TIMEOUT_MS, "MCP connect (SSE)");
    } else {
      throw err;
    }
  }

  if (!options.fresh) {
    pool.set(row.id, { client, lastUsed: Date.now() });
  }
  return client;
}

function extractHttpStatus(err: unknown): number | null {
  if (!err || typeof err !== "object") return null;
  // Prefer a structured status field — the SDK's transport errors carry the
  // real HTTP status here (StreamableHTTPError.code, etc.).
  for (const key of ["status", "statusCode", "code"] as const) {
    const value = (err as Record<string, unknown>)[key];
    if (typeof value === "number" && value >= 100 && value <= 599) return value;
  }
  // Fall back to the message ONLY when it names an HTTP status explicitly
  // ("HTTP 401", "status 403", "status code 401", "401 Unauthorized") — never
  // a bare number, so a "401" buried in unrelated tool-error prose can't flip
  // a working server to needs-auth.
  if (err instanceof Error) {
    const m = err.message.match(
      /(?:\bhttp\b|\bstatus(?:\s+code)?\b)\D{0,4}(\d{3})|\b(\d{3})\s+(?:unauthorized|forbidden|bad request|not found)/i,
    );
    const status = m ? Number(m[1] ?? m[2]) : null;
    if (status && status >= 100 && status <= 599) return status;
  }
  return null;
}

/**
 * True when a connect/call failure means "this server wants authentication"
 * — either the SDK's typed UnauthorizedError (authProvider path) or a plain
 * HTTP 401/403 from a server whose auth hasn't been configured yet.
 */
export function isAuthRequiredError(err: unknown): boolean {
  if (err instanceof Error && err.name === "UnauthorizedError") return true;
  const status = extractHttpStatus(err);
  if (status === 401 || status === 403) return true;
  return err instanceof Error && /\bunauthorized\b/i.test(err.message);
}

/** Drop a server's pooled session (after config/auth changes or errors). */
export function evictPooledClient(serverId: string): void {
  const pooled = pool.get(serverId);
  if (pooled) {
    pool.delete(serverId);
    void pooled.client.close().catch(() => {});
  }
}
