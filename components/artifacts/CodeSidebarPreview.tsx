"use client";

import { highlightCode, languageFromPath } from "@/lib/codeHighlight";
import type { ArtifactPayload } from "@/lib/artifactTypes";

export function CodeSidebarPreview({
  payload,
}: {
  payload: Extract<ArtifactPayload, { type: "code" }>;
}) {
  const file = payload.data.files?.[0];
  if (!file) {
    return (
      <div className="flex h-full items-center justify-center p-3 text-canvas-caption text-canvas-muted">
        No files
      </div>
    );
  }

  const lang = file.language || languageFromPath(file.path);
  const html = highlightCode(file.content.slice(0, 800), lang);

  return (
    <div data-canvas-scroll className="h-full overflow-hidden bg-canvas-card p-2">
      <p className="mb-1 truncate text-canvas-micro font-medium text-canvas-muted">
        {file.path}
      </p>
      <pre className="max-h-full overflow-hidden font-mono text-canvas-micro leading-[1.45] text-canvas-ink">
        <code dangerouslySetInnerHTML={{ __html: html }} />
      </pre>
    </div>
  );
}
