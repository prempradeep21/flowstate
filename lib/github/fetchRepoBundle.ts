import { analyzeRepoTree } from "@/lib/github/analyzeRepoTree";
import {
  decodeBase64Content,
  fetchRawFile,
  githubFetch,
  GitHubApiError,
} from "@/lib/github/githubClient";
import { parseGithubRepoUrl } from "@/lib/github/parseRepoUrl";
import { detectPreviewUrl } from "@/lib/github/previewDetect";
import { filterDisplayableMedia } from "@/lib/github/mediaDimensions";
import {
  countArchitectureImages,
  extractEnvVars,
  extractInstallCommands,
  extractReadmeMedia,
} from "@/lib/github/readmeMedia";
import { buildRepoOverviewAi } from "@/lib/github/ensureRichOverview";
import {
  analyzeDockerfile,
  analyzePackageJson,
  buildArchitectureSummary,
} from "@/lib/github/stackDetect";
import type {
  BuiltByData,
  MediaData,
  OverviewData,
  RepoExplorerData,
  TechAi,
  TopRepo,
} from "@/lib/github/types";

interface GitHubRepo {
  name: string;
  full_name: string;
  description: string | null;
  html_url: string;
  created_at: string;
  updated_at: string;
  pushed_at: string;
  stargazers_count: number;
  forks_count: number;
  watchers_count: number;
  open_issues_count: number;
  license: { spdx_id?: string; name?: string } | null;
  language: string | null;
  size: number;
  topics: string[];
  homepage: string | null;
  default_branch: string;
  has_pages: boolean;
  owner: { login: string; type: string };
}

interface GitHubUser {
  login: string;
  name: string | null;
  avatar_url: string;
  html_url: string;
  blog: string | null;
  company: string | null;
  location: string | null;
  bio: string | null;
  followers: number;
  public_repos: number;
  twitter_username?: string | null;
  created_at: string;
}

interface GitHubReadme {
  content: string;
  encoding: string;
}

interface GitHubRepoListItem {
  name: string;
  description: string | null;
  stargazers_count: number;
  html_url: string;
}

export async function fetchRepoExplorer(url: string): Promise<RepoExplorerData> {
  const parsed = parseGithubRepoUrl(url);
  if (!parsed) {
    throw new Error("Invalid GitHub repository URL");
  }

  const { owner, repo } = parsed;

  const repoMeta = await githubFetch<GitHubRepo>(`/repos/${owner}/${repo}`);
  const branch = repoMeta.default_branch || "main";

  const [readmeRes, languages, ownerProfile, ownerRepos, packageRaw, dockerRaw, fileStructure] =
    await Promise.all([
      githubFetch<GitHubReadme>(`/repos/${owner}/${repo}/readme`).catch(() => null),
      githubFetch<Record<string, number>>(`/repos/${owner}/${repo}/languages`).catch(
        () => ({}),
      ),
      githubFetch<GitHubUser>(`/users/${owner}`).catch(() => null),
      githubFetch<GitHubRepoListItem[]>(
        `/users/${owner}/repos?sort=stars&per_page=6`,
      ).catch(() => []),
      fetchRawFile(owner, repo, "package.json", branch),
      fetchRawFile(owner, repo, "Dockerfile", branch),
      analyzeRepoTree(owner, repo, branch),
    ]);

  const readme = readmeRes?.content
    ? decodeBase64Content(readmeRes.content)
    : (await fetchRawFile(owner, repo, "README.md", branch)) ?? "";

  let packageJson: Record<string, unknown> | undefined;
  if (packageRaw) {
    try {
      packageJson = JSON.parse(packageRaw) as Record<string, unknown>;
    } catch {
      packageJson = undefined;
    }
  }

  const mediaItems = extractReadmeMedia(readme, owner, repo, branch);
  const displayableItems = await filterDisplayableMedia(mediaItems);
  const archCount = countArchitectureImages(mediaItems);
  const images = mediaItems.filter((i) => i.kind === "image");
  const videos = mediaItems.filter((i) => i.kind === "youtube" || i.kind === "video");

  const media: MediaData = {
    screenshotCount: images.length,
    videoCount: videos.length,
    architectureDiagramCount: archCount,
    primaryScreenshot: displayableItems[0]?.url ?? images[0]?.url,
    primaryDemoVideo: videos[0]?.url,
    items: mediaItems.slice(0, 12),
    displayableItems: displayableItems.slice(0, 6),
  };

  const preview = detectPreviewUrl(
    repoMeta.homepage,
    readme,
    repoMeta.has_pages,
  );

  let tech = packageJson
    ? analyzePackageJson(packageJson, languages)
    : {
        aiProviders: [] as string[],
        programmingLanguages: Object.entries(languages).map(([name, bytes]) => {
          const total = Object.values(languages).reduce((a, b) => a + b, 1);
          return { name, bytes, percent: Math.round((bytes / total) * 1000) / 10 };
        }),
        dependencies: [] as string[],
        dockerSupport: false,
        installationCommands: extractInstallCommands(readme),
        envVarsRequired: extractEnvVars(readme),
      };

  if (dockerRaw) tech = analyzeDockerfile(dockerRaw, tech);
  tech = {
    ...tech,
    installationCommands:
      tech.installationCommands.length > 0
        ? tech.installationCommands
        : extractInstallCommands(readme),
    envVarsRequired: extractEnvVars(readme, packageJson),
  };

  const deps = packageJson
    ? [
        ...Object.keys((packageJson.dependencies as object) ?? {}),
        ...Object.keys((packageJson.devDependencies as object) ?? {}),
      ]
    : [];

  const overview: OverviewData = {
    name: repoMeta.name,
    fullName: repoMeta.full_name,
    description: repoMeta.description,
    htmlUrl: repoMeta.html_url,
    createdAt: repoMeta.created_at,
    updatedAt: repoMeta.updated_at,
    pushedAt: repoMeta.pushed_at,
    stars: repoMeta.stargazers_count,
    forks: repoMeta.forks_count,
    watchers: repoMeta.watchers_count,
    openIssues: repoMeta.open_issues_count,
    license: repoMeta.license?.spdx_id ?? repoMeta.license?.name ?? null,
    primaryLanguage: repoMeta.language,
    sizeKb: repoMeta.size,
    topics: repoMeta.topics,
  };

  const overviewAi = await buildRepoOverviewAi({
    name: repoMeta.name,
    fullName: repoMeta.full_name,
    description: repoMeta.description,
    readme,
    deps,
    topics: repoMeta.topics,
    language: repoMeta.language,
    license: repoMeta.license?.spdx_id ?? repoMeta.license?.name ?? null,
  }).catch(() => undefined);

  const techAi: TechAi = {
    architectureSummary: buildArchitectureSummary(tech),
    estimatedSetupTime: readme.includes("30 minute") ? "~30 minutes" : "~15–30 minutes",
  };

  const topRepos: TopRepo[] = (ownerRepos ?? [])
    .filter((r) => r.name !== repo)
    .sort((a, b) => b.stargazers_count - a.stargazers_count)
    .slice(0, 3)
    .map((r) => ({
      name: r.name,
      description: r.description,
      stars: r.stargazers_count,
      htmlUrl: r.html_url,
    }));

  const yearsActive = ownerProfile
    ? Math.max(
        1,
        Math.floor(
          (Date.now() - new Date(ownerProfile.created_at).getTime()) /
            (365.25 * 24 * 60 * 60 * 1000),
        ),
      )
    : 0;

  const builtBy: BuiltByData = {
    name: ownerProfile?.name ?? null,
    login: ownerProfile?.login ?? owner,
    avatarUrl: ownerProfile?.avatar_url ?? `https://github.com/${owner}.png`,
    htmlUrl: ownerProfile?.html_url ?? `https://github.com/${owner}`,
    website: ownerProfile?.blog || undefined,
    company: ownerProfile?.company || undefined,
    location: ownerProfile?.location || undefined,
    bio: ownerProfile?.bio ?? null,
    followers: ownerProfile?.followers ?? 0,
    publicRepos: ownerProfile?.public_repos ?? 0,
    twitterUsername: ownerProfile?.twitter_username ?? undefined,
    topRepos,
    yearsActive,
  };

  return {
    repoUrl: repoMeta.html_url,
    owner,
    name: repoMeta.name,
    enrichmentStatus: "complete",
    overview: {
      status: "ready",
      data: overview,
      ...(overviewAi ? { ai: overviewAi } : {}),
    },
    fileStructure: { status: "ready", data: fileStructure },
    media: { status: "ready", data: media },
    preview: { status: "ready", data: preview },
    techDetails: { status: "ready", data: tech, ai: techAi },
    builtBy: { status: "ready", data: builtBy },
    fetchedAt: new Date().toISOString(),
  };
}

export { GitHubApiError };
