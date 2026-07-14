"use client";

import type { SceneProps } from "@/components/canvas-loading/types";
import styles from "@/components/canvas-loading/scenes.module.css";

const BAR_HEIGHTS = ["40%", "72%", "52%", "88%"];

/**
 * "Turn answers into artifacts" — an answer card expands into a table grid,
 * then morphs in place into a bar chart. Loops every 5.2s.
 */
export function ArtifactScene({ reducedMotion }: SceneProps) {
  return (
    <div className={`${styles.scene} ${reducedMotion ? styles.rmStatic : ""}`}>
      <div
        className="absolute -translate-x-1/2 -translate-y-1/2"
        style={{ left: "50%", top: "46%" }}
        aria-hidden
      >
        <div className={styles.artBox}>
          <div
            className="relative rounded-canvas border border-canvas-border/80 bg-canvas-card/95 shadow-artifact"
            style={{ width: 124, height: 84 }}
          >
            {/* answer skeleton */}
            <div className={`${styles.artSkel} absolute inset-0 px-3 pt-3`}>
              <div className="h-2 w-2/3 rounded-full bg-canvas-ink/15" />
              <div className="mt-2 h-1.5 w-5/6 rounded-full bg-canvas-ink/10" />
              <div className="mt-1.5 h-1.5 w-1/2 rounded-full bg-canvas-ink/10" />
            </div>
            {/* table grid */}
            <div
              className={`${styles.artGrid} absolute inset-0 grid grid-cols-3 gap-1 p-2.5`}
            >
              {Array.from({ length: 9 }, (_, i) => (
                <div
                  key={i}
                  className={`rounded-sm ${i < 3 ? "bg-canvas-ink/15" : "bg-canvas-ink/[0.07]"}`}
                />
              ))}
            </div>
            {/* bar chart */}
            <div
              className={`${styles.artChart} absolute inset-0 flex items-end gap-2 px-4 pb-2.5`}
            >
              {BAR_HEIGHTS.map((height, i) => (
                <div
                  key={height}
                  className={`${styles.artBar} w-3 rounded-t-sm bg-canvas-accent/60`}
                  style={{ height, animationDelay: `${i * 100}ms` }}
                />
              ))}
              <div
                className={`${styles.artDot} absolute left-1/2 top-3 h-1.5 w-1.5 rounded-full bg-canvas-accent`}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
