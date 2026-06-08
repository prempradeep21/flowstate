"use client";

import { ArtifactsPanelIcon, PanelChevronIcon } from "@/components/PanelChrome";
import { ArtifactsSection } from "@/components/sidebar/ArtifactsSection";
import { AttachmentsSection } from "@/components/sidebar/AttachmentsSection";
import { useCanvasStore } from "@/lib/store";

export function AppRightPanel() {
  const collapsed = useCanvasStore((s) => s.rightPanelCollapsed);
  const toggleRightPanel = useCanvasStore((s) => s.toggleRightPanel);

  return (
    <aside
      className={[
        "floating-panel floating-panel-right pointer-events-auto flex flex-col overflow-hidden",
        collapsed ? "w-auto" : "w-[420px]",
      ].join(" ")}
      style={collapsed ? undefined : { height: "calc(100vh - 24px)" }}
    >
      {collapsed ? (
        <button
          type="button"
          onClick={toggleRightPanel}
          aria-label="Open artifacts panel"
          className="flex items-center gap-2 px-3 py-2.5 text-canvas-ink transition-colors hover:bg-canvas-bg/80"
        >
          <ArtifactsPanelIcon className="h-5 w-5 shrink-0 text-canvas-question" />
          <span className="text-[13px] font-medium text-canvas-ink">Artifacts</span>
        </button>
      ) : (
        <div className="panel-expand-in flex h-full min-w-0 flex-col">
          <div className="flex items-center justify-between gap-2 border-b border-canvas-border px-3 py-3">
            <div className="flex min-w-0 items-center gap-2">
              <ArtifactsPanelIcon className="h-5 w-5 shrink-0 text-canvas-question" />
              <h2 className="text-[15px] font-medium text-canvas-ink">Artifacts</h2>
            </div>
            <button
              type="button"
              onClick={toggleRightPanel}
              aria-label="Collapse artifacts panel"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-canvas-muted transition-colors hover:bg-canvas-bg hover:text-canvas-ink"
            >
              <PanelChevronIcon direction="right" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto">
            <ArtifactsSection />
            <AttachmentsSection />
          </div>
        </div>
      )}
    </aside>
  );
}
