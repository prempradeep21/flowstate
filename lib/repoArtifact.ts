import type { ArtifactPayload, RepoArtifactData } from "@/lib/artifactTypes";
import type { RepoExplorerData } from "@/lib/github/types";
import { parseGithubRepoUrl } from "@/lib/github/parseRepoUrl";

/** Source card id for user-initiated repo artifacts (no chat turn). */
export const MANUAL_REPO_SOURCE_CARD_ID = "__manual-repo__";

function emptyExplorer(
  repoUrl: string,
  owner: string,
  repo: string,
): RepoExplorerData {
  return {
    repoUrl,
    owner,
    name: repo,
    enrichmentStatus: "pending",
    overview: { status: "loading" },
    fileStructure: { status: "loading" },
    media: { status: "loading" },
    preview: { status: "loading" },
    techDetails: { status: "loading" },
    builtBy: { status: "loading" },
    fetchedAt: "",
  };
}

export function mergeRepoExplorer(
  prev: RepoExplorerData,
  patch: Partial<RepoExplorerData>,
): RepoExplorerData {
  return {
    ...prev,
    ...patch,
    overview: patch.overview
      ? { ...prev.overview, ...patch.overview, ai: patch.overview.ai ?? prev.overview.ai }
      : prev.overview,
    fileStructure: patch.fileStructure
      ? { ...prev.fileStructure, ...patch.fileStructure }
      : prev.fileStructure,
    media: patch.media ? { ...prev.media, ...patch.media } : prev.media,
    preview: patch.preview ? { ...prev.preview, ...patch.preview } : prev.preview,
    techDetails: patch.techDetails
      ? {
          ...prev.techDetails,
          ...patch.techDetails,
          ai: patch.techDetails.ai ?? prev.techDetails.ai,
        }
      : prev.techDetails,
    builtBy: patch.builtBy ? { ...prev.builtBy, ...patch.builtBy } : prev.builtBy,
  };
}

export function normalizeRepoArtifactData(data: unknown): RepoArtifactData {
  const obj =
    data && typeof data === "object" ? (data as Record<string, unknown>) : {};
  const repoUrl = typeof obj.repoUrl === "string" ? obj.repoUrl.trim() : "";
  const owner = typeof obj.owner === "string" ? obj.owner.trim() : "";
  const repo = typeof obj.repo === "string" ? obj.repo.trim() : "";
  const displayTitle =
    typeof obj.displayTitle === "string" && obj.displayTitle.trim()
      ? obj.displayTitle.trim()
      : owner && repo
        ? `${owner}/${repo}`
        : "GitHub repository";
  const explorerRaw = obj.explorer;
  const explorer =
    explorerRaw && typeof explorerRaw === "object"
      ? (explorerRaw as RepoExplorerData)
      : emptyExplorer(repoUrl, owner, repo);
  return { repoUrl, owner, repo, displayTitle, explorer };
}

export function normalizeRepoPayload(
  payload: Extract<ArtifactPayload, { type: "repo" }>,
): Extract<ArtifactPayload, { type: "repo" }> {
  const data = normalizeRepoArtifactData(payload.data);
  return {
    ...payload,
    title: payload.title?.trim() || data.displayTitle,
    data,
  };
}

export function createRepoPayload(url: string): Extract<ArtifactPayload, { type: "repo" }> | null {
  const parsed = parseGithubRepoUrl(url);
  if (!parsed) return null;
  const repoUrl = url.trim().startsWith("http") ? url.trim() : `https://${url.trim()}`;
  const displayTitle = `${parsed.owner}/${parsed.repo}`;
  return {
    type: "repo",
    title: displayTitle,
    data: {
      repoUrl,
      owner: parsed.owner,
      repo: parsed.repo,
      displayTitle,
      explorer: emptyExplorer(repoUrl, parsed.owner, parsed.repo),
    },
  };
}
