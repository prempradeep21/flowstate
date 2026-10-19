import type { CSSProperties } from "react";
import type { ArtifactKind } from "@/lib/artifactTypes";

/**
 * Shimmering stand-ins shaped like an artifact's content, shown while the real
 * content is still on its way (a lazy chunk, an iframe, an image, a canvas
 * that is still being fetched). Purely decorative — aria-hidden throughout.
 */

export function SkeletonBar({
  className = "",
  style,
}: {
  className?: string;
  style?: CSSProperties;
}) {
  return <div className={`table-shimmer-bar rounded ${className}`} style={style} />;
}

function Lines({ widths }: { widths: number[] }) {
  return (
    <div className="flex flex-col gap-3 px-5 py-4">
      {widths.map((w, i) => (
        <SkeletonBar key={i} className="h-3" style={{ width: `${w}%` }} />
      ))}
    </div>
  );
}

function TableShape() {
  return (
    <div className="flex flex-col gap-3 px-5 py-4">
      <div className="flex gap-4">
        {[22, 30, 18, 24].map((w, i) => (
          <SkeletonBar key={i} className="h-3 opacity-80" style={{ width: `${w}%` }} />
        ))}
      </div>
      {[0, 1, 2, 3, 4].map((r) => (
        <div key={r} className="flex gap-4 border-t border-canvas-border/60 pt-3">
          {[22, 30, 18, 24].map((w, i) => (
            <SkeletonBar
              key={i}
              className="h-2.5"
              style={{ width: `${w - ((r + i) % 3) * 4}%` }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

function ChartShape() {
  return (
    <div className="flex min-h-0 flex-1 items-end gap-3 px-6 pb-6 pt-4">
      {[42, 64, 52, 80, 58, 70, 36].map((h, i) => (
        <SkeletonBar
          key={i}
          className="flex-1 rounded-b-none rounded-t-md"
          style={{ height: `${h}%`, minHeight: 16 }}
        />
      ))}
    </div>
  );
}

function TimelineShape() {
  return (
    <div className="relative flex min-h-0 flex-1 items-center px-6 py-8">
      <div className="absolute inset-x-6 top-1/2 h-px bg-canvas-muted/30" />
      <div className="relative flex w-full justify-between">
        {[0, 1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className={`flex flex-col items-center gap-2 ${i % 2 ? "translate-y-6" : "-translate-y-6"}`}
          >
            <SkeletonBar className="h-2.5 w-14" />
            <div className="h-2.5 w-2.5 rounded-full bg-canvas-muted/40" />
          </div>
        ))}
      </div>
    </div>
  );
}

function ListShape() {
  return (
    <div className="flex flex-col gap-4 px-5 py-4">
      {[72, 58, 84, 46, 66].map((w, i) => (
        <div key={i} className="flex items-center gap-3">
          <div className="h-4 w-4 shrink-0 rounded border-2 border-canvas-muted/30" />
          <SkeletonBar className="h-3" style={{ width: `${w}%` }} />
        </div>
      ))}
    </div>
  );
}

function MapShape() {
  return (
    <div className="relative flex min-h-0 flex-1 items-center justify-center overflow-hidden">
      <SkeletonBar className="absolute inset-0 rounded-none" />
      <div className="relative h-4 w-4 rounded-full border-[3px] border-canvas-accent bg-canvas-card" />
    </div>
  );
}

/** A full-bleed block: pages, embeds, images, video, 3D. */
function MediaShape() {
  return (
    <div className="relative min-h-0 flex-1 overflow-hidden">
      <SkeletonBar className="absolute inset-0 rounded-none" />
    </div>
  );
}

export function ArtifactBodySkeleton({ kind }: { kind?: ArtifactKind }) {
  switch (kind) {
    case "table":
    case "calendar":
      return <TableShape />;
    case "chart":
      return <ChartShape />;
    case "timeline":
      return <TimelineShape />;
    case "todo":
    case "linkgroup":
      return <ListShape />;
    case "map":
    case "streetview":
      return <MapShape />;
    case "website":
    case "embed":
    case "google-doc":
    case "images":
    case "3d":
    case "custom":
    case "episode":
      return <MediaShape />;
    case "code":
    case "repo":
      return <Lines widths={[38, 64, 52, 80, 30, 58, 72]} />;
    default:
      return <Lines widths={[86, 72, 90, 64, 48]} />;
  }
}

/**
 * Fills its (positioned, sized) parent with a content-shaped skeleton. Use as
 * the loading state for content that renders nothing until it is ready.
 */
export function ArtifactLoadingSkeleton({
  kind,
  className = "",
}: {
  kind?: ArtifactKind;
  className?: string;
}) {
  return (
    <div
      className={`pointer-events-none flex h-full min-h-[120px] w-full flex-col ${className}`}
      aria-hidden
    >
      <ArtifactBodySkeleton kind={kind} />
    </div>
  );
}

/**
 * Shimmer laid over an image or iframe until it reports loaded (see
 * useMediaLoaded). The parent must be positioned. By default it sits above
 * z-[1] frames and below z-10 controls; pass `className` to restack it.
 */
export function MediaLoadingCover({
  loaded,
  className = "z-[2]",
}: {
  loaded: boolean;
  className?: string;
}) {
  if (loaded) return null;
  return (
    <div
      className={`pointer-events-none absolute inset-0 bg-canvas-card ${className}`}
      aria-hidden
    >
      <SkeletonBar className="h-full w-full rounded-none" />
    </div>
  );
}
