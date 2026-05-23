const { spawn } = require("child_process");
const fs = require("fs");
const path = require("path");

const nextDir = path.join(__dirname, "..", ".next");

if (fs.existsSync(nextDir)) {
  fs.rmSync(nextDir, { recursive: true, force: true });
  console.log("Removed .next cache");
}

console.log("Starting fresh dev server…");
const child = spawn("npm", ["run", "dev"], {
  stdio: "inherit",
  shell: true,
  cwd: path.join(__dirname, ".."),
});

child.on("exit", (code) => process.exit(code ?? 0));
