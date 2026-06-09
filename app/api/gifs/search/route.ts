import { searchGiphy, type GiphySearchCategory } from "@/lib/giphy/client";

export const runtime = "nodejs";

function parseCategory(raw: string | null): GiphySearchCategory {
  return raw === "sticker" ? "sticker" : "gif";
}

export async function GET(request: Request) {
  const apiKey = process.env.GIPHY_API_KEY;
  if (!apiKey) {
    return Response.json(
      {
        error:
          "GIF search is not configured. Add GIPHY_API_KEY to .env.local.",
      },
      { status: 503 },
    );
  }

  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q") ?? undefined;
  const category = parseCategory(searchParams.get("category"));
  const offset = Number(searchParams.get("offset") ?? "0");
  const limit = Number(searchParams.get("limit") ?? "24");

  try {
    const data = await searchGiphy(apiKey, {
      query,
      category,
      offset: Number.isFinite(offset) ? offset : 0,
      limit: Number.isFinite(limit) ? limit : 24,
    });
    return Response.json(data);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to fetch GIFs";
    return Response.json({ error: message }, { status: 502 });
  }
}
