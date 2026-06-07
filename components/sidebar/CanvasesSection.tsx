"use client";

import { useAuth } from "@/components/AuthProvider";

export function CanvasesSection() {
  const {
    user,
    supabaseConfigured,
    activeCanvasId,
    canvases,
    isSwitchingCanvas,
    switchCanvas,
    createNewCanvas,
  } = useAuth();

  const canManage = Boolean(user && supabaseConfigured);

  return (
    <section className="border-b border-canvas-border px-3 py-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <h2 className="text-[13px] font-medium uppercase tracking-wide text-canvas-muted">
          Canvases
        </h2>
      </div>

      {canManage ? (
        <button
          type="button"
          disabled={isSwitchingCanvas}
          onClick={() => void createNewCanvas()}
          className="mb-3 flex w-full items-center justify-center gap-2 rounded-lg border border-canvas-border bg-canvas-bg px-3 py-2.5 text-[16px] font-medium text-canvas-ink transition-colors hover:bg-canvas-card disabled:opacity-50"
        >
          <PlusIcon />
          Create New Canvas
        </button>
      ) : (
        <p className="mb-3 text-[15px] leading-snug text-canvas-muted">
          Sign in to create and switch between canvases.
        </p>
      )}

      <ul className="space-y-1">
        {canManage ? (
          canvases.map((canvas) => {
            const active = canvas.id === activeCanvasId;
            return (
              <li key={canvas.id}>
                <button
                  type="button"
                  disabled={isSwitchingCanvas || active}
                  onClick={() => void switchCanvas(canvas.id)}
                  className={[
                    "flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-[17px] transition-colors",
                    active
                      ? "bg-canvas-bg font-medium text-canvas-ink"
                      : "text-canvas-ink hover:bg-canvas-bg/70",
                    isSwitchingCanvas ? "opacity-70" : "",
                  ].join(" ")}
                >
                  <span
                    className={[
                      "h-2 w-2 shrink-0 rounded-full",
                      active ? "bg-canvas-accent" : "bg-canvas-border",
                    ].join(" ")}
                    aria-hidden
                  />
                  <span className="min-w-0 flex-1 truncate">{canvas.title}</span>
                </button>
              </li>
            );
          })
        ) : (
          <li className="rounded-lg px-2 py-2 text-[17px] text-canvas-muted">
            Local canvas
          </li>
        )}
      </ul>
    </section>
  );
}

function PlusIcon() {
  return (
    <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M8 3v10M3 8h10" strokeLinecap="round" />
    </svg>
  );
}
