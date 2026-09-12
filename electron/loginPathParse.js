/**
 * Pure helpers for recovering the user's real PATH. No Electron, no fs, no
 * child_process — so the parsing (the part that fails silently) is testable.
 *
 * Why this exists: a Mac app launched from Finder or the Dock inherits
 * launchd's PATH (/usr/bin:/bin:/usr/sbin:/sbin), NOT the one your shell builds
 * from ~/.zprofile and ~/.zshrc. Homebrew and nvm live outside that list, so
 * spawning `npx` for a stdio MCP server fails with ENOENT in ~6ms. Only
 * `npm run electron:dev` — launched from a terminal — has ever worked.
 */

const BEGIN = "__FLOWSTATE_PATH_BEGIN__";
const END = "__FLOWSTATE_PATH_END__";

/**
 * The command handed to the login shell. Sentinels because an interactive
 * shell also emits banners, MOTDs, version-manager chatter and ANSI codes;
 * `command echo` sidesteps a user-shadowed `echo`.
 *
 * `${PATH}` MUST be braced: the sentinels start with underscores, and bare
 * `$PATH__FLOWSTATE...` parses as a variable *named* PATH__FLOWSTATE..., which
 * expands to nothing. That failure is silent — every user quietly drops to the
 * fallback path — so the braces are load-bearing, not style.
 */
const PROBE_COMMAND = 'command echo "' + BEGIN + '${PATH}' + END + '"';

/** Extract PATH from noisy shell output. Returns null when absent or empty. */
function parseProbeOutput(stdout) {
  if (typeof stdout !== "string") return null;
  const start = stdout.indexOf(BEGIN);
  if (start === -1) return null;
  const from = start + BEGIN.length;
  const end = stdout.indexOf(END, from);
  if (end === -1) return null;
  const value = stdout.slice(from, end).trim();
  return value ? value : null;
}

/** Split, drop empties, dedupe, preserve first-seen order. */
function dedupePathEntries(pathValue) {
  const seen = new Set();
  const out = [];
  for (const entry of String(pathValue || "").split(":")) {
    const trimmed = entry.trim();
    if (!trimmed || seen.has(trimmed)) continue;
    seen.add(trimmed);
    out.push(trimmed);
  }
  return out;
}

/**
 * Fallback when the probe fails: prepend the directories real toolchains
 * actually install into, but only those present on this machine. Better than
 * launchd's four entries, and never worse than what we started with.
 *
 * `existsSync` and `readdir` are injected so this stays pure and testable.
 */
function augmentFallbackPath(currentPath, existsSync, homeDir, nvmVersionDirs = []) {
  const candidates = [
    "/opt/homebrew/bin",
    "/opt/homebrew/sbin",
    "/usr/local/bin",
    ...(homeDir ? [`${homeDir}/.local/bin`] : []),
    // Newest first — callers pass these pre-sorted.
    ...nvmVersionDirs,
  ];

  const prefix = candidates.filter((dir) => {
    try {
      return existsSync(dir);
    } catch {
      return false;
    }
  });

  return dedupePathEntries([...prefix, ...dedupePathEntries(currentPath)].join(":")).join(":");
}

module.exports = {
  BEGIN,
  END,
  PROBE_COMMAND,
  parseProbeOutput,
  dedupePathEntries,
  augmentFallbackPath,
};
