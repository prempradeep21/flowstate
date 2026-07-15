"use client";

import type { PropsWithChildren } from "react";

/**
 * Timeline-driven spawn/morph wrapper for canvas nodes. The child node is
 * absolutely positioned in world space; this wrapper only fades/scales it
 * (mirroring the product's artifactPopUpVariants) without creating layout.
 * `morphPulse` adds the small settle pulse at the generating→real swap.
 */
export function DemoSpawn({
  spawn,
  morphPulse = 1,
  center,
  children,
}: PropsWithChildren<{
  spawn: number;
  morphPulse?: number;
  /** World-space center of the node (transform origin). */
  center: { x: number; y: number };
}>) {
  if (spawn <= 0) {
    return (
      <div style={{ opacity: 0, pointerEvents: "none" }} aria-hidden>
        {children}
      </div>
    );
  }
  const pulse = 0.98 + 0.02 * morphPulse;
  const s = (0.94 + 0.06 * spawn) * pulse;
  const opacity = spawn * (0.85 + 0.15 * morphPulse);
  return (
    <div
      style={{
        opacity,
        transform: s < 0.9999 ? `scale(${s})` : undefined,
        transformOrigin: `${center.x}px ${center.y}px`,
      }}
    >
      {children}
    </div>
  );
}
