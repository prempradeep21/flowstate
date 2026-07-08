const { spawn } = require("child_process");

const PORT = 3080;
const DESIGN_SYSTEM_PATH = "/dev/design-system";

console.log(`\n→ Open: http://localhost:${PORT}${DESIGN_SYSTEM_PATH}\n`);

const child = spawn("npx", ["next", "dev", "-p", String(PORT)], {
  stdio: "inherit",
  shell: true,
  env: { ...process.env, NEXT_DIST_DIR: ".next-design-system" },
});

child.on("exit", (code) => process.exit(code ?? 0));
