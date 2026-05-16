import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic();

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
        description: "Number of images to show (default 4, max 6)",
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
  url.searchParams.set("gsrnamespace", "6"); // File namespace only
  url.searchParams.set("gsrlimit", String(Math.min(count * 2, 12))); // fetch extra, filter below
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
      // Only real photos — skip SVG, PDF, OGG, etc.
      return /\.(jpe?g|png|webp)/i.test((info.url as string) ?? "");
    })
    .slice(0, count)
    .map((p) => {
      const info = (p.imageinfo as Record<string, unknown>[])[0];
      return {
        url: info.url as string,
        thumb: (info.thumburl as string) || (info.url as string),
        alt:
          ((p.title as string) ?? query)
            .replace("File:", "")
            .replace(/_/g, " "),
      };
    });
}

export async function POST(req: Request) {
  const { question, model, history } = await req.json();

  const messages: Anthropic.MessageParam[] = [
    ...history.flatMap(
      ({ question: q, answer: a }: { question: string; answer: string }) => [
        { role: "user" as const, content: q },
        { role: "assistant" as const, content: a },
      ],
    ),
    { role: "user" as const, content: question },
  ];

  const encoder = new TextEncoder();

  const readable = new ReadableStream({
    async start(controller) {
      const emit = (data: object) =>
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));

      try {
        // First pass — Claude may call search_images or answer directly.
        const stream1 = anthropic.messages.stream({
          model,
          max_tokens: 2048,
          messages,
          tools: [SEARCH_IMAGES_TOOL],
        });

        for await (const event of stream1) {
          if (
            event.type === "content_block_delta" &&
            event.delta.type === "text_delta"
          ) {
            emit({ text: event.delta.text });
          }
        }

        const msg1 = await stream1.finalMessage();

        if (msg1.stop_reason === "tool_use") {
          const toolBlock = msg1.content.find(
            (b): b is Anthropic.ToolUseBlock => b.type === "tool_use",
          );

          if (toolBlock && toolBlock.name === "search_images") {
            const input = toolBlock.input as { query: string; count?: number };
            emit({ thinking: `Searching Wikimedia for "${input.query}"…` });

            const images = await fetchWikimedia(input.query, input.count ?? 4);
            if (images.length) emit({ images });

            // Second pass: give Claude the tool result so it writes a caption.
            const stream2 = anthropic.messages.stream({
              model,
              max_tokens: 1024,
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
                emit({ text: event.delta.text });
              }
            }
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
