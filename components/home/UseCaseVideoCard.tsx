"use client";

import { useEffect, useRef, useState } from "react";
import {
  YT_RENDER_H,
  YT_RENDER_W,
  youtubePlayUrl,
  youtubePoster,
  youtubePosterFallback,
  type UseCaseVideo,
} from "@/lib/home/useCaseVideos";

/**
 * A demo video that stays parked on its poster until the play button is hit.
 *
 * Once playing, the iframe is rendered at 1920x1080 and scaled down to the
 * card so YouTube serves a 1080p rendition (it picks quality from the player's
 * pixel size — a card-sized player gets a soft low-res stream).
 *
 * A transparent guard sits over the iframe so YouTube's hover chrome (title
 * bar / channel name + avatar) never appears; clicking it returns the card to
 * the poster, which also means the player is never left paused showing that
 * overlay.
 */
export function UseCaseVideoCard({ video }: { video: UseCaseVideo }) {
  const [playing, setPlaying] = useState(false);
  const [posterSrc, setPosterSrc] = useState(youtubePoster(video.youtubeId));
  const frameRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0);

  // keep the 1920x1080 player scaled to the card width
  useEffect(() => {
    if (!playing) return;
    const el = frameRef.current;
    if (!el) return;
    const fit = () => setScale(el.clientWidth / YT_RENDER_W);
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => ro.disconnect();
  }, [playing]);

  return (
    <div className="group flex h-full w-full flex-col overflow-hidden rounded-canvas-lg border border-canvas-border bg-canvas-card text-left shadow-artifact transition-all duration-motion-standard ease-motion-medium hover:-translate-y-1 hover:border-canvas-ink/15 hover:shadow-artifactHover motion-reduce:transition-none motion-reduce:hover:translate-y-0">
      <div ref={frameRef} className="relative aspect-video overflow-hidden bg-black">
        {playing ? (
          <>
            <iframe
              src={youtubePlayUrl(video.youtubeId)}
              title={video.title}
              allow="autoplay; encrypted-media; picture-in-picture"
              className="absolute left-0 top-0 border-0"
              style={{
                width: YT_RENDER_W,
                height: YT_RENDER_H,
                transformOrigin: "0 0",
                transform: `scale(${scale})`,
                visibility: scale ? "visible" : "hidden",
              }}
            />
            <button
              type="button"
              onClick={() => setPlaying(false)}
              aria-label={`Stop ${video.title}`}
              className="absolute inset-0 z-10 cursor-default"
            />
          </>
        ) : (
          <button
            type="button"
            onClick={() => setPlaying(true)}
            aria-label={`Play ${video.title}`}
            className="absolute inset-0 flex items-center justify-center"
          >
            <img
              src={posterSrc}
              alt=""
              loading="lazy"
              onError={() => setPosterSrc(youtubePosterFallback(video.youtubeId))}
              className="absolute inset-0 h-full w-full object-cover"
            />
            <span className="absolute inset-0 bg-black/15 transition-colors duration-motion-standard group-hover:bg-black/25" />
            <span className="relative flex h-14 w-14 items-center justify-center rounded-full border-2 border-canvas-accent bg-white text-canvas-accent shadow-artifact transition-transform duration-motion-standard ease-motion-medium group-hover:scale-110 motion-reduce:transition-none motion-reduce:group-hover:scale-100">
              <svg viewBox="0 0 24 24" className="ml-0.5 h-6 w-6" aria-hidden="true">
                <path d="M8 5.5v13l11-6.5z" fill="currentColor" />
              </svg>
            </span>
          </button>
        )}
      </div>
      <div className="flex flex-1 flex-col justify-center gap-1 border-t border-canvas-border px-3.5 py-3">
        <p className="truncate text-canvas-body font-medium text-canvas-ink">
          {video.title}
        </p>
        <span className="truncate text-canvas-compact text-canvas-muted">
          {video.tagline}
        </span>
      </div>
    </div>
  );
}
