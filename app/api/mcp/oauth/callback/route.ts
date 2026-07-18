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
export async function GET(req: Request) {
  const url = new URL(req.url);
  const serverId = url.searchParams.get("serverId");
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const oauthError = url.searchParams.get("error");

  const respond = (ok: boolean, message?: string) =>
    new Response(
      `<!doctype html><html><body style="font-family:system-ui;padding:24px;color:#333">
<p>${ok ? "Connected. You can close this window." : `Connection failed${message ? `: ${escapeHtml(message)}` : ""}.`}</p>
<script>
  try {
    if (window.opener) {
      window.opener.postMessage(
        { type: "mcp-oauth-complete", serverId: ${JSON.stringify(serverId)}, ok: ${ok} },
        window.location.origin,
      );
    }
  } catch (e) {}
  setTimeout(function () { window.close(); }, ${ok ? 400 : 4000});
</script></body></html>`,
      { headers: { "Content-Type": "text/html; charset=utf-8" } },
    );

  if (oauthError) return respond(false, oauthError);
  if (!serverId || !code || !state) return respond(false, "missing parameters");

  const supabase = await createClient().catch(() => null);
  if (!supabase) return respond(false, "Supabase not configured");
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return respond(false, "sign in required");

  const { data: row } = await supabase
    .from("mcp_servers")
    .select("*")
    .eq("id", serverId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!row || !row.url) return respond(false, "server not found");

  const provider = new SupabaseOAuthClientProvider(supabase, user.id, serverId, url.origin);
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

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
