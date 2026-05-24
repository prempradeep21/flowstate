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
    <ArtifactContentStage minHeight="280px" className="min-h-[280px]">
      <div className="h-full min-h-[280px] w-full">
        <DynamicUiFrame data={payload.data} />
      </div>
    </ArtifactContentStage>
  );
}
