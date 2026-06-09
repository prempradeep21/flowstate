const { spawn } = require("child_process");

const child = spawn("npx", ["next", "dev", "-p", "3040"], {
  stdio: "inherit",
  shell: true,
  env: { ...process.env, NEXT_DIST_DIR: ".next-repo-explorer" },
});

child.on("exit", (code) => process.exit(code ?? 0));
