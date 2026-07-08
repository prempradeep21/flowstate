"use client";

import { useState } from "react";
import { AdminActionIcon } from "@/app/admin/icons/AdminIcons";
import {
  ARTIFACT_SPAWN_GLOBAL_RULES,
  ARTIFACT_INTENT_RESOLUTION_ORDER,
  SPAWN_PRIORITY_TABLE,
} from "@/lib/artifactIntentCatalog";

const MAX_PRIORITY = 90;

interface PipelineStage {
  step: number;
  title: string;
  detail: string;
}

const PIPELINE_STAGES: PipelineStage[] = [
  {
    step: 1,
    title: "Detect intent",
    detail: "Chat message, URL paste, file drop, or manual pick.",
  },
  {
    step: 2,
    title: "Resolve by priority",
    detail: "Explicit request wins; otherwise lowest priority number spawns first.",
  },
  {
    step: 3,
    title: "Spawn or ask",
    detail: "First materialized artifact auto-appears; extras show a permission node.",
  },
];

function SectionHeader({ children }: { children: string }) {
  return (
    <h4 className="text-canvas-micro font-semibold uppercase tracking-wider text-canvas-muted">
      {children}
    </h4>
  );
}

function StageBox({ stage }: { stage: PipelineStage }) {
  return (
    <div className="flex flex-1 items-start gap-3 rounded-canvas border border-canvas-border bg-canvas-bg/40 px-3 py-3">
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-canvas-artifactIconBg font-mono text-canvas-micro font-semibold tabular-nums text-canvas-accent">
        {stage.step}
      </span>
      <div className="min-w-0">
        <p className="text-canvas-body-sm font-medium text-canvas-ink">
          {stage.title}
        </p>
        <p className="mt-0.5 text-canvas-body-sm text-canvas-muted">
          {stage.detail}
        </p>
      </div>
    </div>
  );
}

function StageConnector() {
  return (
    <div
      className="flex shrink-0 items-center justify-center self-stretch text-canvas-muted sm:self-center"
      aria-hidden
    >
      {/* Vertical chevron on mobile, horizontal arrow on sm+ */}
      <AdminActionIcon
        name="chevron-down"
        className="h-4 w-4 sm:hidden"
      />
      <AdminActionIcon
        name="chevron-right"
        className="hidden h-4 w-4 sm:block"
      />
    </div>
  );
}

function PriorityBar({ priority }: { priority: number }) {
  // Lower priority number = spawns earlier = fuller bar.
  const pct = Math.max(8, ((MAX_PRIORITY - priority) / MAX_PRIORITY) * 100);
  return (
    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-canvas-border">
      <div
        className="h-full rounded-full bg-gradient-to-r from-canvas-accent to-amber-500/80 transition-all"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

function PriorityLadder() {
  const rows = [...SPAWN_PRIORITY_TABLE].sort(
    (a, b) => a.priority - b.priority,
  );
  return (
    <section>
      <SectionHeader>Spawn priority — who wins a tie</SectionHeader>
      <p className="mt-1 text-canvas-body-sm text-canvas-muted">
        Lower number spawns first without asking.
      </p>
      <ul className="mt-3 space-y-2">
        {rows.map((row) => (
          <li key={row.kind} className="flex items-center gap-3">
            <span className="w-20 shrink-0 truncate font-mono text-canvas-micro text-canvas-ink">
              {row.kind}
            </span>
            <PriorityBar priority={row.priority} />
            <span className="w-6 shrink-0 text-right font-mono text-canvas-micro tabular-nums text-canvas-muted">
              {row.priority}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function ResolutionOrder() {
  return (
    <section>
      <SectionHeader>Disambiguation order — when intents collide</SectionHeader>
      <p className="mt-1 text-canvas-body-sm text-canvas-muted">
        How competing keyword matches are resolved before priority applies.
      </p>
      <ol className="mt-3 space-y-2">
        {ARTIFACT_INTENT_RESOLUTION_ORDER.map((item) => (
          <li key={item.step} className="flex items-start gap-3">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-canvas-artifactIconBg font-mono text-canvas-micro font-semibold tabular-nums text-canvas-accent">
              {item.step}
            </span>
            <p className="text-canvas-body-sm text-canvas-muted">
              <span className="font-medium text-canvas-ink">{item.label}</span>
              {" — "}
              {item.detail}
            </p>
          </li>
        ))}
      </ol>
    </section>
  );
}

function GlobalRules() {
  return (
    <section>
      <SectionHeader>Global spawn rules</SectionHeader>
      <ul className="mt-3 list-disc space-y-1 pl-4 text-canvas-body-sm text-canvas-muted">
        {ARTIFACT_SPAWN_GLOBAL_RULES.map((rule) => (
          <li key={rule}>{rule}</li>
        ))}
      </ul>
    </section>
  );
}

export function SpawnModelOverview({
  defaultOpen = false,
}: {
  defaultOpen?: boolean;
}): JSX.Element {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <section className="rounded-canvas border border-canvas-border bg-canvas-card shadow-card">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className={`flex w-full items-center justify-between gap-3 px-4 py-4 text-left sm:px-5 ${
          open ? "border-b border-canvas-border" : ""
        }`}
      >
        <div className="min-w-0">
          <h3 className="font-display text-canvas-body font-medium text-canvas-ink">
            How spawning works
          </h3>
          <p className="mt-0.5 text-canvas-body-sm text-canvas-muted">
            What lands on the canvas, and when.
          </p>
        </div>
        <AdminActionIcon
          name={open ? "chevron-up" : "chevron-down"}
          className="h-4 w-4 shrink-0 text-canvas-muted"
        />
      </button>

      {open ? (
        <div className="flex flex-col gap-6 px-4 py-4 sm:px-5">
          <section>
            <SectionHeader>The decision flow</SectionHeader>
            <div className="mt-3 flex flex-col items-stretch gap-2 sm:flex-row sm:items-center">
              {PIPELINE_STAGES.map((stage, index) => (
                <div
                  key={stage.step}
                  className="flex flex-col items-stretch gap-2 sm:flex-1 sm:flex-row sm:items-center"
                >
                  <StageBox stage={stage} />
                  {index < PIPELINE_STAGES.length - 1 ? (
                    <StageConnector />
                  ) : null}
                </div>
              ))}
            </div>
          </section>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <PriorityLadder />
            <ResolutionOrder />
          </div>

          <GlobalRules />
        </div>
      ) : null}
    </section>
  );
}
