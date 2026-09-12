/**
 * Recover the user's real PATH by asking their login shell, and cache it.
 *
 * See loginPathParse.js for why this is necessary. Everything here is
 * best-effort: boot must never fail because a shell was slow or exotic.
 */

const { execFile } = require("node:child_process");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const {
  PROBE_COMMAND,
  parseProbeOutput,
  augmentFallbackPath,
} = require("./loginPathParse.js");

const PROBE_TIMEOUT_MS = 5_000;
const CACHE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;
const CACHE_FILE = "shell-path.json";

function cachePath(app) {
  return path.join(app.getPath("userData"), CACHE_FILE);
}

function readCache(app, shell) {
  try {
    const raw = JSON.parse(fs.readFileSync(cachePath(app), "utf8"));
    if (typeof raw?.path !== "string" || !raw.path) return null;
    if (raw.shell !== shell) return null;
    if (Date.now() - Number(raw.capturedAt || 0) > CACHE_MAX_AGE_MS) return null;
    return raw.path;
  } catch {
    return null;
  }
}

function writeCache(app, shell, value) {
  try {
    fs.writeFileSync(
      cachePath(app),
      JSON.stringify({ path: value, shell, capturedAt: Date.now() }, null, 2),
      { mode: 0o600 },
    );
  } catch {
    // A cache we cannot write just means we probe again next launch.
  }
}

/** Newest-first nvm bin directories, if any. Cheap and sync; runs once. */
function nvmBinDirs(homeDir) {
  try {
    const base = path.join(homeDir, ".nvm", "versions", "node");
    return fs
      .readdirSync(base)
      .sort()
      .reverse()
      .map((v) => path.join(base, v, "bin"));
  } catch {
    return [];
  }
}

function fallbackPath() {
  const home = os.homedir();
  return augmentFallbackPath(
    process.env.PATH || "",
    fs.existsSync,
    home,
    nvmBinDirs(home),
  );
}

/**
 * Ask the shell. `-ilc` (interactive login) rather than `-lc`: a login-only
 * zsh sources .zprofile but NOT .zshrc, which is where nvm/mise/fnm loaders
 * usually live. FLOWSTATE_PATH_PROBE guards against an rc file that would
 * otherwise relaunch something on every probe.
 */
function probeShell(shell) {
  return new Promise((resolve) => {
    execFile(
      shell,
      ["-ilc", PROBE_COMMAND],
      {
        timeout: PROBE_TIMEOUT_MS,
        env: { ...process.env, FLOWSTATE_PATH_PROBE: "1" },
        maxBuffer: 1024 * 1024,
      },
      (err, stdout) => {
        // Ignore err: interactive shells routinely exit non-zero after
        // printing perfectly good output. The sentinels are the real check.
        resolve(parseProbeOutput(stdout));
      },
    );
  });
}

/**
 * Resolve the PATH to hand the embedded Next server. Never throws.
 * A warm cache returns immediately and refreshes in the background, so only
 * the first launch on a machine pays the 200ms-2s interactive-shell cost.
 */
async function resolveLoginPath(app) {
  const shell = process.env.SHELL || "/bin/zsh";

  const cached = readCache(app, shell);
  if (cached) {
    void probeShell(shell).then((fresh) => {
      if (fresh && fresh !== cached) writeCache(app, shell, fresh);
    });
    return cached;
  }

  const probed = await probeShell(shell);
  if (probed) {
    writeCache(app, shell, probed);
    return probed;
  }

  console.warn(
    `[flowstate] Could not read PATH from ${shell}; falling back to known tool directories. ` +
      "Local (stdio) MCP servers may not find npx/uvx.",
  );
  return fallbackPath();
}

module.exports = { resolveLoginPath, fallbackPath };
