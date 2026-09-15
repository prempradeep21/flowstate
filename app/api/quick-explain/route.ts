import Anthropic from "@anthropic-ai/sdk";
import { fromAnthropicUsage, recordUsage } from "@/lib/billing/ledger.server";
import { getCurrentUser } from "@/lib/auth/currentUser.server";

const SYSTEM_PROMPT =
  "Give a brief, clear explanation of the following term or phrase in 2–4 sentences. " +
  "No preamble, no bullet points — plain prose only.";

const MODEL = "claude-haiku-4-5";

export async function POST(req: Request) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return Response.json(
      { error: "ANTHROPIC_API_KEY is not configured" },
      { status: 500 },
    );
  }

  const { text } = (await req.json()) as { text?: string };
  if (!text?.trim()) {
    return Response.json({ error: "No text provided" }, { status: 400 });
  }

  const anthropic = new Anthropic({ apiKey });
  const encoder = new TextEncoder();

  const readable = new ReadableStream({
    async start(controller) {
      const emit = (data: object) =>
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));

      try {
        const stream = anthropic.messages.stream({
          model: MODEL,
          max_tokens: 512,
          system: SYSTEM_PROMPT,
          messages: [{ role: "user", content: text.trim() }],
        });

        for await (const event of stream) {
          if (
            event.type === "content_block_delta" &&
            event.delta.type === "text_delta"
          ) {
            emit({ text: event.delta.text });
          }
        }

        const msg = await stream.finalMessage();
        const usage = fromAnthropicUsage(msg.usage);

        recordUsage({
          ownerId: (await getCurrentUser())?.id ?? null,
          surface: "quick-explain",
          provider: "anthropic",
          model: MODEL,
          ...usage,
          outcome: "success",
        });

        // Emit all four fields, matching /api/chat. The two cache figures were
        // previously dropped here, which understates cost several-fold.
        emit({ usage });
        emit({ done: true });
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        emit({ error: message });
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
