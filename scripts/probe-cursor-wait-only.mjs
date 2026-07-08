import fs from "node:fs";
import path from "node:path";
import { readFileSync } from "node:fs";

try {
  const env = readFileSync(".env.local", "utf8");
  for (const line of env.split(/\r?\n/)) {
    const m = line.match(/^([^#=]+)=(.*)$/);
    if (m) process.env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, "");
  }
} catch {
  /* ignore */
}

if (!("dispose" in Symbol)) {
  Object.defineProperty(Symbol, "dispose", {
    value: Symbol.for("Symbol.dispose"),
    writable: false,
    enumerable: false,
    configurable: false,
  });
}
if (!("asyncDispose" in Symbol)) {
  Object.defineProperty(Symbol, "asyncDispose", {
    value: Symbol.for("Symbol.asyncDispose"),
    writable: false,
    enumerable: false,
    configurable: false,
  });
}

const apiKey = process.env.CURSOR_API_KEY?.trim();
if (!apiKey) {
  console.error("CURSOR_API_KEY missing");
  process.exit(1);
}

const { Agent } = await import("@cursor/sdk");
const sandboxCwd = path.join(process.cwd(), ".cursor-sdk-ui-sandbox");
fs.mkdirSync(sandboxCwd, { recursive: true });

console.log("Node", process.version);
console.log("wait-only probe…");

const t0 = Date.now();
const agent = await Agent.create({
  apiKey,
  model: { id: "composer-2.5" },
  mode: "agent",
  local: { cwd: sandboxCwd, settingSources: [] },
});
console.log("create OK", Date.now() - t0, "ms");

const run = await agent.send("Reply with exactly: OK", { local: { force: true } });
console.log("send OK, run:", run.id, "supports stream:", run.supports("stream"));

run.onDidChangeStatus((status) => {
  console.log("status change:", status);
});

const t1 = Date.now();
const result = await run.wait();
console.log("wait OK in", Date.now() - t1, "ms:", result.status, result.result?.slice?.(0, 200));
agent.close();
