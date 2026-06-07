"use client";

import L from "leaflet";
import { useEffect, useRef } from "react";
import { ArtifactContentStage } from "@/components/artifacts/ArtifactContentStage";
import type { ArtifactPayload } from "@/lib/artifactTypes";
import "leaflet/dist/leaflet.css";

function MapView({
  lat,
  lng,
  zoom,
  label,
}: {
  lat: number;
  lng: number;
  zoom: number;
  label: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    if (mapRef.current) {
      mapRef.current.remove();
      mapRef.current = null;
    }

    const map = L.map(container, {
      center: [lat, lng],
      zoom,
      scrollWheelZoom: false,
      dragging: false,
      doubleClickZoom: false,
      zoomControl: false,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);

    L.circleMarker([lat, lng], {
      radius: 8,
      color: "#7c3aed",
      fillColor: "#7c3aed",
      fillOpacity: 0.85,
    }).addTo(map);

    mapRef.current = map;

    const resizeTimer = window.setTimeout(() => map.invalidateSize(), 0);

    return () => {
      window.clearTimeout(resizeTimer);
      map.remove();
      mapRef.current = null;
    };
  }, [lat, lng, zoom]);

  return (
    <div className="relative h-full w-full min-h-0">
      <div ref={containerRef} className="h-full w-full" />
      <div className="pointer-events-none absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/50 to-transparent px-3 py-2">
        <p className="truncate text-[11px] font-medium text-white/90">{label}</p>
      </div>
    </div>
  );
}

export function MapArtifactContent({
  payload,
  fill = false,
}: {
  payload: Extract<ArtifactPayload, { type: "map" }>;
  fill?: boolean;
}) {
  const { place, zoom } = payload.data;
  const lat = place.lat;
  const lng = place.lng;
  const label = place.label ?? place.name;

  if (lat == null || lng == null || !Number.isFinite(lat) || !Number.isFinite(lng)) {
    return (
      <ArtifactContentStage fill={fill} className={fill ? undefined : "aspect-[4/3]"}>
        <div className="flex h-full min-h-[200px] items-center justify-center bg-canvas-bg p-4 text-center text-[13px] text-canvas-muted">
          Map location could not be loaded.
        </div>
      </ArtifactContentStage>
    );
  }

  return (
    <ArtifactContentStage fill={fill} className={fill ? undefined : "aspect-[4/3]"}>
      <div className={fill ? "h-full min-h-0" : "min-h-[280px] h-full"}>
        <MapView lat={lat} lng={lng} zoom={zoom} label={label} />
      </div>
    </ArtifactContentStage>
  );
}
