"use client";

import { LANDING2_COPY } from "@/components/landing2/landing2Copy";
import { Landing2ChatColumn } from "@/components/landing2/shared/Landing2ChatColumn";
import {
  Landing2PinnedSection,
  Landing2SceneTitle,
} from "@/components/landing2/shared/Landing2PinnedSection";
import { Landing2EdgeBleed, Landing2SceneShell } from "@/components/landing2/shared/Landing2SceneShell";
import { LandingArtifactPreview } from "@/components/landing-page/shared/LandingArtifactPreview";
import { ARTIFACT_CATALOG_ENTRIES } from "@/lib/artifactCatalogSamples";
import { LANDING2_SCENE_WASH } from "@/lib/landing2/landing2Theme";
import { useReducedMotion } from "@/lib/motion/useReducedMotion";
import { m, useTransform, type MotionValue } from "framer-motion";

const BURIED_MAP = ARTIFACT_CATALOG_ENTRIES.find((e) => e.id === "map")!;

function TabStrip() {
  const tabs = [
    { label: "Notion", color: "#2C2A26" },
    { label: "GSheet", color: "#6FCF97" },
    { label: "ChatGPT", color: "#6B4EFF" },
    { label: "Claude", color: "#F2994A" },
    { label: "PDF", color: "#FF8FA3" },
    { label: "Figma", color: "#BB6BD9" },
    { label: "GDocs", color: "#56CCF2" },
    { label: "Tab 47", color: "#8A867E" },
  ];
  return (
    <Landing2EdgeBleed className="absolute top-0 z-20 flex gap-2 overflow-x-auto px-4 py-3 sm:px-8">
      {tabs.map((tab, i) => (
        <span
          key={tab.label}
          className="shrink-0 rounded-canvas-xs border border-canvas-border/80 bg-canvas-card/90 px-3 py-1 text-[11px] font-medium shadow-sm"
          style={{
            color: tab.color,
            transform: `translateY(${i % 2 === 0 ? 0 : 3}px) rotate(${i % 3 === 0 ? -1 : 1}deg)`,
          }}
        >
          {tab.label}
        </span>
      ))}
    </Landing2EdgeBleed>
  );
}

function ChatTrapContent({
  scrollYProgress,
}: {
  scrollYProgress: MotionValue<number>;
}) {
  const copy = LANDING2_COPY.chatTrap;
  const accent = LANDING2_SCENE_WASH["chat-trap"].accent;
  const reducedMotion = useReducedMotion();

  const headlineOpacity = useTransform(scrollYProgress, [0, 0.12, 0.88, 1], [0, 1, 1, 0.7]);
  const chatX = useTransform(scrollYProgress, [0, 1], ["0%", "-4%"]);
  const chatY = useTransform(scrollYProgress, [0, 1], [0, -520]);
  const artifactOpacity = useTransform(scrollYProgress, [0.3, 0.55, 0.9], [0.3, 1, 0.15]);
  const artifactX = useTransform(scrollYProgress, [0, 1], [0, 80]);

  return (
    <Landing2SceneShell sceneId="chat-trap">
      <TabStrip />

      <div className="relative flex h-full w-full">
        <m.div
          className="absolute bottom-0 left-0 top-0 z-10 w-[min(42vw,420px)] overflow-hidden pl-4 pt-24 sm:pl-10"
          style={{
            x: reducedMotion ? 0 : chatX,
            y: reducedMotion ? 0 : chatY,
          }}
        >
          <Landing2ChatColumn />
        </m.div>

        <m.div
          className="absolute bottom-[8%] right-0 z-10 w-[min(52vw,480px)] pr-2 sm:pr-8"
          style={{
            opacity: reducedMotion ? 1 : artifactOpacity,
            x: reducedMotion ? 0 : artifactX,
          }}
        >
          <LandingArtifactPreview entry={BURIED_MAP} previewHeight={240} />
          <p
            className="mt-3 text-right text-canvas-caption font-medium"
            style={{ color: accent }}
          >
            Your map — three scrolls down, gone.
          </p>
        </m.div>

        <m.div
          className="pointer-events-none absolute inset-x-0 bottom-0 top-auto z-30 flex items-end px-6 pb-12 pt-32 sm:px-12 lg:px-16"
          style={{
            opacity: headlineOpacity,
            background:
              "linear-gradient(to top, rgb(var(--canvas-bg)) 35%, transparent)",
          }}
        >
          <Landing2SceneTitle
            variant="hero"
            eyebrow={copy.kicker}
            title={copy.headline}
            body={copy.body}
            accentColour={accent}
            className="max-w-3xl"
          />
        </m.div>
      </div>
    </Landing2SceneShell>
  );
}

export function ChatTrapScene() {
  return (
    <Landing2PinnedSection sceneId="chat-trap">
      {({ scrollYProgress }) => (
        <ChatTrapContent scrollYProgress={scrollYProgress} />
      )}
    </Landing2PinnedSection>
  );
}
