import { createClient } from "@/lib/supabase/server";
import { refreshServerTools } from "@/lib/mcp/toolCache";
import { serializeServerSummary } from "@/lib/mcp/serverSummary";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = await createClient().catch(() => null);
  if (!supabase) return Response.json({ error: "Supabase not configured" }, { status: 500 });
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  let { data: row } = await supabase
    .from("mcp_servers")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!row) return Response.json({ error: "Server not found" }, { status: 404 });

  const refresh = new URL(req.url).searchParams.get("refresh") === "1";
  if (refresh) {
    try {
      await refreshServerTools(supabase, row);
    } catch {
      // status/error columns were updated by refreshServerTools
    }
    const { data: updated } = await supabase
      .from("mcp_servers")
      .select("*")
      .eq("id", id)
      .eq("user_id", user.id)
      .maybeSingle();
    if (updated) row = updated;
  }

  const { data: grants } = await supabase
    .from("mcp_tool_grants")
    .select("server_id, tool_name, decision, tool_hash")
    .eq("user_id", user.id)
    .eq("server_id", id);
  const { data: oauthRows } = await supabase
    .from("mcp_oauth_connections")
    .select("server_id, access_token_encrypted")
    .eq("server_id", id);

  return Response.json({
    server: serializeServerSummary(row, grants ?? [], oauthRows ?? []),
  });
}
