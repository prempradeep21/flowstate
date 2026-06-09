"use client";

import { useState } from "react";
import { useSelectionToolbarAnchor } from "@/hooks/useSelectionToolbarAnchor";
import type { AlignMode } from "@/lib/canvasArrange";
import { deriveGroupLabel } from "@/lib/deriveGroupLabel";
import { summarizeGroup } from "@/lib/summarizeGroup";
import { useCanvasStore } from "@/lib/store";

const ALIGN_ACTIONS: { mode: AlignMode; label: string; icon: string }[] = [
  { mode: "left", label: "Align left", icon: "M2 2v12M5 5h8v2H5zM5 9h5v2H5z" },
  {
    mode: "centerX",
    label: "Align horizontal centers",
    icon: "M8 2v12M4 5h8v2H4zM5.5 9h5v2h-5z",
  },
  {
    mode: "right",
    label: "Align right",
    icon: "M14 2v12M3 5h8v2H3zM6 9h5v2H6z",
  },
  { mode: "top", label: "Align top", icon: "M2 2h12M5 5h2v8H5zM9 5h2v5H9z" },
  {
    mode: "centerY",
    label: "Align vertical centers",
    icon: "M2 8h12M5 4h2v8H5zM9 5.5h2v5H9z",
  },
  {
    mode: "bottom",
    label: "Align bottom",
    icon: "M2 14h12M5 3h2v8H5zM9 6h2v5H9z",
  },
];

function ToolbarIconButton({
  label,
  icon,
  onClick,
}: {
  label: string;
  icon: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={onClick}
      className="flex h-7 w-7 items-center justify-center rounded-canvas text-canvas-muted transition-colors hover:bg-canvas-bg hover:text-canvas-ink"
    >
      <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden>
        <path d={icon} fill="currentColor" />
      </svg>
    </button>
  );
}

export function SelectionToolbar() {
  const anchor = useSelectionToolbarAnchor();
  const selectedFamilyRootIds = useCanvasStore(
    (s) => s.selectedFamilyRootIds,
  );
  const canvasSelection = useCanvasStore((s) => s.canvasSelection);
  const activeGroupId = useCanvasStore((s) => s.activeGroupId);
  const groups = useCanvasStore((s) => s.groups);
  const selectedModel = useCanvasStore((s) => s.selectedModel);
  const createGroupFromSelection = useCanvasStore(
    (s) => s.createGroupFromSelection,
  );
  const alignSelectedCanvasItems = useCanvasStore(
    (s) => s.alignSelectedCanvasItems,
  );

  const [summarizing, setSummarizing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const activeGroup = activeGroupId ? groups[activeGroupId] : null;
  const unitCount = selectedFamilyRootIds.length + canvasSelection.length;
  const hasSelection = unitCount > 0;
  const canGroup = selectedFamilyRootIds.length > 0;
  const showAlignBar = unitCount >= 2;
  const showGroupPanel = Boolean(activeGroup) && !hasSelection;

  if ((!showAlignBar && !showGroupPanel) || !anchor) return null;

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

  if (showAlignBar) {
    return (
      <div
        className="pointer-events-auto absolute z-40"
        style={{
          left: anchor.left,
          top: anchor.top,
          transform: "translate(-50%, -100%)",
        }}
      >
        <div className="flex items-center gap-0.5 rounded-canvas border border-canvas-border/90 bg-canvas-card/95 px-1.5 py-1 shadow-[0_8px_30px_rgb(44_42_38/0.12)] backdrop-blur-sm ring-1 ring-black/[0.04]">
          {ALIGN_ACTIONS.map((a) => (
            <ToolbarIconButton
              key={a.mode}
              label={a.label}
              icon={a.icon}
              onClick={() => alignSelectedCanvasItems(a.mode)}
            />
          ))}
          {canGroup && (
            <>
              <div className="mx-1 h-5 w-px bg-canvas-border" />
              <button
                type="button"
                onClick={handleGroup}
                className="rounded-canvas bg-canvas-ink px-2.5 py-1 text-canvas-compact font-medium text-canvas-card shadow-sm transition-opacity hover:opacity-90"
              >
                Group
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

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
        {activeGroup && (
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
