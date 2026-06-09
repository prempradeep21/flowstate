import { NextResponse } from "next/server";
import { buildRepoOverviewAi } from "@/lib/github/ensureRichOverview";
import {
  decodeBase64Content,
  fetchRawFile,
  githubFetch,
  GitHubApiError,
} from "@/lib/github/githubClient";
import { parseGithubRepoUrl } from "@/lib/github/parseRepoUrl";

export const dynamic = "force-dynamic";

interface RepoMeta {
  name: string;
  full_name: string;
  description: string | null;
  topics: string[];
  language: string | null;
  default_branch: string;
  license: { spdx_id?: string; name?: string } | null;
}

export async function GET(req: Request) {
  const raw = new URL(req.url).searchParams.get("url")?.trim() ?? "";
  if (!raw || !parseGithubRepoUrl(raw)) {
    return NextResponse.json({ error: "Invalid GitHub repository URL" }, { status: 400 });
  }

  const { owner, repo } = parseGithubRepoUrl(raw)!;

  try {
    const repoMeta = await githubFetch<RepoMeta>(`/repos/${owner}/${repo}`);
    const branch = repoMeta.default_branch || "main";

    const [readmeRes, packageRaw] = await Promise.all([
      githubFetch<{ content: string }>(`/repos/${owner}/${repo}/readme`).catch(() => null),
      fetchRawFile(owner, repo, "package.json", branch),
    ]);

    let readme = readmeRes?.content ? decodeBase64Content(readmeRes.content) : "";
    if (!readme) {
      readme = (await fetchRawFile(owner, repo, "README.md", branch)) ?? "";
    }

    let deps: string[] = [];
    if (packageRaw) {
      try {
        const pkg = JSON.parse(packageRaw) as Record<string, unknown>;
        deps = [
          ...Object.keys((pkg.dependencies as object) ?? {}),
          ...Object.keys((pkg.devDependencies as object) ?? {}),
        ];
      } catch {
        deps = [];
      }
    }

    const ai = await buildRepoOverviewAi({
      name: repoMeta.name,
      fullName: repoMeta.full_name,
      description: repoMeta.description,
      readme,
      deps,
      topics: repoMeta.topics,
      language: repoMeta.language,
      license: repoMeta.license?.spdx_id ?? repoMeta.license?.name ?? null,
    });

    return NextResponse.json(
      { ai },
      { headers: { "Cache-Control": "no-store, max-age=0" } },
    );
  } catch (err) {
    if (err instanceof GitHubApiError) {
      return NextResponse.json({ error: err.message }, { status: err.status === 404 ? 404 : 502 });
    }
    const message = err instanceof Error ? err.message : "Summary failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
