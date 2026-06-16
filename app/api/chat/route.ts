import { ARTIFACT_PROMPT } from "@/lib/artifactPrompt";
import {
  CALENDAR_INTENT_SYSTEM_NOTE,
  CALENDAR_THINKING_LABEL,
  CHART_INTENT_SYSTEM_NOTE,
  CHART_THINKING_LABEL,
  CUSTOM_UI_THINKING_LABEL,
  detectCalendarIntent,
  detectChartIntent,
  detectCustomUiIntent,
  detectTimelineIntent,
  detectTodoListIntent,
  detectTravelMapIntent,
  MAP_THINKING_LABEL,
  TIMELINE_EDIT_SYSTEM_NOTE,
  TIMELINE_INTENT_SYSTEM_NOTE,
  TIMELINE_THINKING_LABEL,
  TODO_INTENT_SYSTEM_NOTE,
} from "@/lib/artifactIntent";
import { loadMcpConfig } from "@/lib/mcpConfig";
import { getMcpTools } from "@/lib/mcpManager";
import type { McpToolsResult } from "@/lib/mcpManager";
import { getModelProvider, modelSupportsTools } from "@/lib/models";
import type {
  NeutralContentPart,
  NeutralMessage,
  NeutralToolDef,
} from "@/lib/llm/provider";
import { BUILTIN_TOOLS, createToolExecutor } from "@/lib/llm/tools";
import { anthropicProvider } from "@/lib/llm/anthropicProvider";
import { openrouterProvider } from "@/lib/llm/openrouterProvider";

const BASE_SYSTEM =
  `You are a helpful AI assistant with access to tools.\n\n` +
  `Image tool guidance:\n` +
  `- To GENERATE or CREATE an AI image (artistic, fictional, stylized), use the image generation MCP tool if one is connected. Do NOT use search_images for generation requests.\n` +
  `- To SHOW real photos of existing places, people, or things, use search_images (Wikimedia).\n` +
  `- If the user asks to generate an image but no image-generation MCP tool is available, tell them clearly that image generation requires a connected image-gen MCP server (add one via the MCP panel in the top-right).\n\n` +
  ARTIFACT_PROMPT;

const EMPTY_MCP: McpToolsResult = { tools: [], registry: new Map() };

/** Allow long tool-use turns (tables, charts) on serverless hosts. */
export const maxDuration = 60;

export async function POST(req: Request) {
  interface IncomingFile { name: string; type: string; data: string; }
  interface HistoryMessage { question: string; answer: string; }
  const { question, model, files, history: rawHistory, editingArtifact } =
    (await req.json()) as {
      conversationId: string;
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

  // Tool calling drives artifacts; gate it to models that support it.
  const supportsTools = modelSupportsTools(model);
  const allTools: NeutralToolDef[] = supportsTools
    ? [...BUILTIN_TOOLS, ...mcp.tools]
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

  const todoIntent = detectTodoListIntent(question);
  const calendarIntent = detectCalendarIntent(question);
  const timelineIntent = detectTimelineIntent(question);
  const customUiIntent = detectCustomUiIntent(question);
  const travelMapIntent = detectTravelMapIntent(question);
  const chartIntent = detectChartIntent(question);

  const editingPayload =
    editingArtifact?.payload &&
    typeof editingArtifact.payload === "object" &&
    "type" in (editingArtifact.payload as object)
      ? (editingArtifact.payload as { type?: string })
      : null;

  const editingNote = editingArtifact
    ? `\n\nThe user is editing an existing artifact (id: ${editingArtifact.artifactId}). When they ask for changes, call emit_artifact with the full updated payload. Current artifact JSON:\n${JSON.stringify(editingArtifact.payload, null, 2)}${
        editingPayload?.type === "timeline" ? `\n\n${TIMELINE_EDIT_SYSTEM_NOTE}` : ""
      }`
    : "";

  const systemPrompt = [
    BASE_SYSTEM,
    systemContext,
    todoIntent && !editingArtifact ? TODO_INTENT_SYSTEM_NOTE : null,
    calendarIntent && !editingArtifact ? CALENDAR_INTENT_SYSTEM_NOTE : null,
    timelineIntent && !editingArtifact ? TIMELINE_INTENT_SYSTEM_NOTE : null,
    chartIntent && !editingArtifact ? CHART_INTENT_SYSTEM_NOTE : null,
    editingNote || null,
  ]
    .filter(Boolean)
    .join("\n\n");

  // Force emit_artifact on the first turn for strong artifact intents.
  const shouldForceArtifact =
    supportsTools &&
    (todoIntent || calendarIntent || timelineIntent || chartIntent) &&
    (!editingArtifact ||
      (timelineIntent && editingPayload?.type === "timeline") ||
      (todoIntent && editingPayload?.type === "todo") ||
      (calendarIntent && editingPayload?.type === "calendar") ||
      (chartIntent && editingPayload?.type === "chart"));

  const messages: NeutralMessage[] = [
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
      const emit = (data: object) =>
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));

      try {
        // Optimistic pending-artifact hints based on detected intent.
        if (calendarIntent) {
          emit({ thinking: CALENDAR_THINKING_LABEL });
          emit({ pendingArtifact: { type: "calendar" } });
        } else if (timelineIntent) {
          emit({ thinking: TIMELINE_THINKING_LABEL });
          emit({ pendingArtifact: { type: "timeline" } });
        } else if (customUiIntent) {
          emit({ thinking: CUSTOM_UI_THINKING_LABEL });
          emit({ pendingArtifact: { type: "custom" } });
        } else if (travelMapIntent) {
          emit({ thinking: MAP_THINKING_LABEL });
          emit({ pendingArtifact: { type: "map" } });
        } else if (chartIntent) {
          emit({ thinking: CHART_THINKING_LABEL });
          emit({ pendingArtifact: { type: "chart" } });
        }

        const llm = provider === "anthropic" ? anthropicProvider : openrouterProvider;
        const executeTool = createToolExecutor({ emit, mcp });

        const { usage } = await llm.run({
          model,
          apiKey,
          system: systemPrompt,
          messages,
          tools: allTools,
          forceToolFirstTurn: shouldForceArtifact ? "emit_artifact" : undefined,
          emit,
          executeTool,
          signal: req.signal,
        });

        if (usage.inputTokens || usage.outputTokens) {
          emit({ usage });
        }
      } catch (err) {
        let msg = err instanceof Error ? err.message : "Unknown error";
        try {
          const inner = JSON.parse(msg);
          if (inner?.error?.message) msg = inner.error.message;
        } catch {
          /* not JSON */
        }
        emit({ error: msg });
      } finally {
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
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
