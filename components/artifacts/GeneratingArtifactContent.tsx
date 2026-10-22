"use client";

import { Component, type ReactNode } from "react";
import { ArtifactContent } from "@/components/artifacts/ArtifactContent";
import { ArtifactTypeIcon } from "@/components/artifacts/ArtifactTypeIcon";
import type { ArtifactKind, ArtifactPayload } from "@/lib/artifactTypes";
import { payloadToArtifactKind } from "@/lib/artifactTypes";
import { useArtifactDraftStore } from "@/lib/artifactDrafts";
import { generatingArtifactLabel } from "@/lib/artifactWorkingTitle";
import { validateChartEmit } from "@/lib/chartArtifact";
import {
  artifactCategoryOf,
  artifactCategoryStyle,
} from "@/lib/design/theme/artifactCategories";
import type { Card } from "@/lib/store";

/**
 * A skeleton artifact on the canvas while the model is still writing it. It
 * pops as soon as the artifact's type is known, then fills in from the
 * streamed draft — rows, items and events appear as they are written.
 */

/** Whether a (possibly partial) payload has enough in it to draw for real. */
export function hasRenderableContent(payload: ArtifactPayload): boolean {
  switch (payload.type) {
    case "table":
    case "calendar":
      // Both draw their own skeleton from an empty payload.
      return true;
    case "todo":
      return payload.data.items.length > 0;
    case "timeline":
      return payload.data.events.length > 0;
    case "chart": {
      if (validateChartEmit(payload.data)) return false;
      const { chartType, categories } = payload.data;
      return chartType === "pie" || chartType === "gauge"
        ? true
        : (categories?.length ?? 0) > 0;
    }
    case "code":
      return (payload.data.files ?? []).some((f) => (f.content ?? "").length > 0);
    default:
      return true;
  }
}

function emptyTablePayload(title: string): ArtifactPayload {
  return { type: "table", title, data: { columns: [], rows: [] } };
}

function emptyCalendarPayload(title: string): ArtifactPayload {
  const now = new Date();
  return {
    type: "calendar",
    title,
    data: {
      viewYear: now.getFullYear(),
      viewMonth: now.getMonth() + 1,
      highlightedDates: [],
      events: [],
    },
  };
}

/** Partial data can trip a renderer; fall back to the skeleton until it settles. */
export class DraftBoundary extends Component<
  { resetKey: unknown; fallback: ReactNode; children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidUpdate(prev: { resetKey: unknown }) {
    // The next draft gets a fresh try.
    if (this.state.failed && prev.resetKey !== this.props.resetKey) {
      this.setState({ failed: false });
    }
  }

  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

function Bar({ className = "", style }: { className?: string; style?: React.CSSProperties }) {
  return <div className={`table-shimmer-bar rounded ${className}`} style={style} />;
}

function GeneratingHeader({ kind, title }: { kind: ArtifactKind; title: string }) {
  return (
    <div
      className="artifact-panel-header flex shrink-0 items-center gap-[11px] py-3.5 pl-4 pr-4"
      data-artifact-kind={kind}
      data-artifact-category={artifactCategoryOf(kind)}
    >
      <span
        className="artifact-header-icon flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-canvas-ink"
        style={artifactCategoryStyle(kind)}
      >
        <ArtifactTypeIcon kind={kind} className="h-[22px] w-[22px]" />
      </span>
      <div className="artifact-header-title flex min-w-0 flex-1 items-center">
        {title.trim() ? (
          <span className="truncate text-[17px] font-medium text-canvas-ink">
            {title}
          </span>
        ) : (
          <span className="truncate text-[17px] font-medium text-canvas-muted">
            {generatingArtifactLabel(kind)}
          </span>
        )}
      </div>
      <span
        className="flex shrink-0 items-center gap-1.5 text-[12px] text-canvas-muted"
        aria-live="polite"
      >
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-canvas-accent" />
        Generating
      </span>
    </div>
  );
}

function ListSkeleton() {
  return (
    <div className="flex flex-col gap-4 px-5 py-4" aria-hidden>
      {[72, 58, 84, 46, 66].map((w, i) => (
        <div key={i} className="flex items-center gap-3">
          <div className="h-4 w-4 shrink-0 rounded border-2 border-canvas-muted/30" />
          <Bar className="h-3" style={{ width: `${w}%` }} />
        </div>
      ))}
    </div>
  );
}

/**
 * A todo renders through the artifact registry (it needs a saved version to
 * edit against), so a draft's items are drawn read-only here, in the same rows.
 */
function DraftTodoList({
  payload,
}: {
  payload: Extract<ArtifactPayload, { type: "todo" }>;
}) {
  return (
    <ul className="min-h-0 flex-1 overflow-hidden" aria-label={payload.title}>
      {payload.data.items.map((item, index) => (
        <li
          key={item.id ?? index}
          className="todo-row-animate flex items-start gap-3 border-b border-canvas-ink/12 px-4 py-3 last:border-0"
        >
          <span className="mt-1 h-[22px] w-[22px] shrink-0 rounded-[6px] border-2 border-canvas-ink/40 bg-canvas-card" />
          <p className="min-w-0 flex-1 text-[21px] leading-snug text-canvas-ink">
            {item.label}
          </p>
        </li>
      ))}
    </ul>
  );
}

function TimelineSkeleton() {
  return (
    <div className="relative flex flex-1 items-center px-6 py-8" aria-hidden>
      <div className="absolute inset-x-6 top-1/2 h-px bg-canvas-muted/30" />
      <div className="relative flex w-full justify-between">
        {[0, 1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className={`flex flex-col items-center gap-2 ${i % 2 ? "translate-y-6" : "-translate-y-6"}`}
          >
            <Bar className="h-2.5 w-14" />
            <div className="h-2.5 w-2.5 rounded-full bg-canvas-muted/40" />
          </div>
        ))}
      </div>
    </div>
  );
}

function ChartSkeleton() {
  return (
    <div className="flex flex-1 items-end gap-3 px-6 pb-6 pt-4" aria-hidden>
      {[42, 64, 52, 80, 58, 70, 36].map((h, i) => (
        <Bar key={i} className="flex-1 rounded-t-md" style={{ height: `${h}%`, minHeight: 24 }} />
      ))}
    </div>
  );
}

function CodeSkeleton() {
  return (
    <div className="flex flex-col gap-2.5 px-5 py-4" aria-hidden>
      {[38, 64, 52, 80, 30, 58, 72, 44].map((w, i) => (
        <Bar
          key={i}
          className="h-2.5"
          style={{ width: `${w}%`, marginLeft: i % 3 === 1 ? 24 : 0 }}
        />
      ))}
    </div>
  );
}

function MapSkeleton() {
  return (
    <div className="relative m-3 flex flex-1 items-center justify-center overflow-hidden rounded-canvas-nest-13" aria-hidden>
      <Bar className="absolute inset-0 rounded-none" />
      <div className="relative flex flex-col items-center gap-2">
        <div className="h-4 w-4 animate-bounce rounded-full border-[3px] border-canvas-accent bg-canvas-card" />
        <Bar className="h-2.5 w-24" />
      </div>
    </div>
  );
}

function BlockSkeleton() {
  return (
    <div className="flex flex-1 flex-col gap-3 px-5 py-4" aria-hidden>
      <Bar className="h-8 w-1/2" />
      <div className="flex flex-1 gap-3">
        <Bar className="flex-1" />
        <Bar className="flex-1" />
      </div>
      <Bar className="h-9 w-28 self-end rounded-full" />
    </div>
  );
}

function KindSkeleton({ kind, title }: { kind: ArtifactKind; title: string }) {
  switch (kind) {
    case "table":
      return <ArtifactContent payload={emptyTablePayload(title)} layout="canvas" />;
    case "calendar":
      return <ArtifactContent payload={emptyCalendarPayload(title)} layout="canvas" />;
    case "todo":
      return <ListSkeleton />;
    case "timeline":
      return <TimelineSkeleton />;
    case "chart":
      return <ChartSkeleton />;
    case "code":
      return <CodeSkeleton />;
    case "map":
    case "streetview":
      return <MapSkeleton />;
    default:
      return <BlockSkeleton />;
  }
}

export function GeneratingArtifactContent({
  nodeId,
  kind,
  title,
  sourceCard,
}: {
  nodeId: string;
  kind: ArtifactKind;
  title: string;
  sourceCard?: Card;
}) {
  const draft = useArtifactDraftStore((s) => s.drafts[nodeId]);
  // Without a streamed draft, the card's own pending payload (a turn that
  // emits once, at the end) still fills the skeleton when it matches.
  const cardPayload =
    sourceCard?.artifactPayload &&
    payloadToArtifactKind(sourceCard.artifactPayload) === kind
      ? sourceCard.artifactPayload
      : undefined;
  const payload = draft ?? cardPayload;
  const shownTitle = payload?.title?.trim() || title;
  const skeleton = <KindSkeleton kind={kind} title={shownTitle} />;

  return (
    <div className="flex min-h-0 w-full flex-1 flex-col">
      <GeneratingHeader kind={kind} title={shownTitle} />
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        {payload && hasRenderableContent(payload) ? (
          <DraftBoundary resetKey={payload} fallback={skeleton}>
            {payload.type === "todo" ? (
              <DraftTodoList payload={payload} />
            ) : (
              <ArtifactContent payload={payload} layout="canvas" />
            )}
          </DraftBoundary>
        ) : (
          skeleton
        )}
      </div>
    </div>
  );
}
