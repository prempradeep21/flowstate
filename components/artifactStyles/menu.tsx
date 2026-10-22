"use client";

import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type RefObject } from "react";
import { CanvasFloatingMenuPortal, useCanvasFloatingMenuPosition } from "@/components/CanvasFloatingMenu";
import { ArtifactExportProvider } from "@/components/artifacts/ArtifactExportContext";
import { ArtifactHeaderNestedMenu } from "@/components/artifacts/ArtifactHeaderNestedMenu";
import type { ArtifactRenderContext } from "./types";

/** The ⋯ glyph, drawn the way the live header draws it. */
export function MoreDots({ size = 22 }: { size?: number }) {
  return (
    <svg viewBox="0 0 16 16" width={size} height={size} fill="currentColor" aria-hidden>
      <circle cx="8" cy="3.5" r="1.25" />
      <circle cx="8" cy="8" r="1.25" />
      <circle cx="8" cy="12.5" r="1.25" />
    </svg>
  );
}

/** Whether an artifact has a ⋯ menu at all — cards carry their own actions. */
export function hasArtifactMenu(ctx: ArtifactRenderContext) {
  return !ctx.item.card;
}

/**
 * An artifact's hover actions — the ⋯ button and the live header menu behind
 * it (Version + Export, nothing else). Families draw the button in their own
 * language through `style`; it fades in on hover / selection like the canvas
 * chrome and stays up while its menu is open. The space it sits in is the
 * family's to reserve, so the title never runs under it.
 */
export function ArtifactMoreMenu({
  ctx,
  className = "",
  style,
  iconSize,
}: {
  ctx: ArtifactRenderContext;
  className?: string;
  style?: CSSProperties;
  iconSize?: number;
}) {
  const { item } = ctx;
  const [open, setOpen] = useState(false);
  const [localVersionId, setLocalVersionId] = useState(item.card ? "" : item.artifact.latestVersionId);
  // On the canvas the node owns its version; the studio keeps a local preview.
  const versionId = ctx.canvasMenu?.activeVersionId ?? localVersionId;
  const setVersionId = ctx.canvasMenu?.onVersionChange ?? setLocalVersionId;
  const buttonRef = useRef<HTMLButtonElement>(null);
  const portal = useCanvasFloatingMenuPosition(open, buttonRef);

  useEffect(() => {
    if (!open) return;
    const close = (e: PointerEvent) => {
      const target = e.target as Node;
      if (buttonRef.current?.contains(target) || portal.portalRef.current?.contains(target)) return;
      setOpen(false);
    };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, [open, portal.portalRef]);

  if (item.card) return null;
  const shown = ctx.chromeState !== "rest" || open;
  // Sites and video have no versions, as in the live header.
  const versioned = item.variant !== "video" && item.kind !== "website";

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        aria-label="More options"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className={`inline-flex shrink-0 items-center justify-center transition-opacity duration-300 ease-out ${className}`}
        style={{ opacity: shown ? 1 : 0, pointerEvents: shown ? undefined : "none", ...style }}
      >
        <MoreDots size={iconSize} />
      </button>
      {open ? (
        <ArtifactExportProvider>
          <CanvasFloatingMenuPortal
            open={open}
            style={portal.style}
            portalRef={portal.portalRef}
            className="min-w-[220px] max-h-[min(420px,70vh)] overflow-y-auto rounded-canvas border border-canvas-border bg-canvas-card py-1 shadow-card"
          >
            {ctx.canvasMenu?.extraRows?.(() => setOpen(false))}
            <ArtifactHeaderNestedMenu
              kind={item.kind}
              title={item.artifact.title}
              artifactId={item.artifact.id}
              exportPayload={item.payload}
              versions={
                versioned
                  ? { versions: item.artifact.versions, activeVersionId: versionId, onVersionChange: setVersionId }
                  : undefined
              }
              onRemoveFromCanvas={ctx.canvasMenu?.onRemove}
              onClose={() => setOpen(false)}
            />
          </CanvasFloatingMenuPortal>
        </ArtifactExportProvider>
      ) : null}
    </>
  );
}

/** Clear space kept between the corner circle and any text beside it. */
const CORNER_GAP = 8;

/**
 * Make room for the corner circle: every leaf element (`data-el`) whose box
 * would run under it gets right padding up to the circle's left edge less
 * the gap. Reserved at rest too, so nothing reflows when the circle fades in.
 * Measures in the card's own units, so it holds at any stage scale.
 */
function useCornerClearance(wrapRef: RefObject<HTMLDivElement | null>, inset: number, size: number, active: boolean) {
  useLayoutEffect(() => {
    const wrap = wrapRef.current;
    const host = wrap?.parentElement;
    if (!active || !wrap || !host) return;
    // Each padded element's own inline padding, put back before every pass.
    const padded = new Map<HTMLElement, string>();
    const restore = () => padded.forEach((own, el) => (el.style.paddingRight = own));
    let frame = 0;
    const apply = () => {
      // Measure the natural layout every pass — padding from the last pass
      // would otherwise feed back into the next and never settle.
      restore();
      padded.clear();
      const box = host.getBoundingClientRect();
      const k = host.offsetWidth ? box.width / host.offsetWidth : 1;
      const zoneLeft = box.right - (inset + size + CORNER_GAP) * k;
      const zoneTop = box.top + (inset - CORNER_GAP) * k;
      const zoneBottom = box.top + (inset + size + CORNER_GAP) * k;
      const needs: [HTMLElement, number][] = [];
      host.querySelectorAll<HTMLElement>("[data-el]").forEach((el) => {
        if (wrap.contains(el) || el.querySelector("[data-el]")) return;
        const r = el.getBoundingClientRect();
        if (r.bottom > zoneTop && r.top < zoneBottom && r.right > zoneLeft) {
          const base = parseFloat(getComputedStyle(el).paddingRight) || 0;
          needs.push([el, base + Math.ceil((r.right - zoneLeft) / k)]);
        }
      });
      for (const [el, pad] of needs) {
        padded.set(el, el.style.paddingRight);
        el.style.paddingRight = `${pad}px`;
      }
    };
    const schedule = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(apply);
    };
    apply();
    const resize = new ResizeObserver(schedule);
    resize.observe(host);
    // Text and structure only — our own style writes are attribute changes and never re-trigger it.
    const mutations = new MutationObserver(schedule);
    mutations.observe(host, { childList: true, characterData: true, subtree: true });
    return () => {
      cancelAnimationFrame(frame);
      resize.disconnect();
      mutations.disconnect();
      restore();
    };
  }, [wrapRef, inset, size, active]);
}

/**
 * The ⋯ as a circle tucked into the card's top-right corner, for families
 * whose title has no bar to hold it. Concentric with the corner (R = r + D):
 * the circle's centre is the corner arc's centre, so the inset is the card
 * radius less the circle's — or the radius itself when the card's corner is
 * tighter than the circle. It takes the card's text colour, so it reads on
 * every surface the family paints, and pads whatever text would run under it.
 */
export function CornerMenu({
  ctx,
  cardRadius,
  size = 40,
  style,
}: {
  ctx: ArtifactRenderContext;
  cardRadius: number;
  size?: number;
  style?: CSSProperties;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const active = hasArtifactMenu(ctx);
  const inset = cardRadius > size / 2 ? cardRadius - size / 2 : cardRadius;
  useCornerClearance(wrapRef, inset, size, active);
  if (!active) return null;
  return (
    <div ref={wrapRef} className="absolute z-20" style={{ top: inset, right: inset }}>
      <ArtifactMoreMenu
        ctx={ctx}
        iconSize={Math.round(size / 2)}
        className="rounded-full"
        style={{
          width: size,
          height: size,
          color: "inherit",
          background: "color-mix(in srgb, currentColor 10%, transparent)",
          backdropFilter: "blur(8px)",
          ...style,
        }}
      />
    </div>
  );
}
