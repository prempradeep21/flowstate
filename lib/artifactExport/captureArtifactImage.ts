import { toBlob, toJpeg, toPng } from "html-to-image";
import type { ExportImageFormat } from "@/lib/artifactExport/types";
import { dataUrlToBlob } from "@/lib/artifactExport/download";

const EXPORT_PIXEL_RATIO = 3;

function shouldSkipNode(node: HTMLElement): boolean {
  if (node.dataset.artifactExportExclude !== undefined) return true;
  if (node.classList.contains("artifact-controls-bar")) return true;
  return false;
}

export async function captureElementAsBlob(
  element: HTMLElement,
  format: ExportImageFormat,
  backgroundColor: string,
): Promise<Blob | null> {
  const options = {
    pixelRatio: EXPORT_PIXEL_RATIO,
    backgroundColor,
    filter: (node: HTMLElement) => {
      if (!(node instanceof HTMLElement)) return true;
      return !shouldSkipNode(node);
    },
  };

  try {
    const blob = await toBlob(element, options);
    if (blob) return blob;
  } catch {
    /* fall through */
  }

  try {
    const dataUrl =
      format === "jpeg"
        ? await toJpeg(element, { ...options, quality: 0.95 })
        : await toPng(element, options);
    return dataUrlToBlob(dataUrl);
  } catch {
    return null;
  }
}

export async function captureElementAsDataUrl(
  element: HTMLElement,
  format: ExportImageFormat,
  backgroundColor: string,
): Promise<string | null> {
  const options = {
    pixelRatio: EXPORT_PIXEL_RATIO,
    backgroundColor,
    filter: (node: HTMLElement) => {
      if (!(node instanceof HTMLElement)) return true;
      return !shouldSkipNode(node);
    },
  };

  try {
    if (format === "jpeg") {
      return toJpeg(element, { ...options, quality: 0.95 });
    }
    return toPng(element, options);
  } catch {
    return null;
  }
}
