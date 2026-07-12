import Anthropic from "@anthropic-ai/sdk";
import {
  DEFAULT_MAX_TOKENS,
  DEFAULT_MAX_TOOL_TURNS,
  type LLMProvider,
  type NeutralMessage,
  type RunArgs,
  type RunResult,
} from "@/lib/llm/provider";
import { toAnthropicTools } from "@/lib/llm/tools";
import { buildWebSearchTool, getMaxPauseTurns } from "@/lib/anthropicWebSearch";

function toAnthropicMessages(messages: NeutralMessage[]): Anthropic.MessageParam[] {
  return messages.map((m) => {
    if (typeof m.content === "string") {
      return { role: m.role, content: m.content };
    }
    const blocks: Anthropic.ContentBlockParam[] = m.content.map((part) => {
      if (part.type === "text") {
        return { type: "text", text: part.text };
      }
      if (part.type === "image") {
        return {
          type: "image",
          source: {
            type: "base64",
            media_type: part.mediaType as "image/jpeg" | "image/png" | "image/gif" | "image/webp",
            data: part.data,
          },
        };
      }
      // document (PDF)
      return {
        type: "document",
        source: { type: "base64", media_type: "application/pdf", data: part.data },
      } as unknown as Anthropic.ContentBlockParam;
    });
    return { role: m.role, content: blocks };
  });
}

/**
 * Add an ephemeral cache breakpoint to the final block of the final message so
 * the conversation prefix (history + question, and prior tool-loop rounds) is
 * read from cache on later rounds/turns instead of being re-billed as fresh
 * input. Only applied when the last message is a user turn (the common path:
 * question or tool_result), which always carries cache-compatible blocks.
 * Returns a shallow copy — never mutates the input array.
 */
function withMessageCache(
  msgs: Anthropic.MessageParam[],
): Anthropic.MessageParam[] {
  const last = msgs[msgs.length - 1];
  if (!last || last.role !== "user") return msgs;
  const blocks: Anthropic.ContentBlockParam[] =
    typeof last.content === "string"
      ? [{ type: "text", text: last.content }]
      : last.content.slice();
  if (blocks.length === 0) return msgs;
  blocks[blocks.length - 1] = {
    ...blocks[blocks.length - 1],
    cache_control: { type: "ephemeral" },
  } as Anthropic.ContentBlockParam;
  const out = msgs.slice();
  out[out.length - 1] = { ...last, content: blocks };
  return out;
}

type AnthropicChatTool = Anthropic.ToolUnion | ReturnType<typeof buildWebSearchTool>;

/** Native Anthropic path — prompt caching, hosted web search, and tool loop. */
export const anthropicProvider: LLMProvider = {
  async run(args: RunArgs): Promise<RunResult> {
    const {
      model,
      apiKey,
      system: baseSystem,
      variableSystem,
      tools,
      forceToolFirstTurn,
      emit,
      executeTool,
      signal,
      enableWebSearch,
    } = args;
    const maxTurns = args.maxToolTurns ?? DEFAULT_MAX_TOOL_TURNS;
    const maxTokens = args.maxTokens ?? DEFAULT_MAX_TOKENS;
    const maxPauseTurns = args.maxPauseTurns ?? getMaxPauseTurns();
    const anthropic = new Anthropic({ apiKey });

    // Client tools + (optionally) the hosted web_search server tool.
    const anthropicTools: AnthropicChatTool[] = [
      ...toAnthropicTools(tools),
      ...(enableWebSearch ? [buildWebSearchTool()] : []),
    ];

    // Cache the large, stable instruction prefix (tools + BASE_SYSTEM). The cache
    // breakpoint on this first system block covers all preceding tool schemas too,
    // so repeat turns and every extra tool-loop round read it at ~10% cost.
    const system: Anthropic.TextBlockParam[] = [
      { type: "text", text: baseSystem, cache_control: { type: "ephemeral" } },
    ];
    if (variableSystem) {
      system.push({ type: "text", text: variableSystem });
    }

    let messages = toAnthropicMessages(args.messages);
    const usage = {
      inputTokens: 0,
      outputTokens: 0,
      cacheReadTokens: 0,
      cacheCreationTokens: 0,
    };
    let toolTurns = 0;
    let pauseTurns = 0;
    let webSearchBlocks = 0;
    let searchThinkingEmitted = false;
    let errorMessage: string | null = null;

    for (let turn = 0; turn < maxTurns; turn++) {
      const stream = anthropic.messages.stream(
        {
          model,
          max_tokens: maxTokens,
          system,
          messages: withMessageCache(messages),
          tools: anthropicTools as Anthropic.ToolUnion[],
          ...(turn === 0 && forceToolFirstTurn
            ? { tool_choice: { type: "tool" as const, name: forceToolFirstTurn } }
            : {}),
        },
        signal ? { signal } : undefined,
      );

      for await (const event of stream) {
        if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
          emit({ text: event.delta.text });
        }
        if (event.type === "content_block_start") {
          const block = event.content_block as { type?: string; name?: string };
          if (block.type === "server_tool_use" && block.name === "web_search") {
            webSearchBlocks += 1;
            if (!searchThinkingEmitted) {
              searchThinkingEmitted = true;
              emit({ thinking: "Searching the web…" });
            }
          }
        }
      }

      const msg = await stream.finalMessage();
      // Anthropic reports cache hits/writes separately: `input_tokens` is the
      // UNcached (full-price) portion, while cache reads are ~10% cost.
      const cacheReadTokens = msg.usage.cache_read_input_tokens ?? 0;
      const cacheCreationTokens = msg.usage.cache_creation_input_tokens ?? 0;
      usage.inputTokens += msg.usage.input_tokens;
      usage.outputTokens += msg.usage.output_tokens;
      usage.cacheReadTokens += cacheReadTokens;
      usage.cacheCreationTokens += cacheCreationTokens;
      if (
        msg.usage.input_tokens ||
        msg.usage.output_tokens ||
        cacheReadTokens ||
        cacheCreationTokens
      ) {
        emit({
          usage: {
            inputTokens: msg.usage.input_tokens,
            outputTokens: msg.usage.output_tokens,
            cacheReadTokens,
            cacheCreationTokens,
          },
        });
      }

      if (msg.stop_reason !== "tool_use" && msg.stop_reason !== "pause_turn") {
        break;
      }

      if (msg.stop_reason === "pause_turn") {
        pauseTurns += 1;
        if (pauseTurns >= maxPauseTurns) {
          errorMessage = "Too many web search continuations.";
          emit({ error: errorMessage });
          break;
        }
        messages = [...messages, { role: "assistant", content: msg.content }];
        continue;
      }

      toolTurns += 1;

      const toolUseBlocks = msg.content.filter(
        (b): b is Anthropic.ToolUseBlock => b.type === "tool_use",
      );

      const toolResults: Anthropic.ToolResultBlockParam[] = [];
      for (const block of toolUseBlocks) {
        const resultContent = await executeTool({
          id: block.id,
          name: block.name,
          input: block.input as Record<string, unknown>,
        });
        toolResults.push({
          type: "tool_result",
          tool_use_id: block.id,
          content: resultContent,
        });
      }

      messages = [
        ...messages,
        { role: "assistant", content: msg.content },
        { role: "user", content: toolResults },
      ];
    }

    return { usage, toolTurns, pauseTurns, webSearchBlocks, errorMessage };
  },
};
