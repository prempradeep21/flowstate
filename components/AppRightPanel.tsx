"use client";



import { useEffect, useLayoutEffect, useRef, useState } from "react";

import { BetaFeedbackButton } from "@/components/BetaFeedbackButton";
import { ArtifactsPanelIcon, PanelChevronIcon } from "@/components/PanelChrome";

import { MotionPanelContent } from "@/components/motion/MotionPanel";

import { ArtifactsSection } from "@/components/sidebar/ArtifactsSection";

import { AttachmentsSection } from "@/components/sidebar/AttachmentsSection";
import { SkillsSection } from "@/components/sidebar/SkillsSection";

import { SIDEBAR_TILE_STAGGER_MS } from "@/lib/motion/variants";

import { useCanvasStore } from "@/lib/store";



export function AppRightPanel() {

  const collapsed = useCanvasStore((s) => s.rightPanelCollapsed);

  const toggleRightPanel = useCanvasStore((s) => s.toggleRightPanel);

  const [activeTab, setActiveTab] = useState<
    "artifacts" | "assets" | "skills"
  >("artifacts");
  const tabLabels: Record<typeof activeTab, string> = {
    artifacts: "Artifacts",
    assets: "Assets",
    skills: "Skills",
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

      <BetaFeedbackButton />

      <aside

        className={[

          "flex flex-col overflow-hidden rounded-canvas border border-canvas-border bg-canvas-card shadow-card transition-[width,height] duration-panel ease-panel",

          collapsed ? "w-auto" : "w-[462px]",

        ].join(" ")}

        style={collapsed ? undefined : { height: "calc(100vh - 24px)" }}

      >

      <MotionPanelContent

        side="right"

        collapsed={collapsed}

        collapsedContent={

          <button

            type="button"

            onClick={toggleRightPanel}

            aria-label="Open artifacts panel"

            className="flex items-center gap-2 rounded-canvas text-canvas-ink transition-colors hover:bg-canvas-bg/80"

          >

            <ArtifactsPanelIcon className="h-5 w-5 shrink-0 text-canvas-accent" />

            <span className="text-canvas-body-sm font-medium text-canvas-ink">
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
                  {(["artifacts", "assets", "skills"] as const).map((tab) => {
                    const active = activeTab === tab;
                    return (
                      <button
                        key={tab}
                        type="button"
                        aria-pressed={active}
                        onClick={() => setActiveTab(tab)}
                        className={`rounded-canvas px-3 py-1 text-canvas-body-sm font-medium capitalize transition-colors ${
                          active
                            ? "bg-canvas-ink text-canvas-card shadow-card"
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

                onClick={toggleRightPanel}

                aria-label="Collapse artifacts panel"

                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-canvas text-canvas-muted transition-colors hover:bg-canvas-bg hover:text-canvas-ink"

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
              ) : (
                <SkillsSection />
              )}

            </div>

          </>

        }

      />

      </aside>

    </div>

  );

}

