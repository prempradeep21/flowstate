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

type SortOption = "newest" | "oldest" | "sender";
type FilterOption = "all" | "with-images" | "with-links";

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

function getInitials(email: string): string {
  return email
    .split("@")[0]
    .split(".")
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function getColorForEmail(email: string): string {
  const colors = [
    "from-blue-400 to-cyan-400",
    "from-purple-400 to-pink-400",
    "from-emerald-400 to-teal-400",
    "from-amber-400 to-orange-400",
    "from-rose-400 to-red-400",
  ];
  const hash = email.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return colors[hash % colors.length];
}

export function BetaSuggestionsInbox() {
  const [suggestions, setSuggestions] = useState<BetaSuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [filterBy, setFilterBy] = useState<FilterOption>("all");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

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

  const filteredAndSorted = suggestions
    .filter((item) => {
      const matchesSearch =
        item.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.user_email.toLowerCase().includes(searchQuery.toLowerCase());
      if (!matchesSearch) return false;

      if (filterBy === "with-images" && item.image_urls.length === 0)
        return false;
      if (filterBy === "with-links" && !item.page_url) return false;

      return true;
    })
    .sort((a, b) => {
      if (sortBy === "newest")
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      if (sortBy === "oldest")
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      return a.user_email.localeCompare(b.user_email);
    });

  const toggleExpanded = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleSelected = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredAndSorted.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredAndSorted.map((s) => s.id)));
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-canvas-bg via-canvas-bg to-canvas-card/30 p-6 sm:p-8">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-canvas-ink">Feedback Hub</h1>
              <p className="mt-2 text-canvas-body-sm text-canvas-muted">
                {filteredAndSorted.length} of {suggestions.length}{" "}
                {suggestions.length === 1 ? "suggestion" : "suggestions"}
              </p>
            </div>
            <button
              type="button"
              onClick={() => void load()}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-lg border border-canvas-border bg-canvas-card px-4 py-2.5 text-sm font-semibold text-canvas-ink transition-all duration-200 hover:bg-canvas-card/80 hover:shadow-md disabled:opacity-50"
            >
              <AdminActionIcon
                name="refresh"
                className={loading ? "animate-spin" : ""}
              />
              Refresh
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        {!loading && suggestions.length > 0 && (
          <div className="mb-8 grid grid-cols-3 gap-3 sm:gap-4">
            <div className="rounded-lg border border-canvas-border bg-canvas-card p-4 backdrop-blur-sm">
              <p className="text-xs font-semibold uppercase tracking-wider text-canvas-muted">
                Total
              </p>
              <p className="mt-1 text-2xl font-bold text-canvas-ink">
                {suggestions.length}
              </p>
            </div>
            <div className="rounded-lg border border-canvas-border bg-canvas-card p-4 backdrop-blur-sm">
              <p className="text-xs font-semibold uppercase tracking-wider text-canvas-muted">
                With Images
              </p>
              <p className="mt-1 text-2xl font-bold text-canvas-accent">
                {suggestions.filter((s) => s.image_urls.length > 0).length}
              </p>
            </div>
            <div className="rounded-lg border border-canvas-border bg-canvas-card p-4 backdrop-blur-sm">
              <p className="text-xs font-semibold uppercase tracking-wider text-canvas-muted">
                With Links
              </p>
              <p className="mt-1 text-2xl font-bold text-canvas-accent">
                {suggestions.filter((s) => s.page_url).length}
              </p>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="mb-6 rounded-lg border border-red-300/40 bg-red-50/50 px-5 py-4 text-sm text-red-700">
            <div className="flex items-start gap-3">
              <AdminActionIcon name="alert" className="mt-0.5 h-5 w-5 shrink-0" />
              <p>{error}</p>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && suggestions.length === 0 && (
          <div className="flex justify-center py-16">
            <div className="flex flex-col items-center gap-3">
              <div className="h-10 w-10 animate-spin rounded-full border-3 border-canvas-border border-t-canvas-accent"></div>
              <p className="text-sm text-canvas-muted">Loading suggestions…</p>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && suggestions.length === 0 && (
          <div className="flex flex-col items-center rounded-xl border-2 border-dashed border-canvas-border bg-gradient-to-b from-canvas-card/50 to-canvas-bg/50 px-8 py-20 text-center backdrop-blur-sm">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-canvas-accent/10">
              <AdminActionIcon name="inbox" className="h-8 w-8 text-canvas-accent" />
            </div>
            <h2 className="mt-5 text-xl font-semibold text-canvas-ink">
              No feedback yet
            </h2>
            <p className="mt-2 max-w-sm text-sm text-canvas-muted">
              Suggestions from users will appear here. Share the beta feedback feature to start collecting valuable insights.
            </p>
          </div>
        )}

        {/* Controls and List */}
        {!loading && suggestions.length > 0 && (
          <>
            {/* Search and Filters */}
            <div className="mb-6 space-y-4 rounded-xl border border-canvas-border bg-canvas-card/50 p-4 backdrop-blur-sm">
              <div>
                <input
                  type="text"
                  placeholder="Search by message or email…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-lg border border-canvas-border bg-canvas-bg px-4 py-2.5 text-sm text-canvas-ink placeholder-canvas-muted transition-all focus:border-canvas-accent focus:outline-none focus:ring-2 focus:ring-canvas-accent/20"
                />
              </div>

              <div className="flex flex-wrap gap-3">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  className="rounded-lg border border-canvas-border bg-canvas-bg px-3 py-2 text-sm text-canvas-ink transition-all focus:border-canvas-accent focus:outline-none focus:ring-2 focus:ring-canvas-accent/20"
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="sender">By Sender</option>
                </select>

                <select
                  value={filterBy}
                  onChange={(e) => setFilterBy(e.target.value as FilterOption)}
                  className="rounded-lg border border-canvas-border bg-canvas-bg px-3 py-2 text-sm text-canvas-ink transition-all focus:border-canvas-accent focus:outline-none focus:ring-2 focus:ring-canvas-accent/20"
                >
                  <option value="all">All Suggestions</option>
                  <option value="with-images">With Images</option>
                  <option value="with-links">With Links</option>
                </select>

                {selectedIds.size > 0 && (
                  <button
                    onClick={() => setSelectedIds(new Set())}
                    className="rounded-lg bg-red-500/10 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-500/20 transition-colors"
                  >
                    Clear ({selectedIds.size})
                  </button>
                )}
              </div>
            </div>

            {/* Suggestions List */}
            <div className="space-y-3">
              {filteredAndSorted.map((item) => {
                const expanded = expandedIds.has(item.id);
                const selected = selectedIds.has(item.id);
                const gradient = getColorForEmail(item.user_email);

                return (
                  <div
                    key={item.id}
                    className={`group relative overflow-hidden rounded-xl border transition-all duration-200 ${
                      selected
                        ? "border-canvas-accent bg-canvas-accent/5 shadow-lg"
                        : "border-canvas-border bg-canvas-card/50 hover:shadow-md hover:border-canvas-border/80"
                    }`}
                  >
                    {/* Selection Checkbox */}
                    <div className="absolute left-0 top-0 bottom-0 w-12 flex items-center justify-center bg-gradient-to-r from-canvas-accent/0 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                      <input
                        type="checkbox"
                        checked={selected}
                        onChange={() => toggleSelected(item.id)}
                        className="h-4 w-4 rounded cursor-pointer"
                      />
                    </div>

                    <div
                      className="flex w-full cursor-pointer flex-col pl-0 transition-all"
                      onClick={() => toggleExpanded(item.id)}
                    >
                      {/* Main Content */}
                      <div className="flex flex-1 items-start gap-4 px-5 py-4">
                        {/* Avatar */}
                        <div
                          className={`mt-1 flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${gradient} text-sm font-bold text-white shadow-md`}
                        >
                          {getInitials(item.user_email)}
                        </div>

                        {/* Content */}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-baseline justify-between gap-2">
                            <p className="text-sm font-semibold text-canvas-ink">
                              {item.user_email}
                            </p>
                            <time className="shrink-0 text-xs text-canvas-muted">
                              {formatWhen(item.created_at)}
                            </time>
                          </div>
                          <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-canvas-muted">
                            {item.message}
                          </p>

                          {/* Quick Info Badges */}
                          <div className="mt-2 flex gap-2 flex-wrap">
                            {item.image_urls.length > 0 && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-700">
                                <AdminActionIcon name="image" className="h-3 w-3" />
                                {item.image_urls.length}
                              </span>
                            )}
                            {item.page_url && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-1 text-xs font-medium text-emerald-700">
                                <AdminActionIcon name="link" className="h-3 w-3" />
                                Link
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Expand Icon */}
                        <div className="shrink-0 text-canvas-muted transition-transform duration-200">
                          <AdminActionIcon
                            name={expanded ? "chevron-up" : "chevron-down"}
                            className="h-5 w-5"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Expanded Content */}
                    {expanded && (
                      <div className="animate-in fade-in slide-in-from-top-2 duration-200 border-t border-canvas-border/50 bg-gradient-to-b from-canvas-card/50 to-canvas-bg/30 px-5 py-4">
                        <div className="space-y-5">
                          {/* Message */}
                          <div>
                            <p className="text-xs font-bold uppercase tracking-widest text-canvas-muted">
                              Message
                            </p>
                            <div className="mt-2 rounded-lg bg-canvas-bg/50 p-3 font-mono text-sm leading-relaxed text-canvas-ink">
                              {item.message}
                            </div>
                            <button
                              onClick={() => copyToClipboard(item.message)}
                              className="mt-2 text-xs text-canvas-accent hover:underline"
                            >
                              Copy
                            </button>
                          </div>

                          {/* Page URL */}
                          {item.page_url && (
                            <div>
                              <p className="text-xs font-bold uppercase tracking-widest text-canvas-muted">
                                From Page
                              </p>
                              <a
                                href={item.page_url}
                                target="_blank"
                                rel="noreferrer"
                                className="mt-2 inline-flex items-center gap-2 break-all rounded-lg bg-emerald-50/50 px-3 py-2 text-sm text-emerald-700 hover:bg-emerald-50 transition-colors"
                              >
                                <AdminActionIcon name="link" className="h-4 w-4 shrink-0" />
                                {item.page_url}
                              </a>
                            </div>
                          )}

                          {/* Images */}
                          {item.image_urls.length > 0 && (
                            <div>
                              <p className="text-xs font-bold uppercase tracking-widest text-canvas-muted">
                                Attachments ({item.image_urls.length})
                              </p>
                              <div className="mt-3 grid gap-3 sm:grid-cols-2 md:grid-cols-3">
                                {item.image_urls.map((url) => (
                                  <button
                                    key={url}
                                    onClick={() => setLightboxUrl(url)}
                                    className="group/img relative overflow-hidden rounded-lg border border-canvas-border transition-all hover:shadow-lg"
                                  >
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                      src={url}
                                      alt="Suggestion attachment"
                                      className="h-32 w-full object-cover transition-transform duration-200 group-hover/img:scale-110"
                                    />
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover/img:opacity-100">
                                      <AdminActionIcon
                                        name="expand"
                                        className="h-5 w-5 text-white"
                                      />
                                    </div>
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* No Results */}
            {filteredAndSorted.length === 0 && (
              <div className="rounded-lg border border-dashed border-canvas-border bg-canvas-card/30 px-6 py-8 text-center">
                <AdminActionIcon name="inbox" className="mx-auto h-8 w-8 text-canvas-muted" />
                <p className="mt-3 text-sm text-canvas-muted">
                  No suggestions match your search criteria.
                </p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Image Lightbox */}
      {lightboxUrl && (
        <div
          onClick={() => setLightboxUrl(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
        >
          <div className="relative max-h-[90vh] max-w-[90vw]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={lightboxUrl}
              alt="Suggestion attachment"
              className="h-full w-full object-contain"
              onClick={(e) => e.stopPropagation()}
            />
            <button
              onClick={() => setLightboxUrl(null)}
              className="absolute right-4 top-4 rounded-full bg-white/20 p-2 text-white hover:bg-white/30 transition-colors"
            >
              <AdminActionIcon name="close" className="h-6 w-6" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
