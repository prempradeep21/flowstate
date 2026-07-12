"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { OpenRouterCatalogModel } from "@/app/api/admin/models/openrouter/route";
import {
  MAX_OPENROUTER_MODELS,
  type SelectableOpenRouterModel,
} from "@/lib/modelConfig/publishedModelsTypes";

type CatalogStatus = "loading" | "error" | "loaded";
type SaveStatus =
  | { kind: "idle" }
  | { kind: "saving" }
  | { kind: "saved" }
  | { kind: "error"; message: string };

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full border border-canvas-border bg-canvas-bg px-1.5 py-0.5 text-canvas-micro text-canvas-muted">
      {children}
    </span>
  );
}

export function ModelSelectionConsole({
  initialSelection,
  anthropicModels,
}: {
  initialSelection: SelectableOpenRouterModel[];
  anthropicModels: { id: string; label: string }[];
}) {
  const [selected, setSelected] =
    useState<SelectableOpenRouterModel[]>(initialSelection);
  const [catalog, setCatalog] = useState<OpenRouterCatalogModel[]>([]);
  const [catalogStatus, setCatalogStatus] = useState<CatalogStatus>("loading");
  const [catalogError, setCatalogError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [saveStatus, setSaveStatus] = useState<SaveStatus>({ kind: "idle" });

  const selectedIds = useMemo(
    () => new Set(selected.map((s) => s.id)),
    [selected],
  );
  const atCap = selected.length >= MAX_OPENROUTER_MODELS;

  const fetchCatalog = useCallback(async () => {
    setCatalogStatus("loading");
    setCatalogError(null);
    try {
      const res = await fetch("/api/admin/models/openrouter");
      const body = await res.json().catch(() => null);
      if (!res.ok) {
        setCatalogStatus("error");
        setCatalogError(body?.error ?? `Failed to load (${res.status})`);
        return;
      }
      setCatalog(Array.isArray(body?.models) ? body.models : []);
      setCatalogStatus("loaded");
    } catch {
      setCatalogStatus("error");
      setCatalogError("Network error reaching OpenRouter.");
    }
  }, []);

  useEffect(() => {
    void fetchCatalog();
  }, [fetchCatalog]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return catalog;
    return catalog.filter(
      (m) =>
        m.id.toLowerCase().includes(q) || m.name.toLowerCase().includes(q),
    );
  }, [catalog, search]);

  const add = (m: OpenRouterCatalogModel) => {
    setSaveStatus({ kind: "idle" });
    setSelected((prev) => {
      if (prev.some((s) => s.id === m.id) || prev.length >= MAX_OPENROUTER_MODELS)
        return prev;
      return [
        ...prev,
        {
          id: m.id,
          label: m.name,
          supportsTools: m.supportsTools,
          supportsImages: m.supportsImages,
        },
      ];
    });
  };

  const remove = (id: string) => {
    setSaveStatus({ kind: "idle" });
    setSelected((prev) => prev.filter((s) => s.id !== id));
  };

  const move = (idx: number, dir: -1 | 1) => {
    setSaveStatus({ kind: "idle" });
    setSelected((prev) => {
      const next = [...prev];
      const j = idx + dir;
      if (j < 0 || j >= next.length) return prev;
      [next[idx], next[j]] = [next[j], next[idx]];
      return next;
    });
  };

  const setLabel = (id: string, label: string) => {
    setSaveStatus({ kind: "idle" });
    setSelected((prev) =>
      prev.map((s) => (s.id === id ? { ...s, label } : s)),
    );
  };

  const save = async () => {
    setSaveStatus({ kind: "saving" });
    try {
      const res = await fetch("/api/admin/models/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ openrouterModels: selected }),
      });
      const body = await res.json().catch(() => null);
      if (!res.ok) {
        setSaveStatus({
          kind: "error",
          message: body?.error ?? `Save failed (${res.status})`,
        });
        return;
      }
      setSaveStatus({ kind: "saved" });
    } catch {
      setSaveStatus({ kind: "error", message: "Network error while saving." });
    }
  };

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6 p-4 sm:p-6">
      <p className="text-canvas-body-sm text-canvas-muted">
        The three native Claude models are always available to users. Below, pick
        up to {MAX_OPENROUTER_MODELS} OpenRouter models and order them by
        priority — the order here is the order users see in the composer dropdown.
      </p>

      {/* Always-available Claude models */}
      <section className="rounded-canvas border border-canvas-border bg-canvas-card/50 p-4">
        <h3 className="text-canvas-body-sm font-medium text-canvas-ink">
          Always available (native Anthropic)
        </h3>
        <div className="mt-2 flex flex-wrap gap-2">
          {anthropicModels.map((m) => (
            <span
              key={m.id}
              className="rounded-full border border-canvas-border bg-canvas-bg px-2.5 py-1 text-canvas-micro text-canvas-muted"
            >
              {m.label}
            </span>
          ))}
        </div>
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Selected / prioritised list */}
        <section className="order-2 flex flex-col gap-3 lg:order-1">
          <div className="flex items-center justify-between">
            <h3 className="text-canvas-body font-medium text-canvas-ink">
              Selected for users
            </h3>
            <span className="text-canvas-micro text-canvas-muted">
              {selected.length}/{MAX_OPENROUTER_MODELS}
            </span>
          </div>

          {selected.length === 0 ? (
            <p className="rounded-canvas border border-dashed border-canvas-border p-4 text-canvas-body-sm text-canvas-muted">
              No OpenRouter models selected. Add some from the catalog — users
              will see only the native Claude models until you do.
            </p>
          ) : (
            <ul className="flex flex-col gap-2">
              {selected.map((m, idx) => (
                <li
                  key={m.id}
                  className="flex items-center gap-2 rounded-canvas border border-canvas-border bg-canvas-card p-2"
                >
                  <span className="w-5 shrink-0 text-center text-canvas-micro text-canvas-muted">
                    {idx + 1}
                  </span>
                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <input
                      value={m.label}
                      onChange={(e) => setLabel(m.id, e.target.value)}
                      className="w-full rounded-canvas border border-transparent bg-transparent px-1 py-0.5 text-canvas-body-sm text-canvas-ink outline-none hover:border-canvas-border focus:border-canvas-muted"
                      aria-label={`Label for ${m.id}`}
                    />
                    <span className="truncate px-1 text-canvas-micro text-canvas-muted">
                      {m.id}
                      {!m.supportsTools ? " · text only" : ""}
                    </span>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <button
                      type="button"
                      onClick={() => move(idx, -1)}
                      disabled={idx === 0}
                      aria-label="Move up"
                      className="flex h-7 w-7 items-center justify-center rounded-canvas text-canvas-muted hover:bg-canvas-bg disabled:opacity-30"
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      onClick={() => move(idx, 1)}
                      disabled={idx === selected.length - 1}
                      aria-label="Move down"
                      className="flex h-7 w-7 items-center justify-center rounded-canvas text-canvas-muted hover:bg-canvas-bg disabled:opacity-30"
                    >
                      ↓
                    </button>
                    <button
                      type="button"
                      onClick={() => remove(m.id)}
                      aria-label="Remove"
                      className="flex h-7 w-7 items-center justify-center rounded-canvas text-canvas-muted hover:bg-canvas-bg hover:text-canvas-ink"
                    >
                      ×
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}

          <div className="flex items-center gap-3 pt-1">
            <button
              type="button"
              onClick={() => void save()}
              disabled={saveStatus.kind === "saving"}
              className="rounded-canvas bg-canvas-accent px-4 py-2 text-canvas-body-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {saveStatus.kind === "saving" ? "Saving…" : "Save & publish"}
            </button>
            {saveStatus.kind === "saved" && (
              <span className="text-canvas-body-sm text-canvas-accent">
                Published — users see this now.
              </span>
            )}
            {saveStatus.kind === "error" && (
              <span className="text-canvas-body-sm text-red-500">
                {saveStatus.message}
              </span>
            )}
          </div>
        </section>

        {/* OpenRouter catalog */}
        <section className="order-1 flex min-h-0 flex-col gap-3 lg:order-2">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-canvas-body font-medium text-canvas-ink">
              OpenRouter catalog
            </h3>
            <button
              type="button"
              onClick={() => void fetchCatalog()}
              className="rounded-canvas border border-canvas-border px-2 py-1 text-canvas-micro text-canvas-muted hover:border-canvas-muted hover:text-canvas-ink"
            >
              Refresh
            </button>
          </div>

          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search models…"
            className="w-full rounded-canvas border border-canvas-border bg-canvas-bg px-3 py-2 text-canvas-body-sm text-canvas-ink outline-none focus:border-canvas-muted"
          />

          {catalogStatus === "loading" && (
            <p className="text-canvas-body-sm text-canvas-muted">
              Loading OpenRouter models…
            </p>
          )}
          {catalogStatus === "error" && (
            <p className="text-canvas-body-sm text-red-500">
              {catalogError} <button
                type="button"
                onClick={() => void fetchCatalog()}
                className="underline"
              >
                Retry
              </button>
            </p>
          )}
          {catalogStatus === "loaded" && (
            <>
              <p className="text-canvas-micro text-canvas-muted">
                {filtered.length} of {catalog.length} models
              </p>
              <ul className="flex max-h-[26rem] flex-col gap-1 overflow-y-auto rounded-canvas border border-canvas-border p-1">
                {filtered.map((m) => {
                  const added = selectedIds.has(m.id);
                  const disabled = !added && atCap;
                  return (
                    <li
                      key={m.id}
                      className="flex items-center gap-2 rounded-canvas px-2 py-1.5 hover:bg-canvas-bg"
                    >
                      <div className="flex min-w-0 flex-1 flex-col">
                        <span className="truncate text-canvas-body-sm text-canvas-ink">
                          {m.name}
                        </span>
                        <span className="flex items-center gap-1.5 truncate text-canvas-micro text-canvas-muted">
                          <span className="truncate">{m.id}</span>
                          {m.supportsTools && <Badge>tools</Badge>}
                          {m.supportsImages && <Badge>vision</Badge>}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => add(m)}
                        disabled={added || disabled}
                        className={[
                          "shrink-0 rounded-canvas px-2.5 py-1 text-canvas-micro font-medium transition-colors",
                          added
                            ? "text-canvas-accent"
                            : disabled
                              ? "text-canvas-muted/50"
                              : "border border-canvas-border text-canvas-ink hover:border-canvas-accent/50 hover:text-canvas-accent",
                        ].join(" ")}
                      >
                        {added ? "Added" : disabled ? "Max 10" : "Add"}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
