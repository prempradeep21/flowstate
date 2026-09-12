"use client";

import { CursorDot, GhostCard } from "@/components/canvas-loading/primitives";
import type { SceneProps } from "@/components/canvas-loading/types";
import { collaboratorColor } from "@/lib/collaboratorColors";
import styles from "@/components/canvas-loading/scenes.module.css";

const CURSOR_A = collaboratorColor("kai");
const CURSOR_B = collaboratorColor("ivy");

/**
 * "Share it — all of it" — resting cards, a pulsing share-link chip, and two
 * collaborator cursors gliding one full circuit per 4.8s loop (seamless wrap).
 */
export function ShareScene({ reducedMotion }: SceneProps) {
  return (
    <div className={`${styles.scene} ${reducedMotion ? styles.rmStatic : ""}`}>
      <GhostCard x={34} y={40} animClass={styles.shIn} />
      <GhostCard
        x={60}
        y={62}
        animClass={styles.shIn}
        style={{ animationDelay: "120ms" }}
      />

      {/* share-link chip with ring pulse */}
      <div
        className="absolute -translate-x-1/2 -translate-y-1/2"
        style={{ left: "50%", top: "20%" }}
        aria-hidden
      >
        <div className={styles.shIn} style={{ animationDelay: "240ms" }}>
          <div className="relative">
            <div
              className={`${styles.shRing} absolute inset-0 rounded-full border border-canvas-accent/60`}
            />
            <div
              className="flex h-6 items-center gap-1.5 rounded-full border border-canvas-accent/50 bg-canvas-accent/15 px-2 shadow-sm"
              style={{ width: 72 }}
            >
              <div className="h-2 w-2 rounded-full bg-canvas-accent/60" />
              <div className="h-1 w-full rounded-full bg-canvas-accent/50" />
            </div>
          </div>
        </div>
      </div>

      <CursorDot x={36} y={34} color={CURSOR_A} animClass={styles.shCursorA} />
      <CursorDot x={66} y={58} color={CURSOR_B} animClass={styles.shCursorB} />
    </div>
  );
}
