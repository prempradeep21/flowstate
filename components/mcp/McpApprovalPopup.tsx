"use client";

import { useState } from "react";
import { useCanvasStore } from "@/lib/store";

/**
 * Floating approval dock for paused MCP tool calls. Rendered once at
 * workspace level (fixed above the bottom toolbar) so it is visible no
 * matter which card is streaming or which view mode is active — a
 * mid-stream card renders no composer, so anchoring to the composer would
 * hide the prompt exactly when it's needed.
 *
 * Deliberately NOT dismissed by outside clicks — an accidental click must
 * not deny a tool call. It persists until decided, resolved elsewhere, or
 * the stream ends. Approvals queue: the oldest shows first.
 */
export function McpApprovalDock() {
  const approvals = useCanvasStore((s) => s.pendingMcpApprovals);
  const resolveMcpApproval = useCanvasStore((s) => s.resolveMcpApproval);
  const [busy, setBusy] = useState(false);
  const [showInput, setShowInput] = useState(false);

  const approval = approvals[0];
  if (!approval) return null;

  const decide = async (decision: "allow_once" | "always" | "deny") => {
    if (busy) return;
    setBusy(true);
    try {
      await fetch("/api/mcp/approvals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId: approval.requestId, decision }),
      });
    } catch {
      // The server-side poll will time out and deny; still dismiss locally.
    } finally {
      resolveMcpApproval(approval.requestId);
      setBusy(false);
      setShowInput(false);
    }
  };

  const inputJson = JSON.stringify(approval.inputPreview, null, 2);

  return (
    <div
      data-mcp-approval
      className="pointer-events-none absolute inset-x-0 bottom-24 z-[70] flex justify-center px-4"
      role="alertdialog"
      aria-label={`Permission request from ${approval.serverName}`}
    >
      <div className="pointer-events-auto w-full max-w-md rounded-canvas border border-canvas-accent/40 bg-canvas-card p-3 shadow-artifactHover">
        <div className="flex items-start gap-2">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-canvas-ink">
              Allow <span className="font-semibold">{approval.serverName}</span> to run{" "}
              <span className="font-mono text-[13px]">{approval.toolName}</span>?
            </p>
            {approval.description ? (
              <p className="mt-0.5 line-clamp-2 text-xs text-canvas-muted">
                {approval.description}
              </p>
            ) : null}
            {Object.keys(approval.inputPreview).length > 0 ? (
              <button
                type="button"
                className="btn mt-1 text-xs text-canvas-accent"
                onClick={() => setShowInput((v) => !v)}
              >
                {showInput ? "Hide input" : "Show input"}
              </button>
            ) : null}
            {showInput ? (
              <pre className="mt-1 max-h-32 overflow-auto rounded-lg border border-canvas-border bg-canvas-bg p-2 text-[11px] leading-snug text-canvas-muted">
                {inputJson}
              </pre>
            ) : null}
          </div>
          {approvals.length > 1 ? (
            <span className="shrink-0 rounded-full bg-canvas-bg px-2 py-0.5 text-[10px] text-canvas-muted">
              +{approvals.length - 1} more
            </span>
          ) : null}
        </div>
        <div className="mt-2 flex items-center gap-2">
          <button
            type="button"
            disabled={busy}
            className="btn rounded-full bg-canvas-accent px-3 py-1 text-xs font-medium text-white disabled:opacity-50"
            onClick={() => void decide("allow_once")}
          >
            Allow once
          </button>
          <button
            type="button"
            disabled={busy}
            className="btn rounded-full border border-canvas-border px-3 py-1 text-xs font-medium text-canvas-ink disabled:opacity-50"
            onClick={() => void decide("always")}
          >
            Always allow
          </button>
          <button
            type="button"
            disabled={busy}
            className="btn ml-auto rounded-full px-3 py-1 text-xs font-medium text-canvas-muted disabled:opacity-50"
            onClick={() => void decide("deny")}
          >
            Deny
          </button>
        </div>
      </div>
    </div>
  );
}
