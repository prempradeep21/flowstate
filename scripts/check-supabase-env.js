const fs = require("fs");
const path = require("path");

function loadEnvLocal() {
  const envPath = path.join(__dirname, "..", ".env.local");
  if (!fs.existsSync(envPath)) return {};
  const vars = {};
  for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const idx = trimmed.indexOf("=");
    if (idx === -1) continue;
    const key = trimmed.slice(0, idx).trim();
    const value = trimmed.slice(idx + 1).trim();
    vars[key] = value;
  }
  return vars;
}

function getProjectRef(url) {
  if (!url) return null;
  try {
    const host = new URL(url).hostname;
    const match = host.match(/^([a-z0-9]+)\.supabase\.co$/i);
    return match ? match[1] : null;
  } catch {
    return null;
  }
}

const env = loadEnvLocal();
const readOnly = (env.NEXT_PUBLIC_LOCAL_READ_ONLY ?? "").trim().toLowerCase() !== "false";
const projectRef = getProjectRef(env.NEXT_PUBLIC_SUPABASE_URL);
const configured = Boolean(
  env.NEXT_PUBLIC_SUPABASE_URL && env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
);

const isCli = require.main === module;

if (!configured) {
  console.log(
    "\n[supabase] No .env.local Supabase keys — local canvas mode only.\n",
  );
  if (isCli) process.exit(0);
} else if (readOnly) {
  console.log(
    `\n[supabase] Local read-only session — project ${projectRef ?? "(unknown)"}.`,
    "\n  Loads production data; writes stay in this browser until reload.\n",
  );
  if (isCli) process.exit(0);
} else {
  console.warn(
    `\n[supabase] WARNING: NEXT_PUBLIC_LOCAL_READ_ONLY=false — localhost WRITES to project ${projectRef ?? "unknown"}.`,
    "\n  Remove that override to protect production while developing.\n",
  );
}
