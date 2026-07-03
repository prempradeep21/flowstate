"use client";

import { useState } from "react";
import {
  AlignCenterHorizontal,
  AlignCenterVertical,
  AlignEndHorizontal,
  AlignEndVertical,
  AlignStartHorizontal,
  AlignStartVertical,
  type LucideIcon,
} from "lucide-react";
import { Icon } from "@/components/ui/Icon";
import { useSelectionToolbarAnchor } from "@/hooks/useSelectionToolbarAnchor";
import type { AlignMode } from "@/lib/canvasArrange";
import { deriveGroupLabel } from "@/lib/deriveGroupLabel";
import { summarizeGroup } from "@/lib/summarizeGroup";
import { useCanvasStore } from "@/lib/store";

const ALIGN_ACTIONS: { mode: AlignMode; label: string; icon: LucideIcon }[] = [
  { mode: "left", label: "Align left", icon: AlignStartVertical },
  {
    mode: "centerX",
    label: "Align horizontal centers",
    icon: AlignCenterVertical,
  },
  { mode: "right", label: "Align right", icon: AlignEndVertical },
  { mode: "top", label: "Align top", icon: AlignStartHorizontal },
  {
    mode: "centerY",
    label: "Align vertical centers",
    icon: AlignCenterHorizontal,
  },
  { mode: "bottom", label: "Align bottom", icon: AlignEndHorizontal },
];

function ToolbarIconButton({
  label,
  icon,
  onClick,
}: {
  label: string;
  icon: LucideIcon;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={onClick}
      className="flex h-7 w-7 items-center justify-center rounded-canvas-md text-canvas-muted transition-colors hover:bg-canvas-bg hover:text-canvas-ink"
    >
      <Icon icon={icon} size="inline" />
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
        <div className="flex items-center gap-0.5 rounded-canvas border border-canvas-border/90 bg-canvas-card/95 px-1.5 py-1 backdrop-blur-sm">
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
                className="rounded-canvas bg-canvas-ink px-2.5 py-1 text-canvas-compact font-medium text-canvas-card transition-opacity hover:opacity-90"
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
      <div className="rounded-canvas border border-canvas-border/90 bg-canvas-card/95 px-3.5 py-3 backdrop-blur-sm">
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
              className="mt-3 w-full rounded-canvas bg-canvas-ink px-3 py-1.5 text-canvas-compact font-medium text-canvas-card transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
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
