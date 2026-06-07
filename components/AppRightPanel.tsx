"use client";

import { ArtifactsSection } from "@/components/sidebar/ArtifactsSection";
import { AttachmentsSection } from "@/components/sidebar/AttachmentsSection";
import { useCanvasStore } from "@/lib/store";

export function AppRightPanel() {
  const collapsed = useCanvasStore((s) => s.rightPanelCollapsed);
  const toggleRightPanel = useCanvasStore((s) => s.toggleRightPanel);

  if (collapsed) {
    return (
      <aside className="pointer-events-auto absolute right-0 top-0 z-40 flex h-full w-[78px] flex-col items-center border-l border-canvas-border bg-canvas-card py-3">
        <button
          type="button"
          onClick={toggleRightPanel}
          aria-label="Expand artifacts panel"
          className="flex h-12 w-12 items-center justify-center rounded-lg text-canvas-muted transition-colors hover:bg-canvas-bg hover:text-canvas-ink"
        >
          <ChevronIcon direction="left" />
        </button>
        <span className="mt-3 rotate-90 text-[11px] font-medium uppercase tracking-wide text-canvas-muted">
          Artifacts
        </span>
      </aside>
    );
  }

  return (
    <aside className="pointer-events-auto absolute right-0 top-0 z-40 flex h-full w-[420px] flex-col border-l border-canvas-border bg-canvas-card shadow-xl">
      <div className="flex items-center justify-between gap-2 border-b border-canvas-border px-3 py-3">
        <h2 className="text-[15px] font-medium text-canvas-ink">Canvas artifacts</h2>
        <button
          type="button"
          onClick={toggleRightPanel}
          aria-label="Collapse artifacts panel"
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg text-canvas-muted transition-colors hover:bg-canvas-bg hover:text-canvas-ink"
        >
          <ChevronIcon direction="right" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        <ArtifactsSection />
        <AttachmentsSection />
      </div>
    </aside>
  );
}

function ChevronIcon({ direction }: { direction: "left" | "right" }) {
  return (
    <svg
      viewBox="0 0 16 16"
      className="h-6 w-6"
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
