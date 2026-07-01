"use client";

import { useCallback, useEffect, useState } from "react";
import { AdminActionIcon } from "@/app/admin/icons/AdminIcons";

type BetaSuggestion = {
  id: string;
  user_id: string | null;
  user_email: string;
  page_url: string | null;
  message: string;
  image_urls: string[];
  created_at: string;
};

function formatWhen(iso: string): string {
  try {
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export function BetaSuggestionsInbox() {
  const [suggestions, setSuggestions] = useState<BetaSuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/beta-suggestions");
      const data = (await res.json()) as {
        suggestions?: BetaSuggestion[];
        error?: string;
      };
      if (!res.ok) {
        throw new Error(data.error ?? `HTTP ${res.status}`);
      }
      setSuggestions(data.suggestions ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load suggestions");
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="p-4 sm:p-6">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6 flex flex-wrap items-center justify-end gap-3 border-b border-canvas-border pb-4">
          <button
            type="button"
            onClick={() => void load()}
            disabled={loading}
            className="inline-flex items-center gap-1.5 rounded-canvas border border-canvas-border bg-canvas-card px-3 py-2 text-canvas-body-sm font-medium text-canvas-ink transition-colors hover:bg-canvas-bg disabled:opacity-50"
          >
            <AdminActionIcon name="refresh" />
            Refresh
          </button>
        </div>

        {loading ? (
          <p className="text-canvas-body-sm text-canvas-muted">Loading…</p>
        ) : null}

        {error ? (
          <div className="rounded-canvas border border-amber-300/40 bg-amber-50 px-4 py-3 text-canvas-body-sm text-amber-900">
            {error}
          </div>
        ) : null}

        {!loading && !error && suggestions.length === 0 ? (
          <div className="flex flex-col items-center rounded-canvas border border-dashed border-canvas-border bg-canvas-card/50 px-6 py-12 text-center">
            <span className="flex h-10 w-10 items-center justify-center rounded-canvas bg-canvas-artifactIconBg text-canvas-accent">
              <AdminActionIcon name="inbox" className="h-5 w-5" />
            </span>
            <p className="mt-3 font-display text-lg font-medium text-canvas-ink">
              No suggestions yet
            </p>
            <p className="mt-1 text-canvas-body-sm text-canvas-muted">
              Submissions from the canvas Suggestions button will appear here.
            </p>
          </div>
        ) : null}

        <ul className="space-y-3">
          {suggestions.map((item) => {
            const expanded = expandedId === item.id;
            return (
              <li
                key={item.id}
                className="rounded-canvas border border-canvas-border bg-canvas-card shadow-card"
              >
                <button
                  type="button"
                  onClick={() =>
                    setExpandedId((current) =>
                      current === item.id ? null : item.id,
                    )
                  }
                  className="flex w-full items-start justify-between gap-3 px-4 py-3 text-left"
                >
                  <div className="flex min-w-0 items-start gap-3">
                    <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-canvas bg-canvas-artifactIconBg text-canvas-accent">
                      <AdminActionIcon name="message" />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-canvas-body-sm font-medium text-canvas-ink">
                        {item.user_email}
                      </p>
                      <p className="mt-1 line-clamp-2 text-canvas-body-sm text-canvas-muted">
                        {item.message}
                      </p>
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <time
                      dateTime={item.created_at}
                      className="text-canvas-compact text-canvas-muted"
                    >
                      {formatWhen(item.created_at)}
                    </time>
                    <AdminActionIcon
                      name={expanded ? "chevron-up" : "chevron-down"}
                      className="h-4 w-4 text-canvas-muted"
                    />
                  </div>
                </button>

                {expanded ? (
                  <div className="border-t border-canvas-border px-4 py-3">
                    <p className="whitespace-pre-wrap text-canvas-body-sm text-canvas-ink">
                      {item.message}
                    </p>
                    {item.page_url ? (
                      <p className="mt-3 flex items-center gap-1.5 text-canvas-compact text-canvas-muted">
                        <AdminActionIcon name="link" className="h-3.5 w-3.5" />
                        <a
                          href={item.page_url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-canvas-accent underline"
                        >
                          {item.page_url}
                        </a>
                      </p>
                    ) : null}
                    {item.image_urls.length > 0 ? (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {item.image_urls.map((url) => (
                          <a
                            key={url}
                            href={url}
                            target="_blank"
                            rel="noreferrer"
                            className="block overflow-hidden rounded-canvas border border-canvas-border"
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={url}
                              alt="Suggestion attachment"
                              className="h-24 w-auto object-cover"
                            />
                          </a>
                        ))}
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
