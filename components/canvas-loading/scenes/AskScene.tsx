"use client";

import { Chip, GhostCard, SceneSvg, Wire } from "@/components/canvas-loading/primitives";
import type { SceneProps } from "@/components/canvas-loading/types";
import styles from "@/components/canvas-loading/scenes.module.css";

/**
 * "Drop a question anywhere" — a question chip pops in, a wire draws to the
 * answer card, then a follow-up chains off it. Loops every 4.2s.
 */
export function AskScene({ reducedMotion }: SceneProps) {
  return (
    <div className={`${styles.scene} ${reducedMotion ? styles.rmStatic : ""}`}>
      <SceneSvg>
        <Wire
          d="M 33 34 C 42 37, 46 43, 53 49"
          animClass={`${styles.wire} ${styles.askWire1}`}
        />
        <Wire
          d="M 55 56 C 52 61, 49 65, 46 69"
          animClass={`${styles.wire} ${styles.askWire2}`}
        />
      </SceneSvg>
      <Chip x={30} y={32} accent animClass={styles.askChip} />
      <GhostCard x={56} y={52} animClass={styles.askCard} />
      <Chip x={44} y={72} animClass={styles.askChip2} />
    </div>
  );
}
