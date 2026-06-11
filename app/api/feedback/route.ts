const MAX_MESSAGE_LENGTH = 4000;

async function resolveFeedbackUser(): Promise<{
  userEmail: string;
  userId: string | null;
}> {
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    return { userEmail: "anonymous", userId: null };
  }

  try {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return {
      userEmail: user?.email ?? "anonymous",
      userId: user?.id ?? null,
    };
  } catch {
    return { userEmail: "anonymous", userId: null };
  }
}

function normalizeImageUrls(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is string => typeof item === "string")
    .map((url) => url.trim())
    .filter((url) => url.startsWith("https://"))
    .slice(0, 3);
}

export async function POST(req: Request) {
  let body: { message?: string; pageUrl?: string; imageUrls?: string[] };
  try {
    body = (await req.json()) as {
      message?: string;
      pageUrl?: string;
      imageUrls?: string[];
    };
  } catch {
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }

  const message = body.message?.trim();
  if (!message) {
    return Response.json({ error: "Message is required" }, { status: 400 });
  }
  if (message.length > MAX_MESSAGE_LENGTH) {
    return Response.json({ error: "Message is too long" }, { status: 400 });
  }

  const imageUrls = normalizeImageUrls(body.imageUrls);
  const { userEmail, userId } = await resolveFeedbackUser();
  const pageUrl = body.pageUrl?.trim() || null;

  const webhookUrl = process.env.SLACK_FEEDBACK_WEBHOOK_URL;
  if (webhookUrl) {
    const slackText = [
      "*Beta suggestion*",
      `*From:* ${userEmail}${userId ? ` (\`${userId}\`)` : ""}`,
      pageUrl ? `*Page:* ${pageUrl}` : null,
      imageUrls.length > 0 ? `*Attachments:* ${imageUrls.length} image(s)` : null,
      "",
      message,
    ]
      .filter(Boolean)
      .join("\n");

    const slackPayload =
      imageUrls.length > 0
        ? {
            text: slackText,
            blocks: [
              {
                type: "section",
                text: { type: "mrkdwn", text: slackText },
              },
              ...imageUrls.map((imageUrl) => ({
                type: "image",
                image_url: imageUrl,
                alt_text: "Beta suggestion attachment",
              })),
            ],
          }
        : { text: slackText };

    const slackRes = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(slackPayload),
    });

    if (!slackRes.ok) {
      console.error("[feedback] Slack webhook failed:", slackRes.status);
      return Response.json(
        { error: "Failed to deliver suggestion" },
        { status: 502 },
      );
    }
  } else {
    console.info("[feedback] received (no SLACK_FEEDBACK_WEBHOOK_URL):", {
      userEmail,
      userId,
      pageUrl,
      message,
      imageUrls,
    });
  }

  return Response.json({ ok: true });
}
