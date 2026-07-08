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

const body = JSON.stringify({
  question: "Build a tiny custom UI: a button that says Hello",
  history: [],
  model: "claude-sonnet-4-6",
});

const res = await fetch("http://localhost:3000/api/custom-ui", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body,
});

console.log("HTTP", res.status);
const reader = res.body.getReader();
const decoder = new TextDecoder();
let buf = "";
const deadline = Date.now() + 90_000;

while (Date.now() < deadline) {
  const { done, value } = await reader.read();
  if (done) break;
  buf += decoder.decode(value, { stream: true });
  if (buf.includes("[DONE]")) break;
}

const lines = buf.split("\n\n").filter((l) => l.startsWith("data: "));
console.log("events:", lines.length);
for (const line of lines.slice(0, 12)) {
  const raw = line.slice(6);
  if (raw === "[DONE]") continue;
  try {
    const parsed = JSON.parse(raw);
    const keys = Object.keys(parsed);
    if (parsed.thinking) console.log("thinking:", parsed.thinking.slice(0, 80));
    else if (parsed.error) console.log("error:", parsed.error.slice(0, 120));
    else if (parsed.artifact) console.log("artifact:", parsed.artifact.title);
    else if (parsed.text) console.log("text:", String(parsed.text).slice(0, 80));
    else console.log("event:", keys.join(","));
  } catch {
    console.log("raw:", raw.slice(0, 80));
  }
}
const hasArtifact = lines.some((l) => l.includes('"artifact"'));
console.log(hasArtifact ? "PASS: artifact emitted" : "FAIL: no artifact");
