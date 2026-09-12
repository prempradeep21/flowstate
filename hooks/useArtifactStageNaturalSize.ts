"use client";

import {
  useEffect,
  type RefObject,
} from "react";
import type { ArtifactContentAreaSize } from "@/components/artifacts/ArtifactCanvasSizeReportContext";

function measureContentSize(el: HTMLElement): { w: number; h: number } {
  let w = Math.ceil(el.scrollWidth);
  let h = Math.ceil(el.scrollHeight);
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
): ArtifactContentAreaSize {
  const { w: bodyW, h: bodyH } = measureContentSize(body);
  const stageW = Math.ceil(stage.clientWidth);
  const stageH = Math.ceil(stage.clientHeight);
  return {
    w: Math.max(stageW, bodyW),
    h: Math.max(stageH, bodyH, body.scrollHeight),
  };
}

export function useArtifactStageNaturalSize({
  stageRef,
  bodyRef,
  fontScale,
  fill,
  onCanvasSizeChange,
  onAutoSize,
}: {
  stageRef: RefObject<HTMLElement | null>;
  bodyRef: RefObject<HTMLElement | null>;
  fontScale: number;
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
        const size = measureStageNaturalSize(stage, body);
        // Hidden (display:none keep-alive) or unlaid-out stages measure 0×0 —
        // reporting that would collapse the node to its default size. The
        // ResizeObserver fires again when the node is shown.
        if (size.w <= 0 && size.h <= 0) return;
        onCanvasSizeChange?.(size);
        if (!fill && onAutoSize) {
          onAutoSize(size);
        }
      });
    };

    report();

    const ro = new ResizeObserver(report);
    ro.observe(body);
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
    stageRef,
  ]);
}
