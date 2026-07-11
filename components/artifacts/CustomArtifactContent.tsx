"use client";



import { ArtifactContentStage } from "@/components/artifacts/ArtifactContentStage";

import { DynamicUiFrame } from "@/components/cards/custom/DynamicUiFrame";

import type { ArtifactPayload } from "@/lib/artifactTypes";



export function CustomArtifactContent({
  payload,
  fill = false,
  sidebar = false,
  sidebarPreview = false,
  layout = "panel",
  artifactId,
}: {
  payload: Extract<ArtifactPayload, { type: "custom" }>;
  fill?: boolean;
  sidebar?: boolean;
  sidebarPreview?: boolean;
  layout?: "canvas" | "panel" | "sidebar";
  artifactId?: string;
}) {
  const isCanvas = layout === "canvas";
  const readOnlyShell = !isCanvas ? "pointer-events-none " : "";

  if (sidebar) {
    return (
      <div className="pointer-events-none h-full min-h-0 w-full overflow-hidden">
        <DynamicUiFrame data={payload.data} />
      </div>
    );
  }



  if (fill) {
    return (
      <ArtifactContentStage
        fill
        artifactId={artifactId}
        className={sidebarPreview ? "h-full w-full" : "h-full min-h-0"}
      >
        <div className={`${readOnlyShell}h-full w-full`}>
          <DynamicUiFrame data={payload.data} />
        </div>
      </ArtifactContentStage>
    );
  }

  return (
    <ArtifactContentStage
      className="aspect-[4/3] min-h-[280px]"
      minHeight="280px"
      artifactId={artifactId}
    >
      <div className={`${readOnlyShell}h-full w-full`}>
        <DynamicUiFrame data={payload.data} />
      </div>
    </ArtifactContentStage>
  );

}

