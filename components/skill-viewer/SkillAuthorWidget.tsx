"use client";

export function SkillAuthorWidget({
  name,
  handle,
  avatarUrl,
  sourceUrl,
}: {
  name: string;
  handle: string;
  avatarUrl: string;
  sourceUrl: string;
}) {
  return (
    <a
      href={sourceUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex items-center gap-3"
    >
      <span className="relative shrink-0 rounded-full ring-2 ring-canvas-accent/20 transition-shadow group-hover:ring-canvas-accent/40">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={avatarUrl}
          alt=""
          className="h-10 w-10 rounded-full border border-canvas-border object-cover"
        />
      </span>
      <div className="min-w-0">
        <div className="truncate text-canvas-body-sm font-medium text-canvas-ink group-hover:underline">
          {name}
        </div>
        <div className="truncate text-canvas-caption text-canvas-muted">@{handle}</div>
      </div>
    </a>
  );
}

export function RestrictionChip({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center rounded-full border border-canvas-border px-2.5 py-0.5 text-canvas-compact font-medium text-canvas-muted">
      {label}
    </span>
  );
}
