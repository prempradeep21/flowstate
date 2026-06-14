"use client";

import { m, useReducedMotion } from "framer-motion";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ArtifactPayload } from "@/lib/artifactTypes";
import type { RepoExplorerData, WidgetStatus } from "@/lib/github/types";
import {
  polishWhatItIsCopy,
  WHAT_IT_IS_LIMITS,
  whatItIsLooksLikeRawReadme,
} from "@/lib/github/overviewCopyLimits";
import { findCanvasNodeByArtifactId } from "@/lib/canvasArtifacts";
import { getArtifactBounds } from "@/lib/canvasNodeBounds";
import {
  REPO_ARTIFACT_WIDTH,
  REPO_DRAG_HANDLE_ATTR,
  REPO_HUB,
  REPO_SPOKE_BODY_MAX_HEIGHT,
  REPO_SPOKE_MAX_HEIGHT,
  computeRepoArtifactHeight,
  computeRepoCollapsedSize,
  getRepoSpokeDefinitions,
  positionRepoSpokes,
  REPO_HUB_HOLD_MS,
  REPO_WIDGETS_AFTER_CONNECTORS_MS,
  repoCollapsePositionDelta,
  repoHubForBounds,
  type RepoHubLayout,
  type RepoRevealPhase,
  type RepoSpokeId,
  type RepoSpokeLayout,
} from "@/lib/repoArtifactLayout";
import { dropVariants, sidebarTileEnterVariants } from "@/lib/motion/variants";
import { useCanvasStore } from "@/lib/store";

type RepoPayload = Extract<ArtifactPayload, { type: "repo" }>;

function GitHubLogo({ className = "h-10 w-10" }: { className?: string }) {
  return (
    <svg viewBox="0 0 98 96" className={className} aria-hidden>
      <path
        fill="currentColor"
        fillRule="evenodd"
        clipRule="evenodd"
        d="M48.854 0C21.839 0 0 22 0 49.217c0 21.756 13.993 40.172 33.405 46.69 2.427.49 3.316-1.059 3.316-2.362 0-1.141-.051-5.052-.051-9.08-13.624 2.932-16.66-5.867-16.66-5.867-2.265-5.705-5.532-7.22-5.532-7.22-4.527-3.092.342-3.031.342-3.031 5.012.355 7.652 5.107 7.652 5.107 4.423 7.652 11.606 5.445 14.487 4.165 1.453-3.238 1.74-6.354 1.74-7.653 0-5.833-3.512-7.001-6.847-7.001-4.766 0-7.312 3.587-7.312 7.29 0 1.453.556 3.011 1.25 3.858.128.153.146.287.11.441-.12.498-.39 1.568-.443 1.787-.07.287-.227.348-.523.21-1.953-.907-3.174-3.76-3.174-7.22 0-5.238 3.851-10.047 11.095-10.047 6.531 0 10.887 4.653 10.887 10.47 0 6.853-4.312 12.363-10.305 12.363-2.031 0-3.945-1.049-4.598-2.558 0 0-1.012 3.872-1.258 4.835-.454 1.757-1.676 3.918-2.494 5.247 1.878.566 3.862.872 5.928.872 27.015 0 48.854-21.839 48.854-48.817C97.708 22 75.87 0 48.854 0z"
      />
    </svg>
  );
}

function BoundsGlow({ intensity }: { intensity: "full" | "half" }) {
  const isFull = intensity === "full";
  return (
    <m.div
      className={`pointer-events-none absolute inset-0 rounded-canvas ${
        isFull
          ? "ring-2 ring-canvas-accent/55 shadow-[0_0_0_1px_rgb(var(--canvas-accent)/0.25)]"
          : "ring-1 ring-canvas-accent/30 shadow-[0_0_0_1px_rgb(var(--canvas-accent)/0.12)]"
      }`}
      initial={{ opacity: 0 }}
      animate={{ opacity: isFull ? [0.45, 1, 0.45] : [0.25, 0.55, 0.25] }}
      transition={{
        duration: isFull ? 1.6 : 2,
        repeat: Infinity,
        ease: "easeInOut",
      }}
      aria-hidden
    />
  );
}

function spokeAnchor(spoke: RepoSpokeLayout): { x: number; y: number } {
  const cy = spoke.y + spoke.h / 2;
  return spoke.hubSide === "left"
    ? { x: spoke.x + spoke.w, y: cy }
    : { x: spoke.x, y: cy };
}

function hubAnchor(
  side: RepoSpokeLayout["hubSide"],
  hub: RepoHubLayout,
): { x: number; y: number } {
  return side === "left"
    ? { x: hub.cx - hub.w / 2, y: hub.cy }
    : { x: hub.cx + hub.w / 2, y: hub.cy };
}

function orthogonalPath(
  from: { x: number; y: number },
  to: { x: number; y: number },
): string {
  const midX = (from.x + to.x) / 2;
  return `M ${from.x} ${from.y} L ${midX} ${from.y} L ${midX} ${to.y} L ${to.x} ${to.y}`;
}

function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return String(n);
}

function SpokeSkeleton({ lines = 5 }: { lines?: number }) {
  return (
    <div className="animate-pulse space-y-2 p-0.5">
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="h-2.5 rounded bg-canvas-artifactStage"
          style={{ width: `${68 + (i % 3) * 12}%` }}
        />
      ))}
    </div>
  );
}

function StackRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2 rounded-canvas-sm bg-canvas-artifactStage/70 px-2 py-1.5">
      <span className="mt-0.5 text-canvas-compact" aria-hidden>
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-canvas-micro uppercase tracking-wide text-canvas-muted">{label}</p>
        <p className="text-canvas-body-sm font-medium leading-snug text-canvas-ink">{value}</p>
      </div>
    </div>
  );
}

function StatChip({
  icon,
  label,
  value,
}: {
  icon: string;
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-canvas-sm bg-canvas-artifactStage px-2 py-1.5 text-center">
      <p className="text-canvas-micro" aria-hidden>
        {icon}
      </p>
      <p className="mt-0.5 text-canvas-body-sm font-medium tabular-nums text-canvas-ink">
        {value}
      </p>
      <p className="text-canvas-micro text-canvas-muted">{label}</p>
    </div>
  );
}

function spokeIcon(id: RepoSpokeId): string {
  switch (id) {
    case "overview":
      return "◎";
    case "fileStructure":
      return "▤";
    case "media":
      return "▦";
    case "preview":
      return "↗";
    case "techDetails":
      return "⚙";
    case "builtBy":
      return "◉";
    default:
      return "•";
  }
}

function resolveOverviewText(
  streamingOverview: string,
  explorer: RepoExplorerData,
): string {
  const candidates = [
    streamingOverview,
    explorer.overview.ai?.whatItIs ?? "",
    explorer.overview.data?.description ?? "",
  ];
  for (const raw of candidates) {
    if (!raw?.trim()) continue;
    const polished = polishWhatItIsCopy(raw);
    if (polished && !whatItIsLooksLikeRawReadme(polished)) {
      return polished;
    }
  }
  return "";
}

function spokeStatus(explorer: RepoExplorerData, spokeId: RepoSpokeId): WidgetStatus {
  switch (spokeId) {
    case "overview":
      return explorer.overview.status;
    case "fileStructure":
      return explorer.fileStructure.status;
    case "media":
      return explorer.media.status;
    case "preview":
      return explorer.preview.status;
    case "techDetails":
      return explorer.techDetails.status;
    case "builtBy":
      return explorer.builtBy.status;
    default:
      return "loading";
  }
}

function SpokeBody({
  spokeId,
  explorer,
  streamingOverview,
  loading,
}: {
  spokeId: RepoSpokeId;
  explorer: RepoExplorerData;
  streamingOverview: string;
  loading: boolean;
}) {
  const status = spokeStatus(explorer, spokeId);

  if (
    loading ||
    (status === "loading" && spokeId !== "overview")
  ) {
    return <SpokeSkeleton lines={spokeId === "overview" ? 5 : 4} />;
  }

  if (status === "error") {
    return (
      <p className="text-canvas-body-sm text-canvas-muted">
        Could not load this section. Try expanding the artifact or paste the URL again.
      </p>
    );
  }

  switch (spokeId) {
    case "overview": {
      const text = resolveOverviewText(streamingOverview, explorer);
      if (!text) return <SpokeSkeleton lines={5} />;
      const paragraphs = text.split(/\n\n+/).filter(Boolean);
      const tags = explorer.overview.ai?.tags?.slice(0, 4) ?? [];
      return (
        <div className="space-y-2">
          <div className="space-y-1.5 text-canvas-body-sm leading-relaxed text-canvas-ink">
            {paragraphs.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
          {explorer.overview.ai?.keyFeatures?.length ? (
            <ul className="space-y-1 border-t border-canvas-border/50 pt-2 text-canvas-compact text-canvas-ink">
              {explorer.overview.ai.keyFeatures.slice(0, 3).map((f) => (
                <li key={f} className="flex gap-1.5">
                  <span className="text-canvas-accent">✓</span>
                  <span>{f}</span>
                </li>
              ))}
            </ul>
          ) : null}
          {tags.length ? (
            <div className="flex flex-wrap gap-1">
              {tags.map((t) => (
                <span
                  key={t}
                  className="rounded-full bg-canvas-artifactIconBg px-2 py-0.5 text-canvas-micro text-canvas-accent"
                >
                  {t}
                </span>
              ))}
            </div>
          ) : null}
        </div>
      );
    }
    case "fileStructure": {
      const f = explorer.fileStructure.data;
      if (!f) return <SpokeSkeleton />;
      const top = f.extensionCounts.slice(0, 6);
      const maxCount = top[0]?.count ?? 1;
      return (
        <div className="space-y-2">
          <div className="grid grid-cols-3 gap-1.5">
            <StatChip icon="📄" label="Files" value={f.totalFiles.toLocaleString()} />
            <StatChip icon="📂" label="Folders" value={f.totalFolders.toLocaleString()} />
            <StatChip icon="Σ" label="Entries" value={f.totalEntries.toLocaleString()} />
          </div>
          {top.length ? (
            <ul className="space-y-1">
              {top.map((e) => (
                <li key={e.extension} className="flex items-center gap-2">
                  <span className="w-14 shrink-0 truncate text-canvas-micro font-medium text-canvas-ink">
                    {e.label}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div
                      className="h-1.5 rounded-full bg-canvas-accent/75"
                      style={{
                        width: `${Math.max(10, (e.count / maxCount) * 100)}%`,
                      }}
                    />
                  </div>
                  <span className="w-8 shrink-0 text-right text-canvas-micro tabular-nums text-canvas-muted">
                    {e.count}
                  </span>
                </li>
              ))}
            </ul>
          ) : null}
          {f.topLevelFolders.length ? (
            <div className="flex flex-wrap gap-1">
              {f.topLevelFolders.slice(0, 5).map((d) => (
                <span
                  key={d}
                  className="rounded-canvas-xs bg-canvas-artifactStage px-1.5 py-0.5 font-mono text-canvas-micro text-canvas-muted"
                >
                  {d}/
                </span>
              ))}
            </div>
          ) : null}
        </div>
      );
    }
    case "media": {
      const gallery = explorer.media.data?.displayableItems ?? [];
      if (!gallery.length) return null;
      return (
        <div className="grid grid-cols-2 gap-1.5">
          {gallery.slice(0, 4).map((item) => (
            <a
              key={item.url}
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              data-no-drag
              className="block overflow-hidden rounded-canvas-sm border border-canvas-border bg-canvas-artifactStage"
            >
              <img
                src={item.url}
                alt={item.alt ?? "README screenshot"}
                className="aspect-video w-full object-cover object-top"
              />
            </a>
          ))}
        </div>
      );
    }
    case "preview": {
      const p = explorer.preview.data;
      if (!p) return <SpokeSkeleton />;
      if (!p.previewAvailable || !p.previewUrl) {
        return (
          <div className="space-y-1 text-canvas-body-sm text-canvas-muted">
            <p>No live demo URL detected in README or homepage.</p>
            <p className="text-canvas-compact">Check Tech details for install commands.</p>
          </div>
        );
      }
      return (
        <div className="space-y-2 text-canvas-body-sm">
          <p className="font-medium capitalize text-canvas-ink">
            {(p.previewType ?? "no-preview").replace(/-/g, " ")}
          </p>
          {p.deploymentProvider ? (
            <p className="text-canvas-compact text-canvas-muted">{p.deploymentProvider}</p>
          ) : null}
          <p className="text-canvas-compact text-canvas-muted">
            Confidence {Math.round((p.confidence ?? 0) * 100)}%
          </p>
          <a
            href={p.previewUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex text-canvas-compact text-canvas-accent hover:underline"
            data-no-drag
          >
            Open preview ↗
          </a>
        </div>
      );
    }
    case "techDetails": {
      const t = explorer.techDetails.data;
      if (!t) return <SpokeSkeleton lines={6} />;
      const langs = t.programmingLanguages.slice(0, 4);
      return (
        <div className="space-y-2">
          {explorer.techDetails.ai?.architectureSummary ? (
            <p className="rounded-canvas-sm border border-canvas-border/60 bg-canvas-artifactStage/80 px-2 py-1.5 text-canvas-compact leading-relaxed text-canvas-ink">
              {explorer.techDetails.ai.architectureSummary}
            </p>
          ) : null}
          <div className="space-y-1">
            {t.frontendFramework ? (
              <StackRow icon="🖥" label="Frontend" value={t.frontendFramework} />
            ) : null}
            {t.backendFramework ? (
              <StackRow icon="⚡" label="Backend" value={t.backendFramework} />
            ) : null}
            {t.database ? <StackRow icon="🗄" label="Database" value={t.database} /> : null}
            {t.hostingPlatform ? (
              <StackRow icon="☁" label="Hosting" value={t.hostingPlatform} />
            ) : null}
            {t.aiProviders.length ? (
              <StackRow icon="✦" label="AI" value={t.aiProviders.join(", ")} />
            ) : null}
            {explorer.techDetails.ai?.estimatedSetupTime ? (
              <StackRow
                icon="⏱"
                label="Setup time"
                value={explorer.techDetails.ai.estimatedSetupTime}
              />
            ) : null}
          </div>
          {langs.length ? (
            <div className="flex flex-wrap gap-1">
              {langs.map((l) => (
                <span
                  key={l.name}
                  className="rounded-full bg-canvas-artifactIconBg px-2 py-0.5 text-canvas-micro font-medium text-canvas-accent"
                >
                  {l.name} {Math.round(l.percent)}%
                </span>
              ))}
            </div>
          ) : null}
          {t.dependencies.length ? (
            <div className="rounded-canvas-sm bg-canvas-artifactStage/70 px-2 py-1.5">
              <p className="text-canvas-micro uppercase tracking-wide text-canvas-muted">
                Key dependencies
              </p>
              <p className="mt-0.5 line-clamp-2 text-canvas-compact text-canvas-ink">
                {t.dependencies.slice(0, 8).join(" · ")}
              </p>
            </div>
          ) : null}
          {t.installationCommands.length ? (
            <pre className="overflow-x-auto rounded-canvas-sm bg-canvas-codeBg px-2 py-1.5 font-mono text-canvas-micro text-canvas-ink">
              {t.installationCommands[0]}
            </pre>
          ) : null}
        </div>
      );
    }
    case "builtBy": {
      const b = explorer.builtBy.data;
      if (!b) return <SpokeSkeleton />;
      return (
        <div className="space-y-2.5">
          <div className="flex items-center gap-2.5 rounded-canvas-sm border border-canvas-border/60 bg-canvas-artifactStage/70 p-2">
            <img
              src={b.avatarUrl}
              alt=""
              className="h-12 w-12 shrink-0 rounded-full border-2 border-canvas-border"
            />
            <div className="min-w-0">
              <p className="truncate text-canvas-body-sm font-medium text-canvas-ink">
                {b.name ?? b.login}
              </p>
              <p className="text-canvas-compact text-canvas-muted">@{b.login}</p>
              {b.company ? (
                <p className="truncate text-canvas-micro text-canvas-muted">🏢 {b.company}</p>
              ) : null}
            </div>
          </div>
          {b.bio ? (
            <p className="line-clamp-3 rounded-canvas-sm bg-canvas-artifactStage/50 px-2 py-1.5 text-canvas-body-sm leading-relaxed text-canvas-ink">
              {b.bio}
            </p>
          ) : null}
          <div className="grid grid-cols-3 gap-1.5">
            <StatChip icon="👥" label="Followers" value={formatCount(b.followers)} />
            <StatChip icon="📦" label="Repos" value={b.publicRepos} />
            <StatChip icon="📅" label="Years" value={b.yearsActive} />
          </div>
          <a
            href={b.htmlUrl}
            target="_blank"
            rel="noopener noreferrer"
            data-no-drag
            className="inline-flex items-center gap-1 rounded-canvas-sm bg-canvas-artifactIconBg px-2 py-1 text-canvas-compact font-medium text-canvas-accent hover:underline"
          >
            View on GitHub ↗
          </a>
          {b.topRepos.length ? (
            <ul className="space-y-1 border-t border-canvas-border/50 pt-2">
              {b.topRepos.slice(0, 3).map((r) => (
                <li key={r.htmlUrl}>
                  <a
                    href={r.htmlUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    data-no-drag
                    className="flex items-center justify-between gap-2 rounded-canvas-xs px-1 py-0.5 hover:bg-canvas-artifactStage"
                  >
                    <span className="truncate text-canvas-compact text-canvas-accent">
                      ★ {r.name}
                    </span>
                    <span className="shrink-0 text-canvas-micro tabular-nums text-canvas-muted">
                      {formatCount(r.stars)}
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      );
    }
    default:
      return null;
  }
}

function RepoSpokeCard({
  spoke,
  visible,
  index,
  explorer,
  streamingOverview,
  dataReady,
  onDismiss,
  onHeightChange,
}: {
  spoke: RepoSpokeLayout;
  visible: boolean;
  index: number;
  explorer: RepoExplorerData;
  streamingOverview: string;
  dataReady: boolean;
  onDismiss: () => void;
  onHeightChange: (id: RepoSpokeId, height: number) => void;
}) {
  const reduceMotion = useReducedMotion();
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = cardRef.current;
    if (!el) return;

    const report = () => {
      const next = Math.min(REPO_SPOKE_MAX_HEIGHT, Math.ceil(el.offsetHeight));
      onHeightChange(spoke.id, next);
    };

    report();
    const ro = new ResizeObserver(report);
    ro.observe(el);
    return () => ro.disconnect();
  }, [spoke.id, spoke.y, onHeightChange, explorer, streamingOverview, dataReady]);

  return (
    <m.div
      ref={cardRef}
      data-no-drag
      className="absolute flex max-h-[500px] flex-col overflow-hidden rounded-canvas border border-canvas-border bg-canvas-card shadow-card"
      style={{
        left: spoke.x,
        top: spoke.y,
        width: spoke.w,
        transition: "top 0.22s ease, left 0.22s ease",
      }}
      custom={index}
      variants={sidebarTileEnterVariants}
      initial={reduceMotion ? "reduced" : "initial"}
      animate={visible ? "animate" : "initial"}
    >
      <BoundsGlow intensity="half" />
      <header className="relative z-10 flex shrink-0 items-center gap-2 border-b border-canvas-border px-3 py-2">
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-canvas-artifactIconBg text-canvas-compact text-canvas-accent">
          {spokeIcon(spoke.id)}
        </span>
        <h3 className="min-w-0 flex-1 truncate text-canvas-body-sm font-medium text-canvas-ink">
          {spoke.title}
        </h3>
        <button
          type="button"
          data-no-drag
          aria-label={`Hide ${spoke.title}`}
          onClick={onDismiss}
          className="rounded-canvas-xs px-1 text-canvas-muted hover:bg-canvas-artifactStage hover:text-canvas-ink"
        >
          ×
        </button>
      </header>
      <m.div
        data-canvas-scroll
        className="artifact-content-body relative z-10 overflow-y-auto p-3"
        style={{ maxHeight: REPO_SPOKE_BODY_MAX_HEIGHT }}
        initial={{ opacity: 0 }}
        animate={{
          opacity:
            visible && (dataReady || spoke.id === "overview")
              ? 1
              : 0.35,
        }}
        transition={{ duration: 0.35, delay: visible ? 0.12 + index * 0.05 : 0 }}
      >
        <SpokeBody
          spokeId={spoke.id}
          explorer={explorer}
          streamingOverview={streamingOverview}
          loading={!dataReady && spoke.id !== "overview"}
        />
      </m.div>
    </m.div>
  );
}

async function readStreamText(res: Response): Promise<string> {
  if (!res.body) return "";
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let acc = "";
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    acc += decoder.decode(value, { stream: true });
  }
  return acc;
}

function useRepoEnrichment(
  artifactId: string | undefined,
  repoUrl: string,
  explorer: RepoExplorerData,
) {
  const patchRepoArtifactExplorer = useCanvasStore((s) => s.patchRepoArtifactExplorer);
  const [streamingOverview, setStreamingOverview] = useState(
    () => explorer.overview.ai?.whatItIs ?? "",
  );
  const [dataReady, setDataReady] = useState(
    () => explorer.enrichmentStatus === "complete",
  );
  const startedRef = useRef(false);

  useEffect(() => {
    if (!artifactId || startedRef.current) return;
    if (explorer.enrichmentStatus === "complete") {
      setDataReady(true);
      return;
    }
    startedRef.current = true;

    const bust = `_=${Date.now()}`;
    const exploreUrl = `/api/github/explore?url=${encodeURIComponent(repoUrl)}&${bust}`;
    const streamUrl = `/api/github/summary/stream?url=${encodeURIComponent(repoUrl)}&${bust}`;
    const summaryUrl = `/api/github/summary?url=${encodeURIComponent(repoUrl)}&${bust}`;

    let streamAcc = "";

    const streamTask = (async () => {
      try {
        const res = await fetch(streamUrl, { cache: "no-store" });
        if (!res.ok) return;
        streamAcc = await readStreamText(res);
        const streamed = polishWhatItIsCopy(streamAcc.trim());
        if (streamed && !whatItIsLooksLikeRawReadme(streamed)) {
          setStreamingOverview(streamed);
        }
      } catch {
        /* optional stream */
      }
    })();

    void (async () => {
      try {
        const res = await fetch(exploreUrl, { cache: "no-store" });
        if (!res.ok) throw new Error("explore failed");
        const data = (await res.json()) as RepoExplorerData;

        await streamTask;
        const streamed = polishWhatItIsCopy(streamAcc.trim());
        if (
          streamed &&
          !whatItIsLooksLikeRawReadme(streamed) &&
          data.overview?.ai
        ) {
          data.overview = {
            ...data.overview,
            status: "ready",
            ai: { ...data.overview.ai, whatItIs: streamed },
          };
          setStreamingOverview(streamed);
        } else if (
          data.overview.ai?.whatItIs &&
          data.overview.ai.whatItIs.length >= WHAT_IT_IS_LIMITS.minChars
        ) {
          setStreamingOverview(polishWhatItIsCopy(data.overview.ai.whatItIs));
        }

        const summaryThin =
          !data.overview.ai?.whatItIs ||
          data.overview.ai.whatItIs.length < WHAT_IT_IS_LIMITS.minChars;

        if (summaryThin) {
          try {
            const sumRes = await fetch(summaryUrl, { cache: "no-store" });
            if (sumRes.ok) {
              const { ai } = (await sumRes.json()) as {
                ai: NonNullable<RepoExplorerData["overview"]["ai"]>;
              };
              if (ai) {
                data.overview = { ...data.overview, ai, status: "ready" };
                if (ai.whatItIs) {
                  setStreamingOverview(polishWhatItIsCopy(ai.whatItIs));
                }
              }
            }
          } catch {
            /* keep explore overview */
          }
        } else if (streamed && !data.overview.ai) {
          setStreamingOverview(streamed);
        }

        patchRepoArtifactExplorer(artifactId, {
          ...data,
          enrichmentStatus: "complete",
        });
        setDataReady(true);
      } catch {
        patchRepoArtifactExplorer(artifactId, {
          enrichmentStatus: "error",
          overview: { status: "error" },
          media: { status: "error" },
          preview: { status: "error" },
          techDetails: { status: "error" },
          builtBy: { status: "error" },
          fileStructure: { status: "error" },
        });
      }
    })();
  }, [artifactId, explorer.enrichmentStatus, patchRepoArtifactExplorer, repoUrl]);

  return { streamingOverview, dataReady };
}

export function RepoArtifactContent({
  payload,
  fill = false,
  artifactId,
}: {
  payload: RepoPayload;
  fill?: boolean;
  sidebar?: boolean;
  artifactId?: string;
}) {
  const reduceMotion = useReducedMotion();
  const { repoUrl, displayTitle, explorer } = payload.data;
  const title =
    explorer.overview.data?.name ??
    explorer.overview.data?.fullName ??
    displayTitle;

  const [phase, setPhase] = useState<RepoRevealPhase>("hub");
  const [collapsed, setCollapsed] = useState(false);
  const [hiddenSpokes, setHiddenSpokes] = useState<Set<RepoSpokeId>>(() => new Set());
  const [spokeHeights, setSpokeHeights] = useState<Partial<Record<RepoSpokeId, number>>>({});
  const hubRef = useRef<HTMLDivElement>(null);
  const [hubSize, setHubSize] = useState<{ w: number; h: number } | null>(null);
  const { streamingOverview, dataReady } = useRepoEnrichment(
    artifactId,
    repoUrl,
    explorer,
  );

  useEffect(() => {
    if (reduceMotion) {
      setPhase("widgets");
      return;
    }
    const t1 = window.setTimeout(() => setPhase("connectors"), REPO_HUB_HOLD_MS);
    const t2 = window.setTimeout(
      () => setPhase("widgets"),
      REPO_HUB_HOLD_MS + REPO_WIDGETS_AFTER_CONNECTORS_MS,
    );
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, [reduceMotion]);

  useEffect(() => {
    const el = hubRef.current;
    if (!el) return;
    const sync = () => {
      const w = Math.round(el.offsetWidth);
      const h = Math.round(el.offsetHeight);
      setHubSize((prev) => (prev?.w === w && prev?.h === h ? prev : { w, h }));
    };
    sync();
    const ro = new ResizeObserver(sync);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const hasDisplayableMedia =
    (explorer.media.data?.displayableItems?.length ?? 0) > 0;

  const spokeDefinitions = useMemo(
    () => getRepoSpokeDefinitions(hasDisplayableMedia),
    [hasDisplayableMedia],
  );

  const visibleSpokes = useMemo(
    () =>
      positionRepoSpokes(
        spokeDefinitions.filter((s) => !hiddenSpokes.has(s.id)),
        spokeHeights,
      ),
    [hiddenSpokes, spokeDefinitions, spokeHeights],
  );

  const handleSpokeHeightChange = useCallback((id: RepoSpokeId, height: number) => {
    setSpokeHeights((prev) => (prev[id] === height ? prev : { ...prev, [id]: height }));
  }, []);

  const dismissSpoke = useCallback((id: RepoSpokeId) => {
    setHiddenSpokes((prev) => new Set(prev).add(id));
  }, []);

  const toggleCollapsed = useCallback(() => {
    setCollapsed((prev) => !prev);
  }, []);

  const hubDimensions = hubSize ?? { w: REPO_HUB.w, h: REPO_HUB.h };
  const collapsedSize = useMemo(
    () => computeRepoCollapsedSize(hubDimensions.w, hubDimensions.h),
    [hubDimensions.h, hubDimensions.w],
  );

  const layoutW = collapsed ? collapsedSize.w : REPO_ARTIFACT_WIDTH;
  const activeDefinitions = useMemo(
    () => spokeDefinitions.filter((s) => !hiddenSpokes.has(s.id)),
    [hiddenSpokes, spokeDefinitions],
  );

  const expandedH = useMemo(
    () => computeRepoArtifactHeight(activeDefinitions, spokeHeights),
    [activeDefinitions, spokeHeights],
  );
  const layoutH = collapsed ? collapsedSize.h : expandedH;
  const hub = useMemo(
    () => {
      const base = repoHubForBounds(layoutW, layoutH, collapsed);
      return { ...base, w: hubDimensions.w, h: hubDimensions.h };
    },
    [collapsed, hubDimensions.h, hubDimensions.w, layoutH, layoutW],
  );

  useEffect(() => {
    if (!fill || !artifactId) return;
    const st = useCanvasStore.getState();
    const node = findCanvasNodeByArtifactId(st.canvasArtifactNodes, artifactId);
    if (!node) return;

    const art = st.sessionArtifacts[artifactId];
    const bounds = getArtifactBounds(node, art);
    const { dx, dy } = repoCollapsePositionDelta(
      collapsed,
      bounds.w,
      bounds.h,
      expandedH,
      collapsedSize.w,
      collapsedSize.h,
    );
    if (dx !== 0 || dy !== 0) {
      st.moveCanvasArtifact(node.id, dx, dy);
    }
    st.setCanvasArtifactSize(
      node.id,
      collapsed
        ? { w: collapsedSize.w, h: collapsedSize.h }
        : { w: REPO_ARTIFACT_WIDTH, h: expandedH },
    );
  }, [artifactId, collapsed, collapsedSize.h, collapsedSize.w, expandedH, fill]);

  const connectors = useMemo(
    () =>
      visibleSpokes.map((spoke) => {
        const from = hubAnchor(spoke.hubSide, hub);
        const to = spokeAnchor(spoke);
        return { id: spoke.id, d: orthogonalPath(from, to) };
      }),
    [hub, visibleSpokes],
  );

  const spokesRevealed = phase === "widgets" || Boolean(reduceMotion);
  const showConnectors = (phase !== "hub" || Boolean(reduceMotion)) && !collapsed;
  const showWidgets = spokesRevealed && !collapsed;

  return (
    <div
      className="artifact-content-stage relative"
      style={{
        width: fill ? "100%" : layoutW,
        height: layoutH,
        minWidth: layoutW,
        minHeight: layoutH,
      }}
    >
      <svg
        className="pointer-events-none absolute inset-0 h-full w-full overflow-visible"
        aria-hidden
      >
        {showConnectors
          ? connectors.map((c, i) => (
              <m.path
                key={c.id}
                d={c.d}
                fill="none"
                stroke="rgb(var(--canvas-ink))"
                strokeWidth={1.5}
                strokeLinecap="round"
                initial={
                  reduceMotion ? { pathLength: 1, opacity: 0.85 } : { pathLength: 0, opacity: 0 }
                }
                animate={{ pathLength: 1, opacity: 0.85 }}
                transition={{
                  delay: reduceMotion ? 0 : i * 0.07,
                  duration: 0.48,
                  ease: [0.16, 1, 0.3, 1],
                }}
              />
            ))
          : null}
        {showConnectors
          ? connectors.map((c) => {
              const spoke = visibleSpokes.find((s) => s.id === c.id)!;
              const from = hubAnchor(spoke.hubSide, hub);
              const to = spokeAnchor(spoke);
              return (
                <g key={`${c.id}-dots`}>
                  <circle cx={from.x} cy={from.y} r={4} fill="rgb(var(--canvas-ink))" />
                  <circle cx={to.x} cy={to.y} r={4} fill="rgb(var(--canvas-ink))" />
                </g>
              );
            })
          : null}
      </svg>

      <m.div
        ref={hubRef}
        {...{ [REPO_DRAG_HANDLE_ATTR]: "" }}
        className="absolute z-20 flex flex-col items-center overflow-hidden rounded-canvas border border-canvas-border bg-canvas-card text-center shadow-card"
        style={{
          left: hub.cx - hub.w / 2,
          top: hub.cy - hub.h / 2,
          width: hub.w,
          height: hub.h,
        }}
        variants={dropVariants}
        initial="initial"
        animate="animate"
      >
        <BoundsGlow intensity="full" />
        <div
          className="relative z-10 flex w-full shrink-0 cursor-grab items-center justify-center gap-1.5 border-b border-canvas-border/40 bg-canvas-artifactStage/50 py-1 active:cursor-grabbing"
          title="Drag here to move"
        >
          <span className="text-canvas-micro tracking-widest text-canvas-muted/80" aria-hidden>
            ⋮⋮
          </span>
          <span className="text-canvas-micro font-medium text-canvas-muted/90">Drag</span>
        </div>
        <div className="artifact-content-body relative z-10 flex min-h-0 w-full flex-1 cursor-grab flex-col items-center justify-center px-3 pt-2 active:cursor-grabbing">
          <a
            href={repoUrl}
            target="_blank"
            rel="noopener noreferrer"
            data-no-drag
            className="flex flex-col items-center rounded-canvas-sm px-2 py-1 transition-colors hover:bg-canvas-artifactStage/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-canvas-accent/40"
          >
            <GitHubLogo className="h-9 w-9 text-canvas-ink" />
            <p className="mt-1.5 line-clamp-2 text-canvas-body-sm font-medium leading-snug text-canvas-accent hover:underline">
              {title}
            </p>
          </a>
          {explorer.overview.data ? (
            <p className="mt-1 text-canvas-compact tabular-nums text-canvas-muted">
              ★ {explorer.overview.data.stars.toLocaleString()} ·{" "}
              {explorer.overview.data.forks.toLocaleString()} forks
            </p>
          ) : phase === "hub" && !dataReady ? (
            <m.p
              className="mt-2 text-canvas-compact text-canvas-muted"
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 1.2, repeat: Infinity }}
            >
              Fetching repository…
            </m.p>
          ) : null}
        </div>
        {(spokesRevealed || collapsed) && explorer.overview.data ? (
          <button
            type="button"
            data-no-drag
            aria-expanded={!collapsed}
            aria-label={collapsed ? "Open all branch widgets" : "Collapse all branch widgets"}
            onClick={toggleCollapsed}
            className="relative z-10 mb-2.5 rounded-canvas-xs border border-canvas-border/25 bg-canvas-card/30 px-2.5 py-0.5 text-canvas-micro font-medium text-canvas-muted/75 backdrop-blur-[2px] transition-colors hover:border-canvas-border/50 hover:bg-canvas-artifactStage/50 hover:text-canvas-ink"
          >
            {collapsed ? "Open all" : "Collapse all"}
          </button>
        ) : null}
      </m.div>

      {!collapsed
        ? visibleSpokes.map((spoke, index) => (
            <RepoSpokeCard
              key={spoke.id}
              spoke={spoke}
              visible={showWidgets}
              index={index}
              explorer={explorer}
              streamingOverview={streamingOverview}
              dataReady={dataReady}
              onDismiss={() => dismissSpoke(spoke.id)}
              onHeightChange={handleSpokeHeightChange}
            />
          ))
        : null}
    </div>
  );
}
