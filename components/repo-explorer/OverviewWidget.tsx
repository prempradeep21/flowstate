"use client";

import type { ReactNode } from "react";
import type { OverviewAi, OverviewData } from "@/lib/github/types";
import { WHAT_IT_IS_LIMITS } from "@/lib/github/overviewCopyLimits";
import { StatPill, TagChip, WidgetCard, WidgetSkeleton } from "@/components/repo-explorer/WidgetCard";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return String(n);
}

function ProseBlock({ text }: { text: string }) {
  const paragraphs = text.split(/\n\n+/).filter((p) => p.trim().length > 0);
  return (
    <div className="mt-2 space-y-3">
      {paragraphs.map((p, i) => (
        <p key={i} className="text-canvas-body leading-relaxed text-canvas-ink">
          {p.trim()}
        </p>
      ))}
    </div>
  );
}

function SummarySection({
  label,
  children,
  prominent = false,
}: {
  label: string;
  children: ReactNode;
  prominent?: boolean;
}) {
  return (
    <div
      className={`rounded-canvas-sm border border-canvas-border bg-canvas-artifactStage px-4 py-3 ${
        prominent ? "border-canvas-accent/25 ring-1 ring-canvas-accent/10" : ""
      }`}
    >
      <p className="text-canvas-caption font-medium uppercase tracking-wide text-canvas-muted">
        {label}
      </p>
      {children}
    </div>
  );
}

export function OverviewWidget({
  data,
  ai,
}: {
  data?: OverviewData;
  ai?: OverviewAi;
}) {
  if (!data) return null;

  const hasSummary = Boolean(ai?.whatItIs && ai.whatItIs.length >= WHAT_IT_IS_LIMITS.minChars);

  return (
    <WidgetCard title="Overview" subtitle={data.fullName}>
      <div className="space-y-4">
        <SummarySection label="Overview" prominent>
          {hasSummary ? (
            <ProseBlock text={ai!.whatItIs} />
          ) : (
            <div className="mt-2">
              <WidgetSkeleton lines={6} />
            </div>
          )}
        </SummarySection>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-canvas-caption uppercase tracking-wide text-canvas-muted">
            Category
          </span>
          <span className="text-canvas-body-sm font-medium text-canvas-accent">
            {ai?.category ?? "Open Source"}
          </span>
          {ai?.tags?.map((t) => <TagChip key={t} label={t} />)}
        </div>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <StatPill label="Stars" value={formatCount(data.stars)} />
          <StatPill label="Forks" value={formatCount(data.forks)} />
          <StatPill label="Issues" value={formatCount(data.openIssues)} />
          <StatPill label="Language" value={data.primaryLanguage ?? "—"} />
        </div>

        <div className="grid grid-cols-2 gap-2 text-canvas-compact text-canvas-muted">
          <span>Created {formatDate(data.createdAt)}</span>
          <span>Updated {formatDate(data.updatedAt)}</span>
          <span>License {data.license ?? "None"}</span>
          <span>Size {(data.sizeKb / 1024).toFixed(1)} MB</span>
        </div>

        {ai?.keyFeatures?.length ? (
          <div>
            <div className="mb-2 text-canvas-caption uppercase tracking-wide text-canvas-muted">
              Key features
            </div>
            <ul className="space-y-1.5 text-canvas-body-sm text-canvas-ink">
              {ai.keyFeatures.map((f) => (
                <li key={f} className="flex gap-2">
                  <span className="text-canvas-accent">•</span>
                  <span>{f}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </WidgetCard>
  );
}
