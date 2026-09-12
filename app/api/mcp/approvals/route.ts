import { createClient } from "@/lib/supabase/server";

// Decide a pending mid-turn tool-call approval. The streaming chat request
// polls the row (lib/mcp/approval.ts); this route just records the decision
// and, for remembered choices, upserts the grant with the request's tool hash.
export async function POST(req: Request) {
  const supabase = await createClient().catch(() => null);
  if (!supabase) return Response.json({ error: "Supabase not configured" }, { status: 500 });
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { requestId, decision } = (await req.json()) as {
    requestId?: string;
    decision?: string;
  };
  if (
    !requestId ||
    (decision !== "allow_once" && decision !== "always" && decision !== "deny")
  ) {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }

  const { data: row, error } = await supabase
    .from("mcp_approval_requests")
    .update({ status: decision, decided_at: new Date().toISOString() })
    .eq("id", requestId)
    .eq("user_id", user.id)
    .eq("status", "pending")
    .select("server_id, tool_name, tool_hash")
    .maybeSingle();
  if (error) return Response.json({ error: error.message }, { status: 400 });
  if (!row) {
    return Response.json({ error: "Request already decided or expired" }, { status: 409 });
  }

  if (decision === "always") {
    await supabase.from("mcp_tool_grants").upsert({
      user_id: user.id,
      server_id: row.server_id,
      tool_name: row.tool_name,
      decision: "always",
      tool_hash: row.tool_hash,
    });
  }

  // Opportunistic cleanup of stale approval rows.
  void supabase
    .from("mcp_approval_requests")
    .delete()
    .eq("user_id", user.id)
    .lt("created_at", new Date(Date.now() - 60 * 60 * 1000).toISOString())
    .then(() => {});

  return Response.json({ ok: true });
}
