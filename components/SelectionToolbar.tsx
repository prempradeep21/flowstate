"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
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
import {
  toolbarScreenPosition,
  useSelectionToolbarAnchor,
  type ToolbarWorldAnchor,
} from "@/hooks/useSelectionToolbarAnchor";
import { subscribeViewportPaint } from "@/lib/viewportGesture";
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

/**
 * Wrapper positioned at a WORLD anchor, converted to screen space
 * imperatively on viewport writes + gesture paints — subscribing React to
 * the live viewport re-rendered the toolbar every pan/zoom frame.
 */
function AnchoredWrapper({
  anchor,
  className,
  children,
}: {
  anchor: ToolbarWorldAnchor;
  className: string;
  children: ReactNode;
}) {
  const elRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = elRef.current;
    if (!el) return;
    const apply = (v: { x: number; y: number; scale: number }) => {
      const pos = toolbarScreenPosition(anchor, v);
      el.style.left = `${pos.left}px`;
      el.style.top = `${pos.top}px`;
    };
    apply(useCanvasStore.getState().viewport);
    const unsubStore = useCanvasStore.subscribe((state, prev) => {
      if (state.viewport !== prev.viewport) apply(state.viewport);
    });
    const unsubPaint = subscribeViewportPaint(apply);
    return () => {
      unsubStore();
      unsubPaint();
    };
  }, [anchor]);

  const initial = toolbarScreenPosition(
    anchor,
    useCanvasStore.getState().viewport,
  );
  return (
    <div
      ref={elRef}
      className={className}
      style={{
        left: initial.left,
        top: initial.top,
        transform: "translate(-50%, -100%)",
      }}
    >
      {children}
    </div>
  );
}

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
      className="btn h-7 w-7 rounded-canvas-md text-canvas-muted hover:text-canvas-ink"
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
      <AnchoredWrapper
        anchor={anchor}
        className="pointer-events-auto absolute z-40"
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
                className="btn rounded-canvas bg-canvas-accent px-2.5 py-1 text-canvas-compact font-medium text-canvas-onAccent"
              >
                Group
              </button>
            </>
          )}
        </div>
      </AnchoredWrapper>
    );
  }

  return (
    <AnchoredWrapper
      anchor={anchor}
      className="pointer-events-auto absolute z-40 min-w-[200px] max-w-[280px]"
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
              className="btn mt-3 w-full rounded-canvas bg-canvas-accent px-3 py-1.5 text-canvas-compact font-medium text-canvas-onAccent"
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
    </AnchoredWrapper>
  );
}
