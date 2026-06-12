import type { ArtifactPayload } from "@/lib/artifactTypes";
import { normalizeTableArtifactData } from "@/lib/tableArtifact";
import type { ExportContext, ExportActionKind } from "@/lib/artifactExport/types";
import {
  captureElementAsBlob,
} from "@/lib/artifactExport/captureArtifactImage";
import {
  downloadBlob,
  downloadDataUrl,
  downloadText,
  sanitizeExportFilename,
} from "@/lib/artifactExport/download";
import { tableRowsForGoogleSheets } from "@/lib/artifactExport/registry";
import {
  tableToCsv,
  tableToMarkdown,
  tableWorkbookBlob,
} from "@/lib/artifactExport/serializers/table";
import {
  chartToCsv,
  chartToHtml,
  chartToJson,
} from "@/lib/artifactExport/serializers/chart";
import {
  calendarToIcs,
  payloadToJson,
  timelineToCsv,
  timelineToMarkdown,
  todoToMarkdown,
} from "@/lib/artifactExport/serializers/generic";
import {
  customToHtmlFile,
  embedToIframeHtml,
  googleDocToText,
  imagesToMarkdown,
  isSvgUrl,
  mapToEmbedHtml,
  mapToGeoJson,
  repoToJson,
  threeDModelUrl,
  websiteToEmbedHtml,
} from "@/lib/artifactExport/serializers/media";
import { exportTableToGoogleSheets } from "@/lib/artifactExport/googleSheetsExport";

export type ExportResult =
  | { ok: true; message?: string; url?: string }
  | { ok: false; error: string; needsConnect?: boolean };

async function exportImage(
  ctx: ExportContext,
  format: "png" | "jpeg",
): Promise<ExportResult> {
  const bg = ctx.isDark ? "#211F1C" : "#FFFFFF";

  if (ctx.kind === "chart" && ctx.chartHandle) {
    const dataUrl = await ctx.chartHandle.getPngDataUrl(3);
    if (dataUrl) {
      downloadDataUrl(ctx.title, dataUrl, format === "jpeg" ? "jpeg" : "png");
      return { ok: true, message: `Saved ${format.toUpperCase()} image` };
    }
  }

  if (ctx.kind === "images" && ctx.payload.type === "images") {
    const images = ctx.payload.data.items.filter((i) => i.kind === "image");
    if (images.length === 1) {
      try {
        const res = await fetch(images[0]!.url);
        const blob = await res.blob();
        const ext = format === "jpeg" ? "jpg" : "png";
        downloadBlob(sanitizeExportFilename(ctx.title, ext), blob);
        return { ok: true, message: `Downloaded ${format.toUpperCase()}` };
      } catch {
        /* fall through to DOM capture */
      }
    }
  }

  if (!ctx.exportRootEl) {
    return { ok: false, error: "Nothing to capture — try expanding the artifact." };
  }

  const blob = await captureElementAsBlob(ctx.exportRootEl, format, bg);
  if (!blob) {
    return {
      ok: false,
      error: "Could not capture image. Embedded content may be blocked by the browser.",
    };
  }
  downloadBlob(sanitizeExportFilename(ctx.title, format === "jpeg" ? "jpg" : "png"), blob);
  return { ok: true, message: `Saved ${format.toUpperCase()} image` };
}

async function downloadRemoteUrl(url: string, title: string, ext: string): Promise<ExportResult> {
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const blob = await res.blob();
    downloadBlob(sanitizeExportFilename(title, ext), blob);
    return { ok: true, message: "Download started" };
  } catch {
    return { ok: false, error: "Could not download file." };
  }
}

export async function executeExportAction(
  ctx: ExportContext,
  actionKind: ExportActionKind,
  itemId?: string,
): Promise<ExportResult> {
  const { kind, payload, title } = ctx;

  switch (actionKind) {
    case "image-png":
      return exportImage(ctx, "png");
    case "image-jpeg":
      return exportImage(ctx, "jpeg");
    case "json":
      if (payload.type === "chart") {
        downloadText(title, chartToJson(payload.data), "json", "application/json");
      } else if (payload.type === "repo") {
        downloadText(title, repoToJson(payload.data), "json", "application/json");
      } else {
        downloadText(title, payloadToJson(payload.data), "json", "application/json");
      }
      return { ok: true, message: "Downloaded JSON" };
    case "csv":
      if (payload.type === "table") {
        downloadText(title, tableToCsv(normalizeTablePayloadData(payload)), "csv", "text/csv");
      } else if (payload.type === "chart") {
        downloadText(title, chartToCsv(payload.data), "csv", "text/csv");
      } else if (payload.type === "timeline") {
        downloadText(title, timelineToCsv(payload.data), "csv", "text/csv");
      }
      return { ok: true, message: "Downloaded CSV" };
    case "xls":
      if (payload.type === "table") {
        downloadBlob(
          sanitizeExportFilename(title, "xls"),
          tableWorkbookBlob(normalizeTablePayloadData(payload), "xls"),
        );
      }
      return { ok: true, message: "Downloaded XLS" };
    case "xlsx":
      if (payload.type === "table") {
        downloadBlob(
          sanitizeExportFilename(title, "xlsx"),
          tableWorkbookBlob(normalizeTablePayloadData(payload), "xlsx"),
        );
      }
      return { ok: true, message: "Downloaded XLSX" };
    case "markdown":
      if (payload.type === "table") {
        downloadText(title, tableToMarkdown(normalizeTablePayloadData(payload)), "md", "text/markdown");
      } else if (payload.type === "todo") {
        downloadText(title, todoToMarkdown(payload.data), "md", "text/markdown");
      } else if (payload.type === "timeline") {
        downloadText(title, timelineToMarkdown(payload.data), "md", "text/markdown");
      } else if (payload.type === "images") {
        downloadText(title, imagesToMarkdown(payload.data), "md", "text/markdown");
      }
      return { ok: true, message: "Downloaded Markdown" };
    case "html-file":
      if (payload.type === "chart") {
        downloadText(title, chartToHtml(payload.data, ctx.chartMeta), "html", "text/html");
      } else if (payload.type === "custom") {
        downloadText(title, customToHtmlFile(payload.data), "html", "text/html");
      }
      return { ok: true, message: "Downloaded HTML" };
    case "html-embed":
      if (payload.type === "map") {
        downloadText(title, mapToEmbedHtml(payload.data), "html", "text/html");
      } else if (payload.type === "website") {
        downloadText(title, websiteToEmbedHtml(payload.data), "html", "text/html");
      } else if (payload.type === "embed") {
        downloadText(title, embedToIframeHtml(payload.data), "html", "text/html");
      }
      return { ok: true, message: "Downloaded embed HTML" };
    case "ics":
      if (payload.type === "calendar") {
        downloadText(title, calendarToIcs(payload.data, title), "ics", "text/calendar");
      }
      return { ok: true, message: "Downloaded ICS" };
    case "geojson":
      if (payload.type === "map") {
        downloadText(title, mapToGeoJson(payload.data), "geojson", "application/geo+json");
      }
      return { ok: true, message: "Downloaded GeoJSON" };
    case "text":
      if (payload.type === "google-doc") {
        downloadText(title, googleDocToText(payload.data), "txt", "text/plain");
      }
      return { ok: true, message: "Downloaded text" };
    case "svg":
      if (payload.type === "images") {
        const img = payload.data.items.find((i) => i.kind === "image");
        if (img && isSvgUrl(img.url)) {
          return downloadRemoteUrl(img.url, title, "svg");
        }
      }
      return { ok: false, error: "No SVG source available." };
    case "download-url":
      if (payload.type === "audio") {
        const ext = payload.data.fileName.split(".").pop() ?? "audio";
        return downloadRemoteUrl(payload.data.publicUrl, title, ext);
      }
      if (payload.type === "3d") {
        const ext = payload.data.format ?? "glb";
        return downloadRemoteUrl(threeDModelUrl(payload.data), title, ext);
      }
      if (payload.type === "images") {
        const img = payload.data.items.find((i) => i.kind === "image");
        if (img) {
          const ext = itemId === "download-jpeg" ? "jpg" : "png";
          return downloadRemoteUrl(img.url, title, ext);
        }
      }
      return { ok: false, error: "Nothing to download." };
    case "code-file":
      if (payload.type === "code" && itemId?.startsWith("file-")) {
        const path = itemId.slice("file-".length);
        const file = payload.data.files.find((f) => f.path === path);
        if (file) {
          const ext = file.path.split(".").pop() ?? "txt";
          downloadText(file.path, file.content, ext, "text/plain");
          return { ok: true, message: `Downloaded ${file.path}` };
        }
      }
      return { ok: false, error: "File not found." };
    case "google-sheets":
      if (payload.type !== "table") {
        return { ok: false, error: "Google Sheets export is only available for tables." };
      }
      return exportTableToGoogleSheets(title, tableRowsForGoogleSheets(payload));
    default:
      return { ok: false, error: "Unsupported export format." };
  }
}

function normalizeTablePayloadData(
  payload: Extract<ArtifactPayload, { type: "table" }>,
) {
  return normalizeTableArtifactData(payload.data);
}
