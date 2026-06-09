const { spawn } = require("child_process");

const PORT = 3050;
const CATALOG_PATH = "/dev/artifact-catalog";

console.log(`\n→ Open: http://localhost:${PORT}${CATALOG_PATH}\n`);

const child = spawn("npx", ["next", "dev", "-p", String(PORT)], {
  stdio: "inherit",
  shell: true,
  env: { ...process.env, NEXT_DIST_DIR: ".next-artifact-catalog" },
});

child.on("exit", (code) => process.exit(code ?? 0));
