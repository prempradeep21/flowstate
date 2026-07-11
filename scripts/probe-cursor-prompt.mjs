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

const { Agent } = await import("@cursor/sdk");
const apiKey = process.env.CURSOR_API_KEY?.trim();
console.log("Node", process.version, "Agent.prompt probe…");

const t0 = Date.now();
try {
  const result = await Agent.prompt("Reply with exactly: OK", {
    apiKey,
    model: { id: "composer-2.5" },
    local: { cwd: process.cwd(), settingSources: [] },
  });
  console.log("OK in", Date.now() - t0, "ms:", result.status, result.result?.slice?.(0, 200));
} catch (err) {
  console.error("FAIL in", Date.now() - t0, "ms:", err);
  process.exit(1);
}
