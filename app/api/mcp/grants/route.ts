import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient().catch(() => null);
  if (!supabase) return Response.json({ error: "Supabase not configured" }, { status: 500 });
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { data: grants } = await supabase
    .from("mcp_tool_grants")
    .select("server_id, tool_name, decision, updated_at")
    .eq("user_id", user.id);
  return Response.json({ grants: grants ?? [] });
}

export async function DELETE(req: Request) {
  const supabase = await createClient().catch(() => null);
  if (!supabase) return Response.json({ error: "Supabase not configured" }, { status: 500 });
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { serverId, toolName } = (await req.json()) as {
    serverId?: string;
    toolName?: string;
  };
  if (!serverId || !toolName) {
    return Response.json({ error: "serverId and toolName required" }, { status: 400 });
  }
  const { error } = await supabase
    .from("mcp_tool_grants")
    .delete()
    .eq("user_id", user.id)
    .eq("server_id", serverId)
    .eq("tool_name", toolName);
  if (error) return Response.json({ error: error.message }, { status: 400 });
  return Response.json({ ok: true });
}
