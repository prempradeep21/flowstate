import type { MediaItem } from "@/lib/github/types";

const ARCH_KEYWORDS = /architecture|system|design|workflow|diagram|topology/i;
const YOUTUBE_RE =
  /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]{11})/gi;
const LOOM_RE = /https?:\/\/(?:www\.)?loom\.com\/share\/[\w-]+/gi;
const IMG_MD_RE = /!\[([^\]]*)\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g;
const IMG_HTML_RE = /<img[^>]+src=["']([^"']+)["'][^>]*>/gi;

function resolveRelativeUrl(
  src: string,
  owner: string,
  repo: string,
  branch: string,
): string {
  const trimmed = src.trim();
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (trimmed.startsWith("//")) return `https:${trimmed}`;
  const path = trimmed.replace(/^\.\//, "").replace(/^\//, "");
  return `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${path}`;
}

function youtubeThumb(id: string): string {
  return `https://img.youtube.com/vi/${id}/hqdefault.jpg`;
}

export function extractReadmeMedia(
  readme: string,
  owner: string,
  repo: string,
  branch: string,
): MediaItem[] {
  const items: MediaItem[] = [];
  const seen = new Set<string>();

  const add = (item: MediaItem) => {
    if (seen.has(item.url)) return;
    seen.add(item.url);
    items.push(item);
  };

  let match: RegExpExecArray | null;
  IMG_MD_RE.lastIndex = 0;
  while ((match = IMG_MD_RE.exec(readme)) !== null) {
    const alt = match[1] ?? "";
    const url = resolveRelativeUrl(match[2], owner, repo, branch);
    add({ kind: "image", url, alt });
  }

  IMG_HTML_RE.lastIndex = 0;
  while ((match = IMG_HTML_RE.exec(readme)) !== null) {
    const url = resolveRelativeUrl(match[1], owner, repo, branch);
    add({ kind: "image", url });
  }

  YOUTUBE_RE.lastIndex = 0;
  while ((match = YOUTUBE_RE.exec(readme)) !== null) {
    const id = match[1];
    const url = `https://www.youtube.com/watch?v=${id}`;
    add({
      kind: "youtube",
      url,
      thumb: youtubeThumb(id),
      title: "YouTube video",
    });
  }

  LOOM_RE.lastIndex = 0;
  while ((match = LOOM_RE.exec(readme)) !== null) {
    add({ kind: "video", url: match[0], title: "Loom video" });
  }

  return items;
}

export function countArchitectureImages(items: MediaItem[]): number {
  return items.filter(
    (i) =>
      i.kind === "image" &&
      (ARCH_KEYWORDS.test(i.url) || ARCH_KEYWORDS.test(i.alt ?? "")),
  ).length;
}

export function readmeFirstParagraph(readme: string): string {
  const lines = readme.split("\n");
  const buf: string[] = [];
  for (const line of lines) {
    const t = line.trim();
    if (!t || t.startsWith("#") || t.startsWith(">")) continue;
    if (t.startsWith("!") || t.startsWith("|") || t.startsWith("```")) continue;
    buf.push(t);
    if (buf.join(" ").length > 120) break;
  }
  return buf.join(" ").slice(0, 280);
}

export function extractInstallCommands(readme: string): string[] {
  const commands: string[] = [];
  const codeBlockRe = /```(?:bash|sh|shell)?\n([\s\S]*?)```/gi;
  let match: RegExpExecArray | null;
  while ((match = codeBlockRe.exec(readme)) !== null) {
    const block = match[1];
    for (const line of block.split("\n")) {
      const t = line.trim();
      if (
        /^(npm|pnpm|yarn|bun|pip|cargo|go|docker|git clone|curl|brew|gbrain)/.test(t) &&
        !t.startsWith("#")
      ) {
        commands.push(t);
      }
    }
  }
  return [...new Set(commands)].slice(0, 6);
}

export function extractEnvVars(readme: string, packageJson?: Record<string, unknown>): string[] {
  const vars = new Set<string>();
  const namedEnvRe = /\b([A-Z][A-Z0-9_]{3,})\b/g;
  const allow = (name: string) =>
    /_(KEY|TOKEN|URL|SECRET|ID|HOST|PORT)$/.test(name) ||
    name === "DATABASE_URL" ||
    name.startsWith("GITHUB_") ||
    name.startsWith("SUPABASE_");

  let m: RegExpExecArray | null;
  while ((m = namedEnvRe.exec(readme)) !== null) {
    if (allow(m[1])) vars.add(m[1]);
  }
  const scripts = packageJson?.scripts as Record<string, string> | undefined;
  if (scripts) {
    for (const s of Object.values(scripts)) {
      while ((m = namedEnvRe.exec(s)) !== null) {
        if (allow(m[1])) vars.add(m[1]);
      }
    }
  }
  return [...vars].slice(0, 12);
}
