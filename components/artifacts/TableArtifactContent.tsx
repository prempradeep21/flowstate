"use client";

import { ArtifactContentStage } from "@/components/artifacts/ArtifactContentStage";
import { ArtifactTable } from "@/components/artifacts/ArtifactTable";
import type { ArtifactPayload } from "@/lib/artifactTypes";

export function TableArtifactContent({
  payload,
}: {
  payload: Extract<ArtifactPayload, { type: "table" }>;
}) {
  const { columns, rows } = payload.data;

  return (
    <ArtifactContentStage minHeight="200px" className="min-h-[200px] max-h-[480px] p-0">
      <ArtifactTable columns={columns} rows={rows} />
    </ArtifactContentStage>
  );
}
