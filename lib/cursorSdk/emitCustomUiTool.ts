import type { SDKCustomTool, SDKJsonValue } from "@cursor/sdk";
import {
  CUSTOM_ARTIFACT_MAX_BYTES,
  customArtifactByteSize,
  normalizeCustomArtifactData,
} from "@/lib/customArtifact";
import type { CustomArtifactPayload } from "@/lib/customArtifactShortcuts";

export type EmitCustomUiCapture = CustomArtifactPayload | null;

function asString(value: SDKJsonValue | undefined): string | undefined {
  return typeof value === "string" ? value : undefined;
}

export function createEmitCustomUiTool(
  onCapture: (payload: CustomArtifactPayload) => void,
): SDKCustomTool {
  return {
    description:
      "Deliver the finished custom UI artifact to the Flowstate canvas. Required: title and html. Optional: css, js, description.",
    inputSchema: {
      type: "object",
      properties: {
        title: { type: "string", description: "Artifact title shown on the card" },
        description: { type: "string", description: "Optional subtitle" },
        html: { type: "string", description: "Body markup (required)" },
        css: { type: "string", description: "Styles for the UI" },
        js: { type: "string", description: "Vanilla JS for interactivity" },
      },
      required: ["title", "html"],
    },
    execute: async (args) => {
      const title = asString(args.title)?.trim() || "Custom UI";
      const description = asString(args.description);
      const normalized = normalizeCustomArtifactData({
        html: asString(args.html) ?? "",
        css: asString(args.css),
        js: asString(args.js),
      });

      if (!normalized?.html) {
        return {
          content: [
            {
              type: "text",
              text: "emit_custom_ui requires non-empty html with UI markup.",
            },
          ],
          isError: true,
        };
      }

      if (customArtifactByteSize(normalized) > CUSTOM_ARTIFACT_MAX_BYTES) {
        return {
          content: [
            {
              type: "text",
              text: `Custom UI exceeds ${CUSTOM_ARTIFACT_MAX_BYTES} byte limit. Shorten html/css/js.`,
            },
          ],
          isError: true,
        };
      }

      const payload: CustomArtifactPayload = {
        type: "custom",
        title,
        description,
        data: normalized,
      };
      onCapture(payload);
      return JSON.stringify({ ok: true, title });
    },
  };
}
