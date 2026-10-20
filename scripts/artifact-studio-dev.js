const { spawn } = require("child_process");

const PORT = 3051;
const STUDIO_PATH = "/dev/artifact-studio";

console.log(`\n→ Open: http://localhost:${PORT}${STUDIO_PATH}\n`);

const child = spawn("npx", ["next", "dev", "-p", String(PORT)], {
  stdio: "inherit",
  shell: true,
  env: { ...process.env, NEXT_DIST_DIR: ".next-artifact-studio" },
});

child.on("exit", (code) => process.exit(code ?? 0));
