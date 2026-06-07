"use client";

import { AuthButton } from "@/components/AuthButton";
import { FlowstateBrand } from "@/components/FlowstateBrand";
import { SaveStatusBadge } from "@/components/SaveStatusBadge";
import { CanvasesSection } from "@/components/sidebar/CanvasesSection";
import { useCanvasStore } from "@/lib/store";

export function AppLeftPanel() {
  const collapsed = useCanvasStore((s) => s.leftPanelCollapsed);
  const toggleLeftPanel = useCanvasStore((s) => s.toggleLeftPanel);

  return (
    <aside
      className={`floating-panel floating-panel-left pointer-events-auto flex flex-col ${
        collapsed ? "w-[78px]" : "w-[420px]"
      }`}
    >
      <div
        className={[
          "absolute inset-0 flex flex-col items-center py-3 transition-opacity duration-panel ease-panel",
          collapsed ? "opacity-100" : "pointer-events-none opacity-0",
        ].join(" ")}
      >
        <FlowstateBrand compact />
        <button
          type="button"
          onClick={toggleLeftPanel}
          aria-label="Expand sidebar"
          className="mt-4 flex h-12 w-12 items-center justify-center rounded-lg text-canvas-muted transition-colors hover:bg-canvas-bg hover:text-canvas-ink"
        >
          <ChevronIcon direction="right" />
        </button>
      </div>

      <div
        className={[
          "flex h-full min-w-[420px] flex-col transition-opacity duration-panel ease-panel",
          collapsed ? "pointer-events-none opacity-0" : "opacity-100",
        ].join(" ")}
      >
        <div className="flex items-center justify-between gap-2 border-b border-canvas-border px-3 py-3">
          <FlowstateBrand />
          <button
            type="button"
            onClick={toggleLeftPanel}
            aria-label="Collapse sidebar"
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg text-canvas-muted transition-colors hover:bg-canvas-bg hover:text-canvas-ink"
          >
            <ChevronIcon direction="left" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          <CanvasesSection />
        </div>

        <div className="space-y-2 border-t border-canvas-border p-3">
          <SaveStatusBadge size="panel" />
          <AuthButton size="panel" />
        </div>
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
