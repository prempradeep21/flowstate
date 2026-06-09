"use client";

import { m, useReducedMotion } from "framer-motion";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ArtifactPayload } from "@/lib/artifactTypes";
import type { RepoExplorerData, WidgetStatus } from "@/lib/github/types";
import { WHAT_IT_IS_LIMITS } from "@/lib/github/overviewCopyLimits";
import {
  REPO_ARTIFACT_HEIGHT,
  REPO_ARTIFACT_WIDTH,
  REPO_HUB,
  REPO_HUB_HOLD_MS,
  REPO_SPOKES,
  REPO_WIDGETS_AFTER_CONNECTORS_MS,
  type RepoRevealPhase,
  type RepoSpokeId,
  type RepoSpokeLayout,
} from "@/lib/repoArtifactLayout";
import {
  ARTIFACT_CANVAS_CASING_DEFAULT,
  ARTIFACT_CANVAS_CHROME_OPACITY,
  ARTIFACT_CANVAS_SURFACE_FILL,
} from "@/lib/artifactCanvasChrome";
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

function BoundsGlow({
  intensity,
  canvasChrome = false,
}: {
  intensity: "full" | "half";
  canvasChrome?: boolean;
}) {
  const isFull = intensity === "full";
  return (
    <m.div
      className={`pointer-events-none absolute inset-0 rounded-canvas ${
        canvasChrome ? ARTIFACT_CANVAS_CHROME_OPACITY : ""
      } ${
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

function hubAnchor(side: RepoSpokeLayout["hubSide"]): { x: number; y: number } {
  return side === "left"
    ? { x: REPO_HUB.cx - REPO_HUB.w / 2, y: REPO_HUB.cy }
    : { x: REPO_HUB.cx + REPO_HUB.w / 2, y: REPO_HUB.cy };
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

function LabelRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-t border-canvas-border/60 pt-2 first:border-t-0 first:pt-0">
      <p className="text-canvas-caption font-medium uppercase tracking-wide text-canvas-muted">
        {label}
      </p>
      <p className="mt-0.5 text-canvas-body-sm leading-relaxed text-canvas-ink">{value}</p>
    </div>
  );
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
  const slot = explorer[spokeId === "techDetails" ? "techDetails" : spokeId];
  const status: WidgetStatus = slot?.status ?? "loading";

  if (loading || (status === "loading" && spokeId !== "overview")) {
    return <SpokeSkeleton lines={spokeId === "overview" ? 7 : 5} />;
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
      const text =
        streamingOverview ||
        explorer.overview.ai?.whatItIs ||
        explorer.overview.data?.description ||
        "";
      const audience = explorer.overview.ai?.whoItsFor;
      if (!text && !audience?.intendedFor) return <SpokeSkeleton lines={7} />;
      const paragraphs = text.split(/\n\n+/).filter(Boolean);
      const tags = explorer.overview.ai?.tags?.slice(0, 6) ?? [];
      return (
        <div className="space-y-3">
          {paragraphs.length ? (
            <div className="space-y-2 text-canvas-body-sm leading-relaxed text-canvas-ink">
              {paragraphs.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
          ) : null}
          {audience?.intendedFor ? (
            <div className="space-y-0 rounded-canvas-sm bg-canvas-artifactStage/80 p-2.5">
              <LabelRow label="Intended for" value={audience.intendedFor} />
              {audience.whoShouldUse ? (
                <LabelRow label="Who should use it" value={audience.whoShouldUse} />
              ) : null}
              {audience.whoItHelps ? (
                <LabelRow label="Who it helps" value={audience.whoItHelps} />
              ) : null}
            </div>
          ) : null}
          {explorer.overview.ai?.keyFeatures?.length ? (
            <ul className="space-y-1 text-canvas-body-sm text-canvas-ink">
              {explorer.overview.ai.keyFeatures.map((f) => (
                <li key={f} className="flex gap-2">
                  <span className="text-canvas-accent">•</span>
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
                  className="rounded-full bg-canvas-artifactIconBg px-2 py-0.5 text-canvas-compact text-canvas-accent"
                >
                  {t}
                </span>
              ))}
            </div>
          ) : null}
        </div>
      );
    }
    case "media": {
      const media = explorer.media.data;
      if (!media) return <SpokeSkeleton />;
      const thumbs = media.items.filter((i) => i.kind === "image").slice(0, 3);
      return (
        <div className="space-y-2 text-canvas-body-sm text-canvas-ink">
          <p>
            {media.screenshotCount} screenshots · {media.videoCount} videos ·{" "}
            {media.architectureDiagramCount} diagrams
          </p>
          {media.primaryDemoVideo ? (
            <p className="text-canvas-compact text-canvas-muted">
              Demo video detected in README
            </p>
          ) : null}
          {thumbs.length ? (
            <div className="flex flex-wrap gap-1.5">
              {thumbs.map((item) => (
                <img
                  key={item.url}
                  src={item.thumb ?? item.url}
                  alt={item.alt ?? ""}
                  className="h-14 w-20 rounded-canvas-sm border border-canvas-border object-cover"
                />
              ))}
            </div>
          ) : (
            <p className="text-canvas-compact text-canvas-muted">No media in README.</p>
          )}
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
      const langs = t.programmingLanguages.slice(0, 5);
      return (
        <div className="space-y-2 text-canvas-body-sm text-canvas-ink">
          {t.frontendFramework ? <p>Frontend: {t.frontendFramework}</p> : null}
          {t.backendFramework ? <p>Backend: {t.backendFramework}</p> : null}
          {t.database ? <p>Database: {t.database}</p> : null}
          {t.hostingPlatform ? <p>Hosting: {t.hostingPlatform}</p> : null}
          {t.aiProviders.length ? <p>AI: {t.aiProviders.join(", ")}</p> : null}
          {langs.length ? (
            <p className="text-canvas-compact text-canvas-muted">
              {langs.map((l) => `${l.name} ${Math.round(l.percent)}%`).join(" · ")}
            </p>
          ) : null}
          {t.dependencies.length ? (
            <p className="line-clamp-2 text-canvas-compact text-canvas-muted">
              Key deps: {t.dependencies.slice(0, 8).join(", ")}
            </p>
          ) : null}
          {t.installationCommands.length ? (
            <p className="line-clamp-2 font-mono text-canvas-compact text-canvas-muted">
              {t.installationCommands[0]}
            </p>
          ) : null}
          {explorer.techDetails.ai?.architectureSummary ? (
            <p className="line-clamp-4 text-canvas-compact leading-relaxed text-canvas-muted">
              {explorer.techDetails.ai.architectureSummary}
            </p>
          ) : null}
          {explorer.techDetails.ai?.estimatedSetupTime ? (
            <p className="text-canvas-compact text-canvas-muted">
              Setup: {explorer.techDetails.ai.estimatedSetupTime}
            </p>
          ) : null}
        </div>
      );
    }
    case "builtBy": {
      const b = explorer.builtBy.data;
      if (!b) return <SpokeSkeleton />;
      return (
        <div className="space-y-2">
          <div className="flex items-center gap-2.5">
            <img
              src={b.avatarUrl}
              alt=""
              className="h-11 w-11 rounded-full border border-canvas-border"
            />
            <div className="min-w-0">
              <p className="truncate text-canvas-body-sm font-medium text-canvas-ink">
                {b.name ?? b.login}
              </p>
              <p className="text-canvas-compact text-canvas-muted">@{b.login}</p>
            </div>
          </div>
          {b.bio ? (
            <p className="line-clamp-3 text-canvas-body-sm leading-relaxed text-canvas-muted">
              {b.bio}
            </p>
          ) : null}
          <p className="text-canvas-compact text-canvas-muted">
            {formatCount(b.followers)} followers · {b.publicRepos} public repos ·{" "}
            {b.yearsActive}y on GitHub
          </p>
          {b.company ? (
            <p className="text-canvas-compact text-canvas-muted">{b.company}</p>
          ) : null}
          {b.topRepos.length ? (
            <ul className="space-y-1 text-canvas-compact text-canvas-muted">
              {b.topRepos.slice(0, 3).map((r) => (
                <li key={r.htmlUrl} className="truncate">
                  ★ {formatCount(r.stars)} {r.name}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      );
    }
    case "fileStructure": {
      const f = explorer.fileStructure.data;
      if (!f) return <SpokeSkeleton />;
      const top = f.extensionCounts.slice(0, 8);
      return (
        <div className="space-y-2 text-canvas-body-sm text-canvas-ink">
          <p>
            {f.totalFiles.toLocaleString()} files · {f.totalFolders.toLocaleString()} folders
            {f.truncated ? " (partial tree)" : ""}
          </p>
          {top.length ? (
            <ul className="space-y-1">
              {top.map((e) => (
                <li key={e.extension} className="flex justify-between gap-2 text-canvas-compact">
                  <span>{e.label}</span>
                  <span className="tabular-nums text-canvas-muted">{e.count}</span>
                </li>
              ))}
            </ul>
          ) : null}
          {f.topLevelFolders.length ? (
            <p className="line-clamp-2 font-mono text-canvas-compact text-canvas-muted">
              {f.topLevelFolders.slice(0, 6).map((d) => `${d}/`).join(" ")}
            </p>
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
  canvasChrome = false,
}: {
  spoke: RepoSpokeLayout;
  visible: boolean;
  index: number;
  explorer: RepoExplorerData;
  streamingOverview: string;
  dataReady: boolean;
  onDismiss: () => void;
  canvasChrome?: boolean;
}) {
  const reduceMotion = useReducedMotion();

  return (
    <m.div
      className={`absolute flex flex-col overflow-hidden rounded-canvas border bg-canvas-card ${ARTIFACT_CANVAS_SURFACE_FILL} ${
        canvasChrome
          ? ARTIFACT_CANVAS_CASING_DEFAULT
          : "border-canvas-border shadow-card"
      }`}
      style={{ left: spoke.x, top: spoke.y, width: spoke.w, height: spoke.h }}
      custom={index}
      variants={sidebarTileEnterVariants}
      initial={reduceMotion ? "reduced" : "initial"}
      animate={visible ? "animate" : "initial"}
    >
      <BoundsGlow intensity="half" canvasChrome={canvasChrome} />
      <header className="relative z-10 flex shrink-0 items-center gap-2 border-b border-canvas-border px-3 py-2">
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-canvas-artifactIconBg text-canvas-compact text-canvas-accent">
          ?
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
        className="relative z-10 min-h-0 flex-1 overflow-y-auto p-3"
        initial={{ opacity: 0 }}
        animate={{ opacity: visible && (dataReady || spoke.id === "overview") ? 1 : 0.35 }}
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
        if (streamAcc.trim()) setStreamingOverview(streamAcc);
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
        const streamed = streamAcc.trim();
        if (streamed && data.overview) {
          const ai = data.overview.ai;
          data.overview = {
            ...data.overview,
            status: "ready",
            ai: ai
              ? { ...ai, whatItIs: streamed }
              : {
                  category: "Open Source",
                  tags: [],
                  whatItIs: streamed,
                  whoItsFor: {
                    intendedFor: "",
                    whoShouldUse: "",
                    whoItHelps: "",
                  },
                  keyFeatures: [],
                },
          };
          setStreamingOverview(streamed);
        } else if (
          data.overview.ai?.whatItIs &&
          data.overview.ai.whatItIs.length >= WHAT_IT_IS_LIMITS.minChars
        ) {
          setStreamingOverview(data.overview.ai.whatItIs);
        } else {
          try {
            const sumRes = await fetch(summaryUrl, { cache: "no-store" });
            if (sumRes.ok) {
              const { ai } = (await sumRes.json()) as {
                ai: NonNullable<RepoExplorerData["overview"]["ai"]>;
              };
              if (ai?.whatItIs) {
                data.overview = { ...data.overview, ai, status: "ready" };
                setStreamingOverview(ai.whatItIs);
              }
            }
          } catch {
            /* keep explore overview */
          }
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
  const [hiddenSpokes, setHiddenSpokes] = useState<Set<RepoSpokeId>>(() => new Set());
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

  const visibleSpokes = useMemo(
    () => REPO_SPOKES.filter((s) => !hiddenSpokes.has(s.id)),
    [hiddenSpokes],
  );

  const dismissSpoke = useCallback((id: RepoSpokeId) => {
    setHiddenSpokes((prev) => new Set(prev).add(id));
  }, []);

  const connectors = useMemo(
    () =>
      visibleSpokes.map((spoke) => {
        const from = hubAnchor(spoke.hubSide);
        const to = spokeAnchor(spoke);
        return { id: spoke.id, d: orthogonalPath(from, to) };
      }),
    [visibleSpokes],
  );

  const showConnectors = phase !== "hub" || Boolean(reduceMotion);
  const showWidgets = phase === "widgets" || Boolean(reduceMotion);

  return (
    <div
      className={`relative ${fill ? "h-full w-full" : ""}`}
      style={{
        width: fill ? "100%" : REPO_ARTIFACT_WIDTH,
        height: fill ? "100%" : REPO_ARTIFACT_HEIGHT,
        minWidth: REPO_ARTIFACT_WIDTH,
        minHeight: REPO_ARTIFACT_HEIGHT,
      }}
      data-no-drag
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
              const from = hubAnchor(spoke.hubSide);
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

      <m.a
        href={repoUrl}
        target="_blank"
        rel="noopener noreferrer"
        data-no-drag
        className={`absolute z-20 flex flex-col items-center justify-center overflow-hidden rounded-canvas border bg-canvas-card ${ARTIFACT_CANVAS_SURFACE_FILL} px-4 py-5 text-center transition-shadow hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-canvas-accent/40 ${
          fill
            ? ARTIFACT_CANVAS_CASING_DEFAULT
            : "border-canvas-border shadow-card"
        }`}
        style={{
          left: REPO_HUB.cx - REPO_HUB.w / 2,
          top: REPO_HUB.cy - REPO_HUB.h / 2,
          width: REPO_HUB.w,
          height: REPO_HUB.h,
        }}
        variants={dropVariants}
        initial="initial"
        animate="animate"
      >
        <BoundsGlow intensity="full" canvasChrome={fill} />
        <div className="relative z-10 flex flex-col items-center">
          <GitHubLogo className="h-10 w-10 text-canvas-ink" />
          <p className="mt-2 line-clamp-3 text-canvas-body-sm font-medium leading-snug text-canvas-ink">
            {title}
          </p>
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
      </m.a>

      {visibleSpokes.map((spoke, index) => (
        <RepoSpokeCard
          key={spoke.id}
          spoke={spoke}
          visible={showWidgets}
          index={index}
          explorer={explorer}
          streamingOverview={streamingOverview}
          dataReady={dataReady}
          onDismiss={() => dismissSpoke(spoke.id)}
          canvasChrome={fill}
        />
      ))}
    </div>
  );
}
