"use client";

import { ArtifactContentStage } from "@/components/artifacts/ArtifactContentStage";
import { ArtifactTable } from "@/components/artifacts/ArtifactTable";
import { TableShaderSkeleton } from "@/components/artifacts/TableShaderSkeleton";
import type { ArtifactPayload } from "@/lib/artifactTypes";
import {
  TABLE_ARTIFACT_BODY_MIN_HEIGHT,
  TABLE_ARTIFACT_STAGE_WIDTH,
} from "@/lib/canvasNodeBounds";
import { normalizeTableArtifactData } from "@/lib/tableArtifact";

const CANVAS_TABLE_BODY_CLASS = "max-h-none";

export function TableArtifactContent({
  payload,
  artifactId,
  versionId,
  fill = false,
  sidebar = false,
  showControls = true,
}: {
  payload: Extract<ArtifactPayload, { type: "table" }>;
  artifactId?: string;
  versionId?: string;
  fill?: boolean;
  sidebar?: boolean;
  showControls?: boolean;
}) {
  const { columns, rows } = normalizeTableArtifactData(payload.data);
  const accentSeed = artifactId ?? payload.title;
  const isLoading = rows.length === 0;
  const columnCount = columns.length > 0 ? columns.length : 5;

  if (sidebar) {
    return (
      <div className="h-full overflow-hidden rounded-canvas-sm bg-canvas-card m-1.5">
        {isLoading ? (
          <TableShaderSkeleton
            accentSeed={accentSeed}
            columnCount={columnCount}
            compact
            maxHeightClassName="h-full max-h-[188px]"
          />
        ) : (
          <ArtifactTable
            columns={columns}
            rows={rows}
            accentSeed={accentSeed}
            versionId={versionId}
            compact
            maxHeightClassName="h-full max-h-[188px]"
          />
        )}
      </div>
    );
  }

  if (fill) {
    return (
      <ArtifactContentStage
        fill
        artifactId={artifactId}
        showControls={showControls}
        className="flex-1 !bg-transparent p-0"
      >
        {isLoading ? (
          <TableShaderSkeleton
            accentSeed={accentSeed}
            columnCount={columnCount}
            maxHeightClassName={CANVAS_TABLE_BODY_CLASS}
            minHeightPx={TABLE_ARTIFACT_BODY_MIN_HEIGHT}
            minWidthPx={TABLE_ARTIFACT_STAGE_WIDTH}
            canvasSurface
          />
        ) : (
          <ArtifactTable
            columns={columns}
            rows={rows}
            accentSeed={accentSeed}
            versionId={versionId}
            maxHeightClassName={CANVAS_TABLE_BODY_CLASS}
            canvasSurface
          />
        )}
      </ArtifactContentStage>
    );
  }

  return (
    <ArtifactContentStage
      minHeight="200px"
      artifactId={artifactId}
      showControls={showControls}
      className="min-h-[200px] !bg-canvas-card p-0"
    >
      {isLoading ? (
        <TableShaderSkeleton
          accentSeed={accentSeed}
          columnCount={columnCount}
        />
      ) : (
        <ArtifactTable
          columns={columns}
          rows={rows}
          accentSeed={accentSeed}
          versionId={versionId}
        />
      )}
    </ArtifactContentStage>
  );
}
