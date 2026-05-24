"use client";

import { ArtifactContentStage } from "@/components/artifacts/ArtifactContentStage";
import { DynamicUiFrame } from "@/components/cards/custom/DynamicUiFrame";
import type { ArtifactPayload } from "@/lib/artifactTypes";

export function CustomArtifactContent({
  payload,
}: {
  payload: Extract<ArtifactPayload, { type: "custom" }>;
}) {
  return (
    <ArtifactContentStage className="aspect-[4/3] min-h-[280px]" minHeight="280px">
      <div className="h-full w-full">
        <DynamicUiFrame data={payload.data} />
      </div>
    </ArtifactContentStage>
  );
}
