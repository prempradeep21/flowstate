import Anthropic from "@anthropic-ai/sdk";
import { ARTIFACT_PROMPT } from "@/lib/artifactPrompt";
import {
  CUSTOM_ARTIFACT_MAX_BYTES,
  customArtifactByteSize,
  normalizeCustomArtifactData,
} from "@/lib/customArtifact";
import { geocodeMapArtifact } from "@/lib/geocoding";
import { normalizeCalendarArtifactData } from "@/lib/calendarArtifact";
import { normalizeTimelineArtifactData } from "@/lib/timelineArtifact";
import { fetchChartData } from "@/lib/chartDataFetch";
import { validateChartEmit, normalizeChartArtifactData } from "@/lib/chartArtifact";
import {
  CALENDAR_INTENT_SYSTEM_NOTE,
  CHART_INTENT_SYSTEM_NOTE,
  CUSTOM_UI_EDIT_SYSTEM_NOTE,
  CUSTOM_UI_INLINE_CODE_NOTE,
  CUSTOM_UI_INTENT_SYSTEM_NOTE,
  detectCalendarIntent,
  detectChartIntent,
  detectInlineSourceInQuestion,
  detectTimelineIntent,
  detectTodoListIntent,
  detectTravelMapIntent,
  isCustomUiWork,
  resolveInitialThinkingLabel,
  resolvePrimaryArtifactKind,
  stripAppendedQuestionContext,
  TIMELINE_EDIT_SYSTEM_NOTE,
  TIMELINE_INTENT_SYSTEM_NOTE,
  TODO_INTENT_SYSTEM_NOTE,
} from "@/lib/artifactIntent";
import {
  customEditAckText,
  htmlImportAckText,
  tryImportAttachedHtmlAsCustom,
  trySimpleCustomEdit,
  type CustomArtifactPayload,
} from "@/lib/customArtifactShortcuts";
import { normalizeStreetViewArtifactData } from "@/lib/streetViewArtifact";
import { normalizeTodoArtifactData } from "@/lib/todoArtifact";
import { loadMcpConfig } from "@/lib/mcpConfig";
import { getMcpTools, callMcpTool } from "@/lib/mcpManager";
import type { McpToolsResult, McpImage } from "@/lib/mcpManager";
import {
  QA_TURN_TIMEOUT_ENABLED,
  QA_TURN_TIMEOUT_MS_ACTIVE,
  QA_TURN_TIMEOUT_SECONDS,
} from "@/lib/qaTurnLimits";

const SEARCH_IMAGES_TOOL: Anthropic.Tool = {
  name: "search_images",
  description:
    "Search for and display EXISTING real-world photos from Wikimedia Commons. Use ONLY when the user wants to see real photographs of places, landmarks, people, or things — NOT for AI image generation or creative/artistic image requests. For generation requests, use a connected image-generation MCP tool instead.",
  input_schema: {
    type: "object" as const,
    properties: {
      query: { type: "string", description: "The image search query" },
      count: {
        type: "number",
        description: "Number of images to show (default 4, max 6)",
      },
    },
    required: ["query"],
  },
};

const BASE_SYSTEM =
  `You are a helpful AI assistant with access to tools.\n\n` +
  `Image tool guidance:\n` +
  `- To GENERATE or CREATE an AI image (artistic, fictional, stylized), use the image generation MCP tool if one is connected. Do NOT use search_images for generation requests.\n` +
  `- To SHOW real photos of existing places, people, or things, use search_images (Wikimedia).\n` +
  `- If the user asks to generate an image but no image-generation MCP tool is available, tell them clearly that image generation requires a connected image-gen MCP server (add one via the MCP panel in the top-right).\n\n` +
  ARTIFACT_PROMPT;

const FETCH_CHART_DATA_TOOL: Anthropic.Tool = {
  name: "fetch_chart_data",
  description:
    "Research numeric data for a chart visualization. Call before emit_artifact type chart when the user did not supply complete numbers.",
  input_schema: {
    type: "object" as const,
    properties: {
      topic: { type: "string", description: "Subject to research" },
      chartType: {
        type: "string",
        enum: ["bar", "area", "line", "pie", "gauge"],
        description: "Intended chart type",
      },
      timeRange: {
        type: "string",
        description: "Optional range e.g. 2018-2024",
      },
      unit: {
        type: "string",
        description: "Optional unit e.g. USD, hours, %",
      },
    },
    required: ["topic", "chartType"],
  },
};

const EMIT_ARTIFACT_TOOL: Anthropic.Tool = {
  name: "emit_artifact",
  description:
    "Emit a structured UI artifact for the current canvas card. Use for tables, code files, video grids, custom interactive UI, 3D models, travel maps, calendars, timelines, charts, or to-do lists. Put brief context in your text reply; put structured content here.",
  input_schema: {
    type: "object" as const,
    properties: {
      type: {
        type: "string",
        enum: ["table", "code", "video", "custom", "3d", "map", "streetview", "todo", "calendar", "timeline", "chart"],
        description: "Artifact type to render on the card",
      },
      title: { type: "string", description: "Card artifact title" },
      description: {
        type: "string",
        description: "Optional short subtitle",
      },
      data: {
        type: "object",
        description:
          "Type-specific payload. For custom: { html, css?, js? }. For table: { columns, rows }. For 3d: { modelUrl, format? }. For map: { place: { name } }. For todo: { items: [{ label, checked, dueDate?, priority? }] }.",
      },
    },
    required: ["type", "title", "data"],
  },
};

async function fetchWikimedia(
  query: string,
  count: number,
): Promise<{ url: string; thumb: string; alt: string }[]> {
  const url = new URL("https://commons.wikimedia.org/w/api.php");
  url.searchParams.set("action", "query");
  url.searchParams.set("generator", "search");
  url.searchParams.set("gsrsearch", query);
  url.searchParams.set("gsrnamespace", "6");
  url.searchParams.set("gsrlimit", String(Math.min(count * 2, 12)));
  url.searchParams.set("prop", "imageinfo");
  url.searchParams.set("iiprop", "url|extmetadata");
  url.searchParams.set("iiurlwidth", "800");
  url.searchParams.set("format", "json");
  url.searchParams.set("origin", "*");

  const res = await fetch(url.toString(), {
    headers: { "User-Agent": "FlowstateApp/1.0" },
  });
  if (!res.ok) return [];

  const data = await res.json();
  const pages = Object.values(
    (data?.query?.pages ?? {}) as Record<string, unknown>,
  ) as Record<string, unknown>[];

  return pages
    .filter((p) => {
      const info = (p.imageinfo as Record<string, unknown>[])?.[0];
      if (!info) return false;
      return /\.(jpe?g|png|webp)/i.test((info.url as string) ?? "");
    })
    .slice(0, count)
    .map((p) => {
      const info = (p.imageinfo as Record<string, unknown>[])[0];
      return {
        url: info.url as string,
        thumb: (info.thumburl as string) || (info.url as string),
        alt: ((p.title as string) ?? query)
          .replace("File:", "")
          .replace(/_/g, " "),
      };
    });
}

function mcpImages(imgs: McpImage[]) {
  return imgs.map((img) => {
    const dataUrl = `data:${img.mimeType};base64,${img.data}`;
    return { url: dataUrl, thumb: dataUrl, alt: "Generated image", generated: true };
  });
}

const EMPTY_MCP: McpToolsResult = { anthropicTools: [], registry: new Map() };

/** Match client hard cap for Q&A turns when enabled. Keep in sync with QA_TURN_TIMEOUT_SECONDS. */
export const maxDuration = 180;

export async function POST(req: Request) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return Response.json(
      { error: "ANTHROPIC_API_KEY is not configured" },
      { status: 500 },
    );
  }
  const anthropic = new Anthropic({ apiKey });

  interface IncomingFile { name: string; type: string; data: string; }
  interface HistoryMessage { question: string; answer: string; }
  const { question, model, files, history: rawHistory, editingArtifact } = await req.json() as {
    conversationId: string;
    question: string;
    model: string;
    files?: IncomingFile[];
    history?: HistoryMessage[];
    editingArtifact?: { artifactId: string; payload: unknown };
  };

  const MAX_FULL_HISTORY = 8;
  const allHistory: HistoryMessage[] = rawHistory ?? [];
  let history: HistoryMessage[];
  let systemContext: string | null = null;
  if (allHistory.length > MAX_FULL_HISTORY) {
    const older = allHistory.slice(0, allHistory.length - MAX_FULL_HISTORY);
    history = allHistory.slice(-MAX_FULL_HISTORY);
    systemContext =
      `Earlier in this conversation, the following topics were discussed:\n` +
      older.map((m, i) => `${i + 1}. "${m.question}"`).join("\n");
  } else {
    history = allHistory;
  }

  // Load MCP tools with a 3 s timeout so a slow server never blocks the chat.
  const mcpConfig = loadMcpConfig();
  let mcp: McpToolsResult = EMPTY_MCP;
  if (mcpConfig.servers.some((s) => s.enabled)) {
    try {
      mcp = await Promise.race([
        getMcpTools(mcpConfig.servers),
        new Promise<McpToolsResult>((resolve) =>
          setTimeout(() => resolve(EMPTY_MCP), 3000),
        ),
      ]);
    } catch {
      // proceed without MCP tools
    }
  }

  const allTools: Anthropic.Tool[] = [
    SEARCH_IMAGES_TOOL,
    FETCH_CHART_DATA_TOOL,
    EMIT_ARTIFACT_TOOL,
    ...mcp.anthropicTools,
  ];

  // Build the content for the current user message.
  // If files are attached, send them as image/document blocks before the text.
  const userContent: Anthropic.ContentBlockParam[] = [];
  for (const file of files ?? []) {
    if (file.type.startsWith("image/")) {
      const mediaType = file.type as "image/jpeg" | "image/png" | "image/gif" | "image/webp";
      userContent.push({
        type: "image",
        source: { type: "base64", media_type: mediaType, data: file.data },
      });
    } else if (file.type === "application/pdf") {
      userContent.push({
        type: "document",
        source: { type: "base64", media_type: "application/pdf", data: file.data },
      } as unknown as Anthropic.ContentBlockParam);
    }
  }
  userContent.push({ type: "text", text: question });

  const intentQuestion = stripAppendedQuestionContext(question);

  const todoIntent = detectTodoListIntent(intentQuestion);
  const calendarIntent = detectCalendarIntent(intentQuestion);
  const timelineIntent = detectTimelineIntent(intentQuestion);
  const travelMapIntent = detectTravelMapIntent(intentQuestion);
  const chartIntent = detectChartIntent(intentQuestion);

  const editingPayload =
    editingArtifact?.payload &&
    typeof editingArtifact.payload === "object" &&
    "type" in (editingArtifact.payload as object)
      ? (editingArtifact.payload as { type?: string; title?: string })
      : null;

  const editingCustom = editingPayload?.type === "custom";
  const customUiIntent = isCustomUiWork(intentQuestion, editingPayload);
  const inlineSourceIntent = detectInlineSourceInQuestion(intentQuestion);

  const editingNote = editingArtifact
    ? `\n\nThe user is editing an existing artifact (id: ${editingArtifact.artifactId}). When they ask for changes, call emit_artifact with the full updated payload. Current artifact JSON:\n${JSON.stringify(editingArtifact.payload, null, 2)}${
        editingPayload?.type === "timeline"
          ? `\n\n${TIMELINE_EDIT_SYSTEM_NOTE}`
          : editingCustom
            ? `\n\n${CUSTOM_UI_EDIT_SYSTEM_NOTE}`
            : ""
      }`
    : "";

  let messages: Anthropic.MessageParam[] = [
    ...history.flatMap(({ question: q, answer: a }) => [
      { role: "user" as const, content: q },
      { role: "assistant" as const, content: a },
    ]),
    {
      role: "user" as const,
      content: userContent.length === 1 ? question : userContent,
    },
  ];

  const encoder = new TextEncoder();

  const readable = new ReadableStream({
    async start(controller) {
      const emit = (data: object) => {
        if (closed) return;
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      const totalUsage = { inputTokens: 0, outputTokens: 0 };
      let closed = false;
      const closeStream = () => {
        if (closed) return;
        closed = true;
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
      };
      const hardTimeout =
        QA_TURN_TIMEOUT_ENABLED && QA_TURN_TIMEOUT_MS_ACTIVE > 0
          ? setTimeout(() => {
              emit({
                error: `Request timed out after ${QA_TURN_TIMEOUT_SECONDS / 60} minutes.`,
              });
              closeStream();
            }, QA_TURN_TIMEOUT_MS_ACTIVE)
          : null;

      try {
        const fastCustom = (() => {
          if (editingCustom && editingArtifact?.payload) {
            const patched = trySimpleCustomEdit(
              editingArtifact.payload as CustomArtifactPayload,
              question,
            );
            if (patched) {
              return {
                artifact: patched,
                text: customEditAckText(question),
                thinking: "Applying theme…",
              };
            }
          }
          const imported = tryImportAttachedHtmlAsCustom(question);
          if (imported) {
            return {
              artifact: imported,
              text: htmlImportAckText(imported.title),
              thinking: "Importing HTML…",
            };
          }
          return null;
        })();

        if (fastCustom) {
          emit({ thinking: fastCustom.thinking });
          emit({ pendingArtifact: { type: "custom" } });
          emit({
            artifact: {
              type: fastCustom.artifact.type,
              title: fastCustom.artifact.title,
              description: fastCustom.artifact.description,
              data: fastCustom.artifact.data,
            },
          });
          emit({ text: fastCustom.text });
        } else {
        const primaryKind = resolvePrimaryArtifactKind(
          question,
          editingPayload,
        );
        if (
          primaryKind &&
          (primaryKind === "calendar" ||
            primaryKind === "timeline" ||
            primaryKind === "custom" ||
            primaryKind === "map" ||
            primaryKind === "chart")
        ) {
          emit({
            thinking: resolveInitialThinkingLabel(question, editingPayload),
          });
          emit({ pendingArtifact: { type: primaryKind } });
        }

        // Tool-use loop: Claude may call tools multiple times before a final reply.
        const MAX_TOOL_TURNS = 5;
        let artifactEmitted = false;
        for (let turn = 0; turn < MAX_TOOL_TURNS; turn++) {
          const systemPrompt = [
            BASE_SYSTEM,
            systemContext,
            todoIntent && !editingArtifact ? TODO_INTENT_SYSTEM_NOTE : null,
            calendarIntent && !editingArtifact
              ? CALENDAR_INTENT_SYSTEM_NOTE
              : null,
            timelineIntent && !editingArtifact
              ? TIMELINE_INTENT_SYSTEM_NOTE
              : null,
            chartIntent && !editingArtifact ? CHART_INTENT_SYSTEM_NOTE : null,
            customUiIntent && !editingArtifact
              ? CUSTOM_UI_INTENT_SYSTEM_NOTE
              : null,
            inlineSourceIntent && !editingArtifact
              ? CUSTOM_UI_INLINE_CODE_NOTE
              : null,
            editingNote || null,
          ]
            .filter(Boolean)
            .join("\n\n");
          const stream = anthropic.messages.stream({
            model,
            max_tokens: customUiIntent ? 8192 : 4096,
            system: systemPrompt,
            messages,
            tools: allTools,
            ...((todoIntent ||
              calendarIntent ||
              timelineIntent ||
              chartIntent ||
              customUiIntent) &&
            (!editingArtifact ||
              (timelineIntent && editingPayload?.type === "timeline") ||
              (todoIntent && editingPayload?.type === "todo") ||
              (calendarIntent && editingPayload?.type === "calendar") ||
              (chartIntent && editingPayload?.type === "chart") ||
              (customUiIntent && editingCustom)) &&
            !artifactEmitted &&
            turn === 0
              ? {
                  tool_choice: {
                    type: "tool" as const,
                    name: "emit_artifact",
                  },
                }
              : {}),
          });

          for await (const event of stream) {
            if (
              event.type === "content_block_delta" &&
              event.delta.type === "text_delta"
            ) {
              emit({ text: event.delta.text });
            }
          }

          const msg = await stream.finalMessage();
          totalUsage.inputTokens += msg.usage.input_tokens;
          totalUsage.outputTokens += msg.usage.output_tokens;
          if (msg.usage.input_tokens || msg.usage.output_tokens) {
            emit({
              usage: {
                inputTokens: msg.usage.input_tokens,
                outputTokens: msg.usage.output_tokens,
              },
            });
          }

          if (msg.stop_reason !== "tool_use") break;

          const toolUseBlocks = msg.content.filter(
            (b): b is Anthropic.ToolUseBlock => b.type === "tool_use",
          );

          const toolResults: Anthropic.ToolResultBlockParam[] = [];

          for (const block of toolUseBlocks) {
            const input = block.input as Record<string, unknown>;
            let resultContent = "";

            try {
              if (block.name === "fetch_chart_data") {
                const topic = input.topic as string;
                const chartType = input.chartType as
                  | "bar"
                  | "area"
                  | "line"
                  | "pie"
                  | "gauge";
                emit({ thinking: `Researching data for "${topic}"…` });
                const fetched = await fetchChartData({
                  topic,
                  chartType,
                  timeRange:
                    typeof input.timeRange === "string"
                      ? input.timeRange
                      : undefined,
                  unit:
                    typeof input.unit === "string" ? input.unit : undefined,
                });
                resultContent = JSON.stringify(fetched, null, 2);
              } else if (block.name === "search_images") {
                const query = input.query as string;
                const count =
                  typeof input.count === "number" ? input.count : 4;
                emit({ thinking: `Searching Wikimedia for "${query}"…` });
                const images = await fetchWikimedia(query, count);
                if (images.length) {
                  emit({ images });
                  emit({
                    responseType: "image",
                    artifactTitle: query,
                  });
                }
                resultContent = `Fetched ${images.length} photos from Wikimedia Commons for "${query}".`;
              } else if (block.name === "emit_artifact") {
                const type = input.type as string;
                const title = (input.title as string) ?? "Artifact";
                const description = input.description as string | undefined;
                let data: Record<string, unknown> =
                  (input.data as Record<string, unknown>) ?? {};

                if (type === "custom") {
                  const normalized = normalizeCustomArtifactData(data);
                  if (!normalized?.html) {
                    resultContent =
                      "emit_artifact custom requires non-empty data.html with the UI markup.";
                    toolResults.push({
                      type: "tool_result" as const,
                      tool_use_id: block.id,
                      content: resultContent,
                    });
                    continue;
                  }
                  if (customArtifactByteSize(normalized) > CUSTOM_ARTIFACT_MAX_BYTES) {
                    resultContent = `Custom UI exceeds ${CUSTOM_ARTIFACT_MAX_BYTES} byte limit.`;
                    toolResults.push({
                      type: "tool_result" as const,
                      tool_use_id: block.id,
                      content: resultContent,
                    });
                    continue;
                  }
                  data = normalized as unknown as Record<string, unknown>;
                }

                if (type === "map" || type === "streetview") {
                  const enriched = await geocodeMapArtifact(data);
                  if (!enriched) {
                    resultContent =
                      `emit_artifact ${type} requires data.place.name with a geocodable location (e.g. \"Paris, France\"). Could not geocode the place.`;
                    toolResults.push({
                      type: "tool_result" as const,
                      tool_use_id: block.id,
                      content: resultContent,
                    });
                    continue;
                  }
                  if (type === "streetview") {
                    const sv = normalizeStreetViewArtifactData({
                      ...data,
                      place: enriched.place,
                    });
                    data = sv as unknown as Record<string, unknown>;
                  } else {
                    data = enriched as unknown as Record<string, unknown>;
                  }
                }

                if (type === "todo") {
                  const normalized = normalizeTodoArtifactData(data);
                  if (normalized.items.length === 0) {
                    resultContent =
                      "emit_artifact todo requires data.items with at least one { label, checked } entry.";
                    toolResults.push({
                      type: "tool_result" as const,
                      tool_use_id: block.id,
                      content: resultContent,
                    });
                    continue;
                  }
                  data = normalized as unknown as Record<string, unknown>;
                }

                if (type === "calendar") {
                  data = normalizeCalendarArtifactData(
                    data,
                  ) as unknown as Record<string, unknown>;
                }

                if (type === "timeline") {
                  data = normalizeTimelineArtifactData(
                    data,
                  ) as unknown as Record<string, unknown>;
                }

                if (type === "chart") {
                  const normalized = normalizeChartArtifactData(data);
                  const err = validateChartEmit(normalized);
                  if (err) {
                    resultContent = err;
                    toolResults.push({
                      type: "tool_result" as const,
                      tool_use_id: block.id,
                      content: resultContent,
                    });
                    continue;
                  }
                  data = normalized as unknown as Record<string, unknown>;
                }

                if (type === "table") {
                  emit({ pendingArtifact: { type: "table" } });
                } else if (type === "custom") {
                  emit({ pendingArtifact: { type: "custom" } });
                } else if (type === "chart") {
                  emit({ pendingArtifact: { type: "chart" } });
                }
                emit({ thinking: `Building ${type}…` });
                emit({
                  artifact: { type, title, description, data },
                });
                artifactEmitted = true;
                resultContent = `Emitted ${type} artifact "${title}" for the canvas card.`;
              } else if (mcp.registry.has(block.name)) {
                const server = mcp.registry.get(block.name)!;
                emit({ thinking: `Calling ${server.name}: ${block.name}…` });
                const mcpResult = await callMcpTool(server, block.name, input);
                if (mcpResult.images.length > 0) {
                  emit({ images: mcpImages(mcpResult.images) });
                  emit({ responseType: "image" });
                }
                resultContent = mcpResult.text;
              } else {
                resultContent = `Unknown tool: ${block.name}`;
              }
            } catch (err) {
              resultContent = `Tool error: ${
                err instanceof Error ? err.message : String(err)
              }`;
            }

            toolResults.push({
              type: "tool_result" as const,
              tool_use_id: block.id,
              content: resultContent,
            });
          }

          // Append assistant turn + tool results before next loop iteration.
          messages = [
            ...messages,
            { role: "assistant" as const, content: msg.content },
            { role: "user" as const, content: toolResults },
          ];
        }
        if (customUiIntent && !artifactEmitted) {
          emit({
            error:
              "Custom UI was not saved — no valid artifact was emitted. Try again with a smaller code snippet.",
          });
        }
        }
      } catch (err) {
        if (closed) return;
        let msg = err instanceof Error ? err.message : "Unknown error";
        try {
          const inner = JSON.parse(msg);
          if (inner?.error?.message) msg = inner.error.message;
        } catch {
          /* not JSON */
        }
        if (customUiIntent) {
          msg = `${msg} Custom UI builds can take up to ${QA_TURN_TIMEOUT_SECONDS / 60} minutes — try a smaller change (e.g. "change colors only") or retry.`;
        }
        emit({ error: msg });
      } finally {
        if (hardTimeout) clearTimeout(hardTimeout);
        if (closed) return;
        closeStream();
      }
    },
  });

  return new Response(readable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
