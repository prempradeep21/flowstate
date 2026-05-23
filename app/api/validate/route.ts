import Anthropic from "@anthropic-ai/sdk";

export async function POST(req: Request) {
  const apiKey = req.headers.get("x-api-key");
  if (!apiKey?.startsWith("sk-ant-")) {
    return Response.json(
      { error: "Key must start with sk-ant-" },
      { status: 400 },
    );
  }

  try {
    const client = new Anthropic({ apiKey });
    await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1,
      messages: [{ role: "user", content: "hi" }],
    });
    return Response.json({ valid: true });
  } catch (err: unknown) {
    // 429 means rate-limited but the key itself is valid
    if (
      typeof err === "object" &&
      err !== null &&
      "status" in err &&
      (err as { status: number }).status === 429
    ) {
      return Response.json({ valid: true });
    }
    const msg =
      err instanceof Error ? err.message : "Invalid or unauthorised key";
    return Response.json({ error: msg }, { status: 401 });
  }
}
