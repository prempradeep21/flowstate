"use client";

export function MissingResponsePlaceholder() {
  return (
    <p className="text-center text-canvas-body-sm text-canvas-muted">
      No response received. The connection may have timed out — try your question
      again.
    </p>
  );
}
