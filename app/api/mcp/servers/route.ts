import { createClient } from "@/lib/supabase/server";
import { isStdioMcpAllowed } from "@/lib/supabase/environment";
import type { Database } from "@/lib/supabase/database.types";
import { assertSafeMcpUrl } from "@/lib/mcp/urlGuard";
import { encryptHeaderMap } from "@/lib/mcp/secrets";
import { refreshServerTools, parseCachedTools } from "@/lib/mcp/toolCache";
import { serializeServerSummary } from "@/lib/mcp/serverSummary";

export async function GET() {
  const supabase = await createClient().catch(() => null);
  if (!supabase) return Response.json({ error: "Supabase not configured" }, { status: 500 });
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Sign in to use MCP servers" }, { status: 401 });

  const { data: rows, error } = await supabase
    .from("mcp_servers")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true });
  if (error) return Response.json({ error: error.message }, { status: 500 });

  const { data: grants } = await supabase
    .from("mcp_tool_grants")
    .select("server_id, tool_name, decision, tool_hash")
    .eq("user_id", user.id);
  const { data: oauthRows } = await supabase
    .from("mcp_oauth_connections")
    .select("server_id, access_token_encrypted")
    .eq("user_id", user.id);

  const servers = (rows ?? []).map((row) =>
    serializeServerSummary(row, grants ?? [], oauthRows ?? []),
  );
  return Response.json({ servers });
}

export async function POST(req: Request) {
  const supabase = await createClient().catch(() => null);
  if (!supabase) return Response.json({ error: "Supabase not configured" }, { status: 500 });
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Sign in to add MCP servers" }, { status: 401 });

  const body = (await req.json()) as {
    name?: string;
    url?: string;
    headers?: Record<string, string>;
    transport?: string;
    command?: string;
    args?: string[];
    env?: Record<string, string>;
  };

  const name = body.name?.trim().slice(0, 60);
  if (!name) return Response.json({ error: "A name is required." }, { status: 400 });

  const isStdio = body.transport === "stdio" || (!body.url && !!body.command);

  let insertRow: Database["public"]["Tables"]["mcp_servers"]["Insert"];

  if (isStdio) {
    if (!isStdioMcpAllowed()) {
      return Response.json(
        { error: "Local (stdio) MCP servers only run in the desktop app." },
        { status: 400 },
      );
    }
    const command = body.command?.trim();
    if (!command) {
      return Response.json({ error: "A command is required for a local server." }, { status: 400 });
    }
    const args = Array.isArray(body.args)
      ? body.args.filter((a): a is string => typeof a === "string")
      : [];
    const env =
      body.env && typeof body.env === "object"
        ? Object.fromEntries(
            Object.entries(body.env).filter(([k, v]) => typeof v === "string" && k.trim()),
          )
        : {};
    insertRow = {
      user_id: user.id,
      name,
      transport: "stdio",
      stdio_command: command,
      stdio_args: args as unknown as Database["public"]["Tables"]["mcp_servers"]["Insert"]["stdio_args"],
      stdio_env_encrypted: Object.keys(env).length > 0 ? encryptHeaderMap(env) : null,
      auth_type: "none",
    };
  } else {
    const url = body.url?.trim();
    if (!url) return Response.json({ error: "A url is required." }, { status: 400 });
    try {
      await assertSafeMcpUrl(url);
    } catch (err) {
      return Response.json(
        { error: err instanceof Error ? err.message : "Invalid URL" },
        { status: 400 },
      );
    }
    const headers =
      body.headers && typeof body.headers === "object"
        ? Object.fromEntries(
            Object.entries(body.headers).filter(([k, v]) => typeof v === "string" && k.trim()),
          )
        : {};
    const hasHeaders = Object.keys(headers).length > 0;
    insertRow = {
      user_id: user.id,
      name,
      url,
      transport: "http",
      auth_type: hasHeaders ? "headers" : "none",
      headers_encrypted: hasHeaders ? encryptHeaderMap(headers) : null,
    };
  }

  const { data: inserted, error } = await supabase
    .from("mcp_servers")
    .insert(insertRow)
    .select("*")
    .single();
  if (error) {
    const message = error.message.includes("duplicate")
      ? `You already have a server named "${name}".`
      : error.message;
    return Response.json({ error: message }, { status: 400 });
  }

  // Best-effort initial connect so the panel shows tools right away. An
  // OAuth-requiring server lands in "needs-auth" here, which is expected.
  let toolCount = 0;
  let status: string = "connected";
  let statusError: string | null = null;
  try {
    toolCount = (await refreshServerTools(supabase, inserted)).length;
  } catch (err) {
    const { data: updated } = await supabase
      .from("mcp_servers")
      .select("last_status, last_error, tools_cache")
      .eq("id", inserted.id)
      .maybeSingle();
    status = updated?.last_status ?? "error";
    statusError = updated?.last_error ?? (err instanceof Error ? err.message : null);
    toolCount = updated ? parseCachedTools({ ...inserted, tools_cache: updated.tools_cache }).length : 0;
  }

  return Response.json({
    server: {
      id: inserted.id,
      name,
      url: inserted.url,
      transport: inserted.transport,
      status,
      error: statusError,
      toolCount,
    },
  });
}
