import type { ImagesArtifactData } from "@/lib/artifactTypes";
import type { CustomArtifactData } from "@/lib/artifactTypes";
import type { MapArtifactData } from "@/lib/artifactTypes";
import type { EmbedArtifactData, WebsiteArtifactData } from "@/lib/artifactTypes";
import type { ThreeDArtifactData } from "@/lib/artifactTypes";
import type { AudioArtifactData } from "@/lib/artifactTypes";
import type { GoogleWorkspaceArtifactData } from "@/lib/artifactTypes";
import type { RepoArtifactData } from "@/lib/artifactTypes";
import { buildCustomSrcdoc } from "@/lib/customArtifact";

export function isSvgUrl(url: string): boolean {
  try {
    const path = new URL(url, "https://example.com").pathname.toLowerCase();
    return path.endsWith(".svg");
  } catch {
    return url.toLowerCase().includes(".svg");
  }
}

export function imagesToHtml(data: ImagesArtifactData): string {
  const items = data.items
    .filter((item) => item.kind === "image")
    .map(
      (item) =>
        `<figure><img src="${escapeAttr(item.url)}" alt="${escapeAttr(item.alt ?? "")}" style="max-width:100%;height:auto;" /></figure>`,
    )
    .join("\n");
  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8" /><title>Images</title></head>
<body style="font-family:system-ui;padding:16px;">${items || "<p>No images</p>"}</body></html>`;
}

export function imagesToMarkdown(data: ImagesArtifactData): string {
  return data.items
    .filter((item) => item.kind === "image")
    .map((item) => `![${item.alt ?? "image"}](${item.url})`)
    .join("\n");
}

export function customToHtmlFile(data: CustomArtifactData): string {
  return buildCustomSrcdoc(data);
}

export function customToReact(data: CustomArtifactData): string {
  const srcdoc = buildCustomSrcdoc(data);
  return `import React from "react";

const srcDoc = ${JSON.stringify(srcdoc)};

export default function CustomUiPreview() {
  return (
    <iframe
      title="Custom UI"
      sandbox="allow-scripts"
      srcDoc={srcDoc}
      style={{ width: "100%", height: 480, border: "none" }}
    />
  );
}`;
}

export function mapToGeoJson(data: MapArtifactData): string {
  const features = [];
  if (data.place.lat != null && data.place.lng != null) {
    features.push({
      type: "Feature",
      properties: { name: data.place.name, label: data.place.label },
      geometry: { type: "Point", coordinates: [data.place.lng, data.place.lat] },
    });
  }
  for (const place of data.savedPlaces ?? []) {
    features.push({
      type: "Feature",
      properties: { name: place.label, type: place.type },
      geometry: { type: "Point", coordinates: [place.lng, place.lat] },
    });
  }
  return JSON.stringify({ type: "FeatureCollection", features }, null, 2);
}

export function mapToEmbedHtml(data: MapArtifactData): string {
  const lat = data.place.lat ?? 0;
  const lng = data.place.lng ?? 0;
  const q = encodeURIComponent(data.place.name || `${lat},${lng}`);
  return `<iframe
  width="600"
  height="450"
  style="border:0"
  loading="lazy"
  referrerpolicy="no-referrer-when-downgrade"
  src="https://www.google.com/maps?q=${q}&output=embed&z=${data.zoom}">
</iframe>`;
}

export function websiteToEmbedHtml(data: WebsiteArtifactData): string {
  return `<a href="${escapeAttr(data.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(data.title || data.url)}</a>`;
}

export function embedToIframeHtml(data: EmbedArtifactData): string {
  if (data.embedHtml) return data.embedHtml;
  if (data.iframeSrc) {
    return `<iframe src="${escapeAttr(data.iframeSrc)}" width="${data.embedWidth}" height="${data.embedHeight}" frameborder="0" allowfullscreen></iframe>`;
  }
  return `<a href="${escapeAttr(data.url)}">${escapeHtml(data.title)}</a>`;
}

export function audioToHtml(data: AudioArtifactData): string {
  return `<audio controls src="${escapeAttr(data.publicUrl)}"></audio>`;
}

export function googleDocToText(data: GoogleWorkspaceArtifactData): string {
  return data.extractedText ?? "";
}

export function repoToJson(data: RepoArtifactData): string {
  return JSON.stringify(data, null, 2);
}

export function threeDModelUrl(data: ThreeDArtifactData): string {
  return data.modelUrl;
}

function escapeAttr(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
}

function escapeHtml(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
