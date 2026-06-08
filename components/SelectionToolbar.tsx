"use client";

import { useState } from "react";
import { useSelectionToolbarAnchor } from "@/hooks/useSelectionToolbarAnchor";
import { deriveGroupLabel } from "@/lib/deriveGroupLabel";
import { summarizeGroup } from "@/lib/summarizeGroup";
import { useCanvasStore } from "@/lib/store";

export function SelectionToolbar() {
  const anchor = useSelectionToolbarAnchor();
  const selectedFamilyRootIds = useCanvasStore(
    (s) => s.selectedFamilyRootIds,
  );
  const activeGroupId = useCanvasStore((s) => s.activeGroupId);
  const groups = useCanvasStore((s) => s.groups);
  const selectedModel = useCanvasStore((s) => s.selectedModel);
  const clearSelection = useCanvasStore((s) => s.clearSelection);
  const createGroupFromSelection = useCanvasStore(
    (s) => s.createGroupFromSelection,
  );

  const [summarizing, setSummarizing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const activeGroup = activeGroupId ? groups[activeGroupId] : null;
  const hasSelection = selectedFamilyRootIds.length > 0;
  const showToolbar = hasSelection || activeGroup;

  if (!showToolbar || !anchor) return null;

  const handleGroup = () => {
    setError(null);
    const state = useCanvasStore.getState();
    const label = deriveGroupLabel(state, state.selectedFamilyRootIds);
    createGroupFromSelection(label);
  };

  const handleSummarize = async () => {
    if (!activeGroupId) return;
    setError(null);
    setSummarizing(true);
    const result = await summarizeGroup(activeGroupId, selectedModel);
    setSummarizing(false);
    if (!result.ok) setError(result.error);
  };

  const selectionLabel =
    selectedFamilyRootIds.length === 1
      ? "1 thread selected"
      : `${selectedFamilyRootIds.length} threads selected`;

  return (
    <div
      className="pointer-events-auto absolute z-40 min-w-[200px] max-w-[280px]"
      style={{
        left: anchor.left,
        top: anchor.top,
        transform: "translate(-50%, -100%)",
      }}
    >
      <div className="rounded-canvas border border-canvas-border/90 bg-canvas-card/95 px-3.5 py-3 shadow-[0_8px_30px_rgb(44_42_38/0.12)] backdrop-blur-sm ring-1 ring-black/[0.04]">
        {hasSelection && (
          <>
            <p className="text-canvas-caption font-medium uppercase tracking-[0.06em] text-canvas-muted">
              Selection
            </p>
            <p className="mt-1 text-canvas-body-sm leading-snug text-canvas-ink">
              {selectionLabel}
            </p>
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                onClick={() => clearSelection()}
                className="flex-1 rounded-canvas border border-canvas-border bg-canvas-card px-3 py-1.5 text-canvas-compact font-medium text-canvas-muted transition-colors hover:border-canvas-ink/20 hover:bg-canvas-bg hover:text-canvas-ink"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleGroup}
                className="flex-1 rounded-canvas bg-canvas-ink px-3 py-1.5 text-canvas-compact font-medium text-canvas-card shadow-sm transition-opacity hover:opacity-90"
              >
                Group
              </button>
            </div>
          </>
        )}
        {activeGroup && !hasSelection && (
          <>
            <p className="text-canvas-caption font-medium uppercase tracking-[0.06em] text-canvas-muted">
              Group
            </p>
            <p className="mt-1 truncate text-canvas-body-sm font-medium leading-snug text-canvas-ink">
              {activeGroup.label}
            </p>
            <button
              type="button"
              disabled={summarizing || Boolean(activeGroup.summaryMarkdown)}
              onClick={handleSummarize}
              className="mt-3 w-full rounded-canvas bg-canvas-ink px-3 py-1.5 text-canvas-compact font-medium text-canvas-card shadow-sm transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {summarizing
                ? "Summarizing…"
                : activeGroup.summaryMarkdown
                  ? "Summarized"
                  : "Summarize"}
            </button>
          </>
        )}
        {error && (
          <p className="mt-2 text-canvas-caption leading-snug text-canvas-danger">{error}</p>
        )}
      </div>
    </div>
  );
}
