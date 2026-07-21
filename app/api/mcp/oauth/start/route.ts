import { createClient } from "@/lib/supabase/server";
import { connectMcpServer } from "@/lib/mcp/client";
import { McpAuthRedirectError, SupabaseOAuthClientProvider } from "@/lib/mcp/oauthProvider";
import { refreshServerTools } from "@/lib/mcp/toolCache";

// Begin (or complete) the OAuth connection for a server. If the server needs
// authorization, the SDK's discovery/DCR/PKCE flow runs and the authorization
// URL is returned for the client to open in a popup. If existing tokens work,
// the connect succeeds directly.
export async function POST(req: Request) {
  const supabase = await createClient().catch(() => null);
  if (!supabase) return Response.json({ error: "Supabase not configured" }, { status: 500 });
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { serverId } = (await req.json()) as { serverId?: string };
  if (!serverId) return Response.json({ error: "serverId required" }, { status: 400 });

  const { data: row } = await supabase
    .from("mcp_servers")
    .select("*")
    .eq("id", serverId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!row) return Response.json({ error: "Server not found" }, { status: 404 });

  const origin = new URL(req.url).origin;
  const provider = new SupabaseOAuthClientProvider(supabase, user.id, serverId, origin);

  await supabase
    .from("mcp_servers")
    .update({ auth_type: "oauth" })
    .eq("id", serverId)
    .eq("user_id", user.id);

  try {
    await connectMcpServer(row, { authProvider: provider, fresh: true });
    // Tokens already valid — refresh the tool cache and finish.
    try {
      await refreshServerToolsWithAuth(supabase, row.id, user.id);
    } catch {
      // status columns updated inside
    }
    return Response.json({ connected: true });
  } catch (err) {
    if (err instanceof McpAuthRedirectError) {
      return Response.json({ authorizationUrl: err.authorizationUrl });
    }
    return Response.json(
      { error: err instanceof Error ? err.message : "Connection failed" },
      { status: 502 },
    );
  }
}

async function refreshServerToolsWithAuth(
  supabase: NonNullable<Awaited<ReturnType<typeof createClient>>>,
  serverId: string,
  userId: string,
): Promise<void> {
  const { data: row } = await supabase
    .from("mcp_servers")
    .select("*")
    .eq("id", serverId)
    .eq("user_id", userId)
    .maybeSingle();
  if (row) await refreshServerTools(supabase, row);
}
