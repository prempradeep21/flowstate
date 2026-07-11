const http = require("http");
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const SITE = path.join(ROOT, "sites", "ploy-landing");
const PORT = 3090;

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".ico": "image/x-icon",
};

function send(res, status, body, type) {
  res.writeHead(status, { "Content-Type": type, "Cache-Control": "no-store" });
  res.end(body);
}

const server = http.createServer((req, res) => {
  const url = req.url.split("?")[0].split("#")[0];

  const rel = url === "/" ? "index.html" : url.replace(/^\//, "");
  const filePath = path.normalize(path.join(SITE, rel));

  if (!filePath.startsWith(SITE)) {
    return send(res, 403, "Forbidden", "text/plain");
  }

  fs.readFile(filePath, (err, data) => {
    if (err) return send(res, 404, "Not found", "text/plain");
    const ext = path.extname(filePath);
    send(res, 200, data, MIME[ext] || "application/octet-stream");
  });
});

server.listen(PORT, () => {
  console.log(`Ploy landing clone at http://localhost:${PORT}`);
  console.log(`Serving ${SITE}`);
});
