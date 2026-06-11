"use client";

import {
  useEffect,
  type RefObject,
} from "react";
import { ARTIFACT_CONTROLS_BAR_HEIGHT_PX } from "@/lib/artifactFontScale";
import type { ArtifactContentAreaSize } from "@/components/artifacts/ArtifactCanvasSizeReportContext";

function measureContentSize(el: HTMLElement): { w: number; h: number } {
  let w = Math.ceil(el.scrollWidth);
  let h = Math.ceil(el.scrollHeight);
  // Percentage-sized children (h-full / w-full) collapse before the canvas node allocates space.
  if (w === 0 || h === 0) {
    for (const child of el.children) {
      if (!(child instanceof HTMLElement)) continue;
      if (w === 0) w = Math.max(w, Math.ceil(child.scrollWidth));
      if (h === 0) h = Math.max(h, Math.ceil(child.scrollHeight));
    }
  }
  return { w, h };
}

function measureStageNaturalSize(
  stage: HTMLElement,
  body: HTMLElement,
  showControls: boolean,
): ArtifactContentAreaSize {
  const controlsH = showControls ? ARTIFACT_CONTROLS_BAR_HEIGHT_PX : 0;
  const { w: bodyW, h: bodyH } = measureContentSize(body);
  const stageW = Math.ceil(stage.clientWidth);
  const stageH = Math.ceil(stage.clientHeight);
  const contentH = controlsH + bodyH;
  // Fill-mode children use w-full / h-full, so prefer the stage's allocated size.
  return {
    w: Math.max(stageW, bodyW),
    h: Math.max(stageH, contentH),
  };
}

export function useArtifactStageNaturalSize({
  stageRef,
  bodyRef,
  fontScale,
  showControls,
  fill,
  onCanvasSizeChange,
  onAutoSize,
}: {
  stageRef: RefObject<HTMLElement | null>;
  bodyRef: RefObject<HTMLElement | null>;
  fontScale: number;
  showControls: boolean;
  fill: boolean;
  onCanvasSizeChange?: (size: ArtifactContentAreaSize) => void;
  onAutoSize?: (size: ArtifactContentAreaSize) => void;
}) {
  useEffect(() => {
    const stage = stageRef.current;
    const body = bodyRef.current;
    if (!stage || !body) return;
    if (!onCanvasSizeChange && !onAutoSize) return;

    let frame = 0;

    const report = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const size = measureStageNaturalSize(stage, body, showControls);
        onCanvasSizeChange?.(size);
        if (!fill && onAutoSize) {
          onAutoSize(size);
        }
      });
    };

    report();

    const ro = new ResizeObserver(report);
    ro.observe(body);
    // In fill mode the stage tracks the node; observing it would fight manual resize.
    if (!fill) ro.observe(stage);

    return () => {
      cancelAnimationFrame(frame);
      ro.disconnect();
    };
  }, [
    bodyRef,
    fill,
    fontScale,
    onAutoSize,
    onCanvasSizeChange,
    showControls,
    stageRef,
  ]);
}
