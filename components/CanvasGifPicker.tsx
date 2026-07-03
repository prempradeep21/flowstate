"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type DragEvent as ReactDragEvent,
} from "react";
import { Model3DIcon } from "@/components/MenuIcons";
import { MotionOverlayPopover } from "@/components/motion/MotionOverlay";
import type { Canvas3DSearchResult } from "@/lib/canvas3d/search";
import type { GiphyResult } from "@/lib/giphy/client";
import { setSidebarDragData } from "@/lib/sidebarDnD";
import { useToolbarPopoverAnchor } from "@/hooks/useToolbarPopoverAnchor";
import { useCanvasStore } from "@/lib/store";

interface Props {
  anchorRef: React.RefObject<HTMLElement | null>;
  containerRef: React.RefObject<HTMLElement | null>;
}

type PickerTab = "sticker" | "gif" | "3d";

interface GifSearchResponse {
  results: GiphyResult[];
  totalCount: number;
  offset: number;
  limit: number;
  error?: string;
}

interface ThreeDSearchResponse {
  results: Canvas3DSearchResult[];
  totalCount: number;
  offset: number;
  limit: number;
  error?: string;
}

const TAB_ORDER: PickerTab[] = ["sticker", "gif", "3d"];

const TAB_LABELS: Record<PickerTab, string> = {
  sticker: "Transparent GIFs",
  gif: "All GIFs",
  "3d": "3D",
};

export function CanvasGifPicker({ anchorRef, containerRef }: Props) {
  const open = useCanvasStore((s) => s.gifPickerOpen);
  const setGifPickerOpen = useCanvasStore((s) => s.setGifPickerOpen);
  const requestGifPlacement = useCanvasStore((s) => s.requestGifPlacement);
  const requestCanvas3DPlacement = useCanvasStore(
    (s) => s.requestCanvas3DPlacement,
  );

  const popoverRef = useRef<HTMLDivElement>(null);
  const anchorStyle = useToolbarPopoverAnchor(
    anchorRef,
    containerRef,
    open,
    popoverRef,
  );
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [category, setCategory] = useState<PickerTab>("sticker");
  const [gifResults, setGifResults] = useState<GiphyResult[]>([]);
  const [threeDResults, setThreeDResults] = useState<Canvas3DSearchResult[]>(
    [],
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const is3dTab = category === "3d";
  const results = is3dTab ? threeDResults : gifResults;

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
          limit: "24",
          offset: "0",
        });
        if (debouncedQuery) params.set("q", debouncedQuery);

        if (is3dTab) {
          const res = await fetch(`/api/3d/search?${params.toString()}`);
          const data = (await res.json()) as ThreeDSearchResponse;
          if (cancelled) return;
          if (!res.ok) {
            setThreeDResults([]);
            setError(data.error ?? "Failed to load 3D models");
            return;
          }
          setThreeDResults(data.results ?? []);
          return;
        }

        params.set("category", category);
        const res = await fetch(`/api/gifs/search?${params.toString()}`);
        const data = (await res.json()) as GifSearchResponse;
        if (cancelled) return;
        if (!res.ok) {
          setGifResults([]);
          setError(data.error ?? "Failed to load GIFs");
          return;
        }
        setGifResults(data.results ?? []);
      } catch {
        if (!cancelled) {
          if (is3dTab) setThreeDResults([]);
          else setGifResults([]);
          setError(is3dTab ? "Failed to load 3D models" : "Failed to load GIFs");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [open, category, debouncedQuery, is3dTab]);

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
      setCategory("sticker");
      setError(null);
    }
  }, [open]);

  const startGifDrag = (
    e: ReactDragEvent<HTMLButtonElement>,
    item: GiphyResult,
  ) => {
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

  const start3dDrag = (
    e: ReactDragEvent<HTMLButtonElement>,
    item: Canvas3DSearchResult,
  ) => {
    setSidebarDragData(e.dataTransfer, {
      kind: "3d",
      modelUrl: item.modelUrl,
      format: item.format,
      title: item.title,
      sourceId: item.id,
    });
  };

  const handleGifClick = (item: GiphyResult) => {
    requestGifPlacement({
      url: item.url,
      previewUrl: item.previewUrl,
      title: item.title,
      category: item.category,
      aspectRatio: item.aspectRatio,
      sourceId: item.id,
    });
  };

  const handle3dClick = (item: Canvas3DSearchResult) => {
    requestCanvas3DPlacement({
      modelUrl: item.modelUrl,
      format: item.format,
      title: item.title,
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
            placeholder={is3dTab ? "Search 3D models…" : "Search GIFs…"}
            aria-label={is3dTab ? "Search 3D models" : "Search GIFs"}
            className="w-full rounded-canvas border border-canvas-border bg-canvas-bg px-3 py-2 text-canvas-body-sm text-canvas-ink outline-none placeholder:text-canvas-muted focus:border-canvas-ink/30"
          />
          <div
            className="mt-2 flex rounded-canvas bg-canvas-bg p-0.5"
            role="tablist"
            aria-label="Media category"
          >
            {TAB_ORDER.map((tab) => (
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
              {is3dTab ? "No 3D models found" : "No GIFs found"}
            </p>
          )}
          {!loading && !error && !is3dTab && gifResults.length > 0 && (
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
              {gifResults.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  draggable
                  onDragStart={(e) => startGifDrag(e, item)}
                  onClick={() => handleGifClick(item)}
                  className="group relative aspect-square overflow-hidden rounded-canvas bg-canvas-bg transition-transform hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-canvas-ink/30"
                  title={item.title}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.url}
                    alt={item.title}
                    loading="lazy"
                    draggable={false}
                    className="h-full w-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
          {!loading && !error && is3dTab && threeDResults.length > 0 && (
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
              {threeDResults.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  draggable
                  onDragStart={(e) => start3dDrag(e, item)}
                  onClick={() => handle3dClick(item)}
                  className="group relative flex aspect-square flex-col items-center justify-center gap-1 overflow-hidden rounded-canvas bg-gradient-to-br from-canvas-bg via-canvas-card to-canvas-bg p-2 text-center transition-transform hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-canvas-ink/30"
                  title={item.title}
                >
                  <span className="text-canvas-muted">
                    <Model3DIcon />
                  </span>
                  <span className="line-clamp-2 text-canvas-caption font-medium leading-tight text-canvas-ink">
                    {item.title}
                  </span>
                  {item.animated && (
                    <span className="absolute left-1 top-1 rounded bg-canvas-card/90 px-1 py-0.5 text-[9px] font-medium uppercase tracking-wide text-canvas-muted">
                      Loop
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="border-t border-canvas-border px-3 py-2">
          {is3dTab ? (
            <p className="text-canvas-caption text-canvas-muted">
              Free models from{" "}
              <a
                href="https://github.com/KhronosGroup/glTF-Sample-Models"
                target="_blank"
                rel="noopener noreferrer"
                className="transition-colors hover:text-canvas-ink"
              >
                Khronos
              </a>{" "}
              &{" "}
              <a
                href="https://modelviewer.dev/"
                target="_blank"
                rel="noopener noreferrer"
                className="transition-colors hover:text-canvas-ink"
              >
                Model Viewer
              </a>
            </p>
          ) : (
            <a
              href="https://giphy.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-canvas-caption text-canvas-muted transition-colors hover:text-canvas-ink"
            >
              Powered by GIPHY
            </a>
          )}
        </div>
      </div>
    </MotionOverlayPopover>
  );
}
