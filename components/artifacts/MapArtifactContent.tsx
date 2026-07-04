"use client";

import L from "leaflet";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { ArtifactContentStage } from "@/components/artifacts/ArtifactContentStage";
import type { ArtifactPayload, MapSavedPlace } from "@/lib/artifactTypes";
import type { MapSearchResult } from "@/lib/geocoding";
import { createMapSavedPlace } from "@/lib/mapArtifact";
import { canvasColors } from "@/lib/design/tokens";
import { useCanvasStore } from "@/lib/store";
import "leaflet/dist/leaflet.css";

const PRIMARY_PIN_ICON = L.divIcon({
  className: "",
  html: `<svg width="28" height="36" viewBox="0 0 28 36" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <path d="M14 0C6.82 0 1 5.82 1 13c0 9.75 13 23 13 23s13-13.25 13-23C27 5.82 21.18 0 14 0z" fill="${canvasColors.mapPrimary}"/>
    <circle cx="14" cy="13" r="5" fill="white"/>
  </svg>`,
  iconSize: [28, 36],
  iconAnchor: [14, 36],
});

const SAVED_PIN_ICON = L.divIcon({
  className: "",
  html: `<svg width="24" height="32" viewBox="0 0 24 32" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <path d="M12 0C5.37 0 0 5.37 0 12c0 8.5 12 20 12 20s12-11.5 12-20C24 5.37 18.63 0 12 0z" fill="${canvasColors.mapSaved}"/>
    <circle cx="12" cy="11" r="4" fill="white"/>
  </svg>`,
  iconSize: [24, 32],
  iconAnchor: [12, 32],
});

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function popupHtml(place: MapSavedPlace, canEdit: boolean): string {
  const typeLine = place.type
    ? `<p style="margin:4px 0 0;font-size:11px;color:${canvasColors.muted};text-transform:capitalize">${escapeHtml(place.type)}</p>`
    : "";
  const removeBtn = canEdit
    ? `<button type="button" data-map-remove="${escapeHtml(place.id)}" style="margin-top:8px;font-size:11px;color:${canvasColors.danger};background:none;border:none;padding:0;cursor:pointer;text-decoration:underline">Remove</button>`
    : "";
  return `<div style="min-width:160px;max-width:220px">
    <p style="margin:0;font-size:12px;font-weight:600;line-height:1.35;color:${canvasColors.ink}">${escapeHtml(place.label)}</p>
    ${typeLine}
    <p style="margin:6px 0 0;font-size:10px;color:${canvasColors.muted};font-family:monospace">${place.lat.toFixed(5)}, ${place.lng.toFixed(5)}</p>
    ${removeBtn}
  </div>`;
}

function MapSearchBar({
  onSelect,
}: {
  onSelect: (result: MapSearchResult) => void;
}) {
  const listId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<MapSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const close = useCallback(() => {
    setOpen(false);
    setQuery("");
    setResults([]);
    setActiveIndex(-1);
    setLoading(false);
  }, []);

  const openSearch = useCallback(() => {
    setOpen(true);
    requestAnimationFrame(() => inputRef.current?.focus());
  }, []);

  useEffect(() => {
    if (!open) return;
    const q = query.trim();
    if (q.length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    setLoading(true);
    const timer = window.setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/map-search?q=${encodeURIComponent(q)}`,
          { signal: controller.signal },
        );
        if (!res.ok) {
          setResults([]);
          return;
        }
        const data = (await res.json()) as MapSearchResult[];
        setResults(data);
        setActiveIndex(-1);
      } catch {
        if (!controller.signal.aborted) setResults([]);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 350);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [open, query]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) {
        close();
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open, close]);

  const pickResult = (result: MapSearchResult) => {
    onSelect(result);
    close();
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      e.preventDefault();
      close();
      return;
    }
    if (!results.length) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => (i + 1) % results.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => (i <= 0 ? results.length - 1 : i - 1));
    } else if (e.key === "Enter" && activeIndex >= 0) {
      e.preventDefault();
      pickResult(results[activeIndex]!);
    }
  };

  return (
    <div
      ref={rootRef}
      data-no-drag
      className="absolute right-2 top-2 z-[500] flex max-w-[calc(100%-1rem)] flex-col items-end gap-1"
    >
      {!open ? (
        <button
          type="button"
          aria-label="Search map"
          onClick={openSearch}
          className="flex h-8 w-8 items-center justify-center rounded-canvas-sm border border-black/10 bg-white/95 text-canvas-ink shadow-md backdrop-blur-sm transition hover:bg-white"
        >
          <svg viewBox="0 0 16 16" className="h-4 w-4" aria-hidden>
            <circle
              cx="7"
              cy="7"
              r="4.5"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.4"
            />
            <path
              d="M10.5 10.5L14 14"
              stroke="currentColor"
              strokeWidth="1.4"
              strokeLinecap="round"
            />
          </svg>
        </button>
      ) : (
        <div className="w-[min(18rem,calc(100vw-2rem))] overflow-hidden rounded-canvas-sm border border-black/10 bg-white/95 shadow-lg backdrop-blur-sm">
          <div className="flex items-center gap-1 border-b border-black/5 px-2 py-1.5">
            <svg viewBox="0 0 16 16" className="ml-0.5 h-3.5 w-3.5 shrink-0 text-canvas-muted" aria-hidden>
              <circle
                cx="7"
                cy="7"
                r="4.5"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.4"
              />
              <path
                d="M10.5 10.5L14 14"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinecap="round"
              />
            </svg>
            <input
              ref={inputRef}
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder="Search places…"
              role="combobox"
              aria-expanded={results.length > 0}
              aria-controls={listId}
              aria-autocomplete="list"
              className="min-w-0 flex-1 bg-transparent text-canvas-compact text-canvas-ink outline-none placeholder:text-canvas-muted"
            />
            <button
              type="button"
              aria-label="Close search"
              onClick={close}
              className="flex h-6 w-6 shrink-0 items-center justify-center rounded text-canvas-muted hover:bg-black/5 hover:text-canvas-ink"
            >
              <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" aria-hidden>
                <path
                  d="M4 4l8 8M12 4l-8 8"
                  stroke="currentColor"
                  strokeWidth="1.4"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          </div>
          {(loading || results.length > 0 || query.trim().length >= 2) && (
            <ul
              id={listId}
              role="listbox"
              className="max-h-40 overflow-y-auto py-1"
            >
              {loading && (
                <li className="px-3 py-2 text-canvas-caption text-canvas-muted">
                  Searching…
                </li>
              )}
              {!loading && results.length === 0 && query.trim().length >= 2 && (
                <li className="px-3 py-2 text-canvas-caption text-canvas-muted">
                  No places found
                </li>
              )}
              {!loading &&
                results.map((result, index) => (
                  <li key={`${result.lat}-${result.lng}-${index}`} role="option">
                    <button
                      type="button"
                      aria-selected={index === activeIndex}
                      onMouseEnter={() => setActiveIndex(index)}
                      onClick={() => pickResult(result)}
                      className={`w-full truncate px-3 py-2 text-left text-canvas-compact leading-snug ${
                        index === activeIndex
                          ? "bg-violet-50 text-canvas-ink"
                          : "text-canvas-ink hover:bg-black/[0.04]"
                      }`}
                      title={result.label}
                    >
                      {result.label}
                    </button>
                  </li>
                ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

function AddPinButton({
  active,
  saving,
  onToggle,
}: {
  active: boolean;
  saving: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      data-no-drag
      aria-label={active ? "Cancel add pin" : "Add pin to map"}
      aria-pressed={active}
      disabled={saving}
      onClick={onToggle}
      className={`flex h-8 items-center gap-1.5 rounded-canvas-sm border px-2.5 text-canvas-caption font-medium shadow-md backdrop-blur-sm transition ${
        active
          ? "border-canvas-warning bg-canvas-warningSoft text-canvas-warningText"
          : "border-black/10 bg-white/95 text-canvas-ink hover:bg-white"
      } ${saving ? "opacity-60" : ""}`}
    >
      <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" aria-hidden>
        {active ? (
          <path
            d="M8 1v4M8 11v4M1 8h4M11 8h4M8 8m-2.5 0a2.5 2.5 0 1 0 5 0a2.5 2.5 0 1 0-5 0"
            stroke="currentColor"
            strokeWidth="1.3"
            strokeLinecap="round"
          />
        ) : (
          <path
            d="M8 1.5v3M8 11.5v3M5 8H2M14 8h-3M8 5.5a2.5 2.5 0 1 0 0 5a2.5 2.5 0 1 0 0-5"
            stroke="currentColor"
            strokeWidth="1.3"
            strokeLinecap="round"
          />
        )}
      </svg>
      {saving ? "Saving…" : active ? "Click map" : "Add pin"}
    </button>
  );
}

function MapView({
  primaryLat,
  primaryLng,
  initialZoom,
  primaryLabel,
  savedPlaces,
  canEdit,
  onSavePlaces,
  showLabel = true,
}: {
  primaryLat: number;
  primaryLng: number;
  initialZoom: number;
  primaryLabel: string;
  savedPlaces: MapSavedPlace[];
  canEdit: boolean;
  onSavePlaces: (places: MapSavedPlace[]) => void;
  showLabel?: boolean;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const savedLayerRef = useRef<L.LayerGroup | null>(null);
  const addPinModeRef = useRef(false);
  const canEditRef = useRef(canEdit);
  const savedPlacesRef = useRef(savedPlaces);
  const onSavePlacesRef = useRef(onSavePlaces);
  const onRemoveRef = useRef<(id: string) => void>(() => {});
  const [addPinMode, setAddPinMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [viewingLabel, setViewingLabel] = useState<string | null>(null);
  const [optimisticPlaces, setOptimisticPlaces] = useState<MapSavedPlace[]>([]);

  addPinModeRef.current = addPinMode;
  canEditRef.current = canEdit;
  savedPlacesRef.current = savedPlaces;
  onSavePlacesRef.current = onSavePlaces;
  const optimisticPlacesRef = useRef(optimisticPlaces);
  optimisticPlacesRef.current = optimisticPlaces;

  useEffect(() => {
    setOptimisticPlaces([]);
  }, [savedPlaces]);

  const handleRemove = useCallback(
    (placeId: string) => {
      const isOptimistic = optimisticPlacesRef.current.some((p) => p.id === placeId);
      if (isOptimistic) {
        setOptimisticPlaces((current) => current.filter((p) => p.id !== placeId));
      } else {
        onSavePlaces(savedPlaces.filter((p) => p.id !== placeId));
      }
    },
    [onSavePlaces, savedPlaces],
  );

  onRemoveRef.current = handleRemove;

  const syncSavedMarkers = useCallback(
    (map: L.Map, layer: L.LayerGroup, places: MapSavedPlace[]) => {
      layer.clearLayers();
      for (const place of places) {
        const marker = L.marker([place.lat, place.lng], {
          icon: SAVED_PIN_ICON,
        });
        marker.bindTooltip(place.label, {
          direction: "top",
          opacity: 0.95,
          sticky: true,
          className: "map-saved-tooltip",
        });
        marker.bindPopup(popupHtml(place, canEditRef.current), {
          maxWidth: 240,
          closeButton: true,
        });
        marker.addTo(layer);
      }
    },
    [],
  );

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const map = L.map(container, {
      center: [primaryLat, primaryLng],
      zoom: initialZoom,
      zoomControl: true,
      attributionControl: false,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);

    L.marker([primaryLat, primaryLng], { icon: PRIMARY_PIN_ICON }).addTo(map);

    const savedLayer = L.layerGroup().addTo(map);
    savedLayerRef.current = savedLayer;
    mapRef.current = map;

    const onPopupOpen = (e: L.PopupEvent) => {
      const popup = e.popup;
      const el = popup.getElement();
      if (!el) return;
      const btn = el.querySelector<HTMLButtonElement>("[data-map-remove]");
      if (!btn) return;
      const placeId = btn.getAttribute("data-map-remove");
      if (!placeId) return;
      L.DomEvent.on(btn, "click", (ev) => {
        L.DomEvent.stopPropagation(ev);
        onRemoveRef.current(placeId);
        map.closePopup();
      });
    };

    const onMapClick = async (e: L.LeafletMouseEvent) => {
      if (!addPinModeRef.current || !canEditRef.current) return;
      L.DomEvent.stopPropagation(e.originalEvent);

      const { lat, lng } = e.latlng;
      setSaving(true);
      try {
        const res = await fetch(
          `/api/map-reverse?lat=${encodeURIComponent(lat)}&lng=${encodeURIComponent(lng)}`,
        );
        if (!res.ok) return;
        const hit = (await res.json()) as {
          label: string;
          lat: number;
          lng: number;
          type?: string;
        };
        const place = createMapSavedPlace(hit);
        // Optimistically update the UI immediately
        setOptimisticPlaces((current) => [...current, place]);
        // Then save to the artifact
        onSavePlacesRef.current([...savedPlacesRef.current, place]);
      } finally {
        setSaving(false);
      }
    };

    map.on("popupopen", onPopupOpen);
    map.on("click", onMapClick);

    const resizeTimer = window.setTimeout(() => map.invalidateSize(), 0);
    const observer = new ResizeObserver(() => map.invalidateSize());
    observer.observe(container);

    return () => {
      window.clearTimeout(resizeTimer);
      observer.disconnect();
      map.off("popupopen", onPopupOpen);
      map.off("click", onMapClick);
      map.remove();
      mapRef.current = null;
      savedLayerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    const layer = savedLayerRef.current;
    if (!map || !layer) return;
    const combinedPlaces = [...savedPlaces, ...optimisticPlaces];
    syncSavedMarkers(map, layer, combinedPlaces);
  }, [savedPlaces, optimisticPlaces, canEdit, syncSavedMarkers]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const container = map.getContainer();
    if (addPinMode) {
      container.style.cursor = "crosshair";
    } else {
      container.style.cursor = "";
    }
  }, [addPinMode]);

  const handleSearchSelect = (result: MapSearchResult) => {
    const map = mapRef.current;
    if (!map) return;
    map.flyTo([result.lat, result.lng], result.zoom, { duration: 0.75 });
    setViewingLabel(result.label);
  };

  const bottomLabel = viewingLabel ?? primaryLabel;

  return (
    <div className="relative h-full w-full min-h-0 cursor-default">
      <div ref={containerRef} data-no-drag className="h-full w-full" />
      <MapSearchBar onSelect={handleSearchSelect} />
      {canEdit && (
        <div
          data-no-drag
          className="absolute right-80 top-2 z-[500]"
        >
          <AddPinButton
            active={addPinMode}
            saving={saving}
            onToggle={() => setAddPinMode((v) => !v)}
          />
        </div>
      )}
      {showLabel && (
        <div className="pointer-events-none absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/50 to-transparent px-3 py-2">
          {viewingLabel && viewingLabel !== primaryLabel && (
            <p className="truncate text-canvas-micro text-white/70">
              Viewing: {viewingLabel}
            </p>
          )}
          <p className="truncate text-canvas-caption font-medium text-white/90">
            {bottomLabel}
          </p>
        </div>
      )}
    </div>
  );
}

export function MapArtifactContent({
  payload,
  artifactId,
  canEdit = false,
  fill = false,
  sidebar = false,
  layout = "panel",
}: {
  payload: Extract<ArtifactPayload, { type: "map" }>;
  artifactId?: string;
  canEdit?: boolean;
  fill?: boolean;
  sidebar?: boolean;
  layout?: "canvas" | "panel" | "sidebar";
}) {
  const isCanvas = layout === "canvas";
  const saveMapArtifactVersion = useCanvasStore((s) => s.saveMapArtifactVersion);
  const { place, zoom } = payload.data;
  const lat = place.lat;
  const lng = place.lng;
  const label = place.label ?? place.name;
  const savedPlaces = payload.data.savedPlaces ?? [];

  const handleSavePlaces = useCallback(
    (places: MapSavedPlace[]) => {
      if (!artifactId) return;
      saveMapArtifactVersion(artifactId, {
        ...payload,
        data: {
          ...payload.data,
          savedPlaces: places,
        },
      });
    },
    [artifactId, payload, saveMapArtifactVersion],
  );

  if (lat == null || lng == null || !Number.isFinite(lat) || !Number.isFinite(lng)) {
    if (sidebar) {
      return (
        <div className="flex h-full min-h-[80px] items-center justify-center p-3 text-center text-canvas-caption text-canvas-muted">
          Map unavailable
        </div>
      );
    }
    return (
      <ArtifactContentStage
        fill={fill}
        artifactId={artifactId}
        className={fill ? undefined : "aspect-[4/3]"}
      >
        <div className="flex h-full min-h-[200px] items-center justify-center bg-canvas-bg p-4 text-center text-canvas-body-sm text-canvas-muted">
          Map location could not be loaded.
        </div>
      </ArtifactContentStage>
    );
  }

  if (sidebar) {
    return (
      <div className="pointer-events-none h-full min-h-0 w-full">
        <MapView
          primaryLat={lat}
          primaryLng={lng}
          initialZoom={zoom}
          primaryLabel={label}
          savedPlaces={savedPlaces}
          canEdit={false}
          onSavePlaces={handleSavePlaces}
          showLabel={false}
        />
      </div>
    );
  }

  return (
    <ArtifactContentStage
      fill={fill}
      artifactId={artifactId}
      className={fill ? undefined : "aspect-[4/3]"}
    >
      <div
        className={`${fill ? "h-full min-h-0" : "min-h-[280px] h-full"} ${
          isCanvas ? "" : "pointer-events-none"
        }`}
      >
        <MapView
          primaryLat={lat}
          primaryLng={lng}
          initialZoom={zoom}
          primaryLabel={label}
          savedPlaces={savedPlaces}
          canEdit={canEdit}
          onSavePlaces={handleSavePlaces}
        />
      </div>
    </ArtifactContentStage>
  );
}
