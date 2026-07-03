"use client";

import { LANDING2_COPY } from "@/components/landing2/landing2Copy";
import {
  Landing2PinnedSection,
  Landing2SceneTitle,
} from "@/components/landing2/shared/Landing2PinnedSection";
import { Landing2SceneShell } from "@/components/landing2/shared/Landing2SceneShell";
import { Landing2SpatialStage } from "@/components/landing2/shared/Landing2SpatialStage";
import { LANDING2_ISOLATED_CHATS } from "@/lib/landing2/landing2SpatialCards";
import { LANDING2_ACCENTS, LANDING2_SCENE_WASH } from "@/lib/landing2/landing2Theme";
import { useReducedMotion } from "@/lib/motion/useReducedMotion";
import { m, useTransform, type MotionValue } from "framer-motion";

function PainBeat({
  progress,
  index,
  total,
  kicker,
  headline,
  body,
  accentIndex,
  children,
}: {
  progress: MotionValue<number>;
  index: number;
  total: number;
  kicker: string;
  headline: string;
  body: string;
  accentIndex: number;
  children: React.ReactNode;
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
      <Landing2SceneShell sceneId="three-pains">
        <div className="relative h-full w-full">
          {children}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 z-30 bg-gradient-to-t from-canvas-bg via-canvas-bg/90 to-transparent px-6 pb-12 pt-24 sm:px-12 lg:px-16">
            <Landing2SceneTitle
              variant="hero"
              eyebrow={kicker}
              title={headline}
              body={body}
              accentColour={accent}
              className="max-w-2xl"
            />
          </div>
        </div>
      </Landing2SceneShell>
    </m.div>
  );
}

function ScatteredTabItem({
  label,
  x,
  y,
  color,
  progress,
  index,
}: {
  label: string;
  x: number;
  y: number;
  color: string;
  progress: MotionValue<number>;
  index: number;
}) {
  const drift = useTransform(
    progress,
    [0, 1],
    [0, (index % 2 === 0 ? 1 : -1) * (12 + index * 3)],
  );

  return (
    <m.span
      className="absolute rounded-canvas border bg-canvas-card/95 px-4 py-2 text-canvas-compact font-semibold shadow-card"
      style={{
        left: `${x}%`,
        top: `${y}%`,
        color,
        borderColor: `${color}66`,
        x: drift,
        rotate: index % 2 === 0 ? -2 : 2,
      }}
    >
      {label}
    </m.span>
  );
}

function ScatteredTabsVisual({ progress }: { progress: MotionValue<number> }) {
  const items = [
    { label: "PDF", x: 8, y: 12, c: 0 },
    { label: "Notion", x: 72, y: 8, c: 1 },
    { label: "Sheet", x: 38, y: 28, c: 2 },
    { label: "Chat", x: 85, y: 42, c: 3 },
    { label: "Code", x: 12, y: 48, c: 4 },
    { label: "Map", x: 55, y: 55, c: 5 },
    { label: "Video", x: 28, y: 68, c: 6 },
    { label: "Figma", x: 78, y: 72, c: 7 },
    { label: "MD", x: 48, y: 18, c: 0 },
  ];

  return (
    <>
      {items.map((item, i) => (
        <ScatteredTabItem
          key={item.label}
          label={item.label}
          x={item.x}
          y={item.y}
          color={LANDING2_ACCENTS[item.c % LANDING2_ACCENTS.length]!}
          progress={progress}
          index={i}
        />
      ))}
    </>
  );
}

function ExportTrapVisual() {
  const accent = LANDING2_ACCENTS[3]!;
  return (
    <div
      className="absolute left-[8%] top-[14%] w-[min(360px,72vw)] rounded-canvas border-2 border-dashed bg-canvas-card/95 p-6 shadow-card sm:left-[14%]"
      style={{ borderColor: `${accent}88` }}
    >
      <p className="text-canvas-compact font-semibold" style={{ color: accent }}>
        Export your progress
      </p>
      <ul className="mt-4 space-y-2.5 text-canvas-compact text-canvas-muted">
        <li>↓ Download as Markdown</li>
        <li>↓ Copy chat transcript</li>
        <li>↓ Screenshot each artifact</li>
        <li className="font-medium text-canvas-ink">↓ Host a micro-site?</li>
      </ul>
    </div>
  );
}

function ThreePainsContent({
  scrollYProgress,
}: {
  scrollYProgress: MotionValue<number>;
}) {
  const pains = LANDING2_COPY.threePains;
  const reducedMotion = useReducedMotion();

  if (reducedMotion) {
    const pain = pains[0]!;
    return (
      <Landing2SceneShell sceneId="three-pains">
        <div className="flex h-full items-end px-6 pb-16">
          <Landing2SceneTitle
            variant="hero"
            eyebrow={pain.kicker}
            title={pain.headline}
            body={pain.body}
            accentColour={LANDING2_SCENE_WASH["three-pains"].accent}
          />
        </div>
      </Landing2SceneShell>
    );
  }

  return (
    <div className="relative h-full w-full">
      <PainBeat
        progress={scrollYProgress}
        index={0}
        total={pains.length}
        kicker={pains[0]!.kicker}
        headline={pains[0]!.headline}
        body={pains[0]!.body}
        accentIndex={0}
      >
        <Landing2SpatialStage
          placements={LANDING2_ISOLATED_CHATS}
          scrollYProgress={scrollYProgress}
        />
      </PainBeat>

      <PainBeat
        progress={scrollYProgress}
        index={1}
        total={pains.length}
        kicker={pains[1]!.kicker}
        headline={pains[1]!.headline}
        body={pains[1]!.body}
        accentIndex={3}
      >
        <ExportTrapVisual />
      </PainBeat>

      <PainBeat
        progress={scrollYProgress}
        index={2}
        total={pains.length}
        kicker={pains[2]!.kicker}
        headline={pains[2]!.headline}
        body={pains[2]!.body}
        accentIndex={1}
      >
        <ScatteredTabsVisual progress={scrollYProgress} />
      </PainBeat>
    </div>
  );
}

export function ThreePainsScene() {
  return (
    <Landing2PinnedSection sceneId="three-pains">
      {({ scrollYProgress }) => (
        <ThreePainsContent scrollYProgress={scrollYProgress} />
      )}
    </Landing2PinnedSection>
  );
}
