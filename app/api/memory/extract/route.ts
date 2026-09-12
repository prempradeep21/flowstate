import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";

// Cross-canvas user memory extraction. Called after each exchange, but
// self-throttled: user questions are buffered in pending_notes and a single
// Haiku pass runs every EXTRACT_EVERY_TURNS exchanges (or immediately when the
// user explicitly asks to remember something). Only user questions are mined —
// never model answers — mirroring ChatGPT's approach to avoid contaminating
// memory with model output.
const EXTRACT_MODEL = "claude-haiku-4-5";
const EXTRACT_EVERY_TURNS = 5;
const MAX_QUESTION_CHARS = 500;
const MAX_PENDING_CHARS = 4000;
// ~800 tokens; the prompt enforces the shape, this is the hard backstop.
const MAX_MEMORY_CHARS = 3200;

const EXPLICIT_REMEMBER = /\b(remember|don't forget|do not forget|keep in mind|note that i|for future reference)\b/i;

const NO_CHANGE_SENTINEL = "NO_CHANGE";

const SYSTEM_PROMPT = `You maintain a compact memory document of durable facts about one user, gathered from their own messages across many sessions.

The document format (markdown):
## Core
- [YYYY-MM-DD] one-line durable fact (identity, job, dietary needs, strong standing preferences)
## Interests
- [YYYY-MM-DD] one-line fact
## Places
- [YYYY-MM-DD] one-line fact

Rules:
- Only record durable personal facts the user stated about themselves: job/role, preferences, dietary restrictions, places lived or visited, ongoing projects, tools they use.
- Never record: one-off task details, questions themselves, opinions about a single document, anything the user asked to forget (remove it instead), secrets/passwords/financial identifiers.
- Merge with the existing document: dedupe, update changed facts in place (keep the newer), drop stale or superseded lines.
- Maximum 30 fact lines total across all sections. Prefer dropping the least durable facts to stay under the cap.
- If the new messages contain nothing worth remembering and no corrections, output exactly ${NO_CHANGE_SENTINEL} and nothing else.
- Otherwise output the complete updated document only — no preamble or commentary.`;

export async function POST(req: Request) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return Response.json({ skipped: true, reason: "no-api-key" });
  }

  let supabase;
  try {
    supabase = await createClient();
  } catch {
    return Response.json({ skipped: true, reason: "no-supabase" });
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return Response.json({ skipped: true, reason: "unauthenticated" });
  }

  const { question } = (await req.json()) as { question?: string };
  if (typeof question !== "string" || !question.trim()) {
    return Response.json({ error: "question is required" }, { status: 400 });
  }

  const trimmed = question.trim();
  const clipped =
    trimmed.length > MAX_QUESTION_CHARS
      ? `${trimmed.slice(0, MAX_QUESTION_CHARS)}…`
      : trimmed;

  const { data: row } = await supabase
    .from("user_memories")
    .select("content, pending_notes, turn_count")
    .eq("user_id", user.id)
    .maybeSingle();

  const content = row?.content ?? "";
  let pendingNotes = row?.pending_notes ?? "";
  const turnCount = (row?.turn_count ?? 0) + 1;

  pendingNotes = pendingNotes ? `${pendingNotes}\n- ${clipped}` : `- ${clipped}`;
  // Keep the newest notes when the buffer overflows.
  if (pendingNotes.length > MAX_PENDING_CHARS) {
    pendingNotes = pendingNotes.slice(pendingNotes.length - MAX_PENDING_CHARS);
    const firstBreak = pendingNotes.indexOf("\n- ");
    if (firstBreak > 0) pendingNotes = pendingNotes.slice(firstBreak + 1);
  }

  const shouldExtract =
    turnCount >= EXTRACT_EVERY_TURNS || EXPLICIT_REMEMBER.test(trimmed);

  if (!shouldExtract) {
    await supabase.from("user_memories").upsert({
      user_id: user.id,
      content,
      pending_notes: pendingNotes,
      turn_count: turnCount,
    });
    return Response.json({ buffered: true });
  }

  const today = new Date().toISOString().slice(0, 10);
  const userContent = [
    `Today's date: ${today}`,
    content.trim()
      ? `## Existing memory document\n\n${content}`
      : `## Existing memory document\n\n(empty)`,
    `## New user messages\n\n${pendingNotes}`,
  ].join("\n\n");

  const anthropic = new Anthropic({ apiKey });

  try {
    const message = await anthropic.messages.create({
      model: EXTRACT_MODEL,
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userContent }],
    });

    const textBlock = message.content.find((b) => b.type === "text");
    const output =
      textBlock && textBlock.type === "text" ? textBlock.text.trim() : "";

    const unchanged = !output || output === NO_CHANGE_SENTINEL;
    const nextContent = unchanged
      ? content
      : output.slice(0, MAX_MEMORY_CHARS);

    await supabase.from("user_memories").upsert({
      user_id: user.id,
      content: nextContent,
      pending_notes: "",
      turn_count: 0,
    });

    return Response.json({ extracted: !unchanged });
  } catch {
    // Keep the buffer so facts aren't lost; retry on a later exchange.
    await supabase.from("user_memories").upsert({
      user_id: user.id,
      content,
      pending_notes: pendingNotes,
      turn_count: turnCount,
    });
    return Response.json({ buffered: true, reason: "extract-failed" });
  }
}
