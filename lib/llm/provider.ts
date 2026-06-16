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
  system: string;
  messages: NeutralMessage[];
  tools: NeutralToolDef[];
  /** Force this tool on the first turn (used for strong artifact intents). */
  forceToolFirstTurn?: string;
  emit: EmitFn;
  executeTool: ToolExecutor;
  signal?: AbortSignal;
  maxToolTurns?: number;
}

export interface RunResult {
  usage: { inputTokens: number; outputTokens: number };
}

export interface LLMProvider {
  run(args: RunArgs): Promise<RunResult>;
}

export const DEFAULT_MAX_TOOL_TURNS = 5;
export const DEFAULT_MAX_TOKENS = 4096;
