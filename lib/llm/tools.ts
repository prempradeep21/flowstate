import type Anthropic from "@anthropic-ai/sdk";
import type OpenAI from "openai";
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
import { normalizeStreetViewArtifactData } from "@/lib/streetViewArtifact";
import { normalizeTodoArtifactData } from "@/lib/todoArtifact";
import { callMcpTool } from "@/lib/mcpManager";
import {
  sanitizeCustomUiSource,
  type CustomUiSourceData,
} from "@/lib/customUiSource";
import type { McpToolsResult, McpImage } from "@/lib/mcpManager";
import { isAuthRequiredError } from "@/lib/mcp/client";
import { resolveApproval } from "@/lib/mcp/approval";
import type { ApprovalContext } from "@/lib/mcp/approval";
import type { EmitFn, NeutralToolDef, ToolCall, ToolExecutor } from "@/lib/llm/provider";

// --- Built-in tool definitions (provider-neutral) ----------------------------

export const SEARCH_IMAGES_TOOL: NeutralToolDef = {
  name: "search_images",
  description:
    "Search for and display EXISTING real-world photos from Wikimedia Commons. Use ONLY when the user wants to see real photographs of places, landmarks, people, or things — NOT for AI image generation or creative/artistic image requests. For generation requests, use a connected image-generation MCP tool instead.",
  inputSchema: {
    type: "object",
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

export const FETCH_CHART_DATA_TOOL: NeutralToolDef = {
  name: "fetch_chart_data",
  description:
    "Research numeric data for a chart visualization. Call before emit_artifact type chart when the user did not supply complete numbers.",
  inputSchema: {
    type: "object",
    properties: {
      topic: { type: "string", description: "Subject to research" },
      chartType: {
        type: "string",
        enum: ["bar", "area", "line", "pie", "gauge"],
        description: "Intended chart type",
      },
      timeRange: { type: "string", description: "Optional range e.g. 2018-2024" },
      unit: { type: "string", description: "Optional unit e.g. USD, hours, %" },
    },
    required: ["topic", "chartType"],
  },
};

export const EMIT_ARTIFACT_TOOL: NeutralToolDef = {
  name: "emit_artifact",
  description:
    "Emit a structured UI artifact for the current canvas card. Use for tables, code files, video grids, custom interactive UI, 3D models, travel maps, calendars, timelines, charts, or to-do lists. Put brief context in your text reply; put structured content here.",
  inputSchema: {
    type: "object",
    properties: {
      type: {
        type: "string",
        enum: ["table", "code", "video", "custom", "3d", "map", "streetview", "todo", "calendar", "timeline", "chart"],
        description: "Artifact type to render on the card",
      },
      title: { type: "string", description: "Card artifact title" },
      description: { type: "string", description: "Optional short subtitle" },
      data: {
        type: "object",
        description:
          "Type-specific payload. For custom: { html, css?, js? }. For table: { columns, rows }. For 3d: { modelUrl, format? }. For map: { place: { name } }. For todo: { items: [{ label, checked, dueDate?, priority? }] }.",
      },
    },
    required: ["type", "title", "data"],
  },
};

export const BUILD_CUSTOM_UI_TOOL: NeutralToolDef = {
  name: "build_custom_ui",
  description:
    "Hand the result of a connected MCP tool to the custom UI builder, which produces a bespoke interactive component on a new follow-up card below this one. " +
    "Use it when an MCP tool has already returned data in this turn AND that data needs interaction to be useful — filtering or sorting across many rows, " +
    "drilling into a graph or nested structure, stepping through a sequence, comparing entities side by side — and no emit_artifact type " +
    "(table, chart, calendar, timeline, todo, map) fits the shape of the data. " +
    "Do not use it for: a handful of rows or a plain list (use emit_artifact table or todo), a single value or short answer (just say it in your reply), " +
    "an error message, or output that already rendered as a card. " +
    "The build runs after this turn finishes, on its own card, and takes about a minute. Call it at most once per turn, " +
    "and still write your normal short text reply — the user reads that while the component builds.",
  inputSchema: {
    type: "object",
    properties: {
      title: {
        type: "string",
        description: 'Short component title shown on the card, e.g. "Knowledge graph explorer".',
      },
      request: {
        type: "string",
        description:
          "One or two sentences telling the builder what to build and what the user should be able to do with it. " +
          "Written for a builder that cannot see this conversation. Describe the interaction, not the data — the data is attached automatically.",
      },
      sourceTool: {
        type: "string",
        description:
          "Name of the MCP tool whose result to hand over. Omit to use the most recent MCP result from this turn.",
      },
    },
    required: ["title", "request"],
  },
};

export const BUILTIN_TOOLS: NeutralToolDef[] = [
  SEARCH_IMAGES_TOOL,
  FETCH_CHART_DATA_TOOL,
  EMIT_ARTIFACT_TOOL,
];

// --- Converters --------------------------------------------------------------

export function toAnthropicTools(defs: NeutralToolDef[]): Anthropic.Tool[] {
  return defs.map((d) => ({
    name: d.name,
    description: d.description,
    input_schema: d.inputSchema as Anthropic.Tool.InputSchema,
  }));
}

export function toOpenAITools(
  defs: NeutralToolDef[],
): OpenAI.Chat.Completions.ChatCompletionTool[] {
  return defs.map((d) => ({
    type: "function",
    function: {
      name: d.name,
      description: d.description,
      parameters: d.inputSchema,
    },
  }));
}

// --- Wikimedia image search --------------------------------------------------

export async function fetchWikimedia(
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
        alt: ((p.title as string) ?? query).replace("File:", "").replace(/_/g, " "),
      };
    });
}

export function mcpImages(imgs: McpImage[]) {
  return imgs.map((img) => {
    const dataUrl = `data:${img.mimeType};base64,${img.data}`;
    return { url: dataUrl, thumb: dataUrl, alt: "Generated image", generated: true };
  });
}

// --- Shared tool executor ----------------------------------------------------

export interface ToolExecContext {
  emit: EmitFn;
  mcp: McpToolsResult;
  /** Present when MCP tools are available (signed-in user with servers). */
  mcpCtx?: Omit<ApprovalContext, "emit"> & { origin?: string };
}

/**
 * Builds the provider-agnostic tool executor. Runs the artifact validation /
 * geocoding / normalization business logic, emits artifact/image/thinking SSE
 * events, and returns the tool-result text the provider feeds back to the model.
 */
export function createToolExecutor({ emit, mcp, mcpCtx }: ToolExecContext): ToolExecutor {
  // Per-turn buffer of MCP results, so build_custom_ui can hand one to the UI
  // builder without the model re-emitting up to 16k chars it already sent.
  // Ring of 4 bounds worst-case memory; only the recent ones are plausible
  // handoff candidates anyway.
  const mcpResults: CustomUiSourceData[] = [];
  let handoffCount = 0;

  return async function executeTool(call: ToolCall): Promise<string> {
    const input = call.input ?? {};
    try {
      if (call.name === "fetch_chart_data") {
        const topic = input.topic as string;
        const chartType = input.chartType as "bar" | "area" | "line" | "pie" | "gauge";
        emit({ thinking: `Researching data for "${topic}"…` });
        const fetched = await fetchChartData({
          topic,
          chartType,
          timeRange: typeof input.timeRange === "string" ? input.timeRange : undefined,
          unit: typeof input.unit === "string" ? input.unit : undefined,
        });
        return JSON.stringify(fetched, null, 2);
      }

      if (call.name === "search_images") {
        const query = input.query as string;
        const count = typeof input.count === "number" ? input.count : 4;
        emit({ thinking: `Searching Wikimedia for "${query}"…` });
        const images = await fetchWikimedia(query, count);
        if (images.length) {
          emit({ images });
          emit({ responseType: "image", artifactTitle: query });
        }
        return `Fetched ${images.length} photos from Wikimedia Commons for "${query}".`;
      }

      if (call.name === "emit_artifact") {
        const type = input.type as string;
        const title = (input.title as string) ?? "Artifact";
        const description = input.description as string | undefined;
        let data: Record<string, unknown> = (input.data as Record<string, unknown>) ?? {};

        if (type === "custom") {
          const normalized = normalizeCustomArtifactData(data);
          if (!normalized?.html) {
            return "emit_artifact custom requires non-empty data.html with the UI markup.";
          }
          if (customArtifactByteSize(normalized) > CUSTOM_ARTIFACT_MAX_BYTES) {
            return `Custom UI exceeds ${CUSTOM_ARTIFACT_MAX_BYTES} byte limit.`;
          }
          data = normalized as unknown as Record<string, unknown>;
        }

        if (type === "map" || type === "streetview") {
          const enriched = await geocodeMapArtifact(data);
          if (!enriched) {
            return `emit_artifact ${type} requires data.place.name with a geocodable location (e.g. "Paris, France"). Could not geocode the place.`;
          }
          if (type === "streetview") {
            data = normalizeStreetViewArtifactData({
              ...data,
              place: enriched.place,
            }) as unknown as Record<string, unknown>;
          } else {
            data = enriched as unknown as Record<string, unknown>;
          }
        }

        if (type === "todo") {
          const normalized = normalizeTodoArtifactData(data);
          if (normalized.items.length === 0) {
            return "emit_artifact todo requires data.items with at least one { label, checked } entry.";
          }
          data = normalized as unknown as Record<string, unknown>;
        }

        if (type === "calendar") {
          data = normalizeCalendarArtifactData(data) as unknown as Record<string, unknown>;
        }

        if (type === "timeline") {
          data = normalizeTimelineArtifactData(data) as unknown as Record<string, unknown>;
        }

        if (type === "chart") {
          const normalized = normalizeChartArtifactData(data);
          const err = validateChartEmit(normalized);
          if (err) return err;
          data = normalized as unknown as Record<string, unknown>;
        }

        if (type === "table" || type === "custom" || type === "chart") {
          emit({ pendingArtifact: { type } });
        }
        emit({ thinking: `Building ${type}…` });
        emit({ artifact: { type, title, description, data } });
        return `Emitted ${type} artifact "${title}" for the canvas card.`;
      }

      if (call.name === "build_custom_ui") {
        if (mcpResults.length === 0) {
          return (
            "No MCP tool result is available to hand over. Call the relevant MCP tool first, " +
            "then call build_custom_ui — or just answer directly."
          );
        }
        if (handoffCount >= 1) {
          return (
            "An interactive component is already queued for this turn. " +
            "Do not call build_custom_ui again; finish your text reply."
          );
        }
        const title = typeof input.title === "string" ? input.title.trim() : "";
        if (!title) {
          return "build_custom_ui requires a non-empty title.";
        }
        const wanted = typeof input.sourceTool === "string" ? input.sourceTool.trim() : "";
        const picked =
          (wanted
            ? [...mcpResults].reverse().find(
                (r) => r.toolName === wanted || wanted.endsWith(r.toolName),
              )
            : undefined) ?? mcpResults[mcpResults.length - 1]!;

        const source = sanitizeCustomUiSource({
          ...picked,
          brief: typeof input.request === "string" ? input.request : "",
        });
        if (!source) {
          return "The MCP result could not be prepared for the UI builder. Summarize it for the user instead.";
        }

        handoffCount += 1;
        // Two separate frames: the client SSE handler is an else-if chain, so a
        // combined object would only match whichever key it tests first.
        emit({ customUiHandoff: { title, source } });
        emit({ thinking: `Queuing interactive build: ${title}…` });

        return (
          `Queued an interactive component ("${title}") built from the ${source.toolName} result. ` +
          "It builds on a new card below this one after your reply. " +
          "Do not call build_custom_ui again this turn and do not emit the same data as another artifact. " +
          "Finish with one or two sentences telling the user the component is building below."
        );
      }

      if (mcp.registry.has(call.name)) {
        const handle = mcp.registry.get(call.name)!;
        if (!mcpCtx) {
          return "MCP tools require a signed-in session.";
        }

        const toolDef = mcp.tools.find((t) => t.name === call.name);
        emit({ thinking: `Waiting for permission: ${handle.originalName}…` });
        const approval = await resolveApproval(
          { ...mcpCtx, emit },
          handle,
          input,
          toolDef?.description ?? "",
        );
        if (!approval.allowed) {
          if (approval.reason === "aborted") {
            return "The request was cancelled.";
          }
          return approval.reason === "timeout"
            ? `The user did not respond to the approval prompt for ${handle.originalName}. Do not call this tool again this turn; continue without it.`
            : `The user declined the ${handle.originalName} call. Continue without it and do not retry it this turn.`;
        }

        emit({ thinking: `Calling ${handle.serverName}: ${handle.originalName}…` });
        let mcpResult;
        try {
          mcpResult = await callMcpTool(mcpCtx.supabase, handle, input, mcpCtx.origin);
        } catch (err) {
          if (isAuthRequiredError(err)) {
            emit({
              mcpAuth: { serverId: handle.serverId, serverName: handle.serverName },
            });
            return `The ${handle.serverName} server requires authentication. Tell the user to open the MCP tab in the right panel and click Connect for "${handle.serverName}", then ask again.`;
          }
          throw err;
        }
        if (mcpResult.images.length > 0) {
          emit({ images: mcpImages(mcpResult.images) });
          emit({ responseType: "image" });
        }
        if (mcpResult.html) {
          const normalized = normalizeCustomArtifactData({ html: mcpResult.html });
          if (
            normalized?.html &&
            customArtifactByteSize(normalized) <= CUSTOM_ARTIFACT_MAX_BYTES
          ) {
            emit({ pendingArtifact: { type: "custom" } });
            emit({
              artifact: {
                type: "custom",
                title: `${handle.serverName}: ${handle.originalName}`,
                description: `Output from the ${handle.serverName} MCP tool`,
                data: normalized as unknown as Record<string, unknown>,
              },
            });
            return `Rendered the ${handle.originalName} result as an interactive card on the canvas. Summarize it briefly for the user.`;
          }
        }
        const source = sanitizeCustomUiSource({
          serverName: handle.serverName,
          toolName: handle.originalName,
          brief: "",
          text: mcpResult.text,
        });
        if (source) {
          mcpResults.push(source);
          if (mcpResults.length > 4) mcpResults.shift();
        }
        return mcpResult.text;
      }

      return `Unknown tool: ${call.name}`;
    } catch (err) {
      return `Tool error: ${err instanceof Error ? err.message : String(err)}`;
    }
  };
}
