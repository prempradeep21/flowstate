"use client";

import { useEffect } from "react";
import ReactMarkdown from "react-markdown";
import { useCanvasStore } from "@/lib/store";
import { getArtifactMarkdown } from "@/lib/artifacts";

const PANEL_WIDTH = 480;

export function ArtifactPanel() {
  const openCardId = useCanvasStore((s) => s.openArtifactCardId);
  const card = useCanvasStore((s) =>
    openCardId ? s.cards[openCardId] : undefined,
  );
  const closeArtifact = useCanvasStore((s) => s.closeArtifact);

  const markdown = getArtifactMarkdown(card?.artifactId);
  const isOpen = Boolean(openCardId && markdown);

  // Close on Escape while the panel is open. Registered globally because the
  // panel is focusless overlay UI — there's no element that naturally owns the
  // keystroke.
  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        closeArtifact();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, closeArtifact]);

  return (
    <>
      <div
        aria-hidden={!isOpen}
        onClick={closeArtifact}
        className={`fixed inset-0 z-40 bg-canvas-ink/15 transition-opacity duration-200 ${
          isOpen
            ? "pointer-events-auto opacity-100"
            : "pointer-events-none opacity-0"
        }`}
      />
      <aside
        role="dialog"
        aria-label="Attached document"
        aria-hidden={!isOpen}
        style={{ width: PANEL_WIDTH }}
        className={`fixed right-0 top-0 z-50 flex h-full flex-col border-l border-canvas-border bg-canvas-card shadow-cardHover transition-transform duration-300 ease-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <header className="flex items-center justify-between border-b border-canvas-border px-5 py-3">
          <div className="text-[11px] font-medium uppercase tracking-wider text-canvas-muted">
            Document
          </div>
          <button
            type="button"
            aria-label="Close document"
            onClick={closeArtifact}
            className="flex h-7 w-7 items-center justify-center rounded-md text-canvas-muted transition-colors hover:bg-canvas-bg hover:text-canvas-ink"
          >
            <svg
              aria-hidden
              viewBox="0 0 16 16"
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M3.5 3.5 12.5 12.5" />
              <path d="M12.5 3.5 3.5 12.5" />
            </svg>
          </button>
        </header>
        <div className="flex-1 overflow-y-auto px-6 py-6 text-canvas-ink">
          {markdown && (
            <ReactMarkdown
              components={{
                h1: ({ node: _node, ...props }) => (
                  <h1
                    className="mb-3 text-[24px] font-bold leading-tight text-canvas-ink"
                    {...props}
                  />
                ),
                h2: ({ node: _node, ...props }) => (
                  <h2
                    className="mt-6 mb-2 text-[16px] font-semibold leading-snug text-canvas-ink"
                    {...props}
                  />
                ),
                p: ({ node: _node, ...props }) => (
                  <p
                    className="mb-4 text-[14px] leading-relaxed text-canvas-ink"
                    {...props}
                  />
                ),
                ul: ({ node: _node, ...props }) => (
                  <ul
                    className="mb-4 list-disc space-y-1.5 pl-5 text-[14px] leading-relaxed text-canvas-ink marker:text-canvas-muted"
                    {...props}
                  />
                ),
                ol: ({ node: _node, ...props }) => (
                  <ol
                    className="mb-4 list-decimal space-y-1.5 pl-5 text-[14px] leading-relaxed text-canvas-ink marker:text-canvas-muted"
                    {...props}
                  />
                ),
                li: ({ node: _node, ...props }) => (
                  <li className="pl-1" {...props} />
                ),
                blockquote: ({ node: _node, ...props }) => (
                  <blockquote
                    className="mt-6 border-l-2 border-canvas-border pl-4 text-[14px] italic leading-relaxed text-canvas-muted"
                    {...props}
                  />
                ),
                code: ({ node: _node, ...props }) => (
                  <code
                    className="rounded bg-canvas-bg px-1 py-0.5 font-mono text-[13px] text-canvas-ink"
                    {...props}
                  />
                ),
                a: ({ node: _node, ...props }) => (
                  <a
                    className="text-canvas-ink underline decoration-canvas-muted underline-offset-2 hover:decoration-canvas-ink"
                    {...props}
                  />
                ),
                strong: ({ node: _node, ...props }) => (
                  <strong className="font-semibold" {...props} />
                ),
                em: ({ node: _node, ...props }) => (
                  <em className="italic" {...props} />
                ),
              }}
            >
              {markdown}
            </ReactMarkdown>
          )}
        </div>
      </aside>
    </>
  );
}
