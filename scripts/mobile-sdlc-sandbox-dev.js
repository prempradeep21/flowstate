const { spawn } = require("child_process");

const PORT = 3060;
const SANDBOX_PATH = "/dev/mobile-sdlc-sandbox";

console.log(`\n→ Open: http://localhost:${PORT}${SANDBOX_PATH}\n`);

const child = spawn("npx", ["next", "dev", "-p", String(PORT)], {
  stdio: "inherit",
  shell: true,
  env: { ...process.env, NEXT_DIST_DIR: ".next-mobile-sdlc-sandbox" },
});

child.on("exit", (code) => process.exit(code ?? 0));
