import {
  appendFeedbackToSheet,
  isFeedbackSheetConfigured,
} from "@/lib/feedback/sheets";
import { saveFeedbackToSupabase } from "@/lib/feedback/supabase";
import { isSupabaseConfigured } from "@/lib/supabase/client";

const MAX_MESSAGE_LENGTH = 4000;

async function resolveFeedbackUser(): Promise<{
  userEmail: string;
  userId: string | null;
}> {
  if (!isSupabaseConfigured()) {
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

async function sendFeedbackToSlack(input: {
  userEmail: string;
  userId: string | null;
  pageUrl: string | null;
  message: string;
  imageUrls: string[];
}): Promise<boolean> {
  const webhookUrl = process.env.SLACK_FEEDBACK_WEBHOOK_URL;
  if (!webhookUrl) return false;

  const { userEmail, userId, pageUrl, message, imageUrls } = input;
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
    return false;
  }

  return true;
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

  const feedback = {
    userEmail,
    userId,
    pageUrl,
    message,
    imageUrls,
  };

  const supabaseConfigured = isSupabaseConfigured();
  const slackConfigured = Boolean(process.env.SLACK_FEEDBACK_WEBHOOK_URL);
  const sheetConfigured = isFeedbackSheetConfigured();

  const [supabaseOk, slackOk, sheetOk] = await Promise.all([
    supabaseConfigured
      ? saveFeedbackToSupabase({
          message,
          pageUrl,
          imageUrls,
        })
      : Promise.resolve(false),
    slackConfigured ? sendFeedbackToSlack(feedback) : Promise.resolve(false),
    sheetConfigured ? appendFeedbackToSheet(feedback) : Promise.resolve(false),
  ]);

  if (supabaseConfigured) {
    if (!supabaseOk) {
      return Response.json(
        { error: "Failed to save suggestion" },
        { status: 502 },
      );
    }

    if (slackConfigured && !slackOk) {
      console.error("[feedback] Slack delivery failed after Supabase save");
    }
    if (sheetConfigured && !sheetOk) {
      console.error("[feedback] Google Sheets delivery failed after Supabase save");
    }

    return Response.json({ ok: true });
  }

  if (!slackConfigured && !sheetConfigured) {
    console.info("[feedback] received (no delivery targets configured):", {
      userEmail,
      userId,
      pageUrl,
      message,
      imageUrls,
    });
    return Response.json({ ok: true });
  }

  if (slackOk || sheetOk) {
    return Response.json({ ok: true });
  }

  return Response.json(
    { error: "Failed to deliver suggestion" },
    { status: 502 },
  );
}
