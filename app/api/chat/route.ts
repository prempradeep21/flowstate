import { ARTIFACT_PROMPT } from "@/lib/artifactPrompt";
import {
  CUSTOM_UI_EDIT_SYSTEM_NOTE,
  CUSTOM_UI_INLINE_CODE_NOTE,
  detectCalendarIntent,
  detectChartIntent,
  detectInlineSourceInQuestion,
  detectLiveDataIntent,
  detectTimelineIntent,
  detectTodoListIntent,
  isCustomUiWork,
  LIVE_DATA_SYSTEM_NOTE,
  resolveInitialThinkingLabel,
  resolvePrimaryArtifactKind,
  resolvePrimaryIntentSystemNote,
  STREET_VIEW_EDIT_SYSTEM_NOTE,
  stripAppendedQuestionContext,
  TIMELINE_EDIT_SYSTEM_NOTE,
} from "@/lib/artifactIntent";
import { isAnthropicWebSearchEnabled } from "@/lib/anthropicWebSearch";
import { loadMcpConfig } from "@/lib/mcpConfig";
import { getMcpTools } from "@/lib/mcpManager";
import type { McpToolsResult } from "@/lib/mcpManager";
import { getModel, getModelProvider, modelSupportsTools } from "@/lib/models";
import { findPublishedOpenRouterModel } from "@/lib/modelConfig/publishedModels.server";
import type {
  NeutralContentPart,
  NeutralMessage,
  NeutralToolDef,
} from "@/lib/llm/provider";
import {
  createToolExecutor,
  EMIT_ARTIFACT_TOOL,
  FETCH_CHART_DATA_TOOL,
  SEARCH_IMAGES_TOOL,
} from "@/lib/llm/tools";
import { anthropicProvider } from "@/lib/llm/anthropicProvider";
import { openrouterProvider } from "@/lib/llm/openrouterProvider";
import {
  customEditAckText,
  htmlImportAckText,
  tryImportAttachedHtmlAsCustom,
  trySimpleCustomEdit,
  type CustomArtifactPayload,
} from "@/lib/customArtifactShortcuts";
import {
  CUSTOM_UI_TURN_TIMEOUT_SECONDS,
  QA_TURN_TIMEOUT_ENABLED,
  QA_TURN_TIMEOUT_MS_ACTIVE,
  QA_TURN_TIMEOUT_SECONDS,
} from "@/lib/qaTurnLimits";
import {
  fetchPagesForChat,
  formatFetchedPagesContext,
  shouldAutoFetchUrl,
} from "@/lib/fetchPageContent";
import { extractUrlsFromText } from "@/lib/urlDetection";
import { logQaTurnEvent } from "@/lib/qaTurnEvents.server";

const BASE_SYSTEM =
  `You are a helpful AI assistant with access to tools.\n\n` +
  `Linked pages:\n` +
  `- When the user includes a URL, Flowstate may attach fetched page text below their message. Summarize and explain from that attached content when present.\n` +
  `- Do not say you cannot read or browse a URL when fetched page content is attached.\n` +
  `- Default to your training knowledge for historical facts, evergreen lists, and well-known comparisons.\n` +
  `- web_search is only available when the question requires current/live data — use it sparingly (at most one focused query).\n` +
  `- Cite the source URL when summarizing fetched or searched content.\n\n` +
  `Image tool guidance:\n` +
  `- To GENERATE or CREATE an AI image (artistic, fictional, stylized), use the image generation MCP tool if one is connected. Do NOT use search_images for generation requests.\n` +
  `- To SHOW real photos of existing places, people, or things, use search_images (Wikimedia).\n` +
  `- If the user asks to generate an image but no image-generation MCP tool is available, tell them clearly that image generation requires a connected image-gen MCP server (add one via the MCP panel in the top-right).\n\n` +
  ARTIFACT_PROMPT;

const EMPTY_MCP: McpToolsResult = { tools: [], registry: new Map() };

/** Match client hard cap for Q&A turns when enabled. Keep in sync with QA_TURN_TIMEOUT_SECONDS. */
export const maxDuration = 180;

export async function POST(req: Request) {
  interface IncomingFile { name: string; type: string; data: string; }
  interface HistoryMessage { question: string; answer: string; }
  const {
    question,
    model,
    files,
    history: rawHistory,
    editingArtifact,
    conversationId,
    canvasId,
  } = (await req.json()) as {
    conversationId?: string;
    canvasId?: string;
    question: string;
    model: string;
    files?: IncomingFile[];
    history?: HistoryMessage[];
    editingArtifact?: { artifactId: string; payload: unknown };
  };

  // Pick the provider + its API key from the selected model.
  const provider = getModelProvider(model);
  const apiKey =
    provider === "anthropic"
      ? process.env.ANTHROPIC_API_KEY
      : process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    const envName =
      provider === "anthropic" ? "ANTHROPIC_API_KEY" : "OPENROUTER_API_KEY";
    return Response.json({ error: `${envName} is not configured` }, { status: 500 });
  }

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

  const intentQuestion = stripAppendedQuestionContext(question);

  const liveDataIntent = detectLiveDataIntent(intentQuestion);
  const todoIntent = detectTodoListIntent(intentQuestion);
  const calendarIntent = detectCalendarIntent(intentQuestion);
  const timelineIntent = detectTimelineIntent(intentQuestion);
  const chartIntent = detectChartIntent(intentQuestion);
  const useFetchChartData = chartIntent && !liveDataIntent;
  // Hosted web search is an Anthropic-only capability.
  const webSearchEnabled =
    provider === "anthropic" && isAnthropicWebSearchEnabled() && liveDataIntent;

  const editingPayload =
    editingArtifact?.payload &&
    typeof editingArtifact.payload === "object" &&
    "type" in (editingArtifact.payload as object)
      ? (editingArtifact.payload as { type?: string; title?: string })
      : null;

  const editingCustom = editingPayload?.type === "custom";
  const customUiIntent = isCustomUiWork(intentQuestion, editingPayload);
  const inlineSourceIntent = detectInlineSourceInQuestion(intentQuestion);
  const primaryKind = resolvePrimaryArtifactKind(question, editingPayload);

  // Tool calling drives artifacts; gate it to models that support it. Static
  // registry first, then the admin-published OpenRouter list (so an admin-added
  // text-only model isn't offered tools), else assume supported.
  const supportsTools = getModel(model)
    ? modelSupportsTools(model)
    : findPublishedOpenRouterModel(model)?.supportsTools ?? true;
  const allTools: NeutralToolDef[] = supportsTools
    ? [
        ...(useFetchChartData ? [FETCH_CHART_DATA_TOOL] : []),
        SEARCH_IMAGES_TOOL,
        EMIT_ARTIFACT_TOOL,
        ...mcp.tools,
      ]
    : [];

  // Build the current user message (multimodal parts if files are attached).
  const userParts: NeutralContentPart[] = [];
  for (const file of files ?? []) {
    if (file.type.startsWith("image/")) {
      userParts.push({ type: "image", mediaType: file.type, data: file.data });
    } else if (file.type === "application/pdf") {
      userParts.push({ type: "document", mediaType: file.type, data: file.data });
    }
  }
  userParts.push({ type: "text", text: question });

  const editingNote = editingArtifact
    ? `\n\nThe user is editing an existing artifact (id: ${editingArtifact.artifactId}). When they ask for changes, call emit_artifact with the full updated payload. Current artifact JSON:\n${JSON.stringify(editingArtifact.payload, null, 2)}${
        editingPayload?.type === "timeline"
          ? `\n\n${TIMELINE_EDIT_SYSTEM_NOTE}`
          : editingPayload?.type === "streetview"
            ? `\n\n${STREET_VIEW_EDIT_SYSTEM_NOTE}`
            : editingCustom
              ? `\n\n${CUSTOM_UI_EDIT_SYSTEM_NOTE}`
              : ""
      }`
    : "";

  // Per-request, variable instructions (topic recap, intent notes, artifact-edit
  // payload). Kept SEPARATE from the cached BASE_SYSTEM prefix so the large,
  // stable instruction block stays cache-eligible on the Anthropic path.
  const primaryIntentNote = resolvePrimaryIntentSystemNote(question, editingPayload, {
    useFetchChartData,
    liveData: liveDataIntent,
  });
  const variableSystem = [
    systemContext,
    webSearchEnabled ? LIVE_DATA_SYSTEM_NOTE : null,
    primaryIntentNote,
    inlineSourceIntent && !editingArtifact ? CUSTOM_UI_INLINE_CODE_NOTE : null,
    editingNote || null,
  ]
    .filter(Boolean)
    .join("\n\n");

  // Force emit_artifact on the first turn for strong artifact intents (charts
  // route through fetch_chart_data first, so they are deliberately excluded).
  const shouldForceArtifact =
    supportsTools &&
    (todoIntent ||
      calendarIntent ||
      timelineIntent ||
      customUiIntent ||
      primaryKind === "table") &&
    (!editingArtifact ||
      (timelineIntent && editingPayload?.type === "timeline") ||
      (todoIntent && editingPayload?.type === "todo") ||
      (calendarIntent && editingPayload?.type === "calendar") ||
      (customUiIntent && editingCustom) ||
      (primaryKind === "table" && editingPayload?.type === "table"));

  let messages: NeutralMessage[] = [
    ...history.flatMap(({ question: q, answer: a }) => [
      { role: "user" as const, content: q },
      { role: "assistant" as const, content: a },
    ]),
    {
      role: "user" as const,
      content: userParts.length === 1 ? question : userParts,
    },
  ];

  const encoder = new TextEncoder();

  const readable = new ReadableStream({
    async start(controller) {
      let closed = false;
      let artifactEmitted = false;
      let turnError: string | null = null;

      const emit = (data: object) => {
        if (closed) return;
        if ("artifact" in data) artifactEmitted = true;
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };
      const closeStream = () => {
        if (closed) return;
        closed = true;
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
      };

      const totalUsage = { inputTokens: 0, outputTokens: 0 };
      const turnStartedAt = Date.now();
      let toolTurns = 0;
      let pauseTurns = 0;
      let webSearchBlocks = 0;

      const hardTimeout =
        QA_TURN_TIMEOUT_ENABLED && QA_TURN_TIMEOUT_MS_ACTIVE > 0
          ? setTimeout(() => {
              turnError = `Request timed out after ${QA_TURN_TIMEOUT_SECONDS / 60} minutes.`;
              emit({ error: turnError });
              closeStream();
            }, QA_TURN_TIMEOUT_MS_ACTIVE)
          : null;

      try {
        // Fast paths that skip the model entirely (simple custom-UI theme edits
        // and pasted-HTML imports).
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
          // Optimistic pending-artifact hint based on detected intent.
          if (
            primaryKind &&
            (primaryKind === "calendar" ||
              primaryKind === "timeline" ||
              primaryKind === "custom" ||
              primaryKind === "map" ||
              primaryKind === "chart" ||
              primaryKind === "table")
          ) {
            emit({
              thinking: resolveInitialThinkingLabel(question, editingPayload),
            });
            emit({ pendingArtifact: { type: primaryKind } });
          }

          const autoFetchUrls = extractUrlsFromText(intentQuestion).filter(
            shouldAutoFetchUrl,
          );
          if (autoFetchUrls.length > 0) {
            emit({
              thinking:
                autoFetchUrls.length === 1
                  ? "Reading linked page…"
                  : "Reading linked pages…",
            });
            const pages = await fetchPagesForChat(autoFetchUrls);
            const modelQuestion = question + formatFetchedPagesContext(pages);
            const onlyText = userParts.length === 1 && !(files?.length);
            const finalUserContent: string | NeutralContentPart[] = onlyText
              ? modelQuestion
              : [
                  ...userParts.slice(0, -1),
                  { type: "text" as const, text: modelQuestion },
                ];
            messages = [
              ...messages.slice(0, -1),
              { role: "user" as const, content: finalUserContent },
            ];
          }

          const llm =
            provider === "anthropic" ? anthropicProvider : openrouterProvider;
          const executeTool = createToolExecutor({ emit, mcp });

          const result = await llm.run({
            model,
            apiKey,
            system: BASE_SYSTEM,
            variableSystem: variableSystem || undefined,
            messages,
            tools: allTools,
            forceToolFirstTurn: shouldForceArtifact ? "emit_artifact" : undefined,
            emit,
            executeTool,
            signal: req.signal,
            maxTokens: customUiIntent ? 8192 : 4096,
            enableWebSearch: webSearchEnabled,
          });

          totalUsage.inputTokens = result.usage.inputTokens;
          totalUsage.outputTokens = result.usage.outputTokens;
          toolTurns = result.toolTurns;
          pauseTurns = result.pauseTurns;
          webSearchBlocks = result.webSearchBlocks;
          if (result.errorMessage) turnError = result.errorMessage;

          if (customUiIntent && !artifactEmitted) {
            turnError =
              "Custom UI was not saved — no valid artifact was emitted. Try again with a smaller code snippet.";
            emit({ error: turnError });
          }
        }
      } catch (err) {
        if (!closed) {
          let msg = err instanceof Error ? err.message : "Unknown error";
          try {
            const inner = JSON.parse(msg);
            if (inner?.error?.message) msg = inner.error.message;
          } catch {
            /* not JSON */
          }
          turnError = msg;
          if (customUiIntent) {
            msg = `${msg} Custom UI builds can take up to ${CUSTOM_UI_TURN_TIMEOUT_SECONDS / 60} minutes — try a smaller change (e.g. "change colors only") or retry.`;
          }
          emit({ error: msg });
        }
      } finally {
        if (hardTimeout) clearTimeout(hardTimeout);

        const durationMs = Date.now() - turnStartedAt;
        const outcome =
          turnError?.includes("timed out") || turnError?.includes("timeout")
            ? "timeout"
            : turnError
              ? "error"
              : "success";

        logQaTurnEvent({
          cardId: conversationId ?? null,
          canvasId: canvasId ?? null,
          question,
          model,
          durationMs,
          inputTokens: totalUsage.inputTokens,
          outputTokens: totalUsage.outputTokens,
          toolTurns,
          pauseTurns,
          webSearchBlocks,
          artifactKind: primaryKind,
          outcome,
          errorMessage: turnError,
        });

        if (!closed) closeStream();
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
