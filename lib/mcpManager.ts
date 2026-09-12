// Real MCP manager (replaces the former stub). Server-only.
//
// Tool listing is served from the DB cache (lib/mcp/toolCache) so chat
// requests never open MCP connections at prompt-build time; connections are
// made lazily when a tool is actually called.

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import type { NeutralToolDef } from "@/lib/llm/provider";
import { connectMcpServer, evictPooledClient } from "@/lib/mcp/client";
import { getMcpToolsForUser } from "@/lib/mcp/toolCache";
import type { McpToolHandle } from "@/lib/mcp/types";

export interface McpImage {
  mimeType: string;
  data: string;
}

export interface McpToolResult {
  text: string;
  images: McpImage[];
  /** Set when the server returned a full HTML document worth rendering. */
  html?: string;
}

export type McpServerHandle = McpToolHandle;

export interface McpToolsResult {
  /** Provider-neutral tool definitions exposed to the LLM. */
  tools: NeutralToolDef[];
  registry: Map<string, McpToolHandle>;
}

type Supabase = SupabaseClient<Database>;

/** All enabled MCP tools for the signed-in user (cache-served). */
export async function getMcpTools(
  supabase: Supabase,
  userId: string,
  origin?: string,
): Promise<McpToolsResult> {
  return getMcpToolsForUser(supabase, userId, origin);
}

const CALL_TIMEOUT_MS = 45_000;
const MAX_TEXT_CHARS = 16_000;

/** Execute one MCP tool call against its server (lazy connect, pooled). */
export async function callMcpTool(
  supabase: Supabase,
  handle: McpToolHandle,
  input: Record<string, unknown>,
  origin?: string,
): Promise<McpToolResult> {
  const { data: row } = await supabase
    .from("mcp_servers")
    .select("*")
    .eq("id", handle.serverId)
    .maybeSingle();
  if (!row || !row.enabled) {
    return { text: `MCP server "${handle.serverName}" is not available.`, images: [] };
  }

  try {
    const client = await connectMcpServer(row, {
      authCtx: { supabase, userId: row.user_id, origin },
    });
    const result = await client.callTool(
      { name: handle.originalName, arguments: input },
      undefined,
      { timeout: CALL_TIMEOUT_MS },
    );
    return shapeCallResult(result as { content?: unknown; isError?: boolean });
  } catch (err) {
    evictPooledClient(handle.serverId);
    throw err;
  }
}

/** Map MCP CallToolResult content blocks to {text, images, html?}. */
function shapeCallResult(result: { content?: unknown; isError?: boolean }): McpToolResult {
  const texts: string[] = [];
  const images: McpImage[] = [];
  let html: string | undefined;

  const content = Array.isArray(result.content) ? result.content : [];
  for (const item of content) {
    if (!item || typeof item !== "object") continue;
    const block = item as Record<string, unknown>;
    if (block.type === "text" && typeof block.text === "string") {
      texts.push(block.text);
      if (!html && looksLikeHtmlDocument(block.text)) html = block.text;
    } else if (
      block.type === "image" &&
      typeof block.data === "string" &&
      typeof block.mimeType === "string"
    ) {
      images.push({ mimeType: block.mimeType, data: block.data });
    } else if (block.type === "resource" && block.resource && typeof block.resource === "object") {
      const resource = block.resource as Record<string, unknown>;
      if (typeof resource.text === "string") {
        texts.push(resource.text);
        const mime = typeof resource.mimeType === "string" ? resource.mimeType : "";
        if (!html && (mime.includes("html") || looksLikeHtmlDocument(resource.text))) {
          html = resource.text;
        }
      }
    }
  }

  let text = texts.join("\n\n").trim();
  if (text.length > MAX_TEXT_CHARS) {
    text = `${text.slice(0, MAX_TEXT_CHARS)}\n[truncated]`;
  }
  if (!text && images.length === 0) {
    text = result.isError ? "The MCP tool reported an error." : "The MCP tool returned no content.";
  }
  if (result.isError && text) {
    text = `MCP tool error: ${text}`;
  }
  return { text, images, html };
}

function looksLikeHtmlDocument(text: string): boolean {
  return /^\s*(<!doctype html|<html)/i.test(text);
}
