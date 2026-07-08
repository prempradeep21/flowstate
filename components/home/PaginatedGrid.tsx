"use client";

import { Fragment, useState, type ReactNode } from "react";
import { PanelChevronIcon } from "@/components/PanelChrome";

/** Two rows of three — matches the card grid's fixed 3-column layout. */
const PAGE_SIZE = 6;

export interface GridSlot {
  key: string;
  node: ReactNode;
}

/**
 * Renders `slots` as a fixed 3-column, 2-row grid (6 per page). When there are
 * more slots than fit, prev/next arrow buttons appear in the gutters on either
 * side and page through the remainder. Used for every Home grid section so
 * pagination behaves identically everywhere.
 */
export function PaginatedGrid({
  slots,
  gridClassName = "grid grid-cols-3 gap-5",
}: {
  slots: GridSlot[];
  gridClassName?: string;
}) {
  const [page, setPage] = useState(0);
  const totalPages = Math.max(1, Math.ceil(slots.length / PAGE_SIZE));
  const activePage = Math.min(page, totalPages - 1);
  const start = activePage * PAGE_SIZE;
  const current = slots.slice(start, start + PAGE_SIZE);
  const paginated = totalPages > 1;

  const canPrev = activePage > 0;
  const canNext = activePage < totalPages - 1;

  return (
    <div className="relative">
      {/* Arrows float outside the grid's own box (into the page's existing
          side gutter) rather than reserving space that would shrink the
          grid — so card size stays identical whether a section paginates
          or not. */}
      {paginated && (
        <>
          <PageArrow
            direction="prev"
            disabled={!canPrev}
            onClick={() => setPage((p) => Math.max(0, p - 1))}
          />
          <PageArrow
            direction="next"
            disabled={!canNext}
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
          />
        </>
      )}
      <div className={gridClassName}>
        {current.map((slot) => (
          // Fragment (not a div) so each card's own root element is the
          // grid item — lets grid's default stretch size every tile to
          // match the row's tallest neighbor, instead of stretching an
          // invisible wrapper while the card itself stays content-sized.
          <Fragment key={slot.key}>{slot.node}</Fragment>
        ))}
      </div>
    </div>
  );
}

function PageArrow({
  direction,
  disabled,
  onClick,
}: {
  direction: "prev" | "next";
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={direction === "prev" ? "Previous page" : "Next page"}
      className={`absolute top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-canvas-border bg-canvas-card text-canvas-ink shadow-card transition-all duration-motion-fast ease-motion-medium hover:scale-105 hover:border-canvas-accent/40 hover:text-canvas-accent hover:shadow-artifact focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-canvas-accent disabled:pointer-events-none disabled:opacity-30 motion-reduce:transition-none ${
        direction === "prev"
          ? "-left-11 hover:-translate-x-0.5"
          : "-right-11 hover:translate-x-0.5"
      }`}
    >
      <PanelChevronIcon
        direction={direction === "prev" ? "left" : "right"}
        className="h-4 w-4"
      />
    </button>
  );
}
