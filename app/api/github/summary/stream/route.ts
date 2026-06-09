import Anthropic from "@anthropic-ai/sdk";
import { buildRepoOverviewAi } from "@/lib/github/ensureRichOverview";
import {
  decodeBase64Content,
  fetchRawFile,
  githubFetch,
  GitHubApiError,
} from "@/lib/github/githubClient";
import { parseGithubRepoUrl } from "@/lib/github/parseRepoUrl";
import { polishWhatItIsCopy } from "@/lib/github/overviewCopyLimits";
import { extractReadmeProse } from "@/lib/github/readmeSummary";

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
    return new Response("Invalid GitHub repository URL", { status: 400 });
  }

  const { owner, repo } = parseGithubRepoUrl(raw)!;
  const apiKey = process.env.ANTHROPIC_API_KEY?.trim();

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

    const input = {
      name: repoMeta.name,
      fullName: repoMeta.full_name,
      description: repoMeta.description,
      readme,
      deps,
      topics: repoMeta.topics,
      language: repoMeta.language,
      license: repoMeta.license?.spdx_id ?? repoMeta.license?.name ?? null,
    };

    if (!apiKey) {
      const ai = await buildRepoOverviewAi(input);
      const text = polishWhatItIsCopy(ai.whatItIs);
      return new Response(text, {
        headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" },
      });
    }

    const prose = extractReadmeProse(readme, 6000);
    const prompt = `Repository: ${input.fullName}
GitHub description: ${input.description ?? "(none)"}
Primary language: ${input.language ?? "unknown"}
Topics: ${input.topics.join(", ") || "(none)"}

README excerpt:
${prose}

Write exactly 2 short paragraphs explaining what this GitHub repository is and what it does.
Plain English only — NO URLs, NO markdown, NO "Note:" or disclaimers.
Separate paragraphs with a blank line. Max ~110 words total.`;

    const client = new Anthropic({ apiKey });
    const stream = client.messages.stream({
      model: "claude-sonnet-4-20250514",
      max_tokens: 600,
      system:
        "You summarize GitHub repositories in clear, simple English. Write original prose — never copy README links or notes.",
      messages: [{ role: "user", content: prompt }],
    });

    const encoder = new TextEncoder();
    const body = new ReadableStream({
      async start(controller) {
        try {
          for await (const event of stream) {
            if (
              event.type === "content_block_delta" &&
              event.delta.type === "text_delta"
            ) {
              controller.enqueue(encoder.encode(event.delta.text));
            }
          }
          controller.close();
        } catch (err) {
          controller.error(err);
        }
      },
    });

    return new Response(body, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    if (err instanceof GitHubApiError) {
      return new Response(err.message, { status: err.status === 404 ? 404 : 502 });
    }
    const message = err instanceof Error ? err.message : "Stream failed";
    return new Response(message, { status: 500 });
  }
}
