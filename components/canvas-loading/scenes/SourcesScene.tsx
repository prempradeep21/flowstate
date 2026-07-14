"use client";

import { Chip, DocCard } from "@/components/canvas-loading/primitives";
import type { SceneProps } from "@/components/canvas-loading/types";
import styles from "@/components/canvas-loading/scenes.module.css";

const CHIPS = [
  { x: 68, y: 36 },
  { x: 72, y: 52 },
  { x: 66, y: 68 },
];

/**
 * "Ask your documents" — two docs drop onto the canvas, a scan-line reads the
 * front one, and citation chips pop out. Loops every 5s.
 */
export function SourcesScene({ reducedMotion }: SceneProps) {
  return (
    <div className={`${styles.scene} ${reducedMotion ? styles.rmStatic : ""}`}>
      <DocCard x={32} y={42} animClass={styles.srcDoc} />
      <DocCard
        x={44}
        y={54}
        animClass={styles.srcDoc}
        style={{ animationDelay: "250ms" }}
      >
        <div className={`${styles.srcScan} bg-canvas-accent/60`} />
      </DocCard>
      {CHIPS.map((chip, i) => (
        <Chip
          key={`${chip.x}-${chip.y}`}
          x={chip.x}
          y={chip.y}
          w={48}
          accent
          animClass={styles.srcChip}
          style={{ animationDelay: `${i * 160}ms` }}
        />
      ))}
    </div>
  );
}
