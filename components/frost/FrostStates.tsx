"use client";

import { Component, type ReactNode } from "react";
import {
  D,
  DISPLAY,
  FONT,
  PAD,
  RAISED,
} from "@/components/artifactStyles/styleD/tokens";
import { MediaHead, Well } from "@/components/artifactStyles/styleD/media";
import type { ArtifactPayload } from "@/lib/artifactTypes";

// Kept in its own module so tests can import it without the bodies' fonts.
export { isEmptyPayload } from "./isEmptyPayload";

/**
 * Frost's empty and error bodies (audit 7.3 and 6.1). Both keep the card's
 * title where Style D sets it — top-left, primary font — so a card never
 * changes shape between empty, full and failed.
 *
 *   Empty — one faint-ink line and, when the card can be edited, a raised
 *           "Add" pill that opens Edit.
 *   Error — a rose bloom on the card's lower edge (the only hue Frost allows
 *           besides lime, kept for failure), an ink reason, a raised Retry.
 */

const EMPTY_LINE: Partial<Record<ArtifactPayload["type"], string>> = {
  todo: "No items yet",
  table: "No rows yet",
  timeline: "No events yet",
  images: "No pictures yet",
  linkgroup: "No links yet",
  chart: "No data yet",
};

function CardTitle({ title }: { title: string }) {
  return (
    <p
      className="max-w-[82%]"
      style={{ ...DISPLAY, fontSize: 30, lineHeight: 1.12, letterSpacing: "-0.02em", color: D.ink, margin: 0 }}
    >
      {title}
    </p>
  );
}

function Pill({ children, onClick, center = false }: { children: ReactNode; onClick?: () => void; center?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      data-no-drag
      className={`inline-flex items-center gap-2 ${center ? "self-center" : "self-start"} rounded-full px-5 py-2.5 text-[16px]`}
      style={{ ...FONT, ...RAISED, color: D.ink }}
    >
      {children}
    </button>
  );
}

/**
 * Kinds whose picture has no height of its own (a gallery, a chart): their
 * empty state keeps the card's shape — title over the picture well, the line
 * set in the middle of the well — so the card doesn't change when it fills.
 */
const WELL_EMPTY = new Set<ArtifactPayload["type"]>(["images", "chart"]);

export function FrostEmptyBody({
  payload,
  onAdd,
}: {
  payload: ArtifactPayload;
  onAdd?: () => void;
}) {
  if (WELL_EMPTY.has(payload.type)) {
    return (
      <div data-frost-empty className="flex min-h-0 flex-1 flex-col">
        <MediaHead title={payload.title} />
        <Well>
          <div className="flex flex-1 flex-col items-center justify-center gap-4 p-6 text-center">
            <p style={{ ...FONT, fontSize: 18, color: D.ink, margin: 0 }}>
              {EMPTY_LINE[payload.type] ?? "Nothing here yet"}
            </p>
            {onAdd ? <Pill onClick={onAdd} center>+ Add</Pill> : null}
          </div>
        </Well>
      </div>
    );
  }
  return (
    <div data-frost-empty className="flex min-h-0 flex-1 flex-col" style={{ padding: PAD }}>
      <CardTitle title={payload.title} />
      <div className="mt-auto flex flex-col gap-4">
        <p style={{ ...FONT, fontSize: 18, color: D.ink, margin: 0 }}>
          {EMPTY_LINE[payload.type] ?? "Nothing here yet"}
        </p>
        {onAdd ? <Pill onClick={onAdd}>+ Add</Pill> : null}
      </div>
    </div>
  );
}

export function FrostErrorBody({
  title,
  reason,
  onRetry,
}: {
  title: string;
  reason: string;
  onRetry?: () => void;
}) {
  return (
    <div data-frost-error role="alert" className="relative flex min-h-0 flex-1 flex-col overflow-hidden" style={{ padding: PAD }}>
      <span aria-hidden className="frost-rose-bloom" />
      <div className="relative">
        <CardTitle title={title} />
      </div>
      <div className="relative mt-auto flex flex-col gap-4">
        <p style={{ ...FONT, fontSize: 18, lineHeight: 1.4, color: D.ink, margin: 0 }}>{reason}</p>
        {onRetry ? <Pill onClick={onRetry}>Retry</Pill> : null}
      </div>
    </div>
  );
}

/**
 * The last line of defence: if even the live content throws, the card shows
 * the Frost error body, and Retry remounts it.
 */
export class FrostErrorBoundary extends Component<
  { title: string; resetKey: unknown; children: ReactNode },
  { failed: boolean; attempt: number }
> {
  state = { failed: false, attempt: 0 };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidUpdate(prev: { resetKey: unknown }) {
    if (this.state.failed && prev.resetKey !== this.props.resetKey) {
      this.setState({ failed: false });
    }
  }

  render() {
    if (this.state.failed) {
      return (
        <FrostErrorBody
          title={this.props.title}
          reason="This artifact couldn't be drawn."
          onRetry={() => this.setState((s) => ({ failed: false, attempt: s.attempt + 1 }))}
        />
      );
    }
    return <ReactKeyed k={this.state.attempt}>{this.props.children}</ReactKeyed>;
  }
}

function ReactKeyed({ k, children }: { k: number; children: ReactNode }) {
  return <div key={k} className="flex min-h-0 flex-1 flex-col">{children}</div>;
}
