import type { ArtifactKind, ArtifactPayload } from "@/lib/artifactTypes";
import { isVideoArtifactPayload } from "@/lib/artifactTypes";
import { normalizeTableArtifactData } from "@/lib/tableArtifact";
import type { ExportMenuItem } from "@/lib/artifactExport/types";
import { isSvgUrl } from "@/lib/artifactExport/serializers/media";
import { tableToGrid } from "@/lib/artifactExport/serializers/table";

export function getExportMenuItems(
  kind: ArtifactKind,
  payload: ArtifactPayload,
): ExportMenuItem[] {
  const items: ExportMenuItem[] = [
    { id: "image-png", label: "Export as image (PNG)", kind: "image-png", section: "image" },
    { id: "image-jpeg", label: "Export as image (JPEG)", kind: "image-jpeg", section: "image" },
    { id: "json", label: "JSON", kind: "json", section: "data" },
  ];

  if (kind === "table" && payload.type === "table") {
    items.push(
      { id: "csv", label: "CSV", kind: "csv", section: "data" },
      { id: "xls", label: "XLS", kind: "xls", section: "data" },
      { id: "xlsx", label: "XLSX", kind: "xlsx", section: "data" },
      { id: "markdown", label: "Markdown table", kind: "markdown", section: "data" },
      { id: "google-sheets", label: "Export to Google Sheets", kind: "google-sheets", section: "google" },
    );
  }

  if (kind === "chart" && payload.type === "chart") {
    items.push(
      { id: "html-file", label: "HTML", kind: "html-file", section: "data" },
      { id: "csv", label: "CSV", kind: "csv", section: "data" },
    );
  }

  if (kind === "code" && payload.type === "code") {
    items.splice(0, items.length);
    items.push(
      { id: "image-png", label: "Export as image (PNG)", kind: "image-png", section: "image" },
      { id: "image-jpeg", label: "Export as image (JPEG)", kind: "image-jpeg", section: "image" },
      { id: "json", label: "JSON", kind: "json", section: "data" },
    );
    for (const file of payload.data.files) {
      items.push({
        id: `file-${file.path}`,
        label: `Download ${file.path}`,
        kind: "code-file",
        section: "download",
      });
    }
  }

  if (kind === "custom" && payload.type === "custom") {
    items.push({ id: "html-file", label: "HTML file", kind: "html-file", section: "data" });
  }

  if (kind === "todo" && payload.type === "todo") {
    items.push({ id: "markdown", label: "Markdown checklist", kind: "markdown", section: "data" });
  }

  if (kind === "calendar" && payload.type === "calendar") {
    items.push({ id: "ics", label: "ICS calendar", kind: "ics", section: "data" });
  }

  if (kind === "timeline" && payload.type === "timeline") {
    items.push(
      { id: "csv", label: "CSV", kind: "csv", section: "data" },
      { id: "markdown", label: "Markdown", kind: "markdown", section: "data" },
    );
  }

  if (kind === "images" && payload.type === "images" && !isVideoArtifactPayload(payload)) {
    const imageItems = payload.data.items.filter((i) => i.kind === "image");
    if (imageItems.length === 1) {
      items.push(
        { id: "download-png", label: "Download PNG", kind: "download-url", section: "data" },
        { id: "download-jpeg", label: "Download JPEG", kind: "download-url", section: "data" },
      );
      if (isSvgUrl(imageItems[0]!.url)) {
        items.push({ id: "svg", label: "Download SVG", kind: "svg", section: "data" });
      }
    }
    items.push({ id: "markdown", label: "Markdown", kind: "markdown", section: "data" });
  }

  if (kind === "map" && payload.type === "map") {
    items.push(
      { id: "geojson", label: "GeoJSON", kind: "geojson", section: "data" },
      { id: "html-embed", label: "Embed HTML", kind: "html-embed", section: "data" },
    );
  }

  if (kind === "website" && payload.type === "website") {
    items.push({ id: "html-embed", label: "Link HTML", kind: "html-embed", section: "data" });
  }

  if (kind === "embed" && payload.type === "embed") {
    items.push({ id: "html-embed", label: "Embed HTML", kind: "html-embed", section: "data" });
  }

  if (kind === "repo" && payload.type === "repo") {
    items.push({ id: "json-repo", label: "Repo JSON", kind: "json", section: "data" });
  }

  if (kind === "google-doc" && payload.type === "google-doc") {
    if (payload.data.extractedText) {
      items.push({ id: "text", label: "Plain text", kind: "text", section: "data" });
    }
  }

  if (kind === "3d" && payload.type === "3d") {
    items.push({
      id: "model-download",
      label: `Download ${payload.data.format?.toUpperCase() ?? "model"}`,
      kind: "download-url",
      section: "download",
    });
  }

  if (kind === "audio" && payload.type === "audio") {
    items.push({
      id: "audio-download",
      label: "Download audio",
      kind: "download-url",
      section: "download",
    });
  }

  return items;
}

export function tableRowsForGoogleSheets(payload: Extract<ArtifactPayload, { type: "table" }>): string[][] {
  const data = normalizeTableArtifactData(payload.data);
  return tableToGrid(data.columns, data.rows);
}
