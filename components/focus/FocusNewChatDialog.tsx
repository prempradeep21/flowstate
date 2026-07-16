"use client";

import { useEffect } from "react";
import { getLatestVersion } from "@/lib/sessionArtifacts";
import { useCanvasStore } from "@/lib/store";

/**
 * Shown when "New chat" is pressed while a current artifact exists:
 * continue working on that artifact (attached like a canvas plug connector)
 * or start completely fresh (current artifact panel empties).
 */
export function FocusNewChatDialog({ onClose }: { onClose: () => void }) {
  const focusArtifactId = useCanvasStore((s) => s.focusArtifactId);
  const sessionArtifacts = useCanvasStore((s) => s.sessionArtifacts);
  const focusStartNewChat = useCanvasStore((s) => s.focusStartNewChat);

  const artifact = focusArtifactId
    ? sessionArtifacts[focusArtifactId]
    : undefined;

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  const continueWithArtifact = () => {
    if (!artifact) return;
    const latest = getLatestVersion(artifact);
    focusStartNewChat({
      artifactId: artifact.id,
      versionId: latest?.id ?? artifact.latestVersionId,
    });
    onClose();
  };

  const startFresh = () => {
    focusStartNewChat(null);
    onClose();
  };

  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center">
      <div
        aria-hidden
        onClick={onClose}
        className="absolute inset-0 cursor-default bg-canvas-ink/15"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Start a new chat"
        className="relative z-10 w-[340px] rounded-canvas border border-canvas-border bg-canvas-card p-5 shadow-cardHover"
      >
        <h3 className="text-canvas-body font-semibold text-canvas-ink">
          Start a new chat
        </h3>
        <p className="mt-1 text-canvas-body-sm text-canvas-muted">
          Continue with the current artifact, or start fresh with an empty
          artifact panel?
        </p>
        <div className="mt-4 flex flex-col gap-2">
          <button
            type="button"
            autoFocus
            onClick={continueWithArtifact}
            className="btn w-full justify-start rounded-canvas bg-canvas-accent px-3 py-2 text-left text-canvas-body-sm font-medium text-canvas-onAccent shadow-card"
          >
            Continue with “{artifact?.title ?? "current artifact"}”
          </button>
          <button
            type="button"
            onClick={startFresh}
            className="btn w-full justify-start rounded-canvas border border-canvas-border px-3 py-2 text-left text-canvas-body-sm font-medium text-canvas-ink"
          >
            Start new
          </button>
          <button
            type="button"
            onClick={onClose}
            className="btn w-full rounded-canvas px-3 py-1.5 text-canvas-body-sm text-canvas-muted hover:text-canvas-ink"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
