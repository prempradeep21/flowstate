"use client";

import { useCallback } from "react";
import { ArtifactContentStage } from "@/components/artifacts/ArtifactContentStage";
import type { ArtifactPayload } from "@/lib/artifactTypes";
import { focusCanvasWorldRect } from "@/lib/canvasFocus";
import { computeGroupBounds } from "@/lib/groupBounds";
import { useCanvasStore } from "@/lib/store";

/**
 * The masthead for an imported video, and the index you read before the spine.
 *
 * A chapter row that names a group on this canvas frames that group when
 * clicked — the artifact drives the viewport rather than describing it. Rows
 * whose group is missing stay rendered but inert, so an index built before the
 * chapters exist degrades to a plain list instead of dead controls.
 */
export function EpisodeArtifactContent({
  payload,
  fill = false,
  sidebar = false,
  artifactId,
}: {
  payload: Extract<ArtifactPayload, { type: "episode" }>;
  fill?: boolean;
  sidebar?: boolean;
  artifactId?: string;
}) {
  const { videoTitle, description, channel, url, thumb, duration, chapters } =
    payload.data;

  const focusChapter = useCallback((groupId: string) => {
    const state = useCanvasStore.getState();
    const group = state.groups[groupId];
    if (!group) return;
    const bounds = computeGroupBounds(state, group);
    if (!bounds) return;
    state.setActiveGroupId(groupId);
    focusCanvasWorldRect(bounds, { sound: true, maxScale: 1 });
  }, []);

  const meta = [channel, duration].filter(Boolean).join(" · ");

  return (
    <ArtifactContentStage fill={fill} artifactId={artifactId}>
      <div className="flex h-full flex-col gap-4 px-5 py-4">
        <header className="flex items-start gap-4">
          <div className="min-w-0 flex-1">
            <h3
              className={`font-semibold leading-tight text-canvas-ink ${
                sidebar ? "text-canvas-body" : "text-[19px]"
              }`}
            >
              {videoTitle}
            </h3>
            {meta ? (
              <p className="mt-1 text-canvas-caption text-canvas-muted">{meta}</p>
            ) : null}
            {description ? (
              <p className="mt-2 line-clamp-4 text-canvas-caption leading-snug text-canvas-muted">
                {description}
              </p>
            ) : null}
          </div>
          {thumb ? (
            <a
              href={url}
              target="_blank"
              rel="noreferrer noopener"
              onClick={(e) => e.stopPropagation()}
              className="block w-[38%] shrink-0 overflow-hidden rounded-canvas-sm border border-canvas-border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-canvas-accent/50"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={thumb}
                alt=""
                className="aspect-video w-full object-cover"
              />
            </a>
          ) : null}
        </header>

        <ol className="min-h-0 flex-1 overflow-y-auto">
          {chapters.map((chapter, index) => {
            const clickable = Boolean(chapter.groupId);
            return (
              <li key={`${chapter.label}-${index}`}>
                <button
                  type="button"
                  disabled={!clickable}
                  onClick={(event) => {
                    event.stopPropagation();
                    if (chapter.groupId) focusChapter(chapter.groupId);
                  }}
                  className={`group/row flex w-full items-baseline gap-3 border-b border-canvas-ink/10 px-1 py-2.5 text-left transition-colors ${
                    clickable
                      ? "cursor-pointer hover:bg-canvas-artifactStage focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-canvas-accent/50"
                      : "cursor-default"
                  }`}
                >
                  <span className="w-10 shrink-0 text-canvas-caption tabular-nums text-canvas-muted">
                    {chapter.start ?? `Ch ${index + 1}`}
                  </span>
                  <span
                    className={`min-w-0 flex-1 leading-snug text-canvas-ink ${
                      sidebar ? "text-canvas-caption" : "text-canvas-body"
                    } ${clickable ? "group-hover/row:text-canvas-accent" : ""}`}
                  >
                    {chapter.label}
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
      </div>
    </ArtifactContentStage>
  );
}
