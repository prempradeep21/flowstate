"use client";

import {
  useCallback,
  useRef,
  useState,
  type CSSProperties,
  type MutableRefObject,
  type ReactNode,
} from "react";
import { useArtifactExportOptional } from "@/components/artifacts/ArtifactExportContext";
import { useArtifactMenuControls } from "@/components/artifacts/ArtifactMenuControlsContext";
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
  artifactId,
}: {
  children: ReactNode;
  className?: string;
  minHeight?: string;
  fill?: boolean;
  artifactId?: string;
}) {
  const menuControls = useArtifactMenuControls();
  const [localFontScale] = useArtifactFontScale(artifactId);
  const fontScale = menuControls?.fontScale ?? localFontScale;
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
      className={`artifact-content-stage overflow-hidden bg-canvas-card ${
        fill ? "rounded-b-canvas" : "rounded-canvas-sm"
      } ${fill ? "flex min-h-0 w-full flex-1 flex-col" : ""} ${className}`}
      style={stageStyle}
    >
      <div
        ref={setExportRootRef}
        data-artifact-export-root
        className={`artifact-content-body ${
          fill ? "flex min-h-0 flex-1 flex-col" : ""
        } h-full`}
      >
        {children}
      </div>
    </div>
  );
}
