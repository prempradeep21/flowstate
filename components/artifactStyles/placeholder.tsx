"use client";

import { StudioKindIcon } from "./cards";
import { VARIANT_LABELS } from "@/lib/artifactStudio/pool";
import { ARTIFACT_CATEGORY_META } from "@/lib/design/theme/artifactCategories";
import { CurrentBody } from "./current";
import type {
  ArtifactRenderContext,
  ArtifactStyleFamily,
  StyleFamilyId,
} from "./types";

/**
 * Scaffold for a family that has no design yet. Each slot is drawn as a
 * labelled wireframe so it is obvious which piece a future design replaces;
 * the body keeps today's content so no artifact ever renders empty.
 */

function SlotLabel({ children }: { children: string }) {
  return (
    <span className="pointer-events-none absolute -top-2 left-3 z-10 rounded-full bg-canvas-bg px-1.5 font-mono text-[10px] uppercase leading-4 tracking-wider text-canvas-muted">
      {children}
    </span>
  );
}

export function makePlaceholderFamily(
  id: StyleFamilyId,
  name: string,
  tone: string,
): ArtifactStyleFamily {
  return {
    id,
    name,
    status: "placeholder",
    fonts: { primary: "denton", secondary: "figtree" },
    summary: "Placeholder — slots drawn as wireframes until this style is designed.",
    slots: {
      Frame: ({ ctx, header, body }) => (
        <div
          className={`relative flex h-full flex-col gap-3 rounded-[20px] border-2 border-dashed bg-canvas-card p-3 ${
            ctx.chromeState === "selected" ? "ring-2 ring-canvas-accent/40" : ""
          }`}
          style={{ borderColor: tone }}
        >
          <span
            className="pointer-events-none absolute -top-2.5 right-4 z-10 rounded-full px-2 font-mono text-[10px] font-semibold uppercase leading-5 tracking-wider text-white"
            style={{ backgroundColor: tone }}
          >
            {name} · placeholder
          </span>
          <SlotLabel>Frame</SlotLabel>
          {header}
          {body}
        </div>
      ),
      Header: ({ ctx, icon }) => (
        <div className="relative flex shrink-0 items-center gap-3 rounded-[10px] border border-dashed border-canvas-border px-3 py-2.5">
          <SlotLabel>Header</SlotLabel>
          {icon}
          <div className="min-w-0 flex-1">
            <p className="truncate font-display text-canvas-body-sm font-medium text-canvas-ink">
              {ctx.item.artifact.title}
            </p>
            <p className="truncate font-mono text-[10px] uppercase tracking-wider text-canvas-muted">
              {VARIANT_LABELS[ctx.item.variant]} · {ARTIFACT_CATEGORY_META[ctx.item.category].label}
            </p>
          </div>
        </div>
      ),
      Icon: ({ ctx }: { ctx: ArtifactRenderContext }) => (
        <span className="relative inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-[8px] border border-dashed border-canvas-border text-canvas-muted">
          <StudioKindIcon item={ctx.item} className="h-4 w-4" />
        </span>
      ),
      Body: ({ ctx }) => (
        <div className="relative flex min-h-0 flex-1 flex-col rounded-[10px] border border-dashed border-canvas-border p-1.5">
          <SlotLabel>Body · current content</SlotLabel>
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[6px]">
            <CurrentBody ctx={ctx} />
          </div>
        </div>
      ),
    },
    // Provisions: fill these in when the design arrives. Each key is a visual
    // family whose kinds should share one language; `variants` is for the
    // kinds that need their own handling inside it.
    categories: {},
    variants: {},
  };
}

