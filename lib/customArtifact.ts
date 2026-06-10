import type { CustomArtifactData } from "@/lib/artifactTypes";
import { canvasColors } from "@/lib/design/tokens";
import { withEmojiFontFamily } from "@/lib/richTextDisplay";

export const CUSTOM_ARTIFACT_MAX_BYTES = 50 * 1024;

const BASE_CSS = `
  *, *::before, *::after { box-sizing: border-box; }
  html, body { margin: 0; height: 100%; }
  body {
    font-family: ${withEmojiFontFamily("ui-sans-serif, system-ui, -apple-system, sans-serif")};
    font-size: 14px;
    line-height: 1.5;
    color: ${canvasColors.stageDark};
    background: ${canvasColors.bg};
    overflow: auto;
  }
`;

export function normalizeCustomArtifactData(
  raw: Record<string, unknown>,
): CustomArtifactData | null {
  const html =
    typeof raw.html === "string"
      ? raw.html.trim()
      : typeof raw.HTML === "string"
        ? raw.HTML.trim()
        : "";

  if (html) {
    return {
      html,
      css: typeof raw.css === "string" ? raw.css : undefined,
      js: typeof raw.js === "string" ? raw.js : undefined,
    };
  }

  return null;
}

export function customArtifactByteSize(data: CustomArtifactData): number {
  return (
    data.html.length +
    (data.css?.length ?? 0) +
    (data.js?.length ?? 0)
  );
}

export function buildCustomSrcdoc(data: CustomArtifactData): string {
  const css = `${BASE_CSS}\n${data.css ?? ""}`;
  const js = data.js?.trim() ?? "";
  const scriptBlock = js
    ? `<script>${js.replace(/<\/script/gi, "<\\/script")}</script>`
    : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<style>${css.replace(/<\/style/gi, "<\\/style")}</style>
</head>
<body>
${data.html}
${scriptBlock}
</body>
</html>`;
}
