import Anthropic from "@anthropic-ai/sdk";
import { ARTIFACT_PROMPT } from "@/lib/artifactPrompt";
import {
  CUSTOM_ARTIFACT_MAX_BYTES,
  customArtifactByteSize,
  normalizeCustomArtifactData,
} from "@/lib/customArtifact";
import {
  CUSTOM_UI_EDIT_SYSTEM_NOTE,
  CUSTOM_UI_INLINE_CODE_NOTE,
  CUSTOM_UI_INTENT_SYSTEM_NOTE,
  detectInlineSourceInQuestion,
  isCustomUiWork,
  stripAppendedQuestionContext,
} from "@/lib/artifactIntent";
import type { CustomArtifactPayload } from "@/lib/customArtifactShortcuts";

const EMIT_ARTIFACT_TOOL: Anthropic.Tool = {
  name: "emit_artifact",
  description:
    "Emit a structured UI artifact for the current canvas card. Put the full interactive UI in data.html, data.css, and optional data.js.",
  input_schema: {
    type: "object" as const,
    properties: {
      type: {
        type: "string",
        enum: ["custom"],
        description: "Must be custom for interactive UI artifacts",
      },
      title: { type: "string", description: "Card artifact title" },
      description: {
        type: "string",
        description: "Optional short subtitle",
      },
      data: {
        type: "object",
        description: "Custom UI payload: { html, css?, js? }",
      },
    },
    required: ["type", "title", "data"],
  },
};

export interface CustomUiAnthropicStreamInput {
  question: string;
  history: { question: string; answer: string }[];
  editingArtifact?: { artifactId: string; payload: unknown } | null;
  model?: string;
  emit: (data: object) => void;
  signal?: AbortSignal;
}

export interface CustomUiAnthropicStreamResult {
  artifact: CustomArtifactPayload | null;
  assistantText: string;
  error?: string;
}

export async function streamCustomUiViaAnthropic(
  input: CustomUiAnthropicStreamInput,
): Promise<CustomUiAnthropicStreamResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY?.trim();
  if (!apiKey) {
    return {
      artifact: null,
      assistantText: "",
      error: "ANTHROPIC_API_KEY is not configured.",
    };
  }

  const anthropic = new Anthropic({ apiKey });
  const intentQuestion = stripAppendedQuestionContext(input.question);
  const editingPayload =
    input.editingArtifact?.payload &&
    typeof input.editingArtifact.payload === "object" &&
    "type" in (input.editingArtifact.payload as object)
      ? (input.editingArtifact.payload as { type?: string })
      : null;

  if (!isCustomUiWork(intentQuestion, editingPayload)) {
    return {
      artifact: null,
      assistantText: "",
      error: "Not a custom UI request.",
    };
  }

  const editingCustom = editingPayload?.type === "custom";
  const inlineSourceIntent = detectInlineSourceInQuestion(intentQuestion);
  const editingNote = input.editingArtifact
    ? `\n\nThe user is editing an existing artifact (id: ${input.editingArtifact.artifactId}). Call emit_artifact with the full updated payload. Current artifact JSON:\n${JSON.stringify(input.editingArtifact.payload, null, 2)}${
        editingCustom ? `\n\n${CUSTOM_UI_EDIT_SYSTEM_NOTE}` : ""
      }`
    : "";

  const systemPrompt = [
    `You are a helpful AI assistant with access to tools.\n\n${ARTIFACT_PROMPT}`,
    !editingCustom ? CUSTOM_UI_INTENT_SYSTEM_NOTE : null,
    inlineSourceIntent && !input.editingArtifact
      ? CUSTOM_UI_INLINE_CODE_NOTE
      : null,
    editingNote || null,
  ]
    .filter(Boolean)
    .join("\n\n");

  let messages: Anthropic.MessageParam[] = [
    ...input.history.flatMap(({ question, answer }) => [
      { role: "user" as const, content: question },
      { role: "assistant" as const, content: answer },
    ]),
    { role: "user" as const, content: input.question },
  ];

  input.emit({ thinking: "Building custom UI…" });

  let captured: CustomArtifactPayload | null = null;
  let assistantText = "";
  const model = input.model?.trim() || "claude-sonnet-4-6";

  for (let turn = 0; turn < 3; turn++) {
    if (input.signal?.aborted) {
      return { artifact: captured, assistantText, error: "Cancelled." };
    }

    const stream = anthropic.messages.stream({
      model,
      max_tokens: 8192,
      system: systemPrompt,
      messages,
      tools: [EMIT_ARTIFACT_TOOL],
      ...(turn === 0 && !captured
        ? {
            tool_choice: {
              type: "tool" as const,
              name: "emit_artifact",
            },
          }
        : {}),
    });

    for await (const event of stream) {
      if (input.signal?.aborted) {
        return { artifact: captured, assistantText, error: "Cancelled." };
      }
      if (
        event.type === "content_block_delta" &&
        event.delta.type === "text_delta"
      ) {
        assistantText += event.delta.text;
        input.emit({ text: event.delta.text });
      }
    }

    const msg = await stream.finalMessage();
    if (msg.usage.input_tokens || msg.usage.output_tokens) {
      input.emit({
        usage: {
          inputTokens: msg.usage.input_tokens,
          outputTokens: msg.usage.output_tokens,
        },
      });
    }

    if (msg.stop_reason !== "tool_use") {
      break;
    }

    const toolUseBlocks = msg.content.filter(
      (block): block is Anthropic.ToolUseBlock => block.type === "tool_use",
    );
    const toolResults: Anthropic.ToolResultBlockParam[] = [];

    for (const block of toolUseBlocks) {
      const toolInput = block.input as Record<string, unknown>;
      let resultContent = "";

      if (block.name === "emit_artifact") {
        const type = toolInput.type as string;
        const title = (toolInput.title as string) ?? "Custom UI";
        const description = toolInput.description as string | undefined;
        let data = (toolInput.data as Record<string, unknown>) ?? {};

        if (type !== "custom") {
          resultContent = "Only emit_artifact type custom is supported here.";
        } else {
          const normalized = normalizeCustomArtifactData(data);
          if (!normalized?.html) {
            resultContent =
              "emit_artifact custom requires non-empty data.html with the UI markup.";
          } else if (
            customArtifactByteSize(normalized) > CUSTOM_ARTIFACT_MAX_BYTES
          ) {
            resultContent = `Custom UI exceeds ${CUSTOM_ARTIFACT_MAX_BYTES} byte limit.`;
          } else {
            captured = {
              type: "custom",
              title,
              description,
              data: normalized,
            };
            input.emit({
              artifact: {
                type: captured.type,
                title: captured.title,
                description: captured.description,
                data: captured.data,
              },
            });
            resultContent = `Emitted custom artifact "${title}" for the canvas card.`;
          }
        }
      } else {
        resultContent = `Unknown tool: ${block.name}`;
      }

      toolResults.push({
        type: "tool_result" as const,
        tool_use_id: block.id,
        content: resultContent,
      });
    }

    messages = [
      ...messages,
      { role: "assistant" as const, content: msg.content },
      { role: "user" as const, content: toolResults },
    ];
  }

  if (captured) {
    return {
      artifact: captured,
      assistantText:
        assistantText.trim() ||
        (editingCustom ? "Updated the custom UI." : "Built your custom UI component."),
    };
  }

  return {
    artifact: null,
    assistantText,
    error:
      "Custom UI was not saved — no valid artifact was emitted. Try again with a clearer prompt.",
  };
}
