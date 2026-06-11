"use client";

import {
  useCallback,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { ArtifactControlsBar } from "@/components/artifacts/ArtifactControlsBar";
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
  artifactId,
}: {
  children: ReactNode;
  className?: string;
  minHeight?: string;
  fill?: boolean;
  /** Artifact-specific controls rendered in the reserved top strip (left side). */
  controls?: ReactNode;
  /** When false, hides the top control strip (e.g. sidebar thumbnails). */
  showControls?: boolean;
  artifactId?: string;
}) {
  const [fontScale, setFontScale] = useArtifactFontScale(artifactId);
  const onCanvasSizeChange = useArtifactCanvasSizeReport();
  const stageRef = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const [autoSize, setAutoSize] = useState<ArtifactContentAreaSize | null>(null);

  const handleAutoSize = useCallback((size: ArtifactContentAreaSize) => {
    setAutoSize(size);
  }, []);

  useArtifactStageNaturalSize({
    stageRef,
    bodyRef,
    fontScale,
    showControls,
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
      {showControls ? (
        <ArtifactControlsBar
          fontScale={fontScale}
          onFontScaleChange={setFontScale}
        >
          {controls}
        </ArtifactControlsBar>
      ) : null}
      <div
        ref={bodyRef}
        className={`artifact-content-body ${
          fill ? "flex min-h-0 flex-1 flex-col" : ""
        } ${showControls ? "" : "h-full"}`}
      >
        {children}
      </div>
    </div>
  );
}
