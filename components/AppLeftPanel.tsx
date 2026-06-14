"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { AuthButton } from "@/components/AuthButton";
import { useAuth } from "@/components/AuthProvider";
import { FlowstateBrand } from "@/components/FlowstateBrand";
import { MotionPanelLine } from "@/components/motion/MotionPanelLine";
import { PanelChevronIcon } from "@/components/PanelChrome";
import { SaveStatusBadge } from "@/components/SaveStatusBadge";
import { MotionPanelContent } from "@/components/motion/MotionPanel";
import { ArtifactUpdateCenter } from "@/components/ArtifactUpdateCenter";
import { CanvasesSection } from "@/components/sidebar/CanvasesSection";
import {
  LEFT_PANEL_SECTIONS,
  PANEL_LINE_STAGGER_MS,
} from "@/lib/motion/variants";
import { useCanvasStore } from "@/lib/store";

export function AppLeftPanel() {
  const collapsed = useCanvasStore((s) => s.leftPanelCollapsed);
  const toggleLeftPanel = useCanvasStore((s) => s.toggleLeftPanel);
  const { activeCanvasId, canvases } = useAuth();
  const activeCanvasTitle =
    canvases.find((c) => c.id === activeCanvasId)?.title ?? "Canvas";
  const [lineStaggerActive, setLineStaggerActive] = useState(false);
  const [staggerKey, setStaggerKey] = useState(0);
  const prevCollapsedRef = useRef<boolean | null>(null);

  useLayoutEffect(() => {
    if (prevCollapsedRef.current === true && collapsed === false) {
      setStaggerKey((k) => k + 1);
      setLineStaggerActive(true);
    }
    prevCollapsedRef.current = collapsed;
  }, [collapsed]);

  useEffect(() => {
    if (!lineStaggerActive) return;
    const timer = window.setTimeout(
      () => setLineStaggerActive(false),
      PANEL_LINE_STAGGER_MS,
    );
    return () => window.clearTimeout(timer);
  }, [lineStaggerActive, staggerKey]);

  return (
    <div className="pointer-events-none absolute left-3 top-3 z-40 flex max-w-[min(20rem,40vw)] flex-col items-start gap-5">
      <aside
        className={[
          "pointer-events-auto flex flex-col overflow-hidden rounded-canvas border border-canvas-border bg-canvas-card shadow-card transition-[width,height] duration-panel ease-panel",
          collapsed ? "w-auto" : "w-[315px]",
        ].join(" ")}
        style={collapsed ? undefined : { height: "calc(100vh - 24px)" }}
      >
        <MotionPanelContent
        side="left"
        collapsed={collapsed}
        collapsedContent={
          <>
            <FlowstateBrand compact />
            <span
              className="min-w-0 max-w-[min(12rem,28vw)] truncate text-canvas-body-sm font-medium text-canvas-ink"
              title={activeCanvasTitle}
            >
              {activeCanvasTitle}
            </span>
            <button
              type="button"
              onClick={toggleLeftPanel}
              aria-label="Open sidebar"
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-canvas text-canvas-muted transition-colors hover:bg-canvas-bg hover:text-canvas-ink"
            >
              <PanelChevronIcon direction="right" className="h-4 w-4" />
            </button>
          </>
        }
        expandedContent={
          <>
            <MotionPanelLine
              key={`header-${staggerKey}`}
              section={LEFT_PANEL_SECTIONS.header}
              item={0}
              staggerActive={lineStaggerActive}
              className="flex items-center justify-between gap-2 border-b border-canvas-border px-3 py-3"
            >
              <FlowstateBrand />
              <button
                type="button"
                onClick={toggleLeftPanel}
                aria-label="Collapse sidebar"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-canvas text-canvas-muted transition-colors hover:bg-canvas-bg hover:text-canvas-ink"
              >
                <PanelChevronIcon direction="left" />
              </button>
            </MotionPanelLine>

            <div className="flex-1 overflow-y-auto">
              <CanvasesSection
                key={`canvases-${staggerKey}`}
                staggerActive={lineStaggerActive}
              />
            </div>

            <div className="space-y-2 border-t border-canvas-border p-3">
              <MotionPanelLine
                section={LEFT_PANEL_SECTIONS.footer}
                item={0}
                staggerActive={lineStaggerActive}
              >
                <SaveStatusBadge size="panel" />
              </MotionPanelLine>
              <MotionPanelLine
                section={LEFT_PANEL_SECTIONS.footer}
                item={1}
                staggerActive={lineStaggerActive}
              >
                <AuthButton size="panel" />
              </MotionPanelLine>
            </div>
          </>
        }
      />
      </aside>
      {collapsed ? <ArtifactUpdateCenter /> : null}
    </div>
  );
}

