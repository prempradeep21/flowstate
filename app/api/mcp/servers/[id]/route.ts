import { createClient } from "@/lib/supabase/server";
import { evictPooledClient } from "@/lib/mcp/client";
import { encryptHeaderMap } from "@/lib/mcp/secrets";
import { assertSafeMcpUrl } from "@/lib/mcp/urlGuard";
import type { Database } from "@/lib/supabase/database.types";

async function authed() {
  const supabase = await createClient().catch(() => null);
  if (!supabase) return { supabase: null, user: null };
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const { supabase, user } = await authed();
  if (!supabase || !user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await req.json()) as {
    enabled?: boolean;
    name?: string;
    url?: string;
    headers?: Record<string, string> | null;
  };

  const update: Database["public"]["Tables"]["mcp_servers"]["Update"] = {};
  if (typeof body.enabled === "boolean") update.enabled = body.enabled;
  if (typeof body.name === "string" && body.name.trim()) {
    update.name = body.name.trim().slice(0, 60);
  }
  if (typeof body.url === "string" && body.url.trim()) {
    try {
      await assertSafeMcpUrl(body.url.trim());
    } catch (err) {
      return Response.json(
        { error: err instanceof Error ? err.message : "Invalid URL" },
        { status: 400 },
      );
    }
    update.url = body.url.trim();
    // URL change invalidates the tool cache.
    update.tools_cache = null;
    update.tools_cached_at = null;
  }
  if (body.headers !== undefined) {
    const headers =
      body.headers && typeof body.headers === "object"
        ? Object.fromEntries(
            Object.entries(body.headers).filter(
              ([k, v]) => typeof v === "string" && k.trim(),
            ),
          )
        : {};
    const hasHeaders = Object.keys(headers).length > 0;
    update.headers_encrypted = hasHeaders ? encryptHeaderMap(headers) : null;
    update.auth_type = hasHeaders ? "headers" : "none";
  }
  if (Object.keys(update).length === 0) {
    return Response.json({ error: "Nothing to update" }, { status: 400 });
  }

  const { error } = await supabase
    .from("mcp_servers")
    .update(update)
    .eq("id", id)
    .eq("user_id", user.id);
  if (error) return Response.json({ error: error.message }, { status: 400 });
  evictPooledClient(id);
  return Response.json({ ok: true });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const { supabase, user } = await authed();
  if (!supabase || !user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { error } = await supabase
    .from("mcp_servers")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);
  if (error) return Response.json({ error: error.message }, { status: 400 });
  evictPooledClient(id);
  return Response.json({ ok: true });
}
