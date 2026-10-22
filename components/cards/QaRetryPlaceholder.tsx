"use client";

export function QaRetryPlaceholder({
  message,
  onTryAgain,
}: {
  message: string;
  onTryAgain?: () => void;
}) {
  return (
    <div data-qa-retry className="flex flex-col items-center gap-3 text-center">
      <p className="max-w-sm text-canvas-body-sm text-canvas-muted">{message}</p>
      {onTryAgain ? (
        <button
          type="button"
          data-qa-retry-action
          onClick={onTryAgain}
          className="rounded-canvas border border-canvas-border bg-canvas-card px-3 py-1.5 text-canvas-body-sm font-medium text-canvas-ink transition-colors hover:bg-canvas-bg"
        >
          Try again
        </button>
      ) : null}
    </div>
  );
}
