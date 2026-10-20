"use client";

import { useCallback } from "react";
import { ArtifactContentStage } from "@/components/artifacts/ArtifactContentStage";
import { MediaLoadingCover } from "@/components/artifacts/ArtifactLoadingSkeleton";
import { useMediaLoaded } from "@/hooks/useMediaLoaded";
import { YoutubePosterCell } from "@/components/artifacts/ImagesArtifactContent";
import type { ArtifactPayload } from "@/lib/artifactTypes";
import { focusCanvasWorldRect } from "@/lib/canvasFocus";
import { computeGroupBounds } from "@/lib/groupBounds";
import { useCanvasStore } from "@/lib/store";
import { parseYoutubeId } from "@/lib/youtube";

function EpisodeThumb({ src }: { src: string }) {
  const load = useMediaLoaded(src);
  return (
    <>
      <MediaLoadingCover loaded={load.loaded} />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        ref={load.imgRef}
        src={src}
        alt=""
        onLoad={load.onLoad}
        onError={load.onError}
        className="h-full w-full object-cover"
      />
    </>
  );
}

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
    focusCanvasWorldRect(bounds, { maxScale: 1 });
  }, []);

  const meta = [channel, duration].filter(Boolean).join(" · ");
  const videoId = url ? parseYoutubeId(url) : null;

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
            <div
              className="w-[50%] shrink-0 overflow-hidden rounded-canvas-sm border border-canvas-border"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="aspect-video w-full">
                {videoId ? (
                  // The same poster + play cell a video artifact uses, so the
                  // episode plays through the one canvas player and hands off
                  // to the corner PiP like any other video.
                  <YoutubePosterCell
                    item={{ kind: "youtube", url: url ?? "", title: videoTitle, thumb }}
                    videoId={videoId}
                    allowInteraction
                    playWhileUnselected
                    artifactId={artifactId}
                  />
                ) : (
                  <a
                    href={url}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="relative block h-full w-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-canvas-accent/50"
                  >
                    <EpisodeThumb src={thumb} />
                  </a>
                )}
              </div>
            </div>
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
