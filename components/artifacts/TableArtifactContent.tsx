"use client";

import { ArtifactContentStage } from "@/components/artifacts/ArtifactContentStage";
import { ArtifactTable } from "@/components/artifacts/ArtifactTable";
import type { ArtifactPayload } from "@/lib/artifactTypes";

export function TableArtifactContent({
  payload,
  fill = false,
}: {
  payload: Extract<ArtifactPayload, { type: "table" }>;
  fill?: boolean;
}) {
  const { columns, rows } = payload.data;

  if (fill) {
    return (
      <ArtifactContentStage fill className="h-full p-0">
        <ArtifactTable
          columns={columns}
          rows={rows}
          maxHeightClassName="h-full max-h-none"
        />
      </ArtifactContentStage>
    );
  }

  return (
    <ArtifactContentStage minHeight="200px" className="min-h-[200px] max-h-[480px] p-0">
      <ArtifactTable columns={columns} rows={rows} />
    </ArtifactContentStage>
  );
}
