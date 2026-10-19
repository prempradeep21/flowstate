"use client";

import { useEffect, useRef, useState } from "react";
import {
  YT_RENDER_H,
  YT_RENDER_W,
  youtubePlayUrl,
  type UseCaseVideo,
} from "@/lib/home/useCaseVideos";

type Blob = { x: string; y: string; size: string; opacity: number };

// Shared shape, mirrored per card so neighbours don't look identical.
const BLOBS: Blob[] = [
  { x: "-15%", y: "-35%", size: "65%", opacity: 0.55 },
  { x: "55%", y: "-20%", size: "50%", opacity: 0.35 },
  { x: "30%", y: "35%", size: "40%", opacity: 0.2 },
];

function blobsFor(key: string): Blob[] {
  const seed = [...key].reduce((n, c) => n + c.charCodeAt(0), 0);
  const flip = seed % 2 === 1;
  return BLOBS.map((b) =>
    flip ? { ...b, x: `${100 - parseFloat(b.x) - parseFloat(b.size)}%` } : b,
  );
}

/**
 * A demo video that stays parked on a blurred-gradient cover until the play button is hit.
 *
 * Once playing, the iframe is rendered at 1920x1080 and scaled down to the
 * card so YouTube serves a 1080p rendition (it picks quality from the player's
 * pixel size — a card-sized player gets a soft low-res stream).
 *
 * A transparent guard sits over the iframe so YouTube's hover chrome (title
 * bar / channel name + avatar) never appears; clicking it returns the card to
 * the cover, which also means the player is never left paused showing that
 * overlay.
 */
export function UseCaseVideoCard({ video }: { video: UseCaseVideo }) {
  const [playing, setPlaying] = useState(false);
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
    <div className="group relative w-full overflow-hidden rounded-canvas-lg border border-canvas-border bg-white text-left shadow-artifact transition-all duration-motion-standard ease-motion-medium hover:-translate-y-1 hover:border-canvas-ink/15 hover:shadow-artifactHover motion-reduce:transition-none motion-reduce:hover:translate-y-0">
      <div ref={frameRef} className="relative aspect-video overflow-hidden">
        {/* blurred blue blobs on white; each card gets its own arrangement */}
        <div aria-hidden className="absolute inset-0">
          {blobsFor(video.key).map((b, i) => (
            <span
              key={i}
              className="absolute aspect-square rounded-full bg-canvas-accent blur-3xl transition-transform duration-motion-standard ease-motion-medium group-hover:scale-110 motion-reduce:transition-none motion-reduce:group-hover:scale-100"
              style={{ left: b.x, top: b.y, width: b.size, opacity: b.opacity }}
            />
          ))}
        </div>
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
            className="absolute inset-0 text-left"
          >
            <span className="absolute inset-x-0 bottom-0 flex items-end gap-4 p-5">
              <span className="flex min-w-0 flex-1 flex-col gap-1">
                <span className="font-display text-canvas-brand font-semibold leading-tight text-canvas-ink">
                  {video.title}
                </span>
                <span className="line-clamp-2 text-canvas-body text-canvas-ink/70">
                  {video.tagline}
                </span>
              </span>
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-canvas-accent text-white shadow-artifact transition-transform duration-motion-standard ease-motion-medium group-hover:scale-110 motion-reduce:transition-none motion-reduce:group-hover:scale-100">
                <svg viewBox="0 0 24 24" className="ml-0.5 h-5 w-5" aria-hidden="true">
                  <path d="M8 5.5v13l11-6.5z" fill="currentColor" />
                </svg>
              </span>
            </span>
          </button>
        )}
      </div>
    </div>
  );
}
