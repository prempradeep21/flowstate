"use client";

import { useCallback, useEffect, useState } from "react";

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
        <header className="mb-6 flex flex-wrap items-start justify-between gap-3 border-b border-canvas-border pb-4">
          <div>
            <h2 className="font-display text-2xl font-medium text-canvas-ink">
              Beta suggestions
            </h2>
            <p className="mt-1 text-canvas-body-sm text-canvas-muted">
              Submissions from the canvas Suggestions button.
            </p>
          </div>
          <button
            type="button"
            onClick={() => void load()}
            disabled={loading}
            className="rounded-canvas border border-canvas-border bg-canvas-card px-3 py-2 text-canvas-body-sm font-medium text-canvas-ink transition-colors hover:bg-canvas-bg disabled:opacity-50"
          >
            Refresh
          </button>
        </header>

        {loading ? (
          <p className="text-canvas-body-sm text-canvas-muted">Loading…</p>
        ) : null}

        {error ? (
          <div className="rounded-canvas border border-amber-300/40 bg-amber-50 px-4 py-3 text-canvas-body-sm text-amber-900">
            {error}
          </div>
        ) : null}

        {!loading && !error && suggestions.length === 0 ? (
          <p className="text-canvas-body-sm text-canvas-muted">
            No suggestions yet.
          </p>
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
                  <div className="min-w-0">
                    <p className="truncate text-canvas-body-sm font-medium text-canvas-ink">
                      {item.user_email}
                    </p>
                    <p className="mt-1 line-clamp-2 text-canvas-body-sm text-canvas-muted">
                      {item.message}
                    </p>
                  </div>
                  <time
                    dateTime={item.created_at}
                    className="shrink-0 text-canvas-compact text-canvas-muted"
                  >
                    {formatWhen(item.created_at)}
                  </time>
                </button>

                {expanded ? (
                  <div className="border-t border-canvas-border px-4 py-3">
                    <p className="whitespace-pre-wrap text-canvas-body-sm text-canvas-ink">
                      {item.message}
                    </p>
                    {item.page_url ? (
                      <p className="mt-3 text-canvas-compact text-canvas-muted">
                        Page:{" "}
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
