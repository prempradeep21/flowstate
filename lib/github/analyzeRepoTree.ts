import { githubFetch } from "@/lib/github/githubClient";
import type { FileStructureData } from "@/lib/github/types";

const TREE_ENTRY_CAP = 5000;

interface GitTreeItem {
  path: string;
  type: "blob" | "tree";
  size?: number;
}

interface GitTreeResponse {
  tree: GitTreeItem[];
  truncated: boolean;
}

const EXT_LABELS: Record<string, string> = {
  ts: "TypeScript",
  tsx: "TSX",
  js: "JavaScript",
  jsx: "JSX",
  md: "Markdown",
  json: "JSON",
  yaml: "YAML",
  yml: "YAML",
  txt: "Text",
  py: "Python",
  go: "Go",
  rs: "Rust",
  sh: "Shell",
  sql: "SQL",
  css: "CSS",
  html: "HTML",
  svg: "SVG",
  png: "PNG",
  jpg: "Image",
  jpeg: "Image",
  gif: "GIF",
  toml: "TOML",
  lock: "Lockfile",
};

function extensionOf(path: string): string {
  const base = path.split("/").pop() ?? path;
  const dot = base.lastIndexOf(".");
  if (dot <= 0) return "(no extension)";
  return base.slice(dot + 1).toLowerCase();
}

function labelForExtension(ext: string): string {
  if (ext === "(no extension)") return "No extension";
  return EXT_LABELS[ext] ? `.${ext}` : `.${ext}`;
}

export async function analyzeRepoTree(
  owner: string,
  repo: string,
  branch: string,
): Promise<FileStructureData> {
  let tree: GitTreeItem[] = [];
  let truncated = false;

  try {
    const res = await githubFetch<GitTreeResponse>(
      `/repos/${owner}/${repo}/git/trees/${encodeURIComponent(branch)}?recursive=1`,
      { timeoutMs: 20_000 },
    );
    tree = res.tree ?? [];
    truncated = res.truncated || tree.length > TREE_ENTRY_CAP;
    if (tree.length > TREE_ENTRY_CAP) {
      tree = tree.slice(0, TREE_ENTRY_CAP);
    }
  } catch {
    return {
      totalFiles: 0,
      totalFolders: 0,
      totalEntries: 0,
      truncated: true,
      extensionCounts: [],
      topLevelFolders: [],
    };
  }

  const files = tree.filter((t) => t.type === "blob");
  const trees = tree.filter((t) => t.type === "tree");

  const extMap = new Map<string, number>();
  for (const f of files) {
    const ext = extensionOf(f.path);
    extMap.set(ext, (extMap.get(ext) ?? 0) + 1);
  }

  const extensionCounts = [...extMap.entries()]
    .map(([ext, count]) => ({
      extension: ext,
      label: labelForExtension(ext),
      count,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 16);

  const topLevelSet = new Set<string>();
  for (const f of files) {
    const seg = f.path.split("/")[0];
    if (seg) topLevelSet.add(seg);
  }
  for (const t of trees) {
    const seg = t.path.split("/")[0];
    if (seg) topLevelSet.add(seg);
  }

  const folderPaths = new Set<string>();
  for (const f of files) {
    const parts = f.path.split("/");
    for (let i = 1; i < parts.length; i++) {
      folderPaths.add(parts.slice(0, i).join("/"));
    }
  }
  for (const t of trees) {
    if (t.path) folderPaths.add(t.path);
  }

  const topLevelFolders = [...topLevelSet]
    .filter((name) => {
      const asTree = trees.some((t) => t.path === name);
      const hasChildren = files.some((f) => f.path.startsWith(`${name}/`));
      return asTree || hasChildren;
    })
    .sort((a, b) => a.localeCompare(b))
    .slice(0, 12);

  return {
    totalFiles: files.length,
    totalFolders: Math.max(trees.length, folderPaths.size),
    totalEntries: tree.length,
    truncated,
    extensionCounts,
    topLevelFolders,
  };
}
