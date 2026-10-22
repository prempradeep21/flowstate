"use client";

import { createContext, useContext, useEffect, useMemo } from "react";
import dynamic from "next/dynamic";
import { FROST_FONT_CLASSES, FROST_FONT_VARS } from "@/components/frost/frostFonts";
import { setArtifactBoundsFamily } from "@/lib/canvasNodeBounds";
import { resolveArtifactStyle } from "@/lib/design/style/resolveArtifactStyle";
import {
  DEFAULT_ARTIFACT_STYLE_ID,
  getArtifactStylePack,
} from "@/lib/design/style/stylePacks";
import type {
  ArtifactStyleId,
  ArtifactStylePreset,
  ResolvedArtifactStyle,
} from "@/lib/design/style/types";

/**
 * TEMPORARY dev tool. Lazy so it never reaches a production bundle: it only
 * loads when the Bento pack is live in a dev build.
 */
const BentoColorLab = dynamic(
  () => import("@/components/dev/BentoColorLab").then((m) => m.BentoColorLab),
  { ssr: false },
);

const DEFAULT_RESOLVED: ResolvedArtifactStyle = {
  css: "",
  lightVars: {},
  darkVars: {},
  isDefault: true,
};

/**
 * Resolved style pack for the enclosing scope — the JS-side seam for
 * renderers CSS can't reach (ECharts canvas palettes, map tiles).
 */
const ArtifactStyleContext = createContext<{
  styleId: ArtifactStyleId;
  resolved: ResolvedArtifactStyle;
  /** The active pack definition — JS renderers read `pack[mode].chart` etc. */
  pack: ArtifactStylePreset;
}>({
  styleId: DEFAULT_ARTIFACT_STYLE_ID,
  resolved: DEFAULT_RESOLVED,
  pack: getArtifactStylePack(DEFAULT_ARTIFACT_STYLE_ID),
});

export function useArtifactStyle() {
  return useContext(ArtifactStyleContext);
}

/**
 * Scopes an artifact style pack to a canvas. Wrap the canvas itself, never
 * the floating Flowstate UI around it (panels, toolbar, minimap) — that chrome
 * stays on brand whatever pack is active. Every canvas gets the neutral grey
 * `.canvas-surface` token layer (globals.css); non-default packs nest inside
 * it, set `data-artifact-style` (the hook for app/styles/artifact-styles.css)
 * and inject the pack's CSS variables via a declarative <style> tag
 * (StrictMode/unmount safe). `display: contents` keeps layout untouched while
 * custom properties still inherit through.
 */
export function ArtifactStyleScope({
  styleId,
  children,
}: {
  styleId: ArtifactStyleId;
  children: React.ReactNode;
}) {
  const resolved = useMemo(() => resolveArtifactStyle(styleId), [styleId]);
  const value = useMemo(
    () => ({ styleId, resolved, pack: getArtifactStylePack(styleId) }),
    [styleId, resolved],
  );

  // Node bounds (culling, connectors, plugs, selection) read the active body
  // family's own box. Set during render so this pass already draws with it;
  // idempotent, and cleared when the scope unmounts.
  const bodyFamily = value.pack.bodyFamily ?? null;
  setArtifactBoundsFamily(bodyFamily);
  useEffect(() => {
    setArtifactBoundsFamily(bodyFamily);
    return () => setArtifactBoundsFamily(null);
  }, [bodyFamily]);

  // Mirror the active pack onto <html> so canvas menus portaled to <body>
  // (outside this subtree) can follow it — see resolveArtifactStyle.
  useEffect(() => {
    if (resolved.isDefault) return;
    const root = document.documentElement;
    root.dataset.canvasStyle = styleId;
    // Portaled menus need the pack's fonts too (they resolve on <html>).
    const fontClasses =
      getArtifactStylePack(styleId).bodyFamily === "frost"
        ? FROST_FONT_CLASSES.split(" ")
        : [];
    root.classList.add(...fontClasses);
    return () => {
      if (root.dataset.canvasStyle === styleId) delete root.dataset.canvasStyle;
      root.classList.remove(...fontClasses);
    };
  }, [styleId, resolved.isDefault]);

  if (resolved.isDefault) {
    return (
      <div className="canvas-surface canvas-surface-vanilla contents">
        {children}
      </div>
    );
  }

  return (
    <ArtifactStyleContext.Provider value={value}>
      <div className="canvas-surface contents">
        <div
          data-artifact-style={styleId}
          className={`contents ${value.pack.bodyFamily === "frost" ? FROST_FONT_CLASSES : ""}`}
          style={value.pack.bodyFamily === "frost" ? FROST_FONT_VARS : undefined}
        >
          <style>{resolved.css}</style>
          {children}
          {process.env.NODE_ENV !== "production" && styleId === "bento" ? (
            <BentoColorLab />
          ) : null}
        </div>
      </div>
    </ArtifactStyleContext.Provider>
  );
}
