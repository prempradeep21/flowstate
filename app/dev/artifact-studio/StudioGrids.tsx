"use client";

import { useLayoutEffect, useMemo, useRef, useState } from "react";
import { VARIANT_LABELS, type StudioArtifact } from "@/lib/artifactStudio/pool";
import { ARTIFACT_CATEGORY_META } from "@/lib/design/theme/artifactCategories";
import type { ArtifactCategoryId } from "@/lib/design/theme/types";
import { LazyMount, ScaledStage, STUDIO_ARTIFACT_SCALE } from "./ScaledStage";
import {
  STYLE_FAMILIES,
  StyledArtifact,
  backdropOf,
  type ArtifactStyleFamily,
  type ChromeState,
} from "./styles";
import { useDecisions, VERDICT_META } from "./useDecisions";

function useBoardWidth() {
  const ref = useRef<HTMLDivElement | null>(null);
  const [width, setWidth] = useState(0);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      if (entry) setWidth(entry.contentRect.width);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return { ref, width };
}

function TileSkeleton() {
  return <div className="h-full w-full animate-pulse rounded-canvas bg-canvas-card/60" />;
}

function ExpandIcon() {
  return (
    <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
      <path d="M9.5 2.5h4v4M6.5 13.5h-4v-4M13.5 2.5 9 7M2.5 13.5 7 9" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/**
 * Kinds whose height is their content (a mechanism wraps its steps into as many
 * rows as it needs): drawn at their canvas width, as tall as they measure.
 */
export function hugsContent(item: StudioArtifact): boolean {
  return item.variant === "mechanism";
}

/** Natural size with any measured content height swapped in. */
function useHuggedNaturals() {
  const [heights, setHeights] = useState<Record<string, number>>({});
  const naturalOf = (item: StudioArtifact, familyId?: string) => {
    const h = heights[familyId ? `${familyId}:${item.uid}` : item.uid];
    return h ? { w: item.natural.w, h } : item.natural;
  };
  const report = (item: StudioArtifact, familyId?: string) =>
    hugsContent(item)
      ? (h: number) => {
          const key = familyId ? `${familyId}:${item.uid}` : item.uid;
          setHeights((prev) => (prev[key] === h ? prev : { ...prev, [key]: h }));
        }
      : undefined;
  return { naturalOf, report };
}

/** One artifact in a grid cell: inert preview, click opens the focus view. */
export function StudioTile({
  item,
  family,
  themeId = null,
  chromeState,
  onOpen,
  onHugHeight,
}: {
  item: StudioArtifact;
  family: ArtifactStyleFamily;
  themeId?: string | null;
  chromeState: ChromeState;
  onOpen: () => void;
  onHugHeight?: (h: number) => void;
}) {
  const [hovered, setHovered] = useState(false);
  const { get } = useDecisions();
  const verdict = get(family.id, item.uid)?.verdict;

  return (
    <div
      className="group/tile relative h-full w-full"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <LazyMount placeholder={<TileSkeleton />}>
        <ScaledStage natural={item.natural} mode="natural" hug={hugsContent(item)} onHugHeight={onHugHeight}>
          <StyledArtifact
            family={family}
            ctx={{
              item,
              interactive: false,
              surface: "tile",
              chromeState: chromeState === "rest" && hovered ? "hover" : chromeState,
              themeId,
            }}
          />
        </ScaledStage>
      </LazyMount>
      {/* Click shield: tiles are previews — the focus view is where you interact. */}
      <button
        type="button"
        onClick={onOpen}
        aria-label={`Open ${item.artifact.title}`}
        className="absolute inset-0 z-[70] cursor-zoom-in rounded-canvas focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-canvas-accent"
      />
      <div className="pointer-events-none absolute bottom-2 right-2 z-[71] flex items-center gap-1.5 rounded-full bg-canvas-ink/85 px-2.5 py-1 text-[11px] font-medium text-canvas-card opacity-0 shadow-card transition-opacity group-hover/tile:opacity-100">
        <span>{VARIANT_LABELS[item.variant]}</span>
        <span className="opacity-60">·</span>
        <span className="max-w-[160px] truncate opacity-80">{item.source}</span>
        <ExpandIcon />
      </div>
      {verdict ? (
        <span
          className="pointer-events-none absolute left-2 top-2 z-[71] rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white shadow-card"
          style={{ backgroundColor: VERDICT_META[verdict].color }}
        >
          {VERDICT_META[verdict].label}
        </span>
      ) : null}
    </div>
  );
}

/** Packing unit (px). Tiles span whole units, so sizes stay within a few px of true. */
const BENTO_UNIT = 8;

/**
 * Dense bento board at canvas size: every tile is drawn at STUDIO_ARTIFACT_SCALE
 * of the size it has on the canvas (shrunk further only if wider than the board) and the grid packs
 * those true boxes, back-filling holes.
 */
export function BentoGrid({
  items,
  family,
  themeId = null,
  chromeState,
  onOpen,
}: {
  items: StudioArtifact[];
  family: ArtifactStyleFamily;
  themeId?: string | null;
  chromeState: ChromeState;
  onOpen: (uid: string) => void;
}) {
  const { ref, width } = useBoardWidth();
  const gap = width >= 900 ? 16 : 12;
  const columns = Math.max(1, Math.floor((width + gap) / BENTO_UNIT));
  const { naturalOf, report } = useHuggedNaturals();

  return (
    <div
      ref={ref}
      className="grid w-full"
      style={{
        gridTemplateColumns: `repeat(${columns}, ${BENTO_UNIT}px)`,
        gridAutoRows: `${BENTO_UNIT}px`,
        gridAutoFlow: "dense",
      }}
    >
      {width > 0
        ? items.map((item) => {
            const natural = naturalOf(item);
            const scale = Math.min(STUDIO_ARTIFACT_SCALE, width / natural.w);
            const w = Math.round(natural.w * scale);
            const h = Math.round(natural.h * scale);
            const col = Math.min(columns, Math.ceil((w + gap) / BENTO_UNIT));
            const row = Math.ceil((h + gap) / BENTO_UNIT);
            return (
              <div
                key={item.uid}
                style={{ gridColumn: `span ${col}`, gridRow: `span ${row}` }}
                className="min-h-0 min-w-0"
              >
                <div style={{ width: w, height: h }}>
                  <StudioTile
                    item={item}
                    family={family}
                    themeId={themeId}
                    chromeState={chromeState}
                    onOpen={() => onOpen(item.uid)}
                    onHugHeight={report(item)}
                  />
                </div>
              </div>
            );
          })
        : null}
    </div>
  );
}

/** One of every variant, sectioned by the visual family it belongs to. */
export function FamilySections({
  items,
  family,
  themeId = null,
  chromeState,
  onOpen,
}: {
  items: StudioArtifact[];
  family: ArtifactStyleFamily;
  themeId?: string | null;
  chromeState: ChromeState;
  onOpen: (uid: string) => void;
}) {
  const sections = useMemo(() => {
    const order: ArtifactCategoryId[] = [];
    const byCategory = new Map<ArtifactCategoryId, StudioArtifact[]>();
    for (const item of items) {
      if (!byCategory.has(item.category)) {
        order.push(item.category);
        byCategory.set(item.category, []);
      }
      byCategory.get(item.category)!.push(item);
    }
    return order.map((id) => ({ id, items: byCategory.get(id)! }));
  }, [items]);

  return (
    <div className="flex flex-col gap-14">
      {sections.map((section) => (
        <section key={section.id} aria-labelledby={`family-${section.id}`}>
          <div className="mb-5 flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <h2 id={`family-${section.id}`} className="font-display text-xl font-medium text-[color:var(--studio-label-ink,rgb(var(--canvas-ink)))]">
              {ARTIFACT_CATEGORY_META[section.id].label}
            </h2>
          </div>
          <BentoGrid items={section.items} family={family} themeId={themeId} chromeState={chromeState} onOpen={onOpen} />
        </section>
      ))}
    </div>
  );
}

/** Every variant as a row, every style family as a column. */
/** Column template: a label column, then one 300px column per family — the row scrolls sideways. */
const COMPARE_COLUMNS = `180px repeat(${STYLE_FAMILIES.length}, 300px)`;

export function CompareStylesGrid({
  items,
  chromeState,
  themeId = null,
  onOpen,
}: {
  items: StudioArtifact[];
  chromeState: ChromeState;
  themeId?: string | null;
  onOpen: (uid: string, familyId: ArtifactStyleFamily["id"]) => void;
}) {
  const { naturalOf, report } = useHuggedNaturals();
  return (
    <div className="flex flex-col gap-10 overflow-x-auto pb-4">
      <div className="sticky top-[var(--studio-bar-h,0px)] z-[80] hidden gap-5 bg-canvas-bg/90 py-2 backdrop-blur md:grid" style={{ gridTemplateColumns: COMPARE_COLUMNS }}>
        <span />
        {STYLE_FAMILIES.map((f) => (
          <p key={f.id} className="font-display text-canvas-body-sm font-medium text-canvas-ink">
            {f.name}
            {f.status === "placeholder" ? (
              <span className="ml-2 text-canvas-micro font-normal text-canvas-muted">placeholder</span>
            ) : null}
          </p>
        ))}
      </div>
      {items.map((item) => {
        return (
          <div key={item.uid} className="grid gap-5" style={{ gridTemplateColumns: COMPARE_COLUMNS }}>
            <div className="flex flex-col gap-1 pt-1">
              <p className="font-display text-base font-medium text-canvas-ink">{VARIANT_LABELS[item.variant]}</p>
            </div>
            {STYLE_FAMILIES.map((f) => {
              const natural = naturalOf(item, f.id);
              return (
                <div key={f.id} className="w-full min-w-0 rounded-canvas p-3" style={{ maxWidth: natural.w * STUDIO_ARTIFACT_SCALE + 24, aspectRatio: String(natural.w / natural.h), background: backdropOf(f, themeId)?.background }}>
                  <StudioTile item={item} family={f} themeId={themeId} chromeState={chromeState} onOpen={() => onOpen(item.uid, f.id)} onHugHeight={report(item, f.id)} />
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}
