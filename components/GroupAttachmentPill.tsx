"use client";

export function GroupAttachmentPill({
  label,
  memberCount,
  onRemove,
}: {
  label: string;
  memberCount: number;
  onRemove?: () => void;
}) {
  return (
    <span className="inline-flex max-w-full shrink-0 items-center gap-1 rounded-canvas border border-canvas-accent/40 bg-canvas-accent/10 px-2 py-1 text-canvas-caption text-canvas-ink">
      <span className="rounded-full bg-canvas-accent px-1.5 py-px text-[8px] font-bold uppercase tracking-wide text-canvas-onAccent">
        Group
      </span>
      <span className="truncate">{label}</span>
      <span className="shrink-0 text-canvas-muted">
        · {memberCount} item{memberCount === 1 ? "" : "s"}
      </span>
      {onRemove ? (
        <button
          type="button"
          className="ml-0.5 shrink-0 text-canvas-muted hover:text-canvas-ink"
          aria-label={`Remove ${label}`}
          onClick={onRemove}
        >
          x
        </button>
      ) : null}
    </span>
  );
}
