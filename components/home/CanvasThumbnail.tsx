"use client";

import { sceneVariantForSeed, threadAccentForSeed } from "@/lib/home/canvasThumbnail";

interface SceneLayout {
  /** Root Q&A card. */
  root: { x: number; y: number };
  /** Child card already on the canvas (drifts on hover). */
  child: { x: number; y: number };
  /** Card that pops in on hover. */
  pop: { x: number; y: number };
}

/** Node arrangements — varied per canvas so the grid doesn't repeat itself. */
const SCENES: SceneLayout[] = [
  { root: { x: 22, y: 30 }, child: { x: 118, y: 14 }, pop: { x: 118, y: 74 } },
  { root: { x: 26, y: 16 }, child: { x: 124, y: 44 }, pop: { x: 40, y: 78 } },
  { root: { x: 70, y: 12 }, child: { x: 20, y: 66 }, pop: { x: 126, y: 70 } },
];

const CARD_W = 58;
const CARD_H = 34;

function edge(from: { x: number; y: number }, to: { x: number; y: number }) {
  // Leave from the closest horizontal edge, arrive at the opposite one —
  // echoes the canvas's side plugs + curvy connectors.
  const fromRight = from.x + CARD_W / 2 <= to.x + CARD_W / 2;
  const x1 = fromRight ? from.x + CARD_W : from.x;
  const y1 = from.y + CARD_H / 2;
  const x2 = fromRight ? to.x : to.x + CARD_W;
  const y2 = to.y + CARD_H / 2;
  const dx = Math.max(18, Math.abs(x2 - x1) * 0.5) * (fromRight ? 1 : -1);
  return `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`;
}

function MiniCard({
  x,
  y,
  accent,
  className,
}: {
  x: number;
  y: number;
  accent: string;
  className?: string;
}) {
  return (
    <g
      className={`[transform-box:fill-box] origin-center ${className ?? ""}`}
      style={{ transitionProperty: "transform, opacity" }}
    >
      <rect
        x={x}
        y={y}
        width={CARD_W}
        height={CARD_H}
        rx={6}
        fill="rgb(var(--canvas-card))"
        stroke="rgb(var(--canvas-border))"
      />
      <circle cx={x + 9} cy={y + 10} r={3} fill={accent} />
      <rect
        x={x + 16}
        y={y + 8}
        width={CARD_W - 24}
        height={4}
        rx={2}
        fill="rgb(var(--canvas-ink) / 0.35)"
      />
      <rect
        x={x + 8}
        y={y + 19}
        width={CARD_W - 16}
        height={3.5}
        rx={1.75}
        fill="rgb(var(--canvas-muted) / 0.4)"
      />
      <rect
        x={x + 8}
        y={y + 26}
        width={CARD_W - 30}
        height={3.5}
        rx={1.75}
        fill="rgb(var(--canvas-muted) / 0.28)"
      />
    </g>
  );
}

/**
 * Placeholder thumbnail rendered as a miniature Flowstate canvas: dot grid,
 * Q&A cards, curvy connectors in the canvas's thread accent. Hover (via a
 * `group` ancestor) grows the branch — a connector draws in, a card pops in,
 * and existing nodes drift. Purely decorative; a captured snapshot image can
 * replace it later.
 */
export function CanvasThumbnail({
  seed,
  accent,
}: {
  seed: string;
  /** Override the derived thread accent (e.g. category color for samples). */
  accent?: string;
}) {
  const scene = SCENES[sceneVariantForSeed(seed)];
  const color = accent ?? threadAccentForSeed(seed);

  return (
    <div className="relative h-full w-full overflow-hidden bg-canvas-artifactStage">
      {/* Dot grid — same pattern language as the real canvas background. */}
      <div
        aria-hidden
        className="absolute inset-0 transition-opacity duration-motion-standard ease-motion-medium opacity-70 group-hover:opacity-100"
        style={{
          backgroundImage:
            "radial-gradient(circle, rgb(var(--canvas-dot) / 0.35) 1px, transparent 1px)",
          backgroundSize: "14px 14px",
        }}
      />
      <svg
        viewBox="0 0 200 125"
        className="absolute inset-0 h-full w-full transition-transform duration-motion-slow ease-motion-medium group-hover:scale-[1.045] motion-reduce:transition-none"
        aria-hidden
      >
        {/* Existing connector root → child. */}
        <path
          d={edge(scene.root, scene.child)}
          fill="none"
          stroke={color}
          strokeWidth={1.6}
          strokeLinecap="round"
          opacity={0.8}
        />
        {/* Branch that grows on hover: connector draws root → pop card. */}
        <path
          d={edge(scene.root, scene.pop)}
          fill="none"
          stroke={color}
          strokeWidth={1.6}
          strokeLinecap="round"
          pathLength={1}
          strokeDasharray={1}
          className="[stroke-dashoffset:1] transition-[stroke-dashoffset] duration-motion-slow ease-motion-medium group-hover:[stroke-dashoffset:0] motion-reduce:transition-none"
        />

        <MiniCard
          x={scene.root.x}
          y={scene.root.y}
          accent={color}
          className="transition-transform duration-motion-standard ease-motion-medium group-hover:-translate-y-[2px] motion-reduce:transition-none"
        />
        <MiniCard
          x={scene.child.x}
          y={scene.child.y}
          accent={color}
          className="transition-transform duration-motion-standard ease-motion-medium group-hover:translate-x-[2px] group-hover:-translate-y-[1px] motion-reduce:transition-none"
        />
        {/* New card pops in as the branch completes. */}
        <MiniCard
          x={scene.pop.x}
          y={scene.pop.y}
          accent={color}
          className="scale-75 opacity-0 transition-all delay-100 duration-motion-standard ease-motion-settle group-hover:scale-100 group-hover:opacity-100 motion-reduce:transition-none"
        />
      </svg>
    </div>
  );
}
