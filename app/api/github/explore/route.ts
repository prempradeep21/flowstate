import { NextResponse } from "next/server";
import { fetchRepoExplorer, GitHubApiError } from "@/lib/github/fetchRepoBundle";
import { fetchRepoExploreCached } from "@/lib/github/repoExploreCache";
import { parseGithubRepoUrl } from "@/lib/github/parseRepoUrl";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const raw = new URL(req.url).searchParams.get("url")?.trim() ?? "";
  if (!raw) {
    return NextResponse.json({ error: "Missing url parameter" }, { status: 400 });
  }

  if (!parseGithubRepoUrl(raw)) {
    return NextResponse.json(
      { error: "Invalid GitHub repository URL" },
      { status: 400 },
    );
  }

  try {
    const data = await fetchRepoExploreCached(raw, () => fetchRepoExplorer(raw));
    return NextResponse.json(data, {
      headers: { "Cache-Control": "no-store, max-age=0" },
    });
  } catch (err) {
    if (err instanceof GitHubApiError) {
      const status =
        err.status === 404 ? 404 : err.status === 429 ? 429 : 502;
      return NextResponse.json(
        {
          error: err.message,
          status: err.status,
          code: err.status === 429 ? "github_rate_limit" : "github_api_error",
        },
        { status },
      );
    }    const message = err instanceof Error ? err.message : "Explore failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
