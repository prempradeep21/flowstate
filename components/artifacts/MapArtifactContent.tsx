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
  tooltipAnchor: [0, -26],
});

/**
 * Distinct, map-legible pin hues. Chosen to read clearly over OpenStreetMap
 * tiles in both light and dark app themes (tiles stay light either way).
 * Violet is omitted so saved pins never blend into the primary pin.
 */
const MAP_PIN_PALETTE = [
  "#E11D48", // rose
  "#0EA5E9", // sky
  "#16A34A", // green
  "#D97706", // amber
  "#DB2777", // pink
  "#0D9488", // teal
  "#EA580C", // orange
  "#4F46E5", // indigo
  "#65A30D", // lime
  "#0891B2", // cyan
] as const;

function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

/**
 * Pins created together for one reason share a `group`; pins in the same
 * `type` share a category; otherwise each pin is coloured on its own id so
 * distinct pins stay visually distinct.
 */
function pinColor(place: MapSavedPlace): string {
  const key = (place.group?.trim() || place.type?.trim() || place.id).toLowerCase();
  return MAP_PIN_PALETTE[hashString(key) % MAP_PIN_PALETTE.length]!;
}

const savedIconCache = new Map<string, L.DivIcon>();

function savedPinIcon(color: string): L.DivIcon {
  let icon = savedIconCache.get(color);
  if (!icon) {
    icon = L.divIcon({
      className: "",
      html: `<svg width="24" height="32" viewBox="0 0 24 32" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <path d="M12 0C5.37 0 0 5.37 0 12c0 8.5 12 20 12 20s12-11.5 12-20C24 5.37 18.63 0 12 0z" fill="${color}"/>
    <circle cx="12" cy="11" r="4" fill="white"/>
  </svg>`,
      iconSize: [24, 32],
      iconAnchor: [12, 32],
      tooltipAnchor: [0, -24],
    });
    savedIconCache.set(color, icon);
  }
  return icon;
}

/** Permanent pill tooltip anchored above a pin, tinted to match it. */
function attachPinTooltip(
  marker: L.Marker,
  label: string,
  color: string,
  extraClass = "",
): void {
  marker.bindTooltip(
    `<span class="map-pin-tt__dot"></span><span class="map-pin-tt__label">${escapeHtml(
      label,
    )}</span>`,
    {
      permanent: true,
      direction: "top",
      opacity: 1,
      className: `map-pin-tooltip ${extraClass}`.trim(),
    },
  );
  const el = marker.getTooltip()?.getElement();
  if (el) el.style.setProperty("--pin-color", color);
}

/** MapTiler key — overridable per deploy; falls back to the shared vector key. */
const MAPTILER_KEY =
  process.env.NEXT_PUBLIC_MAPTILER_KEY ?? "pOpgqLqHOd3YbPg0d2oy";

interface MapStyleDef {
  id: string;
  label: string;
  url: string;
  attribution: string;
  maxZoom: number;
}

/**
 * Selectable basemap styles. The first entry is the default. MapTiler styles
 * use the raster endpoint (server-rendered from the vector style) so they drop
 * straight into Leaflet without a MapLibre GL runtime.
 */
const MAP_STYLES: MapStyleDef[] = [
  {
    id: "standard",
    label: "Standard",
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 19,
  },
  {
    id: "landscape",
    label: "Landscape",
    url: `https://api.maptiler.com/maps/landscape-v4/256/{z}/{x}/{y}.png?key=${MAPTILER_KEY}`,
    attribution:
      '<a href="https://www.maptiler.com/copyright/">&copy; MapTiler</a> <a href="https://www.openstreetmap.org/copyright">&copy; OpenStreetMap contributors</a>',
    maxZoom: 22,
  },
];

const DEFAULT_MAP_STYLE_ID = MAP_STYLES[0]!.id;

function resolveMapStyle(id: string | undefined): MapStyleDef {
  return MAP_STYLES.find((s) => s.id === id) ?? MAP_STYLES[0]!;
}

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
      className="flex min-w-0 flex-col items-end gap-1"
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
  const label = saving ? "Saving…" : active ? "Click map to drop" : "Add pin";
  return (
    <button
      type="button"
      data-no-drag
      title={
        saving
          ? "Saving pin…"
          : active
            ? "Click anywhere on the map to drop a pin — click here to cancel"
            : "Drop a pin on the map"
      }
      aria-label={active ? "Cancel adding pin" : "Add pin to map"}
      aria-pressed={active}
      disabled={saving}
      onClick={onToggle}
      className={`flex h-8 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-canvas-sm border px-2.5 text-canvas-caption font-medium shadow-md backdrop-blur-sm transition ${
        active
          ? "border-canvas-warning bg-canvas-warningSoft text-canvas-warningText"
          : "border-black/10 bg-white/95 text-canvas-ink hover:bg-white"
      } ${saving ? "cursor-wait opacity-70" : "cursor-pointer"}`}
    >
      {saving ? (
        <svg viewBox="0 0 16 16" className="h-3.5 w-3.5 animate-spin" aria-hidden>
          <circle
            cx="8"
            cy="8"
            r="6"
            fill="none"
            stroke="currentColor"
            strokeOpacity="0.25"
            strokeWidth="2"
          />
          <path
            d="M8 2a6 6 0 0 1 6 6"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      ) : active ? (
        <svg
          viewBox="0 0 16 16"
          className="h-3.5 w-3.5 motion-safe:animate-pulse"
          aria-hidden
        >
          <path
            d="M8 1v3.5M8 11.5V15M1 8h3.5M11.5 8H15"
            stroke="currentColor"
            strokeWidth="1.3"
            strokeLinecap="round"
          />
          <circle cx="8" cy="8" r="2.25" fill="currentColor" />
        </svg>
      ) : (
        <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" aria-hidden>
          <path
            d="M8 14.5s5-4.6 5-8.5a5 5 0 1 0-10 0c0 3.9 5 8.5 5 8.5Z"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.3"
            strokeLinejoin="round"
          />
          <path
            d="M8 4v4M6 6h4"
            stroke="currentColor"
            strokeWidth="1.3"
            strokeLinecap="round"
          />
        </svg>
      )}
      {label}
    </button>
  );
}

function MapStylePicker({
  styleId,
  onSelect,
}: {
  styleId: string;
  onSelect: (id: string) => void;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const current = resolveMapStyle(styleId);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  return (
    <div ref={rootRef} data-no-drag className="relative shrink-0">
      <button
        type="button"
        aria-label="Change map style"
        aria-haspopup="listbox"
        aria-expanded={open}
        title="Map style"
        onClick={() => setOpen((v) => !v)}
        className={`flex h-8 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-canvas-sm border px-2.5 text-canvas-caption font-medium shadow-md backdrop-blur-sm transition ${
          open
            ? "border-canvas-accent bg-white text-canvas-ink"
            : "border-black/10 bg-white/95 text-canvas-ink hover:bg-white"
        }`}
      >
        <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" aria-hidden>
          <path
            d="M8 2 2 5l6 3 6-3-6-3Z"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.3"
            strokeLinejoin="round"
          />
          <path
            d="M2.5 8.5 8 11l5.5-2.5M2.5 11 8 13.5 13.5 11"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.3"
            strokeLinejoin="round"
          />
        </svg>
        {current.label}
        <svg
          viewBox="0 0 16 16"
          className={`h-3 w-3 text-canvas-muted transition-transform ${
            open ? "rotate-180" : ""
          }`}
          aria-hidden
        >
          <path
            d="M4 6l4 4 4-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
      {open && (
        <ul
          role="listbox"
          aria-label="Map style"
          className="absolute right-0 top-full z-[510] mt-1 min-w-[9rem] overflow-hidden rounded-canvas-sm border border-black/10 bg-white/95 py-1 shadow-lg backdrop-blur-sm"
        >
          {MAP_STYLES.map((style) => {
            const active = style.id === current.id;
            return (
              <li key={style.id} role="option" aria-selected={active}>
                <button
                  type="button"
                  onClick={() => {
                    onSelect(style.id);
                    setOpen(false);
                  }}
                  className={`flex w-full items-center gap-2 px-3 py-1.5 text-left text-canvas-compact ${
                    active
                      ? "bg-violet-50 text-canvas-ink"
                      : "text-canvas-ink hover:bg-black/[0.04]"
                  }`}
                >
                  <span className="flex h-3.5 w-3.5 shrink-0 items-center justify-center">
                    {active && (
                      <svg
                        viewBox="0 0 16 16"
                        className="h-3.5 w-3.5 text-canvas-accent"
                        aria-hidden
                      >
                        <path
                          d="M3 8.5 6.5 12 13 4.5"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.6"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    )}
                  </span>
                  {style.label}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
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
  mapStyleId,
  onSetMapStyle,
  showLabel = true,
}: {
  primaryLat: number;
  primaryLng: number;
  initialZoom: number;
  primaryLabel: string;
  savedPlaces: MapSavedPlace[];
  canEdit: boolean;
  onSavePlaces: (places: MapSavedPlace[]) => void;
  mapStyleId: string;
  onSetMapStyle: (id: string) => void;
  showLabel?: boolean;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const mapStyleIdRef = useRef(mapStyleId);
  // Tracks which style the live tile layer actually renders (init applies the
  // mount-time style; the swap effect keeps this in sync).
  const appliedStyleIdRef = useRef(resolveMapStyle(mapStyleId).id);
  const savedLayerRef = useRef<L.LayerGroup | null>(null);
  const addPinModeRef = useRef(false);
  const canEditRef = useRef(canEdit);
  const savedPlacesRef = useRef(savedPlaces);
  const onSavePlacesRef = useRef(onSavePlaces);
  const onRemoveRef = useRef<(id: string) => void>(() => {});
  // Name pills clutter the tiny sidebar thumbnail; only show them where the
  // map is a real viewing surface (canvas/panel pass `showLabel`).
  const showTooltipsRef = useRef(showLabel);
  const [addPinMode, setAddPinMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [viewingLabel, setViewingLabel] = useState<string | null>(null);

  addPinModeRef.current = addPinMode;
  canEditRef.current = canEdit;
  savedPlacesRef.current = savedPlaces;
  onSavePlacesRef.current = onSavePlaces;
  showTooltipsRef.current = showLabel;
  mapStyleIdRef.current = mapStyleId;

  // Stable identity key: `savedPlaces` is often a fresh `[]` each render
  // (from `?? []` in the parent), so effects must key on this, not the ref.
  const savedPlacesKey = savedPlaces.map((p) => p.id).join("|");

  const handleRemove = useCallback(
    (placeId: string) => {
      onSavePlacesRef.current(
        savedPlacesRef.current.filter((p) => p.id !== placeId),
      );
    },
    [],
  );

  onRemoveRef.current = handleRemove;

  const syncSavedMarkers = useCallback(
    (map: L.Map, layer: L.LayerGroup, places: MapSavedPlace[]) => {
      layer.clearLayers();
      for (const place of places) {
        const color = pinColor(place);
        const marker = L.marker([place.lat, place.lng], {
          icon: savedPinIcon(color),
        });
        marker.bindPopup(popupHtml(place, canEditRef.current), {
          maxWidth: 240,
          closeButton: true,
        });
        marker.addTo(layer);
        if (showTooltipsRef.current) {
          attachPinTooltip(marker, place.label, color);
        }
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

    const initialStyle = resolveMapStyle(mapStyleIdRef.current);
    tileLayerRef.current = L.tileLayer(initialStyle.url, {
      attribution: initialStyle.attribution,
      maxZoom: initialStyle.maxZoom,
    }).addTo(map);

    const primaryMarker = L.marker([primaryLat, primaryLng], {
      icon: PRIMARY_PIN_ICON,
    }).addTo(map);
    if (showTooltipsRef.current) {
      attachPinTooltip(
        primaryMarker,
        primaryLabel,
        canvasColors.mapPrimary,
        "map-pin-tooltip--primary",
      );
    }

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
      tileLayerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Swap the basemap tiles when the selected style changes. The init effect
  // already created the layer for the mount-time style, so this only runs on
  // an actual change (add the new layer before removing the old to avoid a
  // blank-map flash).
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const style = resolveMapStyle(mapStyleId);
    if (style.id === appliedStyleIdRef.current && tileLayerRef.current) return;
    const previous = tileLayerRef.current;
    const next = L.tileLayer(style.url, {
      attribution: style.attribution,
      maxZoom: style.maxZoom,
    }).addTo(map);
    if (previous) map.removeLayer(previous);
    tileLayerRef.current = next;
    appliedStyleIdRef.current = style.id;
  }, [mapStyleId]);

  useEffect(() => {
    const map = mapRef.current;
    const layer = savedLayerRef.current;
    if (!map || !layer) return;
    syncSavedMarkers(map, layer, savedPlacesRef.current);
    // `savedPlacesKey` stands in for `savedPlaces` (whose reference churns).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [savedPlacesKey, canEdit, syncSavedMarkers]);

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
      <div
        data-no-drag
        className="absolute right-2 top-2 z-[500] flex max-w-[calc(100%-1rem)] flex-wrap items-start justify-end gap-2"
      >
        {canEdit && (
          <MapStylePicker styleId={mapStyleId} onSelect={onSetMapStyle} />
        )}
        {canEdit && (
          <AddPinButton
            active={addPinMode}
            saving={saving}
            onToggle={() => setAddPinMode((v) => !v)}
          />
        )}
        <MapSearchBar onSelect={handleSearchSelect} />
      </div>
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
  const mapStyleId = resolveMapStyle(payload.data.mapStyle).id;

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

  const handleSetMapStyle = useCallback(
    (styleId: string) => {
      if (!artifactId) return;
      saveMapArtifactVersion(artifactId, {
        ...payload,
        data: {
          ...payload.data,
          mapStyle: styleId === DEFAULT_MAP_STYLE_ID ? undefined : styleId,
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
          mapStyleId={mapStyleId}
          onSetMapStyle={handleSetMapStyle}
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
          mapStyleId={mapStyleId}
          onSetMapStyle={handleSetMapStyle}
        />
      </div>
    </ArtifactContentStage>
  );
}
