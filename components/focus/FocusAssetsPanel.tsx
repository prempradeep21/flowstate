"use client";

import { AttachmentsSection } from "@/components/sidebar/AttachmentsSection";

/**
 * "Your assets" panel — upload dropzone + draggable asset tiles. Tiles drag
 * into the current chat composer as attachments (sidebar DnD payloads).
 */
export function FocusAssetsPanel() {
  return (
    <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-canvas border border-canvas-border bg-canvas-card shadow-card">
      <div className="shrink-0 border-b border-canvas-border px-4 py-3">
        <h2 className="text-canvas-body-sm font-semibold text-canvas-ink">
          Your assets
        </h2>
        <p className="mt-0.5 text-canvas-caption text-canvas-muted">
          Drag an asset into the chat to attach it.
        </p>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto">
        <AttachmentsSection />
      </div>
    </section>
  );
}
