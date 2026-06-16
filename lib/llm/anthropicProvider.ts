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

/** Native Anthropic path — unchanged behaviour, conformed to LLMProvider. */
export const anthropicProvider: LLMProvider = {
  async run(args: RunArgs): Promise<RunResult> {
    const { model, apiKey, system, tools, forceToolFirstTurn, emit, executeTool, signal } = args;
    const maxTurns = args.maxToolTurns ?? DEFAULT_MAX_TOOL_TURNS;
    const anthropic = new Anthropic({ apiKey });
    const anthropicTools = toAnthropicTools(tools);

    let messages = toAnthropicMessages(args.messages);
    const usage = { inputTokens: 0, outputTokens: 0 };

    for (let turn = 0; turn < maxTurns; turn++) {
      const stream = anthropic.messages.stream(
        {
          model,
          max_tokens: DEFAULT_MAX_TOKENS,
          system,
          messages,
          tools: anthropicTools,
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
      }

      const msg = await stream.finalMessage();
      usage.inputTokens += msg.usage.input_tokens;
      usage.outputTokens += msg.usage.output_tokens;

      if (msg.stop_reason !== "tool_use") break;

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

    return { usage };
  },
};
