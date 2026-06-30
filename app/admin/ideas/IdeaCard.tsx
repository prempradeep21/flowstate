import Link from "next/link";
import type { GroundbreakingIdea } from "@/lib/admin/ideasManifest";

function StatusPill({ status }: { status: GroundbreakingIdea["status"] }) {
  return (
    <span className="rounded-full bg-canvas-bg px-2.5 py-0.5 text-canvas-micro font-medium text-canvas-muted">
      {status}
    </span>
  );
}

export function IdeaCard({ idea }: { idea: GroundbreakingIdea }) {
  const hasPlayground = Boolean(idea.playgroundPath);

  return (
    <article className="flex flex-col rounded-canvas border border-canvas-border bg-canvas-card p-4 shadow-card">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <Link
            href={`/admin/ideas/${idea.slug}`}
            className="font-display text-lg font-medium text-canvas-ink hover:text-canvas-accent"
          >
            {idea.title}
          </Link>
          <p className="mt-1 text-canvas-body-sm text-canvas-muted">
            {idea.tagline}
          </p>
        </div>
        <StatusPill status={idea.status} />
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Link
          href={`/admin/ideas/${idea.slug}`}
          className="rounded-canvas border border-canvas-border bg-canvas-bg px-3 py-1.5 text-canvas-body-sm font-medium text-canvas-ink transition-colors hover:border-canvas-accent/40"
        >
          Read idea
        </Link>
        {hasPlayground ? (
          <Link
            href={idea.playgroundPath!}
            className="inline-flex items-center gap-1.5 rounded-canvas border border-canvas-ink/20 bg-canvas-ink px-3 py-1.5 text-canvas-body-sm font-medium text-canvas-card transition-opacity hover:opacity-90"
          >
            <PlayIcon />
            Play
          </Link>
        ) : (
          <button
            type="button"
            disabled
            title="No playground yet"
            className="inline-flex cursor-not-allowed items-center gap-1.5 rounded-canvas border border-canvas-border bg-canvas-bg px-3 py-1.5 text-canvas-body-sm font-medium text-canvas-muted opacity-60"
          >
            <PlayIcon />
            Play
          </button>
        )}
      </div>
      <p className="mt-3 text-canvas-micro text-canvas-muted">Added {idea.dateAdded}</p>
    </article>
  );
}

function PlayIcon() {
  return (
    <svg aria-hidden viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="currentColor">
      <path d="M4 2.5v11l9-5.5-9-5.5z" />
    </svg>
  );
}
