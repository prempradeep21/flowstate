const { spawn } = require("child_process");

const child = spawn("npx", ["next", "dev", "-p", "3041"], {
  stdio: "inherit",
  shell: true,
  env: { ...process.env, NEXT_DIST_DIR: ".next-skill-viewer" },
});

child.on("exit", (code) => process.exit(code ?? 0));
