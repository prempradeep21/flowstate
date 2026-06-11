"use client";

import { ArtifactContentStage } from "@/components/artifacts/ArtifactContentStage";
import type { ArtifactPayload } from "@/lib/artifactTypes";

function ThreeDInner({
  modelUrl,
  format,
  compact = false,
}: {
  modelUrl: string;
  format: string;
  compact?: boolean;
}) {
  return (
    <div
      className={`flex h-full w-full flex-col items-center justify-center bg-canvas-stageDark text-center ${
        compact ? "p-3" : "p-6"
      }`}
    >
      <p className={`text-white/70 ${compact ? "text-canvas-micro" : "text-canvas-body-sm"}`}>
        3D model preview
      </p>
      {!compact && (
        <>
          <a
            href={modelUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 max-w-full truncate text-canvas-compact text-violet-300 hover:underline"
          >
            Open {format.toUpperCase()} model
          </a>
          <p className="mt-4 text-canvas-caption text-white/40">
            Embed viewer loads in a future update; model URL is ready.
          </p>
        </>
      )}
    </div>
  );
}

export function ThreeDArtifactContent({
  payload,
  fill = false,
  sidebar = false,
  artifactId,
  showControls = true,
}: {
  payload: Extract<ArtifactPayload, { type: "3d" }>;
  fill?: boolean;
  sidebar?: boolean;
  artifactId?: string;
  showControls?: boolean;
}) {
  const { modelUrl, format = "glb" } = payload.data;

  if (sidebar) {
    return <ThreeDInner modelUrl={modelUrl} format={format} compact />;
  }

  if (fill) {
    return (
      <ArtifactContentStage
        fill
        artifactId={artifactId}
        showControls={showControls}
        className="h-full min-h-0"
      >
        <ThreeDInner modelUrl={modelUrl} format={format} />
      </ArtifactContentStage>
    );
  }

  return (
    <ArtifactContentStage
      artifactId={artifactId}
      showControls={showControls}
      className="aspect-[4/3]"
    >
      <div className="min-h-[280px] h-full">
        <ThreeDInner modelUrl={modelUrl} format={format} />
      </div>
    </ArtifactContentStage>
  );
}
