"use client";

import { useEffect, useState } from "react";
import { ArtifactContentStage } from "@/components/artifacts/ArtifactContentStage";
import { useArtifactExportOptional } from "@/components/artifacts/ArtifactExportContext";
import { highlightCode, languageFromPath } from "@/lib/codeHighlight";
import type { ArtifactPayload } from "@/lib/artifactTypes";

export function CodeArtifactContent({
  payload,
  fill = false,
  onActiveFileChange,
  artifactId,
  showControls = true,
}: {
  payload: Extract<ArtifactPayload, { type: "code" }>;
  fill?: boolean;
  onActiveFileChange?: (path: string) => void;
  artifactId?: string;
  showControls?: boolean;
}) {
  const files = payload.data.files ?? [];
  const [activeIdx, setActiveIdx] = useState(0);
  const active = files[activeIdx];
  const exportCtx = useArtifactExportOptional();

  useEffect(() => {
    if (!exportCtx) return;
    exportCtx.setCodeActiveFile(active?.content ?? null, active?.path ?? null);
    return () => exportCtx.setCodeActiveFile(null, null);
  }, [active?.content, active?.path, exportCtx]);

  useEffect(() => {
    if (active?.path) onActiveFileChange?.(active.path);
  }, [active?.path, onActiveFileChange]);

  const selectFile = (i: number) => {
    setActiveIdx(i);
  };

  if (!active) {
    return (
      <ArtifactContentStage
        minHeight={fill ? undefined : "240px"}
        fill={fill}
        artifactId={artifactId}
        showControls={showControls}
      >
        <p className="p-4 text-canvas-body-sm text-canvas-muted">No files in this artifact.</p>
      </ArtifactContentStage>
    );
  }

  const lang = active.language || languageFromPath(active.path);
  const html = highlightCode(active.content, lang);

  if (fill) {
    return (
      <ArtifactContentStage
        fill
        artifactId={artifactId}
        showControls={showControls}
        className="h-full"
      >
        {files.length > 1 && (
          <div className="flex shrink-0 flex-wrap gap-1 border-b border-canvas-border/40 px-3 pb-2 pt-3">
            {files.map((f, i) => (
              <button
                key={f.path}
                type="button"
                onClick={() => selectFile(i)}
                className={`rounded px-2 py-1 text-canvas-compact transition-colors ${
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
        <pre
          data-canvas-scroll
          className="min-h-0 flex-1 overflow-auto p-4 font-mono text-canvas-body-sm leading-[1.55] text-canvas-ink"
        >
          <code dangerouslySetInnerHTML={{ __html: html }} />
        </pre>
      </ArtifactContentStage>
    );
  }

  return (
    <ArtifactContentStage
      minHeight="240px"
      artifactId={artifactId}
      showControls={showControls}
    >
      {files.length > 1 && (
        <div className="flex flex-wrap gap-1 border-b border-canvas-border/40 px-3 pb-2 pt-3">
          {files.map((f, i) => (
            <button
              key={f.path}
              type="button"
              onClick={() => selectFile(i)}
              className={`rounded px-2 py-1 text-canvas-compact transition-colors ${
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
      <pre
        data-canvas-scroll
        className="max-h-[min(480px,60vh)] overflow-auto p-4 font-mono text-canvas-body-sm leading-[1.55] text-canvas-ink"
      >
        <code dangerouslySetInnerHTML={{ __html: html }} />
      </pre>
    </ArtifactContentStage>
  );
}
