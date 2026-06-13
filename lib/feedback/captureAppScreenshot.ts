import { toBlob, toPng } from "html-to-image";
import { dataUrlToBlob } from "@/lib/artifactExport/download";

const FEEDBACK_SCREENSHOT_PIXEL_RATIO = 1.5;

function getAppBackgroundColor(): string {
  const raw = getComputedStyle(document.documentElement)
    .getPropertyValue("--canvas-bg")
    .trim();
  if (!raw) return "#fafaf8";

  const parts = raw.split(/\s+/).map((value) => Number.parseInt(value, 10));
  if (parts.length === 3 && parts.every((value) => !Number.isNaN(value))) {
    return `rgb(${parts.join(", ")})`;
  }

  return "#fafaf8";
}

function shouldExcludeFromScreenshot(node: HTMLElement): boolean {
  if (node.dataset.feedbackCaptureExclude !== undefined) return true;
  return node.closest("[data-feedback-capture-exclude]") !== null;
}

export async function captureAppScreenshot(): Promise<File | null> {
  const root = document.querySelector("main");
  if (!(root instanceof HTMLElement)) return null;

  const options = {
    pixelRatio: FEEDBACK_SCREENSHOT_PIXEL_RATIO,
    backgroundColor: getAppBackgroundColor(),
    cacheBust: true,
    filter: (node: HTMLElement) => {
      if (!(node instanceof HTMLElement)) return true;
      return !shouldExcludeFromScreenshot(node);
    },
  };

  try {
    const blob = await toBlob(root, options);
    if (blob) {
      return new File([blob], `flowstate-screenshot-${Date.now()}.png`, {
        type: "image/png",
      });
    }
  } catch {
    /* fall through */
  }

  try {
    const dataUrl = await toPng(root, options);
    const blob = dataUrlToBlob(dataUrl);
    return new File([blob], `flowstate-screenshot-${Date.now()}.png`, {
      type: "image/png",
    });
  } catch {
    return null;
  }
}
