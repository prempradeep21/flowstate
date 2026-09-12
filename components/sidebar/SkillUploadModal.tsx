"use client";

import { useEffect, useState } from "react";
import { MotionBackdrop, MotionOverlayModal } from "@/components/motion";
import { Button } from "@/components/ui/Button";
import { defaultSkillTitle } from "@/lib/skills";

interface SkillUploadModalProps {
  isOpen: boolean;
  fileName: string;
  busy: boolean;
  error: string | null;
  onConfirm: (title: string) => void;
  onCancel: () => void;
}

export function SkillUploadModal({
  isOpen,
  fileName,
  busy,
  error,
  onConfirm,
  onCancel,
}: SkillUploadModalProps) {
  const [title, setTitle] = useState("");

  useEffect(() => {
    if (isOpen) {
      setTitle(defaultSkillTitle(fileName));
    }
  }, [isOpen, fileName]);

  useEffect(() => {
    if (!isOpen || busy) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [busy, isOpen, onCancel]);

  const canConfirm = title.trim().length > 0 && !busy;

  return (
    <>
      <MotionBackdrop
        isOpen={isOpen}
        onClick={busy ? undefined : onCancel}
        className="pointer-events-auto fixed inset-0 z-[100] bg-black/40"
      />
      {isOpen && (
        <div className="pointer-events-none fixed inset-0 z-[101] flex items-center justify-center p-4">
          <MotionOverlayModal
            isOpen={isOpen}
            className="pointer-events-auto w-full max-w-md rounded-canvas border border-canvas-border bg-canvas-card p-5 shadow-card"
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="skill-upload-title"
              onClick={(e) => e.stopPropagation()}
            >
              <h2
                id="skill-upload-title"
                className="text-canvas-heading font-semibold text-canvas-ink"
              >
                Add skill
              </h2>
              <p className="mt-2 text-canvas-body-sm leading-relaxed text-canvas-muted">
                Skills are reusable instructions. Markdown uploaded here is
                treated as a skill; the same file in Assets stays a document.
              </p>

              <label className="mt-4 block">
                <span className="text-canvas-body-sm font-medium text-canvas-ink">
                  Skill title
                </span>
                <input
                  type="text"
                  value={title}
                  disabled={busy}
                  onChange={(e) => setTitle(e.target.value)}
                  className="mt-1 w-full rounded-canvas border border-canvas-border bg-canvas-bg px-3 py-2 text-canvas-body text-canvas-ink outline-none focus:border-canvas-ink/40 disabled:opacity-50"
                  autoFocus
                />
              </label>
              <p className="mt-1 truncate text-canvas-body-sm text-canvas-muted">
                File: {fileName}
              </p>

              {error && (
                <p className="mt-3 text-canvas-body-sm text-canvas-danger">
                  {error}
                </p>
              )}

              <div className="mt-5 flex justify-end gap-2">
                <Button variant="ghost" disabled={busy} onClick={onCancel}>
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  disabled={!canConfirm}
                  loading={busy}
                  onClick={() => onConfirm(title.trim())}
                >
                  {busy ? "Uploading…" : "Add skill"}
                </Button>
              </div>
            </div>
          </MotionOverlayModal>
        </div>
      )}
    </>
  );
}
