"use client";

export function SkillAttachmentPill({
  title,
  onRemove,
}: {
  title: string;
  onRemove?: () => void;
}) {
  return (
    <span className="inline-flex max-w-full shrink-0 items-center gap-1 rounded-canvas border border-canvas-border bg-canvas-bg px-2 py-1 text-[11px] text-canvas-ink">
      <span className="rounded-full bg-canvas-ink px-1.5 py-px text-[8px] font-bold uppercase tracking-wide text-canvas-card">
        Skill
      </span>
      <span className="truncate">{title}</span>
      {onRemove ? (
        <button
          type="button"
          className="ml-0.5 shrink-0 text-canvas-muted hover:text-canvas-ink"
          aria-label={`Remove ${title}`}
          onClick={onRemove}
        >
          x
        </button>
      ) : null}
    </span>
  );
}
