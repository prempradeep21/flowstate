"use client";

import Link from "next/link";
import { useState } from "react";
import { AdminActionIcon, AdminCardIcon } from "@/app/admin/icons/AdminIcons";
import {
  createCanvasFromSnapshot,
  fetchCanvasList,
} from "@/lib/canvasPersistence";
import { SAMPLE_CANVAS_REGISTRY } from "@/lib/sampleCanvases/registry";
import type { SampleCanvasDefinition } from "@/lib/sampleCanvases/types";
import { createClient } from "@/lib/supabase/client";

type AddState =
  | { status: "idle" }
  | { status: "adding" }
  | { status: "added"; canvasId: string }
  | { status: "error"; message: string };

/** "Henry Ford", "Henry Ford (2)", "Henry Ford (3)" … */
function dedupeTitle(base: string, existingTitles: string[]): string {
  if (!existingTitles.includes(base)) return base;
  let n = 2;
  while (existingTitles.includes(`${base} (${n})`)) n += 1;
  return `${base} (${n})`;
}

function statsLine(def: SampleCanvasDefinition): string {
  const { stats } = def;
  const parts = [
    `${stats.charts} charts`,
    `${stats.tables} tables`,
    `${stats.timelines} timeline${stats.timelines === 1 ? "" : "s"}`,
    `${stats.videos} videos`,
    `${stats.websites} sites`,
    `${stats.maps} maps`,
  ];
  if (stats.other > 0) parts.push(`${stats.other} extras`);
  return parts.join(" · ");
}

function SampleCanvasCard({ def }: { def: SampleCanvasDefinition }) {
  const [state, setState] = useState<AddState>({ status: "idle" });

  const handleAdd = async () => {
    if (state.status === "adding") return;
    setState({ status: "adding" });
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setState({ status: "error", message: "Not signed in." });
        return;
      }
      const existing = await fetchCanvasList(supabase, user.id);
      const title = dedupeTitle(
        def.title,
        existing.map((canvas) => canvas.title),
      );
      const snapshot = def.buildSnapshot();
      // Insert only — never touch lastActiveCanvasId from here. Hijacking the
      // active canvas under a live session once cross-saved two canvases'
      // contents; the user switches to the new canvas via the sidebar, which
      // flushes and hydrates safely.
      const created = await createCanvasFromSnapshot(
        supabase,
        user.id,
        title,
        snapshot,
      );
      setState({ status: "added", canvasId: created.id });
    } catch (error) {
      setState({
        status: "error",
        message:
          error instanceof Error ? error.message : "Failed to add canvas.",
      });
    }
  };

  return (
    <article className="admin-dashboard-card flex flex-col rounded-canvas border border-canvas-border bg-canvas-card p-4 shadow-card transition-colors hover:border-canvas-accent/35">
      <div className="flex items-start gap-3">
        <AdminCardIcon name="sample-canvases" />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="font-display text-lg font-medium text-canvas-ink">
                {def.title}
              </h3>
              <p className="mt-1 text-canvas-body-sm text-canvas-muted">
                {def.tagline} · {def.eraRange}
              </p>
            </div>
            {def.createdWithSkillVersion ? (
              <span
                className="inline-flex shrink-0 items-center rounded-full border border-canvas-border px-2.5 py-0.5 text-canvas-micro font-medium text-canvas-muted"
                title="Skill and version that produced this canvas"
              >
                {def.createdWithSkillVersion}
              </span>
            ) : null}
          </div>
        </div>
      </div>
      <p className="mt-3 pl-12 text-canvas-body-sm text-canvas-muted">
        {def.description}
      </p>
      <p
        className="mt-2 pl-12 text-canvas-micro font-medium"
        style={{ color: def.accent }}
      >
        {statsLine(def)}
      </p>
      <div className="mt-4 flex flex-wrap items-center gap-2 pl-12">
        <a
          href={`/admin/sample-canvases/preview?slug=${encodeURIComponent(def.slug)}`}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 rounded-canvas border border-canvas-border bg-canvas-bg px-3 py-1.5 text-canvas-body-sm font-medium text-canvas-ink transition-colors hover:border-canvas-accent/40"
        >
          <AdminActionIcon name="expand" />
          View canvas
        </a>
        <button
          type="button"
          onClick={handleAdd}
          disabled={state.status === "adding"}
          className="inline-flex items-center gap-1.5 rounded-canvas border border-canvas-ink/20 bg-canvas-ink px-3 py-1.5 text-canvas-body-sm font-medium text-canvas-card transition-opacity hover:opacity-90 disabled:cursor-wait disabled:opacity-60"
        >
          <AdminActionIcon name="sparkles" className="h-4 w-4 text-canvas-card" />
          {state.status === "adding"
            ? "Adding…"
            : state.status === "added"
              ? "Add another copy"
              : "Add to my canvases"}
        </button>
        {state.status === "added" ? (
          <>
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 rounded-canvas border border-canvas-border bg-canvas-bg px-3 py-1.5 text-canvas-body-sm font-medium text-canvas-ink transition-colors hover:border-canvas-accent/40"
            >
              <AdminActionIcon name="chevron-right" />
              Go to app
            </Link>
            <span className="text-canvas-micro text-canvas-muted">
              Added — pick it from your canvas list
            </span>
          </>
        ) : null}
        {state.status === "error" ? (
          <span className="inline-flex items-center gap-1.5 text-canvas-body-sm text-canvas-muted">
            <AdminActionIcon name="alert" />
            {state.message}
          </span>
        ) : null}
      </div>
    </article>
  );
}

export function SampleCanvasesClient() {
  return (
    <div className="space-y-6 p-4 sm:p-6">
      <section className="flex gap-3 rounded-canvas border border-canvas-border bg-canvas-card/50 p-4">
        <AdminCardIcon name="sample-canvases" />
        <p className="text-canvas-body-sm text-canvas-muted">
          Each entry is a code-defined snapshot.{" "}
          <strong className="font-medium text-canvas-ink">Research</strong>{" "}
          canvases deep-research a subject and come from the{" "}
          <code className="text-canvas-micro">.claude/skills/research-canvas</code>{" "}
          skill: an overview band of sourced metrics plus era deep-dive clusters.{" "}
          <strong className="font-medium text-canvas-ink">Project</strong>{" "}
          canvases model a piece of work moving through states, and are
          hand-built with their own layout.{" "}
          <strong className="font-medium text-canvas-ink">View canvas</strong>{" "}
          opens it in a new tab to explore first — nothing is written to your
          account. <strong className="font-medium text-canvas-ink">Add to
          my canvases</strong> then creates a real canvas you own — edits stay
          yours; the code-defined original is untouched.
        </p>
      </section>
      <div className="grid gap-4 lg:grid-cols-2">
        {SAMPLE_CANVAS_REGISTRY.map((def) => (
          <SampleCanvasCard key={def.slug} def={def} />
        ))}
      </div>
    </div>
  );
}
