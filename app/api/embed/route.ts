import { NextResponse } from "next/server";
import { resolveEmbedUrl } from "@/lib/embed/resolveEmbed";
import { validateLinkPreviewUrl } from "@/lib/linkPreview";

export async function GET(req: Request) {
  const raw = new URL(req.url).searchParams.get("url")?.trim() ?? "";
  if (!raw) {
    return NextResponse.json({ error: "Missing url parameter" }, { status: 400 });
  }

  if (!validateLinkPreviewUrl(raw)) {
    return NextResponse.json({ error: "Invalid or blocked URL" }, { status: 400 });
  }

  const result = await resolveEmbedUrl(raw);
  if (!result) {
    return NextResponse.json({ error: "Unsupported embed URL" }, { status: 400 });
  }

  return NextResponse.json(result);
}
