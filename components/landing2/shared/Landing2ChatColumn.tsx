"use client";

import { LandingArtifactPreview } from "@/components/landing-page/shared/LandingArtifactPreview";
import {
  Landing2CardPreview,
  landing2ChatSample,
} from "@/components/landing2/shared/Landing2CardPreview";
import { ARTIFACT_CATALOG_ENTRIES } from "@/lib/artifactCatalogSamples";
import type { MotionValue } from "framer-motion";
import { m, useTransform } from "framer-motion";

const CHAT_SAMPLE_IDS = [
  "text-answer",
  "streaming-text",
  "table-inline",
  "artifact-preview-ready",
  "code-inline",
  "text-answer",
] as const;

const BURIED_ARTIFACT = ARTIFACT_CATALOG_ENTRIES.find((e) => e.id === "map")!;

function ChatStack({ withBuriedArtifact }: { withBuriedArtifact: boolean }) {
  return (
    <>
      {CHAT_SAMPLE_IDS.map((id, i) => (
        <div
          key={`${id}-${i}`}
          className="shrink-0 scale-[0.92] sm:scale-100"
          style={{ opacity: 1 - i * 0.02 }}
        >
          <Landing2CardPreview sample={landing2ChatSample(id)} />
        </div>
      ))}
      {withBuriedArtifact ? (
        <div className="mt-2 opacity-70">
          <LandingArtifactPreview entry={BURIED_ARTIFACT} previewHeight={200} />
          <p className="mt-2 text-center text-canvas-caption text-canvas-muted">
            Your map — three scrolls down, lost forever.
          </p>
        </div>
      ) : null}
    </>
  );
}

function ScrollingChatColumn({
  scrollYProgress,
  compact,
}: {
  scrollYProgress: MotionValue<number>;
  compact: boolean;
}) {
  const translateY = useTransform(
    scrollYProgress,
    [0, 1],
    [0, compact ? -120 : -480],
  );

  return (
    <m.div
      className="mx-auto flex w-full max-w-[min(100%,420px)] flex-col gap-3"
      style={{ y: translateY }}
    >
      <ChatStack withBuriedArtifact={!compact} />
    </m.div>
  );
}

function StaticChatColumn({ compact }: { compact: boolean }) {
  return (
    <div className="mx-auto flex w-full max-w-[min(100%,420px)] flex-col gap-3">
      <ChatStack withBuriedArtifact={!compact} />
    </div>
  );
}

export function Landing2ChatColumn({
  scrollYProgress,
  compact = false,
}: {
  scrollYProgress?: MotionValue<number>;
  compact?: boolean;
}) {
  if (scrollYProgress) {
    return <ScrollingChatColumn scrollYProgress={scrollYProgress} compact={compact} />;
  }
  return <StaticChatColumn compact={compact} />;
}
