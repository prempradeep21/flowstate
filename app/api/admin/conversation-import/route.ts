import Anthropic from "@anthropic-ai/sdk";
import { getAdminUser } from "@/lib/adminAccess.server";
import { guardCredits } from "@/lib/billing/guard.server";
import { fromAnthropicUsage, recordUsage } from "@/lib/billing/ledger.server";
import { resolveBillingOwner } from "@/lib/billing/owner";
import { estimateCredits } from "@/lib/billing/pricing";
import {
  IMPORT_SYSTEM_PROMPT,
  IMPORT_TOOL_NAME,
  IMPORT_TOOL_SCHEMA,
  MAX_IMPORT_CHARS,
} from "@/lib/conversationImport/llmPrompt";
import { normalizeConversationImportSpec } from "@/lib/conversationImport/spec";
import { DEFAULT_MODEL_ID } from "@/lib/models";

/*
 * "Continue on Flowstate" import — admin playground only for now.
 *
 * One LLM call turns an uploaded chat export / transcript into a
 * ConversationImportSpec; the client builds the canvas from it with the same
 * chapter engine as the hand-made transcript canvases.
 */

export const maxDuration = 180;

const MAX_TOKENS = 12_000;

/**
 * Who pays for the import call.
 *
 * Always Flowstate's metered key today. Billing a user's own ChatGPT plan
 * needs OpenAI's "Sign in with ChatGPT" partner approval, and billing a
 * Claude plan is not permitted at all — see
 * docs/continue-on-flowstate/feasibility-subscription-billing.md. When a
 * ChatGPT connection exists this returns `{ kind: "user_plan" }`, and the
 * route skips guardCredits and recordUsage for that call.
 */
function resolveImportBilling(): { kind: "metered" } {
  return { kind: "metered" };
}

export async function POST(req: Request) {
  const user = await getAdminUser();
  if (!user) {
    return Response.json({ error: "Admins only." }, { status: 403 });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return Response.json(
      { error: "ANTHROPIC_API_KEY is not set in .env.local" },
      { status: 500 },
    );
  }

  let body: { text?: unknown; fileName?: unknown };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }
  const text = typeof body.text === "string" ? body.text.trim() : "";
  const fileName = typeof body.fileName === "string" ? body.fileName.slice(0, 200) : "";
  if (!text) {
    return Response.json({ error: "The file is empty." }, { status: 400 });
  }
  if (text.length > MAX_IMPORT_CHARS) {
    return Response.json(
      {
        error: `That file is ${Math.round(text.length / 1000)}k characters; the limit is ${MAX_IMPORT_CHARS / 1000}k. Consolidate it with the Flowstate prompt first.`,
      },
      { status: 413 },
    );
  }

  const billing = resolveImportBilling();
  const model = DEFAULT_MODEL_ID;
  const ownerId = resolveBillingOwner(user.id).ownerId;

  if (billing.kind === "metered") {
    const guard = await guardCredits({
      ownerId,
      email: user.email ?? null,
      surface: "conversation-import",
      estimate: estimateCredits({
        model,
        promptChars: text.length + IMPORT_SYSTEM_PROMPT.length,
        maxTokens: MAX_TOKENS,
      }),
    });
    if (!guard.ok) return guard.response;
  }

  const anthropic = new Anthropic({ apiKey });
  const started = Date.now();
  try {
    const message = await anthropic.messages.create({
      model,
      max_tokens: MAX_TOKENS,
      system: IMPORT_SYSTEM_PROMPT,
      tools: [
        {
          name: IMPORT_TOOL_NAME,
          description: "Create the research canvas structure from the conversation.",
          input_schema: IMPORT_TOOL_SCHEMA,
        },
      ],
      tool_choice: { type: "tool", name: IMPORT_TOOL_NAME },
      messages: [
        {
          role: "user",
          content: `File: ${fileName || "upload.md"}\n\n<document>\n${text}\n</document>`,
        },
      ],
    });

    if (billing.kind === "metered") {
      recordUsage({
        ownerId,
        surface: "conversation-import",
        provider: "anthropic",
        model,
        ...fromAnthropicUsage(message.usage),
        outcome: "success",
        durationMs: Date.now() - started,
      });
    }

    const toolUse = message.content.find((block) => block.type === "tool_use");
    const spec = normalizeConversationImportSpec(
      toolUse && toolUse.type === "tool_use" ? toolUse.input : null,
    );
    if (!spec) {
      return Response.json(
        { error: "Couldn't find any questions or answers in that file." },
        { status: 422 },
      );
    }
    return Response.json({
      spec,
      billing: billing.kind,
      truncated: message.stop_reason === "max_tokens",
    });
  } catch (error) {
    if (billing.kind === "metered") {
      recordUsage({
        ownerId,
        surface: "conversation-import",
        provider: "anthropic",
        model,
        inputTokens: 0,
        outputTokens: 0,
        outcome: "error",
        durationMs: Date.now() - started,
      });
    }
    console.error("[conversation-import] failed", error);
    return Response.json(
      { error: error instanceof Error ? error.message : "Import failed." },
      { status: 502 },
    );
  }
}
