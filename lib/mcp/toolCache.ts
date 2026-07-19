// Tool-list caching. Chat requests must never open MCP connections at
// prompt-build time (the route has a 3s budget) — tool definitions are served
// from mcp_servers.tools_cache and refreshed when stale, from the console, or
// after a connect. Connections only happen when a tool is actually called.

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import type { NeutralToolDef } from "@/lib/llm/provider";
import {
  connectMcpServer,
  evictPooledClient,
  isAuthRequiredError,
  type McpAuthContext,
  type McpServerRow,
} from "@/lib/mcp/client";
import { isStdioMcpAllowed } from "@/lib/supabase/environment";
import { buildExposedName, slugifyServerName } from "@/lib/mcp/naming";
import { computeToolHash } from "@/lib/mcp/toolHash";
import type { McpCachedTool, McpToolHandle } from "@/lib/mcp/types";

export const TOOLS_CACHE_TTL_MS = 10 * 60 * 1000;
const LIST_TIMEOUT_MS = 4_000;
export const MAX_TOOLS_PER_SERVER = 40;
export const MAX_TOOLS_TOTAL = 160;
const MAX_DESCRIPTION_CHARS = 600;

/** In-flight background refreshes so concurrent requests don't stack them. */
const refreshInFlight = new Set<string>();

type Supabase = SupabaseClient<Database>;

export interface McpToolCollection {
  tools: NeutralToolDef[];
  registry: Map<string, McpToolHandle>;
}

/**
 * Connect to one server, list its tools, and persist the cache columns.
 * Returns the cached tool list. Throws on connection failure (after
 * recording last_status/last_error).
 */
export async function refreshServerTools(
  supabase: Supabase,
  row: McpServerRow,
  origin?: string,
): Promise<McpCachedTool[]> {
  const authCtx: McpAuthContext = { supabase, userId: row.user_id, origin };
  try {
    const client = await connectMcpServer(row, { authCtx });
    const listed = await Promise.race([
      client.listTools(),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("tools/list timed out")), LIST_TIMEOUT_MS),
      ),
    ]);
    const tools: McpCachedTool[] = (listed.tools ?? [])
      .slice(0, MAX_TOOLS_PER_SERVER)
      .map((tool) => {
        const description = (tool.description ?? "").slice(0, MAX_DESCRIPTION_CHARS);
        const inputSchema = (tool.inputSchema ?? { type: "object" }) as Record<string, unknown>;
        return {
          name: tool.name,
          description,
          inputSchema,
          hash: computeToolHash(tool.name, description, inputSchema),
        };
      });
    const truncated = (listed.tools?.length ?? 0) > MAX_TOOLS_PER_SERVER;
    await supabase
      .from("mcp_servers")
      .update({
        tools_cache: tools as unknown as Database["public"]["Tables"]["mcp_servers"]["Update"]["tools_cache"],
        tools_cached_at: new Date().toISOString(),
        last_status: "connected",
        last_error: truncated
          ? `Server exposes more than ${MAX_TOOLS_PER_SERVER} tools; extra tools were hidden.`
          : null,
      })
      .eq("id", row.id);
    return tools;
  } catch (err) {
    evictPooledClient(row.id);
    const message = err instanceof Error ? err.message : String(err);
    const needsAuth = isAuthRequiredError(err);
    await supabase
      .from("mcp_servers")
      .update({
        last_status: needsAuth ? "needs-auth" : "error",
        last_error: needsAuth ? "Authentication required." : message.slice(0, 500),
      })
      .eq("id", row.id);
    throw err;
  }
}

export function parseCachedTools(row: McpServerRow): McpCachedTool[] {
  if (!Array.isArray(row.tools_cache)) return [];
  return (row.tools_cache as unknown[]).filter(
    (t): t is McpCachedTool =>
      !!t &&
      typeof t === "object" &&
      typeof (t as McpCachedTool).name === "string" &&
      typeof (t as McpCachedTool).hash === "string",
  );
}

function cacheIsFresh(row: McpServerRow): boolean {
  if (!row.tools_cached_at) return false;
  return Date.now() - new Date(row.tools_cached_at).getTime() < TOOLS_CACHE_TTL_MS;
}

/**
 * All enabled MCP tools for a user as provider-neutral tool defs + a registry
 * mapping exposed names back to their server. Serves from cache; refreshes
 * stale servers best-effort (failures degrade to stale cache or skip).
 */
export async function getMcpToolsForUser(
  supabase: Supabase,
  userId: string,
  origin?: string,
): Promise<McpToolCollection> {
  // Local (stdio) servers are only served where they can actually spawn a
  // process (desktop / dev). A hosted web build serves http servers only.
  let query = supabase
    .from("mcp_servers")
    .select("*")
    .eq("user_id", userId)
    .eq("enabled", true);
  if (!isStdioMcpAllowed()) query = query.eq("transport", "http");
  const { data: rows } = await query.order("created_at", { ascending: true });

  const tools: NeutralToolDef[] = [];
  const registry = new Map<string, McpToolHandle>();
  if (!rows?.length) return { tools, registry };

  // Stale-while-revalidate: the chat path serves whatever is cached (fresh or
  // stale) immediately and refreshes stale servers in the background — a slow
  // server must never eat the route's prompt-build budget and blank out ALL
  // MCP tools. Only servers with no cache at all (never connected) are
  // fetched inline, since serving nothing for them isn't an option.
  const perServer = await Promise.all(
    rows.map(async (row) => {
      const cached = parseCachedTools(row);
      if (cacheIsFresh(row)) return { row, cached };
      if (cached.length > 0) {
        if (!refreshInFlight.has(row.id)) {
          refreshInFlight.add(row.id);
          void refreshServerTools(supabase, row, origin)
            .catch(() => {})
            .finally(() => refreshInFlight.delete(row.id));
        }
        return { row, cached };
      }
      try {
        return { row, cached: await refreshServerTools(supabase, row, origin) };
      } catch {
        return { row, cached: [] };
      }
    }),
  );

  const taken = new Set<string>();
  let total = 0;
  let truncated = 0;
  for (const { row, cached } of perServer) {
    const slug = slugifyServerName(row.name);
    for (const tool of cached) {
      if (total >= MAX_TOOLS_TOTAL) {
        truncated += 1;
        continue;
      }
      const exposedName = buildExposedName(slug, tool.name, taken);
      tools.push({
        name: exposedName,
        description: `[${row.name}] ${tool.description || tool.name}`,
        inputSchema: tool.inputSchema,
      });
      registry.set(exposedName, {
        serverId: row.id,
        serverName: row.name,
        exposedName,
        originalName: tool.name,
        toolHash: tool.hash,
      });
      total += 1;
    }
  }
  if (truncated > 0) {
    console.warn(
      `[mcp] tool cap hit: exposing ${total}/${total + truncated} tools across ${rows.length} servers — disable unused servers to free slots`,
    );
  }
  return { tools, registry };
}
