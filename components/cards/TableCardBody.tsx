"use client";

import { ArtifactCardChrome } from "@/components/cards/ArtifactCardChrome";
import { ArtifactTable } from "@/components/artifacts/ArtifactTable";
import { TextCardBody } from "@/components/cards/TextCardBody";
import type { Card } from "@/lib/store";
import { normalizeTableArtifactData } from "@/lib/tableArtifact";

interface TableCardBodyProps {
  card: Card;
  isStreaming?: boolean;
}

export function TableCardBody({ card, isStreaming }: TableCardBodyProps) {
  const payload =
    card.artifactPayload?.type === "table" ? card.artifactPayload : null;

  if (!payload) {
    return <TextCardBody card={card} isStreaming={isStreaming} />;
  }

  const { columns, rows } = normalizeTableArtifactData(payload.data);

  return (
    <div className="flex flex-col gap-3">
      {card.answer.trim() && (
        <TextCardBody card={card} isStreaming={isStreaming} />
      )}
      <ArtifactCardChrome
        type="table"
        title={payload.title}
        description={payload.description}
      >
        <div className="overflow-hidden rounded-canvas border border-canvas-border bg-canvas-card">
          <ArtifactTable
            columns={columns}
            rows={rows}
            accentSeed={card.id}
          />
        </div>
      </ArtifactCardChrome>
    </div>
  );
}
