"use client";

import { useEffect, useState } from "react";
import { useArtifactStyle } from "@/components/ArtifactStyleScope";
import { getArtifactStylePack } from "@/lib/design/style/stylePacks";
import { artifactCategoryOf } from "@/lib/design/theme/artifactCategories";
import type { ArtifactCategoryKind } from "@/lib/design/theme/types";
import { useCanvasStore } from "@/lib/store";

/** Packs where every card is one solid colour (no pale role). */
const SOLID_PACKS = new Set(["bento"]);

/**
 * Fired when something rewrites the pack's `--art-*` channels at runtime
 * (today: the dev colour lab). CSS repaints itself; the JS renderers —
 * ECharts, visx, the timeline SVG — have to be told to re-read.
 */
export const ARTIFACT_TONES_EVENT = "flowstate:artifact-tones";

export type CategoryTones = { fill: string; onFill: string };

function channelsToHex(value: string): string | null {
  const parts = value.trim().split(/[\s,]+/).map(Number);
  if (parts.length < 3 || parts.some((n) => !Number.isFinite(n))) return null;
  return `#${parts
    .slice(0, 3)
    .map((n) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, "0"))
    .join("")}`.toUpperCase();
}

/**
 * Per-kind channels win over the category's — that is the same precedence the
 * stylesheet gives them, so a kind mapped on its own stays consistent between
 * the CSS surfaces and the canvas-rendered ones.
 */
function readScopeTones(
  styleId: string,
  kind: ArtifactCategoryKind,
): CategoryTones | null {
  const scope = document.querySelector(`[data-artifact-style="${styleId}"]`);
  if (!scope) return null;
  const computed = getComputedStyle(scope);
  const category = artifactCategoryOf(kind);
  const read = (role: "solid" | "on-solid") =>
    channelsToHex(computed.getPropertyValue(`--art-kind-${kind}-${role}`)) ??
    channelsToHex(computed.getPropertyValue(`--art-cat-${category}-${role}`));
  const fill = read("solid");
  const onFill = read("on-solid");
  return fill && onFill ? { fill, onFill } : null;
}

/**
 * The live solid/ink pair for one artifact kind, or null when the active pack
 * is not a solid one (callers then keep their own palette).
 *
 * The pack literal is the synchronous answer — correct on first paint and
 * during SSR — and the DOM read that follows picks up any runtime override.
 */
export function useArtifactTones(
  kind: ArtifactCategoryKind,
): CategoryTones | null {
  const { styleId } = useArtifactStyle();
  const canvasTheme = useCanvasStore((s) => s.canvasTheme);
  const isSolidPack = SOLID_PACKS.has(styleId);

  const packTones = (() => {
    if (!isSolidPack) return null;
    const pack = getArtifactStylePack(styleId);
    const tones = (canvasTheme === "dark" ? pack.dark : pack.light).categories?.[
      artifactCategoryOf(kind)
    ];
    return tones ? { fill: tones.solid, onFill: tones.onSolid } : null;
  })();

  const [tones, setTones] = useState<CategoryTones | null>(packTones);

  useEffect(() => {
    if (!isSolidPack) {
      setTones(null);
      return;
    }
    const sync = () => setTones(readScopeTones(styleId, kind) ?? packTones);
    sync();
    window.addEventListener(ARTIFACT_TONES_EVENT, sync);
    return () => window.removeEventListener(ARTIFACT_TONES_EVENT, sync);
    // packTones is derived from the same three inputs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [styleId, kind, canvasTheme, isSolidPack]);

  return isSolidPack ? tones : null;
}
