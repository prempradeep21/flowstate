"use client";

export function SectionHeading({
  title,
  count,
}: {
  title: string;
  count?: number;
}) {
  return (
    <div className="mb-4 flex items-baseline gap-2.5">
      <h2 className="font-display text-canvas-heading font-semibold text-canvas-ink">
        {title}
      </h2>
      {typeof count === "number" && count > 0 && (
        <span className="rounded-full border border-canvas-border bg-canvas-card px-2 py-0.5 text-canvas-micro font-medium text-canvas-muted">
          {count}
        </span>
      )}
    </div>
  );
}
