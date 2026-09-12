import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { createClient } from "@/lib/supabase/server";
import { SupabaseOAuthClientProvider } from "@/lib/mcp/oauthProvider";
import { refreshServerTools } from "@/lib/mcp/toolCache";
import { assertSafeMcpUrl, guardedFetch } from "@/lib/mcp/urlGuard";

export const dynamic = "force-dynamic";

// The OAuth popup lands here after the user authorizes the MCP server.
// finishAuth exchanges the code (PKCE verifier + client info come from the
// DB, so this works even on a different serverless instance than /start),
// then a small self-closing page notifies the opener via postMessage.
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(req: Request) {
  const url = new URL(req.url);
  const serverId = url.searchParams.get("serverId");
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const oauthError = url.searchParams.get("error");

  // serverId is reflected into an inline <script>; it is always a UUID, so
  // anything else is an attack. Validate before it can reach the response,
  // and only ever emit the validated value (never the raw query string).
  const safeServerId = serverId && UUID_RE.test(serverId) ? serverId : null;

  const respond = (ok: boolean, message?: string) =>
    new Response(
      `<!doctype html><html><body style="font-family:system-ui;padding:24px;color:#333">
<p>${ok ? "Connected. You can close this window." : `Connection failed${message ? `: ${escapeHtml(message)}` : ""}.`}</p>
<script>
  try {
    if (window.opener) {
      window.opener.postMessage(
        { type: "mcp-oauth-complete", serverId: ${jsonForScript(safeServerId)}, ok: ${ok} },
        window.location.origin,
      );
    }
  } catch (e) {}
  setTimeout(function () { window.close(); }, ${ok ? 400 : 4000});
</script></body></html>`,
      { headers: { "Content-Type": "text/html; charset=utf-8" } },
    );

  if (oauthError) return respond(false, "authorization was declined");
  if (!safeServerId || !code || !state) return respond(false, "missing parameters");

  const supabase = await createClient().catch(() => null);
  if (!supabase) return respond(false, "Supabase not configured");
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return respond(false, "sign in required");

  const { data: row } = await supabase
    .from("mcp_servers")
    .select("*")
    .eq("id", safeServerId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!row || !row.url) return respond(false, "server not found");

  const provider = new SupabaseOAuthClientProvider(supabase, user.id, safeServerId, url.origin);
  const stateOk = await provider.consumeState(state);
  if (!stateOk) return respond(false, "invalid state");

  try {
    const serverUrl = await assertSafeMcpUrl(row.url);
    const transport = new StreamableHTTPClientTransport(serverUrl, {
      fetch: guardedFetch,
      authProvider: provider,
    });
    await transport.finishAuth(code);
  } catch (err) {
    return respond(false, err instanceof Error ? err.message : "token exchange failed");
  }

  // Populate the tool cache now that we have tokens (best-effort).
  try {
    await refreshServerTools(supabase, row, url.origin);
  } catch {
    // last_status/last_error already recorded
  }
  return respond(true);
}

/**
 * JSON-encode a value for embedding inside an inline <script>. JSON.stringify
 * escapes quotes but NOT the literal "</script>", which would break out of the
 * script element — neutralize `<` as defense-in-depth on top of the UUID
 * validation of the only value we ever pass here.
 */
function jsonForScript(value: unknown): string {
  return JSON.stringify(value ?? null).replace(/</g, "\\u003c");
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
