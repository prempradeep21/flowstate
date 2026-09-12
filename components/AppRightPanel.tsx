"use client";



import { useEffect, useLayoutEffect, useRef, useState } from "react";

import { AdminPortalButton } from "@/components/AdminPortalButton";
import { BetaFeedbackButton } from "@/components/BetaFeedbackButton";
import { LiveDrakkar } from "@/components/LiveDrakkar";
import { LocalSessionTag } from "@/components/LocalSessionTag";
import { ArtifactsPanelIcon, PanelChevronIcon } from "@/components/PanelChrome";

import { MotionPanelContent } from "@/components/motion/MotionPanel";

import { ArtifactsSection } from "@/components/sidebar/ArtifactsSection";
import { McpSection } from "@/components/sidebar/McpSection";

import { AttachmentsSection } from "@/components/sidebar/AttachmentsSection";
import { SkillsSection } from "@/components/sidebar/SkillsSection";

import { SIDEBAR_TILE_STAGGER_MS } from "@/lib/motion/variants";

import { useCanvasStore } from "@/lib/store";



export function AppRightPanel() {

  const collapsed = useCanvasStore((s) => s.rightPanelCollapsed);

  const toggleRightPanel = useCanvasStore((s) => s.toggleRightPanel);

  const [activeTab, setActiveTab] = useState<
    "artifacts" | "assets" | "skills" | "mcp"
  >("artifacts");
  const tabLabels: Record<typeof activeTab, string> = {
    artifacts: "Artifacts",
    assets: "Assets",
    skills: "Skills",
    mcp: "MCP",
  };
  const [tileStaggerActive, setTileStaggerActive] = useState(false);
  const [staggerKey, setStaggerKey] = useState(0);
  const prevCollapsedRef = useRef<boolean | null>(null);

  useLayoutEffect(() => {
    if (prevCollapsedRef.current === true && collapsed === false) {
      setStaggerKey((k) => k + 1);
      setTileStaggerActive(true);
    }
    prevCollapsedRef.current = collapsed;
  }, [collapsed]);

  useEffect(() => {
    if (!tileStaggerActive) return;
    const timer = window.setTimeout(
      () => setTileStaggerActive(false),
      SIDEBAR_TILE_STAGGER_MS,
    );
    return () => window.clearTimeout(timer);
  }, [tileStaggerActive, staggerKey]);



  return (

    <div className="pointer-events-auto absolute right-3 top-3 z-40 flex items-start gap-2">

      <LocalSessionTag />

      <LiveDrakkar />

      <AdminPortalButton />

      <BetaFeedbackButton />

      <aside
        className={[
          "flex flex-col overflow-hidden rounded-canvas border shadow-card transition-[width,height] duration-panel ease-panel",

          collapsed
            ? "w-auto border-canvas-accent bg-canvas-accent"
            : "w-[462px] border-canvas-border bg-canvas-card",

        ].join(" ")}

        style={collapsed ? undefined : { height: "calc(100vh - 24px)" }}

      >

      <MotionPanelContent

        side="right"

        collapsed={collapsed}

        collapsedContent={

          <button

            type="button"
            data-coach-target="artifacts-panel-entry"

            onClick={toggleRightPanel}

            aria-label="Open artifacts panel"

            className="btn gap-2 rounded-canvas text-canvas-onAccent"

          >

            <ArtifactsPanelIcon className="h-5 w-5 shrink-0 text-canvas-onAccent" />

            <span className="text-canvas-body-sm font-medium text-canvas-onAccent">
              {tabLabels[activeTab]}
            </span>

          </button>

        }

        expandedContent={

          <>

            <div className="flex items-center justify-between gap-2 border-b border-canvas-border px-3 py-3">

              <div className="flex min-w-0 items-center gap-2">

                <ArtifactsPanelIcon className="h-5 w-5 shrink-0 text-canvas-accent" />

                <div
                  className="flex rounded-canvas bg-canvas-bg p-0.5"
                  role="group"
                  aria-label="Right panel view"
                >
                  {(["artifacts", "assets", "skills", "mcp"] as const).map((tab) => {
                    const active = activeTab === tab;
                    return (
                      <button
                        key={tab}
                        type="button"
                        aria-pressed={active}
                        onClick={() => setActiveTab(tab)}
                        className={`btn rounded-canvas px-3 py-1 text-canvas-body-sm font-medium ${
                          tab === "mcp" ? "uppercase" : "capitalize"
                        } ${
                          active
                            ? "bg-canvas-accent text-canvas-onAccent shadow-card"
                            : "text-canvas-muted hover:text-canvas-ink"
                        }`}
                      >
                        {tab}
                      </button>
                    );
                  })}
                </div>

              </div>

          <button

            type="button"
            data-coach-target="artifacts-panel-entry"

            onClick={toggleRightPanel}

                aria-label="Collapse artifacts panel"

                className="btn h-10 w-10 shrink-0 rounded-canvas text-canvas-muted hover:text-canvas-ink"

              >

                <PanelChevronIcon direction="right" />

              </button>

            </div>



            <div className="flex-1 overflow-y-auto">

              {activeTab === "artifacts" ? (
                <ArtifactsSection
                  key={staggerKey}
                  staggerActive={tileStaggerActive}
                />
              ) : activeTab === "assets" ? (
                <AttachmentsSection />
              ) : activeTab === "skills" ? (
                <SkillsSection />
              ) : (
                <McpSection />
              )}

            </div>

          </>

        }

      />

      </aside>

    </div>

  );

}

