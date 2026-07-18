// Mid-turn tool-call approval. The executor (inside the streaming chat
// request) emits an SSE event, the popup next to the chatbox POSTs the
// decision to /api/mcp/approvals, and this module polls the row until
// decided. DB polling (not in-memory promises) because on serverless the
// decision POST may land on a different instance than the stream.

import { randomUUID } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import type { McpToolHandle } from "@/lib/mcp/types";

type Supabase = SupabaseClient<Database>;

const POLL_INTERVAL_MS = 1_500;
const APPROVAL_TIMEOUT_MS = 75_000;
const MAX_PREVIEW_CHARS = 2_000;

export type ApprovalOutcome =
  | { allowed: true }
  | { allowed: false; reason: "denied" | "timeout" | "aborted" };

export interface ApprovalContext {
  supabase: Supabase;
  userId: string;
  signal?: AbortSignal;
  emit: (event: Record<string, unknown>) => void;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Trim tool input for display so huge payloads don't flood the popup. */
export function buildInputPreview(input: Record<string, unknown>): Record<string, unknown> {
  try {
    const json = JSON.stringify(input);
    if (json.length <= MAX_PREVIEW_CHARS) return input;
    return { _truncated: `${json.slice(0, MAX_PREVIEW_CHARS)}…` };
  } catch {
    return {};
  }
}

/**
 * Resolve whether this tool call may run: remembered grant (hash-validated)
 * → allow/deny immediately; otherwise prompt the user and poll for the
 * decision. "Always" decisions are persisted by the approvals route.
 */
export async function resolveApproval(
  ctx: ApprovalContext,
  handle: McpToolHandle,
  input: Record<string, unknown>,
  toolDescription: string,
): Promise<ApprovalOutcome> {
  const { supabase, userId, signal, emit } = ctx;

  const { data: grant } = await supabase
    .from("mcp_tool_grants")
    .select("decision, tool_hash")
    .eq("user_id", userId)
    .eq("server_id", handle.serverId)
    .eq("tool_name", handle.originalName)
    .maybeSingle();

  if (grant) {
    if (grant.tool_hash === handle.toolHash) {
      return grant.decision === "always" ? { allowed: true } : { allowed: false, reason: "denied" };
    }
    // Tool definition changed since the grant (rug-pull protection): drop it.
    await supabase
      .from("mcp_tool_grants")
      .delete()
      .eq("user_id", userId)
      .eq("server_id", handle.serverId)
      .eq("tool_name", handle.originalName);
  }

  const requestId = randomUUID();
  const { error: insertError } = await supabase.from("mcp_approval_requests").insert({
    id: requestId,
    user_id: userId,
    server_id: handle.serverId,
    tool_name: handle.originalName,
    input_preview: buildInputPreview(input) as Database["public"]["Tables"]["mcp_approval_requests"]["Insert"]["input_preview"],
    tool_hash: handle.toolHash,
  });
  if (insertError) {
    return { allowed: false, reason: "denied" };
  }

  emit({
    mcpApproval: {
      requestId,
      serverId: handle.serverId,
      serverName: handle.serverName,
      toolName: handle.originalName,
      description: toolDescription,
      inputPreview: buildInputPreview(input),
    },
  });

  const deadline = Date.now() + APPROVAL_TIMEOUT_MS;
  while (Date.now() < deadline) {
    if (signal?.aborted) {
      await supabase
        .from("mcp_approval_requests")
        .update({ status: "cancelled", decided_at: new Date().toISOString() })
        .eq("id", requestId)
        .eq("status", "pending");
      return { allowed: false, reason: "aborted" };
    }
    const { data: row } = await supabase
      .from("mcp_approval_requests")
      .select("status")
      .eq("id", requestId)
      .maybeSingle();
    const status = row?.status;
    if (status && status !== "pending") {
      emit({ mcpApprovalResolved: { requestId } });
      if (status === "allow_once" || status === "always") return { allowed: true };
      return { allowed: false, reason: "denied" };
    }
    await sleep(POLL_INTERVAL_MS);
  }

  await supabase
    .from("mcp_approval_requests")
    .update({ status: "expired", decided_at: new Date().toISOString() })
    .eq("id", requestId)
    .eq("status", "pending");
  emit({ mcpApprovalResolved: { requestId } });
  return { allowed: false, reason: "timeout" };
}
