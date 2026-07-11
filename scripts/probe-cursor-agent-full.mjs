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
const { Agent } = await import("@cursor/sdk");
const { CUSTOM_UI_SUBAGENTS } = await import("../lib/cursorSdk/customUiSubagents.ts");

const sandboxCwd = path.join(process.cwd(), ".cursor-sdk-ui-sandbox");
fs.mkdirSync(sandboxCwd, { recursive: true });

const agent = await Agent.create({
  apiKey,
  model: { id: "composer-2.5" },
  mode: "agent",
  agents: CUSTOM_UI_SUBAGENTS,
  local: { cwd: sandboxCwd, settingSources: [] },
});
console.log("created", agent.agentId);

const prompt = `Build a colorful currency converter widget (html/css/js). Call emit_custom_ui when done.`;
const run = await agent.send(prompt, { local: { force: true } });
console.log("run", run.id);

try {
  for await (const event of run.stream()) {
    console.log("event", event.type, event.subtype ?? event.status ?? event.name ?? "");
  }
} catch (err) {
  console.error("stream error:", err?.message ?? err);
}

const result = await run.wait();
console.log("wait", result.status, result.error, result.message, result.result?.slice?.(0, 300));
agent.close();
