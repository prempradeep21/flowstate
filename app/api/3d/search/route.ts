import { searchCanvas3DCatalog } from "@/lib/canvas3d/search";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q") ?? undefined;
  const offset = Number(searchParams.get("offset") ?? "0");
  const limit = Number(searchParams.get("limit") ?? "24");

  const data = searchCanvas3DCatalog({
    query,
    offset: Number.isFinite(offset) ? offset : 0,
    limit: Number.isFinite(limit) ? limit : 24,
  });

  return Response.json(data);
}
