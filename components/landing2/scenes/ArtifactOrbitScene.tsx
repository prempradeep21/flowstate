"use client";

import { useEffect, useState } from "react";
import {
  LANDING2_ARTIFACT_ACCENTS,
  LANDING2_ARTIFACT_IDS,
  LANDING2_COPY,
} from "@/components/landing2/landing2Copy";
import { Landing2LazyMount } from "@/components/landing2/shared/Landing2LazyMount";
import {
  Landing2PinnedSection,
  Landing2SceneTitle,
} from "@/components/landing2/shared/Landing2PinnedSection";
import { Landing2EdgeBleed, Landing2SceneShell } from "@/components/landing2/shared/Landing2SceneShell";
import {
  LandingArtifactPreview,
  previewHeightForEntry,
} from "@/components/landing-page/shared/LandingArtifactPreview";
import { ARTIFACT_CATALOG_ENTRIES } from "@/lib/artifactCatalogSamples";
import { LANDING2_ACCENTS, LANDING2_SCENE_WASH } from "@/lib/landing2/landing2Theme";
import { useReducedMotion } from "@/lib/motion/useReducedMotion";
import { m, useTransform, type MotionValue } from "framer-motion";

const ARTIFACT_ENTRIES = LANDING2_ARTIFACT_IDS.map((id) =>
  ARTIFACT_CATALOG_ENTRIES.find((e) => e.id === id)!,
);

function ArtifactRail({
  scrollYProgress,
}: {
  scrollYProgress: MotionValue<number>;
}) {
  const railX = useTransform(scrollYProgress, [0.1, 0.9], ["4vw", "-78%"]);
  const focusIndex = useTransform(
    scrollYProgress,
    [0.1, 0.9],
    [0, ARTIFACT_ENTRIES.length - 1],
  );

  return (
    <Landing2EdgeBleed className="absolute bottom-[8%] left-0 right-0 top-[42%]">
      <m.div className="flex h-full items-stretch gap-5 px-[4vw]" style={{ x: railX }}>
        {ARTIFACT_ENTRIES.map((entry, i) => (
          <ArtifactRailCard
            key={entry.id}
            entry={entry}
            index={i}
            focusIndex={focusIndex}
            accentIndex={LANDING2_ARTIFACT_ACCENTS[i] ?? 0}
          />
        ))}
      </m.div>
    </Landing2EdgeBleed>
  );
}

function ArtifactRailCard({
  entry,
  index,
  focusIndex,
  accentIndex,
}: {
  entry: (typeof ARTIFACT_ENTRIES)[number];
  index: number;
  focusIndex: MotionValue<number>;
  accentIndex: number;
}) {
  const accent = LANDING2_ACCENTS[accentIndex % LANDING2_ACCENTS.length]!;
  const scale = useTransform(focusIndex, (v) => {
    const dist = Math.abs(v - index);
    return dist < 0.55 ? 1.05 : dist < 1.1 ? 0.94 : 0.86;
  });
  const opacity = useTransform(focusIndex, (v) => {
    const dist = Math.abs(v - index);
    return dist < 1.4 ? 1 : 0.35;
  });

  return (
    <m.article
      className="flex w-[min(78vw,380px)] shrink-0 flex-col overflow-hidden rounded-canvas border border-canvas-border bg-canvas-card shadow-artifact"
      style={{ scale, opacity, borderColor: `${accent}55` }}
    >
      <div
        className="px-4 py-3 font-display text-canvas-heading"
        style={{ background: `${accent}18`, color: accent }}
      >
        {entry.name}
      </div>
      <div className="flex-1 p-2">
        <Landing2LazyMount minHeight={220}>
          <LandingArtifactPreview
            entry={entry}
            previewHeight={previewHeightForEntry(entry.id)}
          />
        </Landing2LazyMount>
      </div>
    </m.article>
  );
}

function ArtifactGrid() {
  return (
    <div className="grid gap-5 px-6 sm:grid-cols-2">
      {ARTIFACT_ENTRIES.map((entry, i) => {
        const accent = LANDING2_ACCENTS[(LANDING2_ARTIFACT_ACCENTS[i] ?? 0) % LANDING2_ACCENTS.length]!;
        return (
          <article
            key={entry.id}
            className="overflow-hidden rounded-canvas border bg-canvas-card shadow-artifact"
            style={{ borderColor: `${accent}44` }}
          >
            <div className="px-3 py-2 font-display text-canvas-compact" style={{ color: accent }}>
              {entry.name}
            </div>
            <Landing2LazyMount minHeight={180}>
              <LandingArtifactPreview
                entry={entry}
                previewHeight={previewHeightForEntry(entry.id)}
              />
            </Landing2LazyMount>
          </article>
        );
      })}
    </div>
  );
}

function ArtifactOrbitContent({
  scrollYProgress,
}: {
  scrollYProgress: MotionValue<number>;
}) {
  const copy = LANDING2_COPY.artifactOrbit;
  const accent = LANDING2_SCENE_WASH["artifact-orbit"].accent;
  const reducedMotion = useReducedMotion();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 768px)");
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  const headerOpacity = useTransform(scrollYProgress, [0, 0.15], [0.4, 1]);

  return (
    <Landing2SceneShell sceneId="artifact-orbit">
      <m.div
        className="absolute inset-x-0 top-0 z-20 px-6 pt-16 sm:px-12 lg:px-16"
        style={{ opacity: reducedMotion ? 1 : headerOpacity }}
      >
        <Landing2SceneTitle
          variant="hero"
          eyebrow={copy.kicker}
          title={copy.headline}
          body={copy.body}
          accentColour={accent}
          className="max-w-2xl"
        />
        <div className="mt-6 flex flex-wrap gap-2">
          {copy.hubLabels.map((label, i) => (
            <span
              key={label}
              className="rounded-full px-3 py-1 text-canvas-caption font-medium"
              style={{
                background: `${LANDING2_ACCENTS[i % LANDING2_ACCENTS.length]}22`,
                color: LANDING2_ACCENTS[i % LANDING2_ACCENTS.length],
              }}
            >
              {label}
            </span>
          ))}
        </div>
      </m.div>

      {reducedMotion || isMobile ? (
        <div className="absolute inset-x-0 bottom-0 top-[38%] overflow-y-auto pb-8">
          <ArtifactGrid />
        </div>
      ) : (
        <ArtifactRail scrollYProgress={scrollYProgress} />
      )}
    </Landing2SceneShell>
  );
}

export function ArtifactOrbitScene() {
  return (
    <Landing2PinnedSection sceneId="artifact-orbit">
      {({ scrollYProgress }) => (
        <ArtifactOrbitContent scrollYProgress={scrollYProgress} />
      )}
    </Landing2PinnedSection>
  );
}
