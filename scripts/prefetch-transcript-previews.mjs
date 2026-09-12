import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const tsxCli = path.join(root, "node_modules", "tsx", "dist", "cli.mjs");
const scriptPath = path.join(__dirname, "prefetch-transcript-previews.ts");

const result = spawnSync(process.execPath, [tsxCli, scriptPath], {
  stdio: "inherit",
  cwd: root,
});
process.exit(result.status ?? 1);
