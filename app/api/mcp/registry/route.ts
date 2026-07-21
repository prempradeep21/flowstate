import { createClient } from "@/lib/supabase/server";
import { searchRegistry } from "@/lib/mcp/registryClient";

export async function GET(req: Request) {
  const supabase = await createClient().catch(() => null);
  if (!supabase) return Response.json({ error: "Supabase not configured" }, { status: 500 });
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const query = url.searchParams.get("q") ?? undefined;
  const cursor = url.searchParams.get("cursor") ?? undefined;

  try {
    const result = await searchRegistry({ query, cursor });
    // The web app can only use remote-capable servers.
    const servers = result.servers.filter((s) => s.remotes.length > 0);
    return Response.json({ servers, nextCursor: result.nextCursor });
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : "Registry search failed" },
      { status: 502 },
    );
  }
}
