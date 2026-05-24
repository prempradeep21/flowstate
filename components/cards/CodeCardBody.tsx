"use client";

import { useState } from "react";
import { ArtifactCardChrome } from "@/components/cards/ArtifactCardChrome";
import { TextCardBody } from "@/components/cards/TextCardBody";
import type { Card } from "@/lib/store";

interface CodeCardBodyProps {
  card: Card;
  isStreaming?: boolean;
}

export function CodeCardBody({ card, isStreaming }: CodeCardBodyProps) {
  const payload =
    card.artifactPayload?.type === "code" ? card.artifactPayload : null;
  const files = payload?.data.files ?? [];
  const [activeIdx, setActiveIdx] = useState(0);
  const active = files[activeIdx];

  if (!payload || files.length === 0) {
    return <TextCardBody card={card} isStreaming={isStreaming} />;
  }

  return (
    <div className="flex flex-col gap-3">
      {card.answer.trim() && (
        <TextCardBody card={card} isStreaming={isStreaming} />
      )}
      <ArtifactCardChrome
        type="code"
        title={payload.title}
        description={payload.description}
      >
        {files.length > 1 && (
          <div className="flex flex-wrap gap-1 border-b border-canvas-border pb-2">
            {files.map((f, i) => (
              <button
                key={f.path}
                type="button"
                onClick={() => setActiveIdx(i)}
                className={`rounded px-2 py-1 text-[12px] ${
                  i === activeIdx
                    ? "bg-canvas-ink text-canvas-card"
                    : "text-canvas-muted hover:bg-canvas-bg"
                }`}
              >
                {f.path}
              </button>
            ))}
          </div>
        )}
        {active && (
          <pre className="max-h-80 overflow-auto rounded-lg bg-[#f4f4f5] p-3 text-[12px] leading-relaxed text-canvas-ink">
            <code>{active.content}</code>
          </pre>
        )}
      </ArtifactCardChrome>
    </div>
  );
}
