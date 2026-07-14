"use client";

import { GhostCard, SceneSvg, Wire } from "@/components/canvas-loading/primitives";
import type { SceneProps } from "@/components/canvas-loading/types";
import styles from "@/components/canvas-loading/scenes.module.css";

const WIRES = [
  "M 32 44 C 44 32, 50 26, 58 23",
  "M 33 47 C 44 48, 52 48, 61 48",
  "M 32 49 C 44 60, 50 68, 57 72",
];

const CARDS: { x: number; y: number; accent?: boolean }[] = [
  { x: 64, y: 22 },
  { x: 68, y: 48, accent: true },
  { x: 62, y: 74 },
];

/**
 * "One thought becomes three branches" — a parent card fans out three wires
 * into branch cards, which retreat back into it at the end of the 4.6s loop.
 */
export function BranchScene({ reducedMotion }: SceneProps) {
  return (
    <div className={`${styles.scene} ${reducedMotion ? styles.rmStatic : ""}`}>
      <SceneSvg>
        {WIRES.map((d, i) => (
          <Wire
            key={d}
            d={d}
            animClass={`${styles.wire} ${styles.brWire}`}
            style={{ animationDelay: `${i * 180}ms` }}
          />
        ))}
      </SceneSvg>
      <GhostCard x={28} y={46} animClass={styles.brParent} />
      {CARDS.map((card, i) => (
        <GhostCard
          key={`${card.x}-${card.y}`}
          x={card.x}
          y={card.y}
          w={64}
          h={40}
          accent={card.accent}
          animClass={styles.brCard}
          style={{ animationDelay: `${i * 140}ms` }}
        />
      ))}
    </div>
  );
}
