"use client";

import { ArtifactContentStage } from "@/components/artifacts/ArtifactContentStage";
import { ThreeDModelViewer } from "@/components/artifacts/ThreeDModelViewer";
import type { ArtifactPayload } from "@/lib/artifactTypes";

export function ThreeDArtifactContent({
  payload,
  fill = false,
  sidebar = false,
  artifactId,
  showControls = true,
  allowInteraction = false,
}: {
  payload: Extract<ArtifactPayload, { type: "3d" }>;
  fill?: boolean;
  sidebar?: boolean;
  artifactId?: string;
  showControls?: boolean;
  allowInteraction?: boolean;
}) {
  const { modelUrl, format = "glb" } = payload.data;

  const viewer = (
    <ThreeDModelViewer
      modelUrl={modelUrl}
      format={format}
      interactive={allowInteraction}
      className={sidebar ? "min-h-[80px]" : "min-h-[200px]"}
    />
  );

  if (sidebar) {
    return (
      <div className="h-full w-full overflow-hidden rounded-canvas bg-transparent">
        {viewer}
      </div>
    );
  }

  if (fill) {
    return (
      <ArtifactContentStage
        fill
        artifactId={artifactId}
        showControls={showControls}
        className="h-full min-h-0 !bg-transparent"
      >
        {viewer}
      </ArtifactContentStage>
    );
  }

  return (
    <ArtifactContentStage
      artifactId={artifactId}
      showControls={showControls}
      className="aspect-[4/3] !bg-transparent"
    >
      <div className="min-h-[280px] h-full">{viewer}</div>
    </ArtifactContentStage>
  );
}
