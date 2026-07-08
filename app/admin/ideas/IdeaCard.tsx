import Link from "next/link";
import type { GroundbreakingIdea } from "@/lib/admin/ideasManifest";
import {
  AdminActionIcon,
  AdminCardIcon,
  AdminStatusIcon,
  statusPillClass,
} from "@/app/admin/icons/AdminIcons";

export function IdeaCard({ idea }: { idea: GroundbreakingIdea }) {
  const hasPlayground = Boolean(idea.playgroundPath);

  return (
    <article className="admin-dashboard-card flex flex-col rounded-canvas border border-canvas-border bg-canvas-card p-4 shadow-card transition-colors hover:border-canvas-accent/35">
      <div className="flex items-start gap-3">
        <AdminCardIcon name="ideas" />
        <div className="min-w-0 flex-1">
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
            <span
              className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-0.5 text-canvas-micro font-medium ${statusPillClass(idea.status)}`}
            >
              <AdminStatusIcon status={idea.status} />
              {idea.status}
            </span>
          </div>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-2 pl-12">
        <Link
          href={`/admin/ideas/${idea.slug}`}
          className="inline-flex items-center gap-1.5 rounded-canvas border border-canvas-border bg-canvas-bg px-3 py-1.5 text-canvas-body-sm font-medium text-canvas-ink transition-colors hover:border-canvas-accent/40"
        >
          <AdminActionIcon name="book" />
          Read idea
        </Link>
        {hasPlayground ? (
          <Link
            href={idea.playgroundPath!}
            className="inline-flex items-center gap-1.5 rounded-canvas border border-canvas-ink/20 bg-canvas-ink px-3 py-1.5 text-canvas-body-sm font-medium text-canvas-card transition-opacity hover:opacity-90"
          >
            <AdminActionIcon name="play" className="text-canvas-card" />
            Play
          </Link>
        ) : (
          <button
            type="button"
            disabled
            title="No playground yet"
            className="inline-flex cursor-not-allowed items-center gap-1.5 rounded-canvas border border-canvas-border bg-canvas-bg px-3 py-1.5 text-canvas-body-sm font-medium text-canvas-muted opacity-60"
          >
            <AdminActionIcon name="play" />
            Play
          </button>
        )}
      </div>
      <p className="mt-3 pl-12 text-canvas-micro text-canvas-muted">
        Added {idea.dateAdded}
      </p>
    </article>
  );
}
