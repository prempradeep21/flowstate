"use client";

import type { ReactNode } from "react";
import { GridBackground } from "@/components/canvasBackgrounds/GridBackground";
import type { Landing2SceneId } from "@/components/landing2/landing2Copy";
import { LANDING2_ACCENTS, LANDING2_SCENE_WASH, sceneWashStyle } from "@/lib/landing2/landing2Theme";

function Landing2ColorOrbs({ sceneId }: { sceneId: Landing2SceneId }) {
  const wash = LANDING2_SCENE_WASH[sceneId];
  const primary = wash.orb ?? wash.accent;
  const secondary = LANDING2_ACCENTS[(LANDING2_ACCENTS.indexOf(primary) + 3) % LANDING2_ACCENTS.length]!;

  return (
    <div className="pointer-events-none absolute inset-0 z-[2] overflow-hidden" aria-hidden>
      <div
        className="absolute -left-[15vw] top-[10vh] h-[min(55vw,420px)] w-[min(55vw,420px)] rounded-full blur-[80px]"
        style={{ background: `${primary}55` }}
      />
      <div
        className="absolute -right-[10vw] bottom-[5vh] h-[min(45vw,360px)] w-[min(45vw,360px)] rounded-full blur-[90px]"
        style={{ background: `${secondary}44` }}
      />
    </div>
  );
}

export function Landing2SceneShell({
  sceneId,
  children,
  showGrid = true,
  showOrbs = true,
  className = "",
}: {
  sceneId: Landing2SceneId;
  children: ReactNode;
  showGrid?: boolean;
  showOrbs?: boolean;
  className?: string;
}) {
  return (
    <div className={`relative h-full w-full overflow-hidden ${className}`}>
      {showGrid ? (
        <GridBackground viewport={{ x: 0, y: 0, scale: 1 }} />
      ) : null}
      <div
        className="pointer-events-none absolute inset-0 z-[1]"
        aria-hidden
        style={sceneWashStyle(sceneId)}
      />
      {showOrbs ? <Landing2ColorOrbs sceneId={sceneId} /> : null}
      <div className="relative z-10 h-full w-full">{children}</div>
    </div>
  );
}

/** Full viewport width breakout from centered containers */
export function Landing2EdgeBleed({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`relative w-[100vw] max-w-none ${className}`}
      style={{ marginLeft: "calc(50% - 50vw)" }}
    >
      {children}
    </div>
  );
}
