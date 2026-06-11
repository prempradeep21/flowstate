"use client";

import {
  applyEmittedArtifact,
  AskCallbacks,
  AskHandle,
} from "@/lib/dummyLLM";
import type { EmittedArtifact, ResponseType } from "@/lib/artifactTypes";
import { buildAncestorHistory } from "@/lib/buildAncestorHistory";
import { resolveEditingPayloadForApi } from "@/lib/artifactGeneration";
import {
  CALENDAR_THINKING_LABEL,
  CHART_THINKING_LABEL,
  CUSTOM_UI_THINKING_LABEL,
  detectCalendarIntent,
  detectCustomUiIntent,
  detectTimelineIntent,
  TIMELINE_THINKING_LABEL,
} from "@/lib/artifactIntent";
import {
  ClaudeModel,
  CardImage,
  CanvasAsset,
  PendingFileAttachment,
  useCanvasStore,
} from "./store";

const MAX_ASSET_TEXT_CONTEXT_CHARS = 60_000;

async function blobToBase64(blob: Blob): Promise<string> {
  const buffer = await blob.arrayBuffer();
  let binary = "";
  const bytes = new Uint8Array(buffer);
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}

function isTextAsset(asset: CanvasAsset): boolean {
  return (
    asset.kind === "code" ||
    asset.mimeType.startsWith("text/") ||
    asset.mimeType === "application/json"
  );
}

async function registerConversation(
  conversationId: string,
  parentConversationId: string | null,
): Promise<void> {
  await fetch("/api/conversations", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ conversationId, parentConversationId }),
  });
}

export function askClaude(
  cardId: string,
  parentConversationId: string | null,
  question: string,
  model: ClaudeModel,
  cb: AskCallbacks,
): AskHandle {
  let cancelled = false;
  const controller = new AbortController();
  let responseType: ResponseType = "text";
  let receivedContent = false;

  const run = async () => {
    if (cancelled) return;
    cb.onThinking(
      detectCalendarIntent(question)
        ? CALENDAR_THINKING_LABEL
        : detectTimelineIntent(question)
          ? TIMELINE_THINKING_LABEL
          : detectCustomUiIntent(question)
            ? CUSTOM_UI_THINKING_LABEL
            : "Thinking",
    );
    try {
      const state = useCanvasStore.getState();
      const card = state.cards[cardId];
      const history = buildAncestorHistory(
        {
          cards: state.cards,
          connections: state.connections,
          sessionArtifacts: state.sessionArtifacts,
        },
        cardId,
      );

      const editingArtifact = resolveEditingPayloadForApi(cardId);

      const files: PendingFileAttachment[] = [];
      const assetTextContexts: string[] = [];
      const skillTextContexts: string[] = [];
      for (const file of card?.pendingFiles ?? []) {
        if (
          file.mimeType.startsWith("text/") ||
          file.mimeType === "application/json"
        ) {
          try {
            const bytes = Uint8Array.from(atob(file.base64), (c) =>
              c.charCodeAt(0),
            );
            const raw = new TextDecoder().decode(bytes);
            const truncated = raw.length > MAX_ASSET_TEXT_CONTEXT_CHARS;
            const text = truncated
              ? raw.slice(0, MAX_ASSET_TEXT_CONTEXT_CHARS)
              : raw;
            assetTextContexts.push(
              `Attached file: ${file.name}\n${text}${
                truncated ? "\n[File truncated due to size limit]" : ""
              }`,
            );
          } catch {
            assetTextContexts.push(`Attached file: ${file.name} could not be read.`);
          }
          continue;
        }
        files.push(file);
      }
      if (card?.images?.length) {
        for (const img of card.images) {
          if (img.url.startsWith("data:")) {
            const m = img.url.match(/^data:([^;]+);base64,(.+)$/);
            if (m) {
              files.push({
                name: "image.png",
                mimeType: m[1],
                base64: m[2],
              });
            }
          }
        }
      }

      for (const ref of card?.attachedAssets ?? []) {
        const asset = state.canvasAssets[ref.assetId];
        if (!asset?.publicUrl) continue;
        try {
          const response = await fetch(asset.publicUrl);
          if (!response.ok) continue;
          const blob = await response.blob();
          if (asset.mimeType.startsWith("image/") || asset.mimeType === "application/pdf") {
            files.push({
              name: asset.name,
              mimeType: asset.mimeType,
              base64: await blobToBase64(blob),
            });
          } else if (isTextAsset(asset)) {
            const raw = await blob.text();
            const truncated = raw.length > MAX_ASSET_TEXT_CONTEXT_CHARS;
            const text = truncated
              ? raw.slice(0, MAX_ASSET_TEXT_CONTEXT_CHARS)
              : raw;
            assetTextContexts.push(
              `Asset: ${asset.name} (${asset.mimeType})\n${text}${
                truncated ? "\n[Asset truncated due to size limit]" : ""
              }`,
            );
          }
        } catch {
          assetTextContexts.push(
            `Asset: ${asset.name} (${asset.mimeType}) could not be loaded.`,
          );
        }
      }

      for (const ref of card?.attachedSkills ?? []) {
        const skill = state.canvasSkills[ref.skillId];
        if (!skill?.publicUrl) continue;
        try {
          const response = await fetch(skill.publicUrl);
          if (!response.ok) continue;
          const raw = await response.text();
          const truncated = raw.length > MAX_ASSET_TEXT_CONTEXT_CHARS;
          const text = truncated
            ? raw.slice(0, MAX_ASSET_TEXT_CONTEXT_CHARS)
            : raw;
          skillTextContexts.push(
            `Skill: ${skill.title}\n${text}${
              truncated ? "\n[Skill truncated due to size limit]" : ""
            }`,
          );
        } catch {
          skillTextContexts.push(
            `Skill: ${skill.title} could not be loaded.`,
          );
        }
      }

      await registerConversation(cardId, parentConversationId);
      const contextBlocks: string[] = [];
      if (assetTextContexts.length > 0) {
        contextBlocks.push(
          `Attached asset context:\n\n${assetTextContexts.join("\n\n---\n\n")}`,
        );
      }
      if (skillTextContexts.length > 0) {
        contextBlocks.push(
          `Attached skill context:\n\n${skillTextContexts.join("\n\n---\n\n")}`,
        );
      }
      const questionWithAssetContext =
        contextBlocks.length > 0
          ? `${question}\n\n${contextBlocks.join("\n\n")}`
          : question;

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          conversationId: cardId,
          parentConversationId,
          question: questionWithAssetContext,
          model,
          history,
          files: files.length > 0 ? files.map((f) => ({ name: f.name, type: f.mimeType, data: f.base64 })) : undefined,
          editingArtifact,
        }),
        signal: controller.signal,
      });

      if (!res.ok) {
        if (cancelled) return;
        receivedContent = true;
        cb.onThinking?.(`Request failed (${res.status})`);
        cb.onToken(`Error: HTTP ${res.status}`);
        cb.onDone({ artifactId: null, responseType: "text" });
        return;
      }

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let acc = "";
      let buf = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done || cancelled) break;
        buf += decoder.decode(value, { stream: true });
        const parts = buf.split("\n\n");
        buf = parts.pop() ?? "";
        for (const part of parts) {
          const line = part.trim();
          if (!line.startsWith("data: ")) continue;
          const raw = line.slice(6);
          if (raw === "[DONE]") continue;
          try {
            const parsed = JSON.parse(raw);
            if (parsed.images) {
              receivedContent = true;
              responseType = "image";
              cb.onResponseType?.("image");
              cb.onImages?.(parsed.images as CardImage[]);
            } else if (parsed.artifact) {
              receivedContent = true;
              const raw = parsed.artifact as {
                type?: string;
                title?: string;
                description?: string;
                data?: Record<string, unknown>;
              };
              const validTypes = [
                "table",
                "code",
                "video",
                "custom",
                "3d",
                "map",
                "streetview",
                "todo",
                "calendar",
                "timeline",
                "chart",
              ] as const;
              if (
                !raw.type ||
                !validTypes.includes(raw.type as (typeof validTypes)[number])
              ) {
                continue;
              }
              const artifact: EmittedArtifact = {
                type: raw.type as EmittedArtifact["type"],
                title: raw.title ?? "Artifact",
                description: raw.description,
                data: raw.data ?? {},
              };
              responseType = artifact.type;
              cb.onResponseType?.(artifact.type);
              cb.onArtifact?.(artifact);
            } else if (parsed.responseType === "image") {
              responseType = "image";
              cb.onResponseType?.("image");
            } else if (parsed.pendingArtifact?.type === "table") {
              cb.onThinking?.("Building table…");
            } else if (parsed.pendingArtifact?.type === "calendar") {
              cb.onThinking?.(CALENDAR_THINKING_LABEL);
            } else if (parsed.pendingArtifact?.type === "timeline") {
              cb.onThinking?.(TIMELINE_THINKING_LABEL);
            } else if (parsed.pendingArtifact?.type === "custom") {
              cb.onThinking?.(CUSTOM_UI_THINKING_LABEL);
            } else if (parsed.pendingArtifact?.type === "map") {
              cb.onThinking?.("Preparing map…");
            } else if (parsed.pendingArtifact?.type === "chart") {
              cb.onThinking?.(CHART_THINKING_LABEL);
            } else if (parsed.thinking) {
              cb.onThinking(parsed.thinking);
            } else if (parsed.usage) {
              useCanvasStore
                .getState()
                .addUsage(parsed.usage.inputTokens, parsed.usage.outputTokens);
            } else if (parsed.error) {
              receivedContent = true;
              cb.onThinking?.("Request failed");
              acc = acc ? `${acc}\n\n⚠️ ${parsed.error}` : `⚠️ ${parsed.error}`;
              cb.onToken(acc);
            } else if (parsed.text) {
              receivedContent = true;
              acc += parsed.text;
              cb.onToken(acc);
            }
          } catch {
            // malformed chunk — skip
          }
        }
      }
    } catch (err) {
      if (!cancelled) {
        receivedContent = true;
        const msg = err instanceof Error ? err.message : String(err);
        cb.onThinking?.("Request failed");
        cb.onToken(`⚠️ ${msg}`);
      }
    } finally {
      if (!cancelled) {
        if (!receivedContent) {
          cb.onThinking?.("Request failed");
          cb.onToken(
            "⚠️ No response received. The connection may have timed out.",
          );
        }
        cb.onDone({ artifactId: null, responseType });
      }
    }
  };

  run();

  return {
    cancel: () => {
      cancelled = true;
      controller.abort();
    },
  };
}

export { applyEmittedArtifact };
