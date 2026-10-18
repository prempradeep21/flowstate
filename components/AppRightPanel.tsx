"use client";



import { useEffect, useLayoutEffect, useRef, useState } from "react";

import { AdminPortalButton } from "@/components/AdminPortalButton";
import { BetaFeedbackButton } from "@/components/BetaFeedbackButton";
import { CanvasTopRightToolbar } from "@/components/CanvasTopRightToolbar";
import { LiveDrakkar } from "@/components/LiveDrakkar";
import { LocalSessionTag } from "@/components/LocalSessionTag";
import { ArtifactsPanelIcon, PanelChevronIcon } from "@/components/PanelChrome";

import { MotionPanelContent } from "@/components/motion/MotionPanel";

import { ArtifactsSection } from "@/components/sidebar/ArtifactsSection";
import { McpSection } from "@/components/sidebar/McpSection";

import { AttachmentsSection } from "@/components/sidebar/AttachmentsSection";
import { SkillsSection } from "@/components/sidebar/SkillsSection";

// Beta suggestions button is parked for now; flip to bring it back.
const SHOW_BETA_SUGGESTIONS = false;

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

      {SHOW_BETA_SUGGESTIONS && <BetaFeedbackButton />}

      {/* One unit: canvas controls + the Artifacts toggle share a pill while the
          panel is collapsed; once it opens, the controls keep their own pill
          beside it. The aside stays in the same tree so it never remounts. */}
      <div
        className={
          collapsed
            ? "flex items-center gap-1 rounded-canvas border border-canvas-border bg-canvas-card p-1 shadow-card"
            : "flex items-start gap-2"
        }
      >

      <CanvasTopRightToolbar framed={!collapsed} />

      {collapsed && (
        <div className="mx-0.5 h-6 w-px shrink-0 bg-canvas-border" aria-hidden />
      )}

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

        collapsedClassName="h-[34px] px-2 sm:px-3"

        collapsedContent={

          <button

            type="button"
            data-coach-target="artifacts-panel-entry"

            onClick={toggleRightPanel}

            aria-label="Open artifacts panel"

            className="btn gap-2 rounded-canvas text-canvas-onAccent"

          >

            <ArtifactsPanelIcon className="h-5 w-5 shrink-0 text-canvas-onAccent" />

            <span className="hidden text-canvas-body-sm font-medium text-canvas-onAccent sm:inline">
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

    </div>

  );

}

