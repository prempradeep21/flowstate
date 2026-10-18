"use client";

import { useEffect, type ReactNode } from "react";
// Direct import: the components/motion barrel drags in lib/store and trips a
// circular-init error on pages that never load the canvas.
import { MotionBackdrop, MotionOverlayModal } from "@/components/motion/MotionOverlay";
import { CloseButton } from "@/components/ui/CloseButton";

/** Backdrop + panel + Escape-to-close, shared by the outreach modals. */
export function OutreachModal({
  isOpen,
  title,
  onClose,
  widthClass = "max-w-2xl",
  children,
  footer,
}: {
  isOpen: boolean;
  title: string;
  onClose: () => void;
  widthClass?: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, onClose]);

  return (
    <>
      <MotionBackdrop
        isOpen={isOpen}
        onClick={onClose}
        className="pointer-events-auto fixed inset-0 z-[100] bg-black/50"
      />
      {isOpen && (
        <div className="pointer-events-none fixed inset-0 z-[101] flex items-center justify-center p-4">
          <MotionOverlayModal
            isOpen={isOpen}
            className={`pointer-events-auto flex max-h-[90vh] w-full ${widthClass} flex-col rounded-canvas border border-canvas-border bg-canvas-card shadow-card`}
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-label={title}
              className="flex min-h-0 flex-1 flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between gap-3 border-b border-canvas-border px-5 py-3">
                <h2 className="truncate text-canvas-body font-semibold text-canvas-ink">
                  {title}
                </h2>
                <CloseButton onClick={onClose} />
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto p-5">{children}</div>
              {footer ? (
                <div className="flex items-center justify-end gap-2 border-t border-canvas-border px-5 py-3">
                  {footer}
                </div>
              ) : null}
            </div>
          </MotionOverlayModal>
        </div>
      )}
    </>
  );
}
