"use client";

import { ZoomResistantChrome } from "@/components/ZoomResistantChrome";
import { groupHasNewSummaryContent } from "@/lib/groupSummaryStaleness";
import { SUMMARY_ICON_GAP } from "@/lib/groupBounds";
import { useGroupBounds } from "@/lib/useGroupBounds";
import type { BranchGroup } from "@/lib/store";
import { useCanvasStore } from "@/lib/store";

interface GroupSummaryIconProps {
  group: BranchGroup;
}

export function GroupSummaryIcon({ group }: GroupSummaryIconProps) {
  const bounds = useGroupBounds(group);
  const openGroupArtifact = useCanvasStore((s) => s.openGroupArtifact);
  const hasNewContent = useCanvasStore((s) => {
    const g = s.groups[group.id];
    return g ? groupHasNewSummaryContent(s, g) : false;
  });

  if (!group.summaryMarkdown || !bounds) return null;

  return (
    <div
      data-group-summary-icon
      className="pointer-events-none absolute z-20"
      style={{
        left: bounds.x + bounds.w + SUMMARY_ICON_GAP,
        top: bounds.y,
      }}
    >
      <ZoomResistantChrome transformOrigin="top left">
        <button
          type="button"
          aria-label={`Open summary for ${group.label}`}
          title="Open group summary"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={() => openGroupArtifact(group.id)}
          className="pointer-events-auto relative flex h-8 w-8 items-center justify-center rounded-lg border border-canvas-border bg-canvas-card text-canvas-muted shadow-card transition-colors hover:bg-canvas-bg hover:text-canvas-ink"
        >
          <svg
            aria-hidden
            viewBox="0 0 16 16"
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M3 2.5h7l3 3V13.5H3V2.5z" />
            <path d="M10 2.5V5.5H13" />
            <path d="M5.5 8h5M5.5 10.5h3.5" />
          </svg>
          {hasNewContent && (
            <span
              aria-hidden
              className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-canvas-ink"
            />
          )}
        </button>
      </ZoomResistantChrome>
    </div>
  );
}
