"use client";

import { useCallback, useEffect, useState } from "react";
import { GridBackground } from "@/components/canvasBackgrounds/GridBackground";
import { BuiltByWidget } from "@/components/repo-explorer/BuiltByWidget";
import { FileStructureWidget } from "@/components/repo-explorer/FileStructureWidget";
import { MediaWidget } from "@/components/repo-explorer/MediaWidget";
import { OverviewWidget } from "@/components/repo-explorer/OverviewWidget";
import { PreviewWidget } from "@/components/repo-explorer/PreviewWidget";
import { TechDetailsWidget } from "@/components/repo-explorer/TechDetailsWidget";
import { WidgetSkeleton } from "@/components/repo-explorer/WidgetCard";
import { WHAT_IT_IS_LIMITS } from "@/lib/github/overviewCopyLimits";
import type { OverviewAi, RepoExplorerData } from "@/lib/github/types";

const DEFAULT_REPO = "https://github.com/garrytan/gbrain";

function isSummaryThin(ai: OverviewAi | undefined): boolean {
  if (!ai?.whatItIs) return true;
  if (ai.whatItIs.length < WHAT_IT_IS_LIMITS.minChars) return true;
  if (!ai.whoItsFor?.intendedFor || ai.whoItsFor.intendedFor.length < 40) return true;
  return false;
}

async function fetchJson<T>(path: string): Promise<T> {
  const res = await fetch(path, { cache: "no-store" });
  const json = (await res.json()) as T & { error?: string };
  if (!res.ok) {
    throw new Error(json.error ?? "Request failed");
  }
  return json;
}

export function RepoExplorerApp() {
  const [urlInput, setUrlInput] = useState(DEFAULT_REPO);
  const [data, setData] = useState<RepoExplorerData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRepo = useCallback(async (url: string) => {
    setLoading(true);
    setError(null);
    try {
      const bust = `_=${Date.now()}`;
      const explore = await fetchJson<RepoExplorerData>(
        `/api/github/explore?url=${encodeURIComponent(url)}&${bust}`,
      );

      if (isSummaryThin(explore.overview.ai)) {
        const { ai } = await fetchJson<{ ai: OverviewAi }>(
          `/api/github/summary?url=${encodeURIComponent(url)}&${bust}`,
        );
        explore.overview = { ...explore.overview, ai, status: "ready" };
      }

      setData(explore);
    } catch (e) {
      setData(null);
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchRepo(DEFAULT_REPO);
  }, [fetchRepo]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void fetchRepo(urlInput.trim());
  };

  return (
    <div className="relative h-full min-h-screen overflow-hidden bg-canvas-bg font-sans text-canvas-ink">
      <GridBackground viewport={{ x: 0, y: 0, scale: 1 }} />

      <div className="relative z-10 flex h-full min-h-screen flex-col">
        <header className="floating-chrome-padding border-b border-canvas-border/80 bg-canvas-card/90 backdrop-blur-sm">
          <div className="mx-auto flex max-w-6xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-canvas-caption uppercase tracking-wide text-canvas-muted">
                Flowstate · Repository Explorer
              </p>
              <h1 className="text-canvas-heading font-medium text-canvas-ink">
                {loading
                  ? "Loading repository…"
                  : data?.overview.data?.name ?? "Repository Explorer"}
              </h1>
            </div>
            <form onSubmit={handleSubmit} className="flex w-full max-w-md gap-2">
              <input
                type="url"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="https://github.com/owner/repo"
                className="min-w-0 flex-1 rounded-canvas border border-canvas-border bg-canvas-bg px-3 py-2 text-canvas-body-sm text-canvas-ink placeholder:text-canvas-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-canvas-accent/40"
              />
              <button
                type="submit"
                disabled={loading}
                className="shrink-0 rounded-canvas bg-canvas-accent px-4 py-2 text-canvas-body-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                Explore
              </button>
            </form>
          </div>
        </header>

        <main className="floating-chrome-padding mx-auto w-full max-w-6xl flex-1 overflow-y-auto pb-8">
          {error ? (
            <div className="rounded-canvas border border-canvas-dangerBorder bg-canvas-dangerSoft px-4 py-3 text-canvas-body-sm text-canvas-danger">
              {error}
            </div>
          ) : null}

          <div className="grid gap-4 lg:grid-cols-12 lg:grid-rows-[auto_auto_auto]">
            <div className="lg:col-span-7 lg:row-span-2">
              {loading ? (
                <div className="rounded-canvas border border-canvas-border bg-canvas-card p-4 shadow-card">
                  <WidgetSkeleton lines={8} />
                </div>
              ) : (
                <OverviewWidget
                  data={data?.overview.data}
                  ai={data?.overview.ai}
                />
              )}
            </div>

            <div className="lg:col-span-5">
              {loading ? (
                <div className="rounded-canvas border border-canvas-border bg-canvas-card p-4 shadow-card">
                  <WidgetSkeleton lines={5} />
                </div>
              ) : (
                <BuiltByWidget data={data?.builtBy.data} />
              )}
            </div>

            <div className="lg:col-span-5">
              {loading ? (
                <div className="rounded-canvas border border-canvas-border bg-canvas-card p-4 shadow-card">
                  <WidgetSkeleton lines={4} />
                </div>
              ) : (
                <PreviewWidget data={data?.preview.data} />
              )}
            </div>

            <div className="lg:col-span-6">
              {loading ? (
                <div className="rounded-canvas border border-canvas-border bg-canvas-card p-4 shadow-card">
                  <WidgetSkeleton lines={6} />
                </div>
              ) : (
                <FileStructureWidget data={data?.fileStructure.data} />
              )}
            </div>

            {(data?.media.data?.displayableItems?.length ?? 0) > 0 ? (
              <div className="lg:col-span-6">
                {loading ? (
                  <div className="rounded-canvas border border-canvas-border bg-canvas-card p-4 shadow-card">
                    <WidgetSkeleton lines={4} />
                  </div>
                ) : (
                  <MediaWidget data={data?.media.data} />
                )}
              </div>
            ) : null}

            <div className="lg:col-span-12">
              {loading ? (
                <div className="rounded-canvas border border-canvas-border bg-canvas-card p-4 shadow-card">
                  <WidgetSkeleton lines={10} />
                </div>
              ) : (
                <TechDetailsWidget
                  data={data?.techDetails.data}
                  ai={data?.techDetails.ai}
                />
              )}
            </div>
          </div>

          {data?.fetchedAt ? (
            <p className="mt-4 text-center text-canvas-micro text-canvas-muted">
              Fetched {new Date(data.fetchedAt).toLocaleString()} ·{" "}
              <a
                href={data.repoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-canvas-accent hover:underline"
              >
                View on GitHub
              </a>
            </p>
          ) : null}
        </main>
      </div>
    </div>
  );
}
