"use client";

import { useEffect, useMemo, useState } from "react";
import { ArtifactShell } from "@/components/artifacts/ArtifactShell";
import { FocusAllArtifactsGrid } from "@/components/focus/FocusAllArtifactsGrid";
import { getLatestVersion, getVersionById } from "@/lib/sessionArtifacts";
import { useCanvasStore } from "@/lib/store";

/**
 * "Current artifact" panel. Shows the focused artifact; the "All artifacts"
 * button swaps the panel body for a chronological picker grid. Deliberately
 * NOT a drop target — assets attach through the chat composer only.
 */
export function FocusArtifactPanel() {
  const focusArtifactId = useCanvasStore((s) => s.focusArtifactId);
  const sessionArtifacts = useCanvasStore((s) => s.sessionArtifacts);
  const [gridOpen, setGridOpen] = useState(false);
  // null = follow the artifact's latest version.
  const [versionId, setVersionId] = useState<string | null>(null);
  const [todoEditing, setTodoEditing] = useState(false);

  const artifact = focusArtifactId
    ? sessionArtifacts[focusArtifactId]
    : undefined;

  useEffect(() => {
    setVersionId(null);
    setTodoEditing(false);
  }, [focusArtifactId]);

  const activeVersion = useMemo(() => {
    if (!artifact) return null;
    return (
      (versionId ? getVersionById(artifact, versionId) : null) ??
      getLatestVersion(artifact)
    );
  }, [artifact, versionId]);

  return (
    <section className="flex min-h-0 min-w-0 flex-col overflow-hidden rounded-canvas border border-canvas-border bg-canvas-card shadow-card">
      <div className="flex shrink-0 items-center justify-between gap-2 border-b border-canvas-border px-4 py-3">
        <div className="min-w-0">
          <h2 className="text-canvas-body-sm font-semibold text-canvas-ink">
            {gridOpen ? "All artifacts" : "Current artifact"}
          </h2>
          {!gridOpen && artifact && (
            <p className="mt-0.5 truncate text-canvas-caption text-canvas-muted">
              {artifact.title}
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={() => setGridOpen((v) => !v)}
          aria-pressed={gridOpen}
          className="shrink-0 rounded-canvas border border-canvas-border px-2.5 py-1 text-canvas-body-sm font-medium text-canvas-ink transition-colors hover:bg-canvas-bg"
        >
          {gridOpen ? "Back" : "All artifacts"}
        </button>
      </div>

      {gridOpen ? (
        <FocusAllArtifactsGrid onClose={() => setGridOpen(false)} />
      ) : artifact && activeVersion ? (
        <div className="min-h-0 flex-1 overflow-y-auto p-4">
          <div
            className={`rounded-canvas border bg-canvas-card p-5 shadow-card ${
              todoEditing
                ? "border-2 border-dashed border-canvas-accent"
                : "border-canvas-border"
            }`}
          >
            <ArtifactShell
              sessionArtifact={artifact}
              versionId={activeVersion.id}
              onVersionChange={setVersionId}
              menuVariant="panel"
              onTodoEditingChange={setTodoEditing}
            />
          </div>
        </div>
      ) : (
        <div className="flex flex-1 items-center justify-center px-8 text-center text-canvas-body text-canvas-muted">
          Artifacts created in the current chat will appear here.
        </div>
      )}
    </section>
  );
}
