"use client";

import { useEffect } from "react";
import { MotionBackdrop, MotionOverlayModal } from "@/components/motion";
import { Button } from "@/components/ui/Button";

interface DeleteCanvasConfirmModalProps {
  isOpen: boolean;
  canvasTitle: string;
  busy: boolean;
  error: string | null;
  onConfirm: () => void;
  onCancel: () => void;
}

export function DeleteCanvasConfirmModal({
  isOpen,
  canvasTitle,
  busy,
  error,
  onConfirm,
  onCancel,
}: DeleteCanvasConfirmModalProps) {
  useEffect(() => {
    if (!isOpen || busy) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [busy, isOpen, onCancel]);

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
              role="alertdialog"
              aria-modal="true"
              aria-labelledby="delete-canvas-title"
              aria-describedby="delete-canvas-desc"
              onClick={(e) => e.stopPropagation()}
            >
              <h2
                id="delete-canvas-title"
                className="text-canvas-heading font-semibold text-canvas-ink"
              >
                Delete canvas?
              </h2>
              <p
                id="delete-canvas-desc"
                className="mt-3 text-canvas-body leading-relaxed text-canvas-muted"
              >
                <span className="font-medium text-canvas-ink">
                  &ldquo;{canvasTitle}&rdquo;
                </span>{" "}
                and all its cards, branches, and history will be permanently
                deleted. Collaborators will lose access. This cannot be undone.
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
                  tone="danger"
                  loading={busy}
                  onClick={onConfirm}
                >
                  {busy ? "Deleting…" : "Delete canvas"}
                </Button>
              </div>
            </div>
          </MotionOverlayModal>
        </div>
      )}
    </>
  );
}
