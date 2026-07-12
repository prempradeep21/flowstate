"use client";

import { createContext, useContext, useMemo } from "react";
import { resolveArtifactStyle } from "@/lib/design/style/resolveArtifactStyle";
import { DEFAULT_ARTIFACT_STYLE_ID } from "@/lib/design/style/stylePacks";
import type {
  ArtifactStyleId,
  ResolvedArtifactStyle,
} from "@/lib/design/style/types";

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
}>({ styleId: DEFAULT_ARTIFACT_STYLE_ID, resolved: DEFAULT_RESOLVED });

export function useArtifactStyle() {
  return useContext(ArtifactStyleContext);
}

/**
 * Scopes an artifact style pack to a subtree. Vanilla (the default pack)
 * renders children bare — no wrapper, no stylesheet — so the factory look is
 * a structural no-op. Non-default packs set `data-artifact-style` (the hook
 * for app/styles/artifact-styles.css) and inject the pack's CSS variables via
 * a declarative <style> tag (StrictMode/unmount safe). `display: contents`
 * keeps layout untouched while custom properties still inherit through.
 */
export function ArtifactStyleScope({
  styleId,
  children,
}: {
  styleId: ArtifactStyleId;
  children: React.ReactNode;
}) {
  const resolved = useMemo(() => resolveArtifactStyle(styleId), [styleId]);
  const value = useMemo(() => ({ styleId, resolved }), [styleId, resolved]);

  if (resolved.isDefault) {
    return <>{children}</>;
  }

  return (
    <ArtifactStyleContext.Provider value={value}>
      <div data-artifact-style={styleId} className="contents">
        <style>{resolved.css}</style>
        {children}
      </div>
    </ArtifactStyleContext.Provider>
  );
}
