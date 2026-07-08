const http = require("http");
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const VIEWER = path.join(ROOT, "ui-instructions-viewer");
const SPEC_PATH = path.join(ROOT, "docs", "ui-interaction-motion-instructions.md");
const PORT = 3070;

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".md": "text/plain; charset=utf-8",
  ".json": "application/json; charset=utf-8",
};

function send(res, status, body, type) {
  res.writeHead(status, { "Content-Type": type, "Cache-Control": "no-store" });
  res.end(body);
}

const server = http.createServer((req, res) => {
  const url = req.url.split("?")[0];

  if (url === "/ui-interaction-motion-instructions.md" || url === "/api/spec") {
    fs.readFile(SPEC_PATH, (err, data) => {
      if (err) return send(res, 404, "Instructions doc not found", "text/plain");
      send(res, 200, data, "text/markdown; charset=utf-8");
    });
    return;
  }

  const rel = url === "/" ? "index.html" : url.replace(/^\//, "");
  const filePath = path.normalize(path.join(VIEWER, rel));

  if (!filePath.startsWith(VIEWER)) {
    return send(res, 403, "Forbidden", "text/plain");
  }

  fs.readFile(filePath, (err, data) => {
    if (err) return send(res, 404, "Not found", "text/plain");
    const ext = path.extname(filePath);
    send(res, 200, data, MIME[ext] || "application/octet-stream");
  });
});

server.listen(PORT, () => {
  console.log(`UI instructions viewer at http://localhost:${PORT}`);
  console.log(`Reading ${SPEC_PATH}`);
});
