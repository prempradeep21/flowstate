import type { ArtifactKind, ArtifactPayload } from "@/lib/artifactTypes";
import { normalizeTableArtifactData } from "@/lib/tableArtifact";
import type { CodeVariant, ExportContext } from "@/lib/artifactExport/types";
import {
  tableToCsv,
  tableToHtml,
  tableToMarkdown,
  tableToReact,
} from "@/lib/artifactExport/serializers/table";
import {
  chartToCsv,
  chartToHtml,
  chartToJson,
  chartToReact,
} from "@/lib/artifactExport/serializers/chart";
import {
  calendarToIcs,
  payloadToJson,
  timelineToCsv,
  timelineToMarkdown,
  todoToHtml,
  todoToMarkdown,
  todoToReact,
} from "@/lib/artifactExport/serializers/generic";
import {
  customToHtmlFile,
  customToReact,
  embedToIframeHtml,
  imagesToHtml,
  imagesToMarkdown,
  mapToEmbedHtml,
  mapToGeoJson,
  audioToHtml,
  websiteToEmbedHtml,
} from "@/lib/artifactExport/serializers/media";

export function getCodeVariants(
  kind: ArtifactKind,
  payload: ArtifactPayload,
): CodeVariant[] {
  const variants: CodeVariant[] = [{ id: "json", label: "JSON" }];

  switch (kind) {
    case "table":
      variants.push(
        { id: "html", label: "HTML" },
        { id: "react", label: "React" },
        { id: "csv", label: "CSV" },
        { id: "markdown", label: "Markdown" },
      );
      break;
    case "chart":
      variants.push(
        { id: "html", label: "HTML" },
        { id: "react", label: "React" },
        { id: "csv", label: "CSV" },
      );
      break;
    case "custom":
      variants.push({ id: "html", label: "HTML" }, { id: "react", label: "React" });
      break;
    case "todo":
      variants.push(
        { id: "html", label: "HTML" },
        { id: "react", label: "React" },
        { id: "markdown", label: "Markdown" },
      );
      break;
    case "calendar":
      variants.push({ id: "ics", label: "ICS" });
      break;
    case "timeline":
      variants.push({ id: "csv", label: "CSV" }, { id: "markdown", label: "Markdown" });
      break;
    case "images":
      variants.push({ id: "html", label: "HTML" }, { id: "markdown", label: "Markdown" });
      break;
    case "map":
      variants.push({ id: "geojson", label: "GeoJSON" }, { id: "embed", label: "Embed HTML" });
      break;
    case "streetview":
      variants.push({ id: "embed", label: "Embed HTML" });
      break;
    case "website":
    case "embed":
      variants.push({ id: "embed", label: "Embed HTML" });
      break;
    case "audio":
      variants.push({ id: "html", label: "HTML" });
      break;
    case "google-doc":
      if (payload.type === "google-doc" && payload.data.extractedText) {
        variants.push({ id: "markdown", label: "Text" });
      }
      break;
    default:
      break;
  }

  return variants;
}

export function generateCodeVariant(ctx: ExportContext, variantId: CodeVariant["id"]): string {
  const { kind, payload, title, chartMeta } = ctx;

  if (variantId === "json") {
    if (payload.type === "chart") return chartToJson(payload.data);
    if (payload.type === "repo") return payloadToJson(payload.data);
    return payloadToJson(payload.data);
  }

  switch (kind) {
    case "table":
      if (payload.type !== "table") break;
      {
        const data = normalizeTableArtifactData(payload.data);
        if (variantId === "html") return tableToHtml(data);
        if (variantId === "react") return tableToReact(data);
        if (variantId === "csv") return tableToCsv(data);
        if (variantId === "markdown") return tableToMarkdown(data);
      }
      break;
    case "chart":
      if (payload.type !== "chart") break;
      if (variantId === "html") return chartToHtml(payload.data, chartMeta);
      if (variantId === "react") return chartToReact(payload.data, chartMeta);
      if (variantId === "csv") return chartToCsv(payload.data);
      break;
    case "custom":
      if (payload.type !== "custom") break;
      if (variantId === "html") return customToHtmlFile(payload.data);
      if (variantId === "react") return customToReact(payload.data);
      break;
    case "todo":
      if (payload.type !== "todo") break;
      if (variantId === "html") return todoToHtml(payload.data);
      if (variantId === "react") return todoToReact(payload.data);
      if (variantId === "markdown") return todoToMarkdown(payload.data);
      break;
    case "calendar":
      if (payload.type !== "calendar") break;
      if (variantId === "ics") return calendarToIcs(payload.data, title);
      break;
    case "timeline":
      if (payload.type !== "timeline") break;
      if (variantId === "csv") return timelineToCsv(payload.data);
      if (variantId === "markdown") return timelineToMarkdown(payload.data);
      break;
    case "images":
      if (payload.type !== "images") break;
      if (variantId === "html") return imagesToHtml(payload.data);
      if (variantId === "markdown") return imagesToMarkdown(payload.data);
      break;
    case "map":
      if (payload.type !== "map") break;
      if (variantId === "geojson") return mapToGeoJson(payload.data);
      if (variantId === "embed") return mapToEmbedHtml(payload.data);
      break;
    case "streetview":
      if (payload.type !== "streetview") break;
      if (variantId === "embed") {
        const lat = payload.data.place.lat ?? 0;
        const lng = payload.data.place.lng ?? 0;
        return `<iframe width="600" height="450" style="border:0" loading="lazy" src="https://www.google.com/maps/embed?pb=!4v0!6m8!1m7!1s!2m2!1d${lat}!2d${lng}!3f${payload.data.heading ?? 0}!4f${payload.data.pitch ?? 0}!5f${payload.data.fov ?? 90}"></iframe>`;
      }
      break;
    case "website":
      if (payload.type !== "website") break;
      if (variantId === "embed") return websiteToEmbedHtml(payload.data);
      break;
    case "embed":
      if (payload.type !== "embed") break;
      if (variantId === "embed") return embedToIframeHtml(payload.data);
      break;
    case "audio":
      if (payload.type !== "audio") break;
      if (variantId === "html") return audioToHtml(payload.data);
      break;
    case "google-doc":
      if (payload.type === "google-doc" && variantId === "markdown") {
        return payload.data.extractedText ?? "";
      }
      break;
    default:
      break;
  }

  return payloadToJson(payload.data);
}
