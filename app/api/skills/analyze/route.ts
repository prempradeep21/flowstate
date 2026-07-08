import { NextResponse } from "next/server";
import { analyzeSkillWithClaude } from "@/lib/skillAiAnalysis";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const params = new URL(req.url).searchParams;
  const url = params.get("url")?.trim() ?? "";
  const fileName = params.get("fileName")?.trim() || "skill.md";

  if (!url) {
    return NextResponse.json({ error: "Missing skill file url" }, { status: 400 });
  }

  try {
    const fileRes = await fetch(url);
    if (!fileRes.ok) {
      return NextResponse.json(
        { error: `Could not fetch skill file (${fileRes.status})` },
        { status: 502 },
      );
    }
    const rawText = await fileRes.text();

    const metadata = await analyzeSkillWithClaude(rawText, fileName);

    return NextResponse.json(
      { metadata },
      { headers: { "Cache-Control": "no-store, max-age=0" } },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Skill analysis failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
