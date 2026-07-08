"use client";

import {
  CREATION_PATH_LABELS,
  type ArtifactCreationPath,
  type ArtifactIntentEntry,
} from "@/lib/artifactIntentCatalog";

const PATH_BADGE_CLASS: Record<ArtifactCreationPath, string> = {
  "ai-intent": "bg-violet-500/10 text-violet-800 border-violet-200",
  "llm-prompt": "bg-sky-500/10 text-sky-900 border-sky-200",
  "url-paste": "bg-amber-500/10 text-amber-900 border-amber-200",
  manual: "bg-canvas-bg text-canvas-muted border-canvas-border",
  "file-drop": "bg-emerald-500/10 text-emerald-900 border-emerald-200",
  "search-images": "bg-rose-500/10 text-rose-900 border-rose-200",
};

function PathBadge({ path }: { path: ArtifactCreationPath }) {
  return (
    <span
      className={`inline-flex rounded-full border px-1.5 py-px text-[10px] font-medium leading-tight ${PATH_BADGE_CLASS[path]}`}
    >
      {CREATION_PATH_LABELS[path]}
    </span>
  );
}

export function ArtifactIntentListItem({
  entry,
  selected,
  onSelect,
}: {
  entry: ArtifactIntentEntry;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-current={selected ? "true" : undefined}
      className={`w-full rounded-canvas border px-3 py-2.5 text-left transition-colors ${
        selected
          ? "border-canvas-accent/50 bg-canvas-accent/5 shadow-sm"
          : "border-transparent bg-transparent hover:border-canvas-border hover:bg-canvas-card/80"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="rounded-md bg-canvas-artifactIconBg px-1.5 py-px font-mono text-[10px] font-semibold uppercase tracking-wide text-canvas-accent">
              {entry.kind}
            </span>
            <span className="truncate font-display text-canvas-body-sm font-medium text-canvas-ink">
              {entry.label}
            </span>
          </div>
          <p className="mt-1 line-clamp-2 text-canvas-micro leading-snug text-canvas-muted">
            {entry.summary}
          </p>
        </div>
        {entry.spawnPriority !== undefined ? (
          <span className="shrink-0 font-mono text-canvas-micro tabular-nums text-canvas-muted">
            {entry.spawnPriority}
          </span>
        ) : null}
      </div>
      <div className="mt-2 flex flex-wrap gap-1">
        {entry.creationPaths.slice(0, 3).map((path) => (
          <PathBadge key={path} path={path} />
        ))}
        {entry.creationPaths.length > 3 ? (
          <span className="text-canvas-micro text-canvas-muted">
            +{entry.creationPaths.length - 3}
          </span>
        ) : null}
      </div>
    </button>
  );
}
