"use client";

import { CollaboratorAvatarStack } from "@/components/CollaboratorAvatarStack";
import { CanvasThumbnail } from "@/components/home/CanvasThumbnail";
import { formatRelativeTime } from "@/lib/home/formatRelativeTime";
import type { CanvasMember } from "@/lib/collaborationTypes";

const NO_ONLINE_USERS = new Set<string>();

export function CanvasGridCard({
  canvasId,
  title,
  updatedAt,
  members,
  isSwitching,
  isPendingSwitch,
  onOpen,
}: {
  canvasId: string;
  title: string;
  updatedAt: string | null | undefined;
  members?: CanvasMember[];
  isSwitching: boolean;
  isPendingSwitch: boolean;
  onOpen: () => void;
}) {
  const relative = formatRelativeTime(updatedAt);

  return (
    <button
      type="button"
      disabled={isSwitching}
      onClick={onOpen}
      title={title}
      className="group flex h-full w-full flex-col overflow-hidden rounded-canvas-lg border border-canvas-border bg-canvas-card text-left shadow-artifact transition-all duration-motion-standard ease-motion-medium hover:-translate-y-1 hover:border-canvas-ink/15 hover:shadow-artifactHover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-canvas-accent disabled:cursor-default disabled:opacity-70 motion-reduce:transition-none motion-reduce:hover:translate-y-0"
    >
      <div className="relative aspect-[16/10]">
        <CanvasThumbnail seed={canvasId} />
        {/* Open affordance — slides in with the branch animation. */}
        <span
          aria-hidden
          className="absolute right-2.5 top-2.5 flex h-7 w-7 translate-y-1 items-center justify-center rounded-canvas border border-canvas-border bg-canvas-card text-canvas-ink opacity-0 shadow-card transition-all duration-motion-standard ease-motion-medium group-hover:translate-y-0 group-hover:opacity-100 motion-reduce:transition-none"
        >
          <ArrowIcon />
        </span>
        {isPendingSwitch && (
          <span className="absolute inset-0 flex items-center justify-center bg-canvas-card/40">
            <span
              className="h-6 w-6 animate-spin rounded-full border-2 border-canvas-border border-t-canvas-accent"
              aria-label="Opening canvas"
            />
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col justify-center gap-1.5 border-t border-canvas-border px-3.5 py-3">
        <p className="truncate text-canvas-body font-medium text-canvas-ink">
          {title}
        </p>
        <div className="flex min-h-[1.75rem] items-center justify-between gap-2">
          <span className="truncate text-canvas-compact text-canvas-muted">
            {relative ? `Updated ${relative}` : " "}
          </span>
          {members && members.length > 1 && (
            <CollaboratorAvatarStack
              members={members}
              onlineUserIds={NO_ONLINE_USERS}
              size="sm"
            />
          )}
        </div>
      </div>
    </button>
  );
}

function ArrowIcon() {
  return (
    <svg
      viewBox="0 0 16 16"
      className="h-3.5 w-3.5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      aria-hidden
    >
      <path d="M3 13 13 3M6 3h7v7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
