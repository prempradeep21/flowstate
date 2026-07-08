import fs from "node:fs";
import path from "node:path";
import { readFileSync } from "node:fs";

// Load .env.local manually
try {
  const env = readFileSync(".env.local", "utf8");
  for (const line of env.split(/\r?\n/)) {
    const m = line.match(/^([^#=]+)=(.*)$/);
    if (m) process.env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, "");
  }
} catch {
  /* ignore */
}

// Polyfill Symbol.dispose
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
console.log("Symbol.dispose" in Symbol, "Symbol.asyncDispose" in Symbol);
console.log("Creating agent…");

const t0 = Date.now();
try {
  const agent = await Agent.create({
    apiKey,
    model: { id: "composer-2.5" },
    mode: "agent",
    local: {
      cwd: sandboxCwd,
      settingSources: [],
    },
  });
  console.log("Agent.create OK in", Date.now() - t0, "ms, id:", agent.agentId);

  console.log("Sending prompt…");
  const t1 = Date.now();
  const run = await agent.send("Reply with exactly: OK", { local: { force: true } });
  console.log("agent.send OK in", Date.now() - t1, "ms, run:", run.id);

  let events = 0;
  for await (const event of run.stream()) {
    events++;
    if (events <= 8) {
      const extra =
        event.subtype ??
        event.status ??
        event.name ??
        (event.type === "assistant" ? "assistant" : "");
      console.log("event", events, event.type, extra);
    }
  }
  console.log("stream events:", events);

  const result = await run.wait();
  console.log(
    "wait result:",
    result.status,
    result.error ?? result.message ?? result.result?.slice?.(0, 200),
  );
  agent.close();
} catch (err) {
  console.error("FAILED after", Date.now() - t0, "ms:");
  console.error(err);
  process.exit(1);
}
