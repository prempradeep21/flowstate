import Anthropic from "@anthropic-ai/sdk";
import { conversationStore } from "@/lib/conversationStore";

const SEARCH_IMAGES_TOOL: Anthropic.Tool = {
  name: "search_images",
  description:
    "Search for and display photos from Wikimedia Commons when the user asks to see images, pictures, or photos of a place, landmark, person, or thing.",
  input_schema: {
    type: "object" as const,
    properties: {
      query: { type: "string", description: "The image search query" },
      count: {
        type: "number",
        description:
          "Number of images to show. Use at least 4 when the user asks for pictures/photos (max 6).",
      },
    },
    required: ["query"],
  },
};

async function fetchWikimedia(
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

export async function POST(req: Request) {
  const apiKey =
    req.headers.get("x-api-key") ?? process.env.ANTHROPIC_API_KEY ?? "";
  if (!apiKey) {
    return Response.json({ error: "No API key provided" }, { status: 401 });
  }
  const anthropic = new Anthropic({ apiKey });

  const {
    conversationId,
    parentConversationId,
    question,
    model,
    history: clientHistory,
  } = await req.json();

  const clientList = Array.isArray(clientHistory) ? clientHistory : [];
  conversationStore.register(
    conversationId,
    parentConversationId ?? null,
  );
  if (clientList.length > 0) {
    conversationStore.seedHistory(
      conversationId,
      parentConversationId ?? null,
      clientList,
    );
  }

  const serverCtx = conversationStore.getContextChain(conversationId);
  const history =
    clientList.length >= serverCtx.history.length
      ? clientList
      : serverCtx.history;
  const systemContext = serverCtx.systemContext;

  const messages: Anthropic.MessageParam[] = [
    ...history.flatMap(({ question: q, answer: a }) => [
      { role: "user" as const, content: q },
      { role: "assistant" as const, content: a },
    ]),
    { role: "user" as const, content: question },
  ];

  const encoder = new TextEncoder();

  const readable = new ReadableStream({
    async start(controller) {
      const emit = (data: object) =>
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));

      const totalUsage = { inputTokens: 0, outputTokens: 0 };
      let answerAcc = "";

      try {
        const stream1 = anthropic.messages.stream({
          model,
          max_tokens: 2048,
          ...(systemContext ? { system: systemContext } : {}),
          messages,
          tools: [SEARCH_IMAGES_TOOL],
        });

        for await (const event of stream1) {
          if (
            event.type === "content_block_delta" &&
            event.delta.type === "text_delta"
          ) {
            answerAcc += event.delta.text;
            emit({ text: event.delta.text });
          }
        }

        const msg1 = await stream1.finalMessage();
        totalUsage.inputTokens += msg1.usage.input_tokens;
        totalUsage.outputTokens += msg1.usage.output_tokens;

        if (msg1.stop_reason === "tool_use") {
          const toolBlock = msg1.content.find(
            (b): b is Anthropic.ToolUseBlock => b.type === "tool_use",
          );

          if (toolBlock && toolBlock.name === "search_images") {
            const input = toolBlock.input as { query: string; count?: number };
            emit({ thinking: `Searching Wikimedia for "${input.query}"…` });

            const imageCount = Math.min(
              Math.max(input.count ?? 4, 4),
              6,
            );
            const images = await fetchWikimedia(input.query, imageCount);
            if (images.length) emit({ images });

            const stream2 = anthropic.messages.stream({
              model,
              max_tokens: 1024,
              ...(systemContext ? { system: systemContext } : {}),
              messages: [
                ...messages,
                { role: "assistant" as const, content: msg1.content },
                {
                  role: "user" as const,
                  content: [
                    {
                      type: "tool_result" as const,
                      tool_use_id: toolBlock.id,
                      content: `Fetched ${images.length} photos from Wikimedia Commons for "${input.query}".`,
                    },
                  ],
                },
              ],
              tools: [SEARCH_IMAGES_TOOL],
            });

            for await (const event of stream2) {
              if (
                event.type === "content_block_delta" &&
                event.delta.type === "text_delta"
              ) {
                answerAcc += event.delta.text;
                emit({ text: event.delta.text });
              }
            }
            const msg2 = await stream2.finalMessage();
            totalUsage.inputTokens += msg2.usage.input_tokens;
            totalUsage.outputTokens += msg2.usage.output_tokens;
          }
        }
      } catch (err) {
        let msg = err instanceof Error ? err.message : "Unknown error";
        try {
          const inner = JSON.parse(msg);
          if (inner?.error?.message) msg = inner.error.message;
        } catch { /* not JSON */ }
        emit({ error: msg });
      } finally {
        // Store the completed Q&A in the backend conversation store.
        if (answerAcc) {
          conversationStore.addMessage(conversationId, question, answerAcc);
        }
        if (totalUsage.inputTokens || totalUsage.outputTokens) {
          emit({ usage: totalUsage });
        }
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
