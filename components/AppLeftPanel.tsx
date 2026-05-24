"use client";

import { AuthButton } from "@/components/AuthButton";
import { FlowstateBrand } from "@/components/FlowstateBrand";
import { SaveStatusBadge } from "@/components/SaveStatusBadge";
import { ArtifactsSection } from "@/components/sidebar/ArtifactsSection";
import { AttachmentsSection } from "@/components/sidebar/AttachmentsSection";
import { ViewModeToggle } from "@/components/ViewModeToggle";
import { useCanvasStore } from "@/lib/store";

export function AppLeftPanel() {
  const collapsed = useCanvasStore((s) => s.leftPanelCollapsed);
  const toggleLeftPanel = useCanvasStore((s) => s.toggleLeftPanel);

  if (collapsed) {
    return (
      <aside className="flex w-[52px] shrink-0 flex-col items-center border-r border-canvas-border bg-canvas-card py-3">
        <FlowstateBrand compact />
        <button
          type="button"
          onClick={toggleLeftPanel}
          aria-label="Expand sidebar"
          className="mt-4 flex h-8 w-8 items-center justify-center rounded-lg text-canvas-muted transition-colors hover:bg-canvas-bg hover:text-canvas-ink"
        >
          <ChevronIcon direction="right" />
        </button>
      </aside>
    );
  }

  return (
    <aside className="flex w-[280px] shrink-0 flex-col border-r border-canvas-border bg-canvas-card">
      <div className="flex items-center justify-between gap-2 border-b border-canvas-border px-3 py-3">
        <FlowstateBrand />
        <button
          type="button"
          onClick={toggleLeftPanel}
          aria-label="Collapse sidebar"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-canvas-muted transition-colors hover:bg-canvas-bg hover:text-canvas-ink"
        >
          <ChevronIcon direction="left" />
        </button>
      </div>

      <div className="border-b border-canvas-border px-3 py-3">
        <ViewModeToggle />
      </div>

      <div className="flex-1 overflow-y-auto">
        <ArtifactsSection />
        <AttachmentsSection />
      </div>

      <div className="space-y-2 border-t border-canvas-border p-3">
        <SaveStatusBadge />
        <AuthButton />
      </div>
    </aside>
  );
}

function ChevronIcon({ direction }: { direction: "left" | "right" }) {
  return (
    <svg
      viewBox="0 0 16 16"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden
    >
      {direction === "left" ? (
        <path d="M10 3 5 8l5 5" strokeLinecap="round" strokeLinejoin="round" />
      ) : (
        <path d="M6 3l5 5-5 5" strokeLinecap="round" strokeLinejoin="round" />
      )}
    </svg>
  );
}
