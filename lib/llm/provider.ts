// Provider-neutral LLM interface. Each provider (Anthropic, OpenRouter) owns its
// own transport, message format, and tool-call loop, but emits the SAME SSE
// events (via `emit`) and runs the SAME shared tool executor — so `/api/chat`
// and the client streaming contract stay provider-agnostic.

/** A tool the model may call, in neutral JSON-schema form. */
export interface NeutralToolDef {
  name: string;
  description: string;
  /** JSON Schema object describing the tool input. */
  inputSchema: Record<string, unknown>;
}

/** Multimodal content parts shared across providers. */
export type NeutralContentPart =
  | { type: "text"; text: string }
  | { type: "image"; mediaType: string; data: string } // base64
  | { type: "document"; mediaType: string; data: string }; // base64 (e.g. PDF)

export interface NeutralMessage {
  role: "user" | "assistant";
  content: string | NeutralContentPart[];
}

/** A single tool invocation the model requested. */
export interface ToolCall {
  id: string;
  name: string;
  input: Record<string, unknown>;
}

/** Emits a server-sent event chunk to the client (the existing SSE protocol). */
export type EmitFn = (data: object) => void;

/**
 * Executes a tool call: performs the work, emits any artifact/image/thinking
 * events, and returns the tool-result text to feed back to the model.
 */
export type ToolExecutor = (call: ToolCall) => Promise<string>;

export interface RunArgs {
  model: string;
  apiKey: string;
  /** Stable, cacheable system prefix (Anthropic marks it with a cache breakpoint). */
  system: string;
  /**
   * Per-request, variable system notes (topic recap, intent notes, artifact-edit
   * payload). Anthropic keeps this in a SEPARATE uncached block after the cached
   * prefix; OpenRouter simply concatenates it onto the system message.
   */
  variableSystem?: string;
  messages: NeutralMessage[];
  tools: NeutralToolDef[];
  /** Force this tool on the first turn (used for strong artifact intents). */
  forceToolFirstTurn?: string;
  emit: EmitFn;
  executeTool: ToolExecutor;
  signal?: AbortSignal;
  maxToolTurns?: number;
  /** Override the per-turn output token budget (e.g. larger for custom UI). */
  maxTokens?: number;
  /** Anthropic-only: enable the hosted web_search tool + pause_turn handling. */
  enableWebSearch?: boolean;
  /** Cap on pause_turn continuations for hosted web search. */
  maxPauseTurns?: number;
}

export interface RunUsage {
  inputTokens: number;
  outputTokens: number;
  /** Anthropic prompt-cache reads (billed ~10%). 0 for providers without caching. */
  cacheReadTokens: number;
  /** Anthropic prompt-cache writes. 0 for providers without caching. */
  cacheCreationTokens: number;
}

export interface RunResult {
  usage: RunUsage;
  /** Number of tool-execution rounds performed. */
  toolTurns: number;
  /** Number of web-search pause_turn continuations (Anthropic). */
  pauseTurns: number;
  /** Number of hosted web_search invocations (Anthropic). */
  webSearchBlocks: number;
  /** Non-fatal error surfaced mid-run (already emitted); recorded for telemetry. */
  errorMessage?: string | null;
}

export interface LLMProvider {
  run(args: RunArgs): Promise<RunResult>;
}

export const DEFAULT_MAX_TOOL_TURNS = 5;
export const DEFAULT_MAX_TOKENS = 4096;
