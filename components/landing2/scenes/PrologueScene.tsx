"use client";

import { LANDING2_COPY } from "@/components/landing2/landing2Copy";
import {
  Landing2PinnedSection,
  Landing2SceneTitle,
} from "@/components/landing2/shared/Landing2PinnedSection";
import { Landing2SceneShell } from "@/components/landing2/shared/Landing2SceneShell";
import { LANDING2_SCENE_WASH } from "@/lib/landing2/landing2Theme";
import { useReducedMotion } from "@/lib/motion/useReducedMotion";
import { m, useTransform, type MotionValue } from "framer-motion";

function PrologueContent({
  scrollYProgress,
}: {
  scrollYProgress: MotionValue<number>;
}) {
  const copy = LANDING2_COPY.prologue;
  const reducedMotion = useReducedMotion();
  const accent = LANDING2_SCENE_WASH.prologue.accent;

  const year = useTransform(
    scrollYProgress,
    [0, 0.4, 1],
    [copy.yearStart, copy.yearEnd, copy.yearEnd],
  );
  const yearDisplay = useTransform(year, (v) => Math.round(v).toString());

  const line2021Opacity = useTransform(scrollYProgress, [0, 0.3, 0.48], [1, 1, 0]);
  const line2026Opacity = useTransform(scrollYProgress, [0.32, 0.52, 0.82], [0, 1, 1]);
  const kickerOpacity = useTransform(scrollYProgress, [0.55, 0.72], [0, 1]);
  const bodyOpacity = useTransform(scrollYProgress, [0.68, 0.85], [0, 1]);

  if (reducedMotion) {
    return (
      <Landing2SceneShell sceneId="prologue">
        <div className="flex h-full flex-col justify-end px-6 pb-20 sm:px-12 lg:px-16">
          <Landing2SceneTitle
            variant="hero"
            title={copy.line2026}
            body={copy.body}
            accentColour={accent}
          />
        </div>
      </Landing2SceneShell>
    );
  }

  return (
    <Landing2SceneShell sceneId="prologue">
      <div className="relative flex h-full w-full flex-col justify-end overflow-hidden pb-16 sm:pb-20">
        <div
          className="pointer-events-none absolute -right-[8vw] top-[8vh] select-none font-display leading-none tracking-[-0.06em] text-canvas-ink/[0.06]"
          aria-hidden
        >
          <m.span
            className="block text-[clamp(8rem,28vw,22rem)]"
            style={{ opacity: 0.9 }}
          >
            <m.span>{yearDisplay}</m.span>
          </m.span>
        </div>

        <div className="relative z-10 w-full px-6 sm:px-12 lg:px-16">
          <m.p
            className="font-display text-[clamp(1.5rem,4vw,2.75rem)] text-canvas-ink"
            style={{ color: accent, opacity: line2021Opacity }}
          >
            {copy.line2021}
          </m.p>

          <m.p
            className="mt-4 font-display text-[clamp(2rem,5.5vw,3.75rem)] leading-[1.05] tracking-[-0.03em] text-canvas-ink"
            style={{ opacity: line2026Opacity }}
          >
            {copy.line2026}
          </m.p>

          <m.p
            className="mt-6 max-w-xl text-canvas-body-lg font-medium"
            style={{ color: accent, opacity: kickerOpacity }}
          >
            {copy.kicker}
          </m.p>

          <m.p
            className="mt-4 max-w-2xl text-canvas-body-lg leading-[1.65] text-canvas-muted"
            style={{ opacity: bodyOpacity }}
          >
            {copy.body}
          </m.p>
        </div>
      </div>
    </Landing2SceneShell>
  );
}

export function PrologueScene() {
  return (
    <Landing2PinnedSection sceneId="prologue">
      {({ scrollYProgress }) => (
        <PrologueContent scrollYProgress={scrollYProgress} />
      )}
    </Landing2PinnedSection>
  );
}
