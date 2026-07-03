"use client";

import { LANDING2_COPY } from "@/components/landing2/landing2Copy";
import { Landing2CanvasFrame } from "@/components/landing2/shared/Landing2CanvasFrame";
import {
  Landing2PinnedSection,
  Landing2SceneTitle,
} from "@/components/landing2/shared/Landing2PinnedSection";
import { Landing2SceneShell } from "@/components/landing2/shared/Landing2SceneShell";
import { buildLanding2CanvasSnapshot } from "@/lib/landing2/buildLanding2CanvasSnapshot";
import { LANDING2_ACCENTS, LANDING2_SCENE_WASH } from "@/lib/landing2/landing2Theme";
import { useReducedMotion } from "@/lib/motion/useReducedMotion";
import { m, useTransform, type MotionValue } from "framer-motion";

function AvatarStack({ colors }: { colors: string[] }) {
  const initials = ["You", "P", "CF"];
  return (
    <div className="flex -space-x-2">
      {initials.map((label, i) => (
        <span
          key={label}
          className="inline-flex h-10 w-10 items-center justify-center rounded-full border-2 border-canvas-card text-canvas-caption font-bold text-canvas-ink"
          style={{
            zIndex: initials.length - i,
            background: `${colors[i] ?? colors[0]}33`,
            borderColor: colors[i] ?? colors[0],
          }}
        >
          {label.slice(0, 2)}
        </span>
      ))}
    </div>
  );
}

function ShareBeat({
  progress,
  index,
  total,
  title,
  body,
  accentIndex,
}: {
  progress: MotionValue<number>;
  index: number;
  total: number;
  title: string;
  body: string;
  accentIndex: number;
}) {
  const slice = 1 / total;
  const start = index * slice;
  const mid = start + slice * 0.32;
  const end = start + slice;
  const accent = LANDING2_ACCENTS[accentIndex % LANDING2_ACCENTS.length]!;

  const opacity = useTransform(
    progress,
    [start, mid, end - slice * 0.12, end],
    [0, 1, 1, 0],
  );

  return (
    <m.div className="absolute inset-0" style={{ opacity }}>
      <Landing2SceneShell sceneId="share" showGrid={false}>
        <div className="absolute inset-0 opacity-90">
          <Landing2CanvasFrame
            buildSnapshot={buildLanding2CanvasSnapshot}
            fullBleed
            label="Shared canvas"
          />
        </div>

        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background: `linear-gradient(105deg, ${accent}33 0%, transparent 45%, rgb(var(--canvas-bg) / 0.7) 100%)`,
          }}
        />

        <div className="relative z-10 flex h-full flex-col justify-end px-6 pb-14 sm:px-12 lg:px-16">
          <div className="mb-6 flex items-center gap-4">
            <AvatarStack colors={[accent, LANDING2_ACCENTS[5]!, LANDING2_ACCENTS[2]!]} />
            <span
              className="rounded-full px-3 py-1 text-canvas-caption font-semibold"
              style={{ background: `${accent}22`, color: accent }}
            >
              Live canvas · 3 collaborators
            </span>
          </div>
          <Landing2SceneTitle
            variant="hero"
            eyebrow={LANDING2_COPY.share.kicker}
            title={title}
            body={body}
            accentColour={accent}
            className="max-w-2xl"
          />
        </div>
      </Landing2SceneShell>
    </m.div>
  );
}

function ShareContent({ scrollYProgress }: { scrollYProgress: MotionValue<number> }) {
  const scenarios = LANDING2_COPY.share.scenarios;
  const reducedMotion = useReducedMotion();

  if (reducedMotion) {
    const s = scenarios[0]!;
    return (
      <Landing2SceneShell sceneId="share">
        <div className="flex h-full items-end px-6 pb-16">
          <Landing2SceneTitle
            variant="hero"
            eyebrow={LANDING2_COPY.share.kicker}
            title={s.title}
            body={s.body}
            accentColour={LANDING2_SCENE_WASH.share.accent}
          />
        </div>
      </Landing2SceneShell>
    );
  }

  return (
    <div className="relative h-full w-full">
      {scenarios.map((scenario, i) => (
        <ShareBeat
          key={scenario.title}
          progress={scrollYProgress}
          index={i}
          total={scenarios.length}
          title={scenario.title}
          body={scenario.body}
          accentIndex={i === 0 ? 5 : 6}
        />
      ))}
    </div>
  );
}

export function ShareScene() {
  return (
    <Landing2PinnedSection sceneId="share">
      {({ scrollYProgress }) => <ShareContent scrollYProgress={scrollYProgress} />}
    </Landing2PinnedSection>
  );
}
