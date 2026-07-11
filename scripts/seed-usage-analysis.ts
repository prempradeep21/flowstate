import { readFileSync } from "fs";
import { resolve } from "path";
import { saveUsageAnalysisSnapshot } from "../lib/admin/usageAnalysis.server";

function loadEnvLocal() {
  try {
    const raw = readFileSync(resolve(process.cwd(), ".env.local"), "utf8");
    for (const line of raw.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      let value = trimmed.slice(eq + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      if (!process.env[key]) process.env[key] = value;
    }
  } catch {
    // .env.local optional when env is already set
  }
}

loadEnvLocal();

async function main() {
  const row = await saveUsageAnalysisSnapshot();
  console.log("Snapshot saved:", row.id, row.computed_at, row.stats);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
