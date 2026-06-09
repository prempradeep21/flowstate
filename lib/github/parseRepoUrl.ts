import type { RepoRef } from "@/lib/github/types";

const GITHUB_HOSTS = new Set(["github.com", "www.github.com"]);

/** Parse a GitHub repository URL into owner/repo. Returns null for non-repo paths. */
export function parseGithubRepoUrl(input: string): RepoRef | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  let url: URL;
  try {
    const withScheme = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
    url = new URL(withScheme);
  } catch {
    return null;
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") return null;
  if (!GITHUB_HOSTS.has(url.hostname.toLowerCase())) return null;

  const parts = url.pathname.split("/").filter(Boolean);
  if (parts.length < 2) return null;

  const [owner, repoRaw, ...rest] = parts;
  if (!owner || !repoRaw) return null;

  const reserved = new Set([
    "settings",
    "orgs",
    "organizations",
    "marketplace",
    "topics",
    "explore",
    "features",
    "enterprise",
    "login",
    "signup",
  ]);
  if (reserved.has(owner.toLowerCase())) return null;

  const repo = repoRaw.replace(/\.git$/i, "");
  if (["tree", "blob", "commits", "pull", "issues", "discussions", "wiki", "actions"].includes(repo)) {
    return null;
  }

  if (rest[0] === "tree" || rest[0] === "blob") {
    // Still a repo URL with path — valid
  }

  return {
    owner,
    repo,
    defaultBranch: "main",
  };
}

export function repoCacheKey(ref: Pick<RepoRef, "owner" | "repo">, branch: string): string {
  return `${ref.owner}/${ref.repo}@${branch}`;
}
