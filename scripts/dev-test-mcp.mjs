// Local MCP test server for stress-testing Flowstate's MCP output handling.
// Emits every MCP content type deterministically so each pipeline path can be
// exercised without hunting for public servers.
//
//   node scripts/dev-test-mcp.mjs        (listens on http://localhost:8765/mcp)
//
// Add in Flowstate (dev builds allow localhost): MCP tab → Paste URL →
//   http://localhost:8765/mcp

import { createServer } from "node:http";
import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";

const PORT = 8765;

// 1x1 red-pixel PNG (valid, tiny). Enough to prove the base64-image path.
const TINY_PNG =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";

// Minimal one-page PDF, base64 (valid per readers, used to test blob resources).
const TINY_PDF = Buffer.from(
  `%PDF-1.1
1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj
2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj
3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 200 200]>>endobj
xref
0 4
0000000000 65535 f
trailer<</Size 4/Root 1 0 R>>
startxref
150
%%EOF`,
).toString("base64");

function buildServer() {
  const server = new McpServer({ name: "flowstate-test", version: "1.0.0" });

  server.tool(
    "generate_test_image",
    "Generates a test image (returns a base64 PNG image content block). Use when asked to generate or fetch a test image.",
    {},
    async () => ({
      content: [
        { type: "text", text: "Here is the generated test image (1x1 red pixel PNG)." },
        { type: "image", data: TINY_PNG, mimeType: "image/png" },
      ],
    }),
  );

  server.tool(
    "fetch_html_page",
    "Returns a complete HTML document (tests HTML-to-artifact conversion).",
    {},
    async () => ({
      content: [
        {
          type: "text",
          text: `<!doctype html><html><head><style>body{font-family:sans-serif;background:#0b1220;color:#e6edf3;padding:24px}h1{color:#7ee787}</style></head><body><h1>MCP HTML output</h1><p>If you can read this inside a card, HTML→custom-artifact conversion works.</p><button onclick="this.textContent='clicked!'">Click me</button></body></html>`,
        },
      ],
    }),
  );

  server.tool(
    "fetch_dataset",
    "Returns structured JSON rows (tests model-driven table artifact emission).",
    { rows: z.number().optional().describe("Row count, default 5") },
    async ({ rows }) => {
      const n = Math.min(rows ?? 5, 50);
      const data = Array.from({ length: n }, (_, i) => ({
        city: ["Tokyo", "Kyoto", "Osaka", "Nagoya", "Sapporo"][i % 5],
        line: `Line-${i + 1}`,
        daily_riders: 100000 + i * 13337,
      }));
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    },
  );

  server.tool(
    "fetch_pdf_file",
    "Returns a PDF as a binary blob resource (tests binary file handling).",
    {},
    async () => ({
      content: [
        { type: "text", text: "Attached: test.pdf (embedded blob resource)." },
        {
          type: "resource",
          resource: {
            uri: "file:///test.pdf",
            mimeType: "application/pdf",
            blob: TINY_PDF,
          },
        },
      ],
    }),
  );

  server.tool(
    "fetch_image_by_url",
    "Returns a markdown image link rather than inline data (tests URL-image passthrough).",
    {},
    async () => ({
      content: [
        {
          type: "text",
          text: "Fetched image: ![Wikimedia sample](https://upload.wikimedia.org/wikipedia/commons/thumb/3/3a/Cat03.jpg/320px-Cat03.jpg)",
        },
      ],
    }),
  );

  server.tool(
    "fetch_huge_text",
    "Returns ~50K characters (tests the 16K truncation cap).",
    {},
    async () => ({
      content: [
        {
          type: "text",
          text: Array.from({ length: 1000 }, (_, i) => `Row ${i}: ${"x".repeat(40)}`).join("\n"),
        },
      ],
    }),
  );

  server.tool(
    "slow_tool",
    "Waits 20 seconds before answering (tests long-call UX; call timeout is 45s).",
    {},
    async () => {
      await new Promise((r) => setTimeout(r, 20_000));
      return { content: [{ type: "text", text: "Done after 20s." }] };
    },
  );

  return server;
}

const httpServer = createServer(async (req, res) => {
  if (!req.url?.startsWith("/mcp")) {
    res.writeHead(404).end();
    return;
  }
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const body = chunks.length ? JSON.parse(Buffer.concat(chunks).toString()) : undefined;

  // Stateless mode: fresh server+transport per request.
  const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });
  res.on("close", () => transport.close());
  const server = buildServer();
  await server.connect(transport);
  await transport.handleRequest(req, res, body);
});

httpServer.listen(PORT, "127.0.0.1", () => {
  console.log(`flowstate-test MCP listening on http://localhost:${PORT}/mcp`);
});
