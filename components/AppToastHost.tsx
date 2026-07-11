"use client";

import { useAppToastStore } from "@/lib/appToastStore";

function CloseIcon() {
  return (
    <svg aria-hidden viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none">
      <path
        d="M4.5 4.5l7 7M11.5 4.5l-7 7"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function AppToastHost() {
  const toast = useAppToastStore((s) => s.toast);
  const dismissToast = useAppToastStore((s) => s.dismissToast);

  if (!toast) return null;

  const isError = toast.variant === "error";

  return (
    <div className="pointer-events-none fixed left-1/2 top-4 z-[9999] -translate-x-1/2">
      <div
        role={isError ? "alert" : "status"}
        aria-live="polite"
        className={`pointer-events-auto flex max-w-md items-start gap-2.5 rounded-canvas border px-3.5 py-2.5 shadow-card backdrop-blur-sm ${
          isError
            ? "border-canvas-danger/30 bg-canvas-tagDangerSoft text-canvas-tagDanger"
            : "border-canvas-border/80 bg-canvas-card/95 text-canvas-ink"
        }`}
      >
        <p className="min-w-0 flex-1 text-canvas-body-sm leading-snug">
          {toast.message}
        </p>
        <button
          type="button"
          onClick={dismissToast}
          aria-label="Close"
          className={`mt-0.5 shrink-0 rounded-full p-1 transition-colors ${
            isError
              ? "text-canvas-tagDanger hover:bg-canvas-danger/10"
              : "text-canvas-muted hover:bg-canvas-bg hover:text-canvas-ink"
          }`}
        >
          <CloseIcon />
        </button>
      </div>
    </div>
  );
}
