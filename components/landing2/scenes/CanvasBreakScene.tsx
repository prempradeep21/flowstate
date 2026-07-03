"use client";

import { LANDING2_COPY } from "@/components/landing2/landing2Copy";
import { Landing2CanvasFrame } from "@/components/landing2/shared/Landing2CanvasFrame";
import {
  Landing2PinnedSection,
  Landing2SceneTitle,
} from "@/components/landing2/shared/Landing2PinnedSection";
import { Landing2SceneShell } from "@/components/landing2/shared/Landing2SceneShell";
import { Landing2SpatialStage } from "@/components/landing2/shared/Landing2SpatialStage";
import { buildLanding2CanvasSnapshot } from "@/lib/landing2/buildLanding2CanvasSnapshot";
import { LANDING2_BRANCH_PLACEMENTS } from "@/lib/landing2/landing2SpatialCards";
import { LANDING2_SCENE_WASH } from "@/lib/landing2/landing2Theme";
import { useReducedMotion } from "@/lib/motion/useReducedMotion";
import { m, useTransform, type MotionValue } from "framer-motion";

function CanvasBreakContent({
  scrollYProgress,
}: {
  scrollYProgress: MotionValue<number>;
}) {
  const copy = LANDING2_COPY.canvasBreak;
  const accent = LANDING2_SCENE_WASH["canvas-break"].accent;
  const reducedMotion = useReducedMotion();

  const staticOpacity = useTransform(scrollYProgress, [0, 0.25, 0.45], [1, 0.5, 0]);
  const canvasOpacity = useTransform(scrollYProgress, [0.2, 0.45, 1], [0, 1, 1]);
  const canvasScale = useTransform(scrollYProgress, [0.2, 0.55], [0.96, 1]);
  const copyOpacity = useTransform(scrollYProgress, [0.5, 0.68, 0.95], [0, 1, 1]);
  const copyY = useTransform(scrollYProgress, [0.5, 0.68], [24, 0]);

  if (reducedMotion) {
    return (
      <Landing2SceneShell sceneId="canvas-break">
        <div className="flex h-full flex-col">
          <div className="flex-1 px-6 py-16">
            <Landing2SceneTitle
              variant="hero"
              eyebrow={copy.kicker}
              title={copy.headline}
              body={copy.body}
              accentColour={accent}
            />
          </div>
          <div className="h-[55vh] w-full">
            <Landing2CanvasFrame
              buildSnapshot={buildLanding2CanvasSnapshot}
              fullBleed
            />
          </div>
        </div>
      </Landing2SceneShell>
    );
  }

  return (
    <Landing2SceneShell sceneId="canvas-break" showGrid={false} showOrbs>
      <m.div
        className="absolute inset-0 z-10"
        style={{ opacity: staticOpacity }}
      >
        <Landing2SpatialStage
          placements={LANDING2_BRANCH_PLACEMENTS}
          scrollYProgress={scrollYProgress}
          showConnectors
        />
      </m.div>

      <m.div
        className="absolute inset-0 z-20"
        style={{ opacity: canvasOpacity, scale: canvasScale }}
      >
        <Landing2CanvasFrame
          buildSnapshot={buildLanding2CanvasSnapshot}
          fullBleed
          label="Flowstate live canvas"
        />
      </m.div>

      <m.div
        className="pointer-events-none absolute inset-x-0 top-0 z-30 px-6 pt-20 sm:px-12 lg:px-16"
        style={{ opacity: copyOpacity, y: copyY }}
      >
        <div
          className="inline-block rounded-canvas border border-canvas-border/60 bg-canvas-card/85 px-6 py-5 shadow-card backdrop-blur-md"
        >
          <Landing2SceneTitle
            variant="hero"
            eyebrow={copy.tagline}
            title={copy.headline}
            body={copy.body}
            accentColour={accent}
            className="max-w-xl"
          />
        </div>
      </m.div>
    </Landing2SceneShell>
  );
}

export function CanvasBreakScene() {
  return (
    <Landing2PinnedSection sceneId="canvas-break">
      {({ scrollYProgress }) => (
        <CanvasBreakContent scrollYProgress={scrollYProgress} />
      )}
    </Landing2PinnedSection>
  );
}
