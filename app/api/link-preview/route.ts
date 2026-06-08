import { NextResponse } from "next/server";
import { fetchLinkPreview, validateLinkPreviewUrl } from "@/lib/linkPreview";
import { fetchPageScreenshot } from "@/lib/pageScreenshot";

export async function GET(req: Request) {
  const raw = new URL(req.url).searchParams.get("url")?.trim() ?? "";
  if (!raw) {
    return NextResponse.json({ error: "Missing url parameter" }, { status: 400 });
  }

  if (!validateLinkPreviewUrl(raw)) {
    return NextResponse.json({ error: "Invalid or blocked URL" }, { status: 400 });
  }

  try {
    const result = await fetchLinkPreview(raw);
    if (!result.previewImageUrl) {
      const screenshotUrl = await fetchPageScreenshot(raw);
      if (screenshotUrl) {
        result.previewImageUrl = screenshotUrl;
      }
    }
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: "Preview failed" }, { status: 500 });
  }
}
