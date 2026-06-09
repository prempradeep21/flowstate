"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type DragEvent as ReactDragEvent,
} from "react";
import { MotionOverlayPopover } from "@/components/motion/MotionOverlay";
import type { GiphyResult } from "@/lib/giphy/client";
import { setSidebarDragData } from "@/lib/sidebarDnD";
import { useToolbarPopoverAnchor } from "@/hooks/useToolbarPopoverAnchor";
import { useCanvasStore, type CanvasGifCategory } from "@/lib/store";

interface Props {
  anchorRef: React.RefObject<HTMLElement | null>;
  containerRef: React.RefObject<HTMLElement | null>;
}

type TabCategory = CanvasGifCategory;

interface SearchResponse {
  results: GiphyResult[];
  totalCount: number;
  offset: number;
  limit: number;
  error?: string;
}

const TAB_LABELS: Record<TabCategory, string> = {
  gif: "GIFs",
  sticker: "Transparent",
};

export function CanvasGifPicker({ anchorRef, containerRef }: Props) {
  const open = useCanvasStore((s) => s.gifPickerOpen);
  const setGifPickerOpen = useCanvasStore((s) => s.setGifPickerOpen);
  const requestGifPlacement = useCanvasStore((s) => s.requestGifPlacement);

  const popoverRef = useRef<HTMLDivElement>(null);
  const anchorStyle = useToolbarPopoverAnchor(
    anchorRef,
    containerRef,
    open,
    popoverRef,
  );
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [category, setCategory] = useState<TabCategory>("gif");
  const [results, setResults] = useState<GiphyResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    const timer = window.setTimeout(() => setDebouncedQuery(query.trim()), 300);
    return () => window.clearTimeout(timer);
  }, [query, open]);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams({
          category,
          limit: "24",
          offset: "0",
        });
        if (debouncedQuery) params.set("q", debouncedQuery);
        const res = await fetch(`/api/gifs/search?${params.toString()}`);
        const data = (await res.json()) as SearchResponse;
        if (cancelled) return;
        if (!res.ok) {
          setResults([]);
          setError(data.error ?? "Failed to load GIFs");
          return;
        }
        setResults(data.results ?? []);
      } catch {
        if (!cancelled) {
          setResults([]);
          setError("Failed to load GIFs");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [open, category, debouncedQuery]);

  const handlePointerDown = useCallback(
    (e: PointerEvent) => {
      const target = e.target as Node;
      if (popoverRef.current?.contains(target)) return;
      if (anchorRef.current?.contains(target)) return;
      setGifPickerOpen(false);
    },
    [anchorRef, setGifPickerOpen],
  );

  useEffect(() => {
    if (!open) return;
    document.addEventListener("pointerdown", handlePointerDown, true);
    return () =>
      document.removeEventListener("pointerdown", handlePointerDown, true);
  }, [open, handlePointerDown]);

  useEffect(() => {
    if (!open) {
      setQuery("");
      setDebouncedQuery("");
      setCategory("gif");
      setError(null);
    }
  }, [open]);

  const startDrag = (e: ReactDragEvent<HTMLButtonElement>, item: GiphyResult) => {
    setSidebarDragData(e.dataTransfer, {
      kind: "gif",
      url: item.url,
      previewUrl: item.previewUrl,
      title: item.title,
      category: item.category,
      aspectRatio: item.aspectRatio,
      sourceId: item.id,
    });
  };

  const handleTileClick = (item: GiphyResult) => {
    requestGifPlacement({
      url: item.url,
      previewUrl: item.previewUrl,
      title: item.title,
      category: item.category,
      aspectRatio: item.aspectRatio,
      sourceId: item.id,
    });
  };

  return (
    <MotionOverlayPopover
      isOpen={open}
      className="pointer-events-auto absolute bottom-full z-[60] mb-3 flex w-[min(92vw,420px)] -translate-x-1/2 flex-col rounded-canvas border border-canvas-border bg-canvas-card shadow-card"
      style={{ transformOrigin: "bottom center", ...anchorStyle }}
    >
      <div ref={popoverRef} className="flex flex-col">
        <div className="border-b border-canvas-border p-3">
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search GIFs…"
            aria-label="Search GIFs"
            className="w-full rounded-canvas border border-canvas-border bg-canvas-bg px-3 py-2 text-canvas-body-sm text-canvas-ink outline-none placeholder:text-canvas-muted focus:border-canvas-ink/30"
          />
          <div
            className="mt-2 flex rounded-canvas bg-canvas-bg p-0.5"
            role="tablist"
            aria-label="GIF category"
          >
            {(Object.keys(TAB_LABELS) as TabCategory[]).map((tab) => (
              <button
                key={tab}
                type="button"
                role="tab"
                aria-selected={category === tab}
                className={`flex-1 rounded-canvas px-2 py-1.5 text-canvas-compact font-medium transition-colors ${
                  category === tab
                    ? "bg-canvas-card text-canvas-ink shadow-card"
                    : "text-canvas-muted hover:text-canvas-ink"
                }`}
                onClick={() => setCategory(tab)}
              >
                {TAB_LABELS[tab]}
              </button>
            ))}
          </div>
        </div>

        <div className="max-h-[320px] min-h-[160px] overflow-y-auto p-2">
          {loading && (
            <p className="px-2 py-6 text-center text-canvas-body-sm text-canvas-muted">
              Loading…
            </p>
          )}
          {!loading && error && (
            <p className="px-2 py-6 text-center text-canvas-body-sm text-canvas-muted">
              {error}
            </p>
          )}
          {!loading && !error && results.length === 0 && (
            <p className="px-2 py-6 text-center text-canvas-body-sm text-canvas-muted">
              No GIFs found
            </p>
          )}
          {!loading && !error && results.length > 0 && (
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
              {results.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  draggable
                  onDragStart={(e) => startDrag(e, item)}
                  onClick={() => handleTileClick(item)}
                  className="group relative aspect-square overflow-hidden rounded-canvas bg-canvas-bg transition-transform hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-canvas-ink/30"
                  title={item.title}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.previewUrl}
                    alt={item.title}
                    loading="lazy"
                    draggable={false}
                    className="h-full w-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="border-t border-canvas-border px-3 py-2">
          <a
            href="https://giphy.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-canvas-caption text-canvas-muted transition-colors hover:text-canvas-ink"
          >
            Powered by GIPHY
          </a>
        </div>
      </div>
    </MotionOverlayPopover>
  );
}
