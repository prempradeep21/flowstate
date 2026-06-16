"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { AuthButton } from "@/components/AuthButton";
import { FlowstateBrand } from "@/components/FlowstateBrand";
import { MotionPanelLine } from "@/components/motion/MotionPanelLine";
import { PanelChevronIcon } from "@/components/PanelChrome";
import { SaveStatusBadge } from "@/components/SaveStatusBadge";
import { ModelPicker } from "@/components/ModelPicker";
import { MotionPanelContent } from "@/components/motion/MotionPanel";
import { CanvasesSection } from "@/components/sidebar/CanvasesSection";
import {
  LEFT_PANEL_SECTIONS,
  PANEL_LINE_STAGGER_MS,
} from "@/lib/motion/variants";
import { useCanvasStore } from "@/lib/store";

export function AppLeftPanel() {
  const collapsed = useCanvasStore((s) => s.leftPanelCollapsed);
  const toggleLeftPanel = useCanvasStore((s) => s.toggleLeftPanel);
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
    <aside
      className={[
        "floating-panel floating-panel-left pointer-events-auto flex flex-col overflow-hidden",
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
                <ModelPicker />
              </MotionPanelLine>
              <MotionPanelLine
                section={LEFT_PANEL_SECTIONS.footer}
                item={1}
                staggerActive={lineStaggerActive}
              >
                <SaveStatusBadge size="panel" />
              </MotionPanelLine>
              <MotionPanelLine
                section={LEFT_PANEL_SECTIONS.footer}
                item={2}
                staggerActive={lineStaggerActive}
              >
                <AuthButton size="panel" />
              </MotionPanelLine>
            </div>
          </>
        }
      />
    </aside>
  );
}
