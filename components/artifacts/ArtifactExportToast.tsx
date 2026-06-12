"use client";

export function ArtifactExportToast({
  message,
  isError,
}: {
  message: string | null;
  isError?: boolean;
}) {
  if (!message) return null;
  return (
    <div
      role="status"
      className={`pointer-events-none fixed bottom-6 left-1/2 z-[9999] -translate-x-1/2 rounded-full px-4 py-2 text-canvas-body-sm shadow-card ${
        isError
          ? "bg-canvas-tagDangerSoft text-canvas-tagDanger"
          : "bg-canvas-ink text-canvas-card"
      }`}
    >
      {message}
    </div>
  );
}
