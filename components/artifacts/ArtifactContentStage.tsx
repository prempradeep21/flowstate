"use client";

import {
  useCallback,
  useRef,
  useState,
  type CSSProperties,
  type MutableRefObject,
  type ReactNode,
} from "react";
import { ArtifactControlsBar } from "@/components/artifacts/ArtifactControlsBar";
import { useHideArtifactControls } from "@/components/artifacts/ArtifactControlsVisibility";
import { useArtifactExportOptional } from "@/components/artifacts/ArtifactExportContext";
import {
  useArtifactCanvasSizeReport,
  type ArtifactContentAreaSize,
} from "@/components/artifacts/ArtifactCanvasSizeReportContext";
import { useArtifactFontScale } from "@/hooks/useArtifactFontScale";
import { useArtifactStageNaturalSize } from "@/hooks/useArtifactStageNaturalSize";

export function ArtifactContentStage({
  children,
  className = "",
  minHeight,
  fill = false,
  controls,
  showControls = true,
  showFontControls = true,
  artifactId,
  canvasChrome = false,
}: {
  children: ReactNode;
  className?: string;
  minHeight?: string;
  fill?: boolean;
  /** Artifact-specific controls rendered in the reserved top strip (left side). */
  controls?: ReactNode;
  /** When false, hides the top control strip (e.g. sidebar thumbnails). */
  showControls?: boolean;
  /** When false, hides Aa font scale controls (e.g. audio speed toolbar only). */
  showFontControls?: boolean;
  artifactId?: string;
  canvasChrome?: boolean;
}) {
  const [fontScale, setFontScale] = useArtifactFontScale(artifactId);
  // Read-only mobile renderer forces all control strips off.
  const effectiveShowControls = showControls && !useHideArtifactControls();
  const onCanvasSizeChange = useArtifactCanvasSizeReport();
  const exportCtx = useArtifactExportOptional();
  const stageRef = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const [autoSize, setAutoSize] = useState<ArtifactContentAreaSize | null>(null);

  const setExportRootRef = useCallback(
    (node: HTMLDivElement | null) => {
      (bodyRef as MutableRefObject<HTMLDivElement | null>).current = node;
      if (exportCtx) {
        exportCtx.exportRootRef.current = node;
      }
    },
    [exportCtx],
  );

  const handleAutoSize = useCallback((size: ArtifactContentAreaSize) => {
    setAutoSize(size);
  }, []);

  useArtifactStageNaturalSize({
    stageRef,
    bodyRef,
    fontScale,
    showControls: effectiveShowControls,
    fill,
    onCanvasSizeChange,
    onAutoSize: onCanvasSizeChange ? undefined : handleAutoSize,
  });

  const stageStyle: CSSProperties = {
    ...(minHeight && !fill && !autoSize ? { minHeight } : {}),
    ["--artifact-font-scale" as string]: String(fontScale),
    ...(!fill && autoSize
      ? {
          width: autoSize.w,
          minWidth: autoSize.w,
          height: autoSize.h,
          minHeight: autoSize.h,
        }
      : {}),
  };

  return (
    <div
      ref={stageRef}
      className={`artifact-content-stage overflow-hidden rounded-canvas-sm bg-canvas-artifactStage ${
        fill ? "flex min-h-0 w-full flex-1 flex-col" : ""
      } ${className}`}
      style={stageStyle}
    >
      {effectiveShowControls ? (
        <ArtifactControlsBar
          fontScale={fontScale}
          onFontScaleChange={setFontScale}
          showFontControls={showFontControls}
          canvasChrome={canvasChrome}
        >
          {controls}
        </ArtifactControlsBar>
      ) : null}
      <div
        ref={setExportRootRef}
        data-artifact-export-root
        className={`artifact-content-body ${
          fill ? "flex min-h-0 flex-1 flex-col" : ""
        } ${showControls ? "" : "h-full"}`}
      >
        {children}
      </div>
    </div>
  );
}
