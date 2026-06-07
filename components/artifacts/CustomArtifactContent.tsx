"use client";

import { ArtifactContentStage } from "@/components/artifacts/ArtifactContentStage";
import { DynamicUiFrame } from "@/components/cards/custom/DynamicUiFrame";
import type { ArtifactPayload } from "@/lib/artifactTypes";

export function CustomArtifactContent({
  payload,
  fill = false,
}: {
  payload: Extract<ArtifactPayload, { type: "custom" }>;
  fill?: boolean;
}) {
  if (fill) {
    return (
      <ArtifactContentStage fill className="h-full min-h-0">
        <div className="h-full min-h-0 w-full">
          <DynamicUiFrame data={payload.data} />
        </div>
      </ArtifactContentStage>
    );
  }

  return (
    <ArtifactContentStage className="aspect-[4/3] min-h-[280px]" minHeight="280px">
      <div className="h-full w-full">
        <DynamicUiFrame data={payload.data} />
      </div>
    </ArtifactContentStage>
  );
}
