"use client";

import { useState } from "react";
import { ArtifactContentStage } from "@/components/artifacts/ArtifactContentStage";
import { highlightCode, languageFromPath } from "@/lib/codeHighlight";
import type { ArtifactPayload } from "@/lib/artifactTypes";

export function CodeArtifactContent({
  payload,
  onActiveFileChange,
}: {
  payload: Extract<ArtifactPayload, { type: "code" }>;
  onActiveFileChange?: (path: string) => void;
}) {
  const files = payload.data.files ?? [];
  const [activeIdx, setActiveIdx] = useState(0);
  const active = files[activeIdx];

  const selectFile = (i: number) => {
    setActiveIdx(i);
    const path = files[i]?.path;
    if (path) onActiveFileChange?.(path);
  };

  if (!active) {
    return (
      <ArtifactContentStage minHeight="240px">
        <p className="p-4 text-[13px] text-canvas-muted">No files in this artifact.</p>
      </ArtifactContentStage>
    );
  }

  const lang = active.language || languageFromPath(active.path);
  const html = highlightCode(active.content, lang);

  return (
    <ArtifactContentStage minHeight="240px">
      {files.length > 1 && (
        <div className="flex flex-wrap gap-1 border-b border-canvas-border/40 px-3 pb-2 pt-3">
          {files.map((f, i) => (
            <button
              key={f.path}
              type="button"
              onClick={() => selectFile(i)}
              className={`rounded px-2 py-1 text-[12px] transition-colors ${
                i === activeIdx
                  ? "bg-canvas-ink text-canvas-card"
                  : "text-canvas-muted hover:bg-white/60"
              }`}
            >
              {f.path}
            </button>
          ))}
        </div>
      )}
      <pre className="max-h-[min(480px,60vh)] overflow-auto p-4 font-mono text-[13px] leading-[1.55] text-canvas-ink">
        <code dangerouslySetInnerHTML={{ __html: html }} />
      </pre>
    </ArtifactContentStage>
  );
}
