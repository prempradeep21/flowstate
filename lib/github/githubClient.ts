const GITHUB_API = "https://api.github.com";
const USER_AGENT = "FlowstateRepoExplorer/1.0";

export class GitHubApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "GitHubApiError";
  }
}

function authHeaders(): HeadersInit {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "User-Agent": USER_AGENT,
  };
  const token = process.env.GITHUB_TOKEN?.trim();
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

export async function githubFetch<T>(
  path: string,
  opts?: { timeoutMs?: number },
): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), opts?.timeoutMs ?? 12_000);

  try {
    const res = await fetch(`${GITHUB_API}${path}`, {
      headers: authHeaders(),
      signal: controller.signal,
      next: { revalidate: 3600 },
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      const isRateLimit = res.status === 403 || res.status === 429;
      throw new GitHubApiError(
        isRateLimit
          ? "GitHub API rate limit exceeded. Add GITHUB_TOKEN to .env.local for higher limits."
          : body || `GitHub API ${res.status}`,
        isRateLimit ? 429 : res.status,
      );
    }

    return (await res.json()) as T;
  } finally {
    clearTimeout(timeout);
  }
}

export async function fetchRawFile(
  owner: string,
  repo: string,
  path: string,
  ref: string,
): Promise<string | null> {
  const url = `https://raw.githubusercontent.com/${owner}/${repo}/${ref}/${path}`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": USER_AGENT },
      signal: controller.signal,
    });
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

export function decodeBase64Content(content: string): string {
  return Buffer.from(content.replace(/\n/g, ""), "base64").toString("utf8");
}
