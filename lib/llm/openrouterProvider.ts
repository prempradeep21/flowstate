import OpenAI from "openai";
import {
  DEFAULT_MAX_TOKENS,
  DEFAULT_MAX_TOOL_TURNS,
  type LLMProvider,
  type NeutralMessage,
  type RunArgs,
  type RunResult,
} from "@/lib/llm/provider";
import { toOpenAITools } from "@/lib/llm/tools";

const OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1";

function toOpenAIMessages(
  messages: NeutralMessage[],
): OpenAI.Chat.Completions.ChatCompletionMessageParam[] {
  return messages.map((m) => {
    if (typeof m.content === "string") {
      return { role: m.role, content: m.content };
    }
    // Assistant history is always plain text; only the current user message
    // carries multimodal parts.
    if (m.role === "assistant") {
      const text = m.content
        .filter((p) => p.type === "text")
        .map((p) => (p as { text: string }).text)
        .join("\n");
      return { role: "assistant", content: text };
    }
    const parts: OpenAI.Chat.Completions.ChatCompletionContentPart[] = [];
    for (const part of m.content) {
      if (part.type === "text") {
        parts.push({ type: "text", text: part.text });
      } else if (part.type === "image") {
        parts.push({
          type: "image_url",
          image_url: { url: `data:${part.mediaType};base64,${part.data}` },
        });
      } else {
        // PDF has no portable OpenAI-format equivalent across models.
        parts.push({
          type: "text",
          text: "[A PDF was attached, but this model cannot read PDF files. Ask the user to paste the relevant text.]",
        });
      }
    }
    return { role: "user", content: parts };
  });
}

interface AccumulatedToolCall {
  id: string;
  name: string;
  args: string;
}

/** OpenRouter (OpenAI-compatible) path with streamed tool-call accumulation. */
export const openrouterProvider: LLMProvider = {
  async run(args: RunArgs): Promise<RunResult> {
    const { model, apiKey, system, variableSystem, tools, forceToolFirstTurn, emit, executeTool, signal } = args;
    const maxTurns = args.maxToolTurns ?? DEFAULT_MAX_TOOL_TURNS;
    const maxTokens = args.maxTokens ?? DEFAULT_MAX_TOKENS;

    const client = new OpenAI({
      apiKey,
      baseURL: OPENROUTER_BASE_URL,
      defaultHeaders: {
        "HTTP-Referer": "https://flowstate.app",
        "X-Title": "Flowstate",
      },
    });
    const openaiTools = toOpenAITools(tools);

    // OpenRouter has no prompt-cache breakpoints — fold the variable notes back
    // into a single system message.
    const systemContent = variableSystem ? `${system}\n\n${variableSystem}` : system;
    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      { role: "system", content: systemContent },
      ...toOpenAIMessages(args.messages),
    ];
    const usage = {
      inputTokens: 0,
      outputTokens: 0,
      cacheReadTokens: 0,
      cacheCreationTokens: 0,
    };
    let toolTurns = 0;

    for (let turn = 0; turn < maxTurns; turn++) {
      const stream = await client.chat.completions.create(
        {
          model,
          max_tokens: maxTokens,
          messages,
          tools: openaiTools,
          tool_choice:
            turn === 0 && forceToolFirstTurn
              ? { type: "function", function: { name: forceToolFirstTurn } }
              : "auto",
          stream: true,
          stream_options: { include_usage: true },
        },
        signal ? { signal } : undefined,
      );

      let textAcc = "";
      const toolAcc = new Map<number, AccumulatedToolCall>();
      let finishReason: string | null = null;
      let turnInputTokens = 0;
      let turnOutputTokens = 0;

      for await (const chunk of stream) {
        if (chunk.usage) {
          turnInputTokens += chunk.usage.prompt_tokens ?? 0;
          turnOutputTokens += chunk.usage.completion_tokens ?? 0;
        }
        const choice = chunk.choices[0];
        if (!choice) continue;
        const delta = choice.delta;
        if (delta?.content) {
          emit({ text: delta.content });
          textAcc += delta.content;
        }
        if (delta?.tool_calls) {
          for (const tc of delta.tool_calls) {
            const cur = toolAcc.get(tc.index) ?? { id: "", name: "", args: "" };
            if (tc.id) cur.id = tc.id;
            if (tc.function?.name) cur.name = tc.function.name;
            if (tc.function?.arguments) cur.args += tc.function.arguments;
            toolAcc.set(tc.index, cur);
          }
        }
        if (choice.finish_reason) finishReason = choice.finish_reason;
      }

      usage.inputTokens += turnInputTokens;
      usage.outputTokens += turnOutputTokens;
      if (turnInputTokens || turnOutputTokens) {
        emit({
          usage: {
            inputTokens: turnInputTokens,
            outputTokens: turnOutputTokens,
            cacheReadTokens: 0,
            cacheCreationTokens: 0,
          },
        });
      }

      if (finishReason !== "tool_calls" || toolAcc.size === 0) break;

      toolTurns += 1;
      const calls = [...toolAcc.values()];
      messages.push({
        role: "assistant",
        content: textAcc || null,
        tool_calls: calls.map((c) => ({
          id: c.id,
          type: "function",
          function: { name: c.name, arguments: c.args || "{}" },
        })),
      });

      for (const c of calls) {
        let parsed: Record<string, unknown> = {};
        try {
          parsed = c.args ? JSON.parse(c.args) : {};
        } catch {
          parsed = {};
        }
        const resultContent = await executeTool({ id: c.id, name: c.name, input: parsed });
        messages.push({ role: "tool", tool_call_id: c.id, content: resultContent });
      }
    }

    return { usage, toolTurns, pauseTurns: 0, webSearchBlocks: 0, errorMessage: null };
  },
};
