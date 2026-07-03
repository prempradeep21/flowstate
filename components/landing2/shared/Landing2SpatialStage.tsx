"use client";

import type { Landing2SpatialPlacement } from "@/lib/landing2/landing2SpatialCards";
import { Landing2CardPreview } from "@/components/landing2/shared/Landing2CardPreview";
import { LANDING2_ACCENTS } from "@/lib/landing2/landing2Theme";
import { m, useTransform, type MotionValue } from "framer-motion";

function StaticSpatialCard({ placement }: { placement: Landing2SpatialPlacement }) {
  const scale = placement.scale ?? 1;
  const accent = LANDING2_ACCENTS[placement.accentIndex % LANDING2_ACCENTS.length]!;

  return (
    <div
      className="pointer-events-none absolute z-10 origin-top-left"
      style={{
        left: `${placement.x}%`,
        top: `${placement.y}%`,
        transform: `scale(${scale}) rotate(${placement.rotate ?? 0}deg)`,
      }}
    >
      <div
        className="rounded-canvas shadow-artifact"
        style={{ boxShadow: `0 12px 40px ${accent}33, 0 0 0 1px ${accent}44` }}
      >
        <Landing2CardPreview sample={placement.sample} accentColour={accent} />
      </div>
    </div>
  );
}

function AnimatedSpatialCard({
  placement,
  progress,
}: {
  placement: Landing2SpatialPlacement;
  progress: MotionValue<number>;
}) {
  const driftX = useTransform(progress, [0, 1], [0, placement.driftX ?? 0]);
  const driftY = useTransform(progress, [0, 1], [0, placement.driftY ?? 0]);
  const scale = placement.scale ?? 1;
  const accent = LANDING2_ACCENTS[placement.accentIndex % LANDING2_ACCENTS.length]!;

  return (
    <m.div
      className="pointer-events-none absolute z-10 origin-top-left"
      style={{
        left: `${placement.x}%`,
        top: `${placement.y}%`,
        x: driftX,
        y: driftY,
        scale,
        rotate: placement.rotate ?? 0,
      }}
    >
      <div
        className="rounded-canvas shadow-artifact"
        style={{ boxShadow: `0 12px 40px ${accent}33, 0 0 0 1px ${accent}44` }}
      >
        <Landing2CardPreview sample={placement.sample} accentColour={accent} />
      </div>
    </m.div>
  );
}

function StaticConnectorLine({
  x1,
  y1,
  x2,
  y2,
  color,
}: {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  color: string;
}) {
  return (
    <path
      d={`M ${x1} ${y1} C ${(x1 + x2) / 2} ${y1}, ${(x1 + x2) / 2} ${y2}, ${x2} ${y2}`}
      fill="none"
      stroke={color}
      strokeWidth="0.4"
      strokeOpacity={0.6}
      strokeLinecap="round"
    />
  );
}

function AnimatedConnectorLine({
  x1,
  y1,
  x2,
  y2,
  color,
  progress,
}: {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  color: string;
  progress: MotionValue<number>;
}) {
  const pathLength = useTransform(progress, [0.15, 0.75], [0, 1]);

  return (
    <m.path
      d={`M ${x1} ${y1} C ${(x1 + x2) / 2} ${y1}, ${(x1 + x2) / 2} ${y2}, ${x2} ${y2}`}
      fill="none"
      stroke={color}
      strokeWidth="0.4"
      strokeOpacity={0.6}
      strokeLinecap="round"
      style={{ pathLength }}
    />
  );
}

function ConnectorLines({
  placements,
  progress,
}: {
  placements: Landing2SpatialPlacement[];
  progress?: MotionValue<number>;
}) {
  if (placements.length < 2) return null;

  return (
    <svg
      className="pointer-events-none absolute inset-0 z-[5] h-full w-full"
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      aria-hidden
    >
      {placements.slice(1).map((b, i) => {
        const a = placements[i]!;
        const props = {
          x1: a.x + 12,
          y1: a.y + 8,
          x2: b.x + 4,
          y2: b.y + 6,
          color: LANDING2_ACCENTS[a.accentIndex % LANDING2_ACCENTS.length]!,
        };
        return progress ? (
          <AnimatedConnectorLine key={b.id} {...props} progress={progress} />
        ) : (
          <StaticConnectorLine key={b.id} {...props} />
        );
      })}
    </svg>
  );
}

export function Landing2SpatialStage({
  placements,
  scrollYProgress,
  showConnectors = false,
  className = "",
}: {
  placements: Landing2SpatialPlacement[];
  scrollYProgress?: MotionValue<number>;
  showConnectors?: boolean;
  className?: string;
}) {
  return (
    <div className={`relative h-full w-full ${className}`}>
      {showConnectors ? (
        <ConnectorLines placements={placements} progress={scrollYProgress} />
      ) : null}
      {placements.map((p) =>
        scrollYProgress ? (
          <AnimatedSpatialCard key={p.id} placement={p} progress={scrollYProgress} />
        ) : (
          <StaticSpatialCard key={p.id} placement={p} />
        ),
      )}
    </div>
  );
}
