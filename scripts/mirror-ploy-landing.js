const fs = require("fs");
const path = require("path");
const https = require("https");

const ROOT = path.join(__dirname, "..");
const OUT = path.join(ROOT, "sites", "ploy-landing");
const BASE = "https://my-site-9d392eab.ploy.build";

const ASSETS = [
  { url: "/", out: "index.html", text: true },
  { url: "/favicon.ico", out: "favicon.ico", text: false },
  {
    url: "/_ploy_static/_astro/index@_@astro.hMsSHmUv.css",
    out: "_ploy_static/_astro/index@_@astro.hMsSHmUv.css",
    text: true,
  },
  {
    url: "/_ploy_static/_astro/client.CXJcWBxe.js",
    out: "_ploy_static/_astro/client.CXJcWBxe.js",
    text: true,
  },
  {
    url: "/_ploy_static/_astro/page.CE9QXWpy.js",
    out: "_ploy_static/_astro/page.CE9QXWpy.js",
    text: true,
  },
  {
    url: "/_ploy_static/_astro/index.BCvWX60U.js",
    out: "_ploy_static/_astro/index.BCvWX60U.js",
    text: true,
  },
  {
    url: "/_ploy_static/_astro/jsx-runtime.DXco-PnT.js",
    out: "_ploy_static/_astro/jsx-runtime.DXco-PnT.js",
    text: true,
  },
];

function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    https
      .get(url, (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          fetchUrl(new URL(res.headers.location, url).href).then(resolve, reject);
          return;
        }
        if (res.statusCode !== 200) {
          reject(new Error(`HTTP ${res.statusCode} for ${url}`));
          return;
        }
        const chunks = [];
        res.on("data", (chunk) => chunks.push(chunk));
        res.on("end", () => resolve(Buffer.concat(chunks)));
        res.on("error", reject);
      })
      .on("error", reject);
  });
}

function sanitizeHtml(html) {
  let out = html;

  // Remove Google Analytics loader + inline config.
  out = out.replace(
    /<script src="https:\/\/www\.googletagmanager\.com\/gtag\/js[^"]*"[^>]*><\/script>\s*/g,
    "",
  );
  out = out.replace(
    /<script>\s*window\.dataLayer[\s\S]*?gtag\('config'[^)]*\);\s*<\/script>\s*/g,
    "",
  );

  // Remove Ploy analytics ingest script.
  out = out.replace(/<script data-ploy-analytics="1">[\s\S]*?<\/script>\s*/g, "");

  return out;
}

async function main() {
  for (const asset of ASSETS) {
    const dest = path.join(OUT, asset.out);
    fs.mkdirSync(path.dirname(dest), { recursive: true });

    const url = `${BASE}${asset.url}`;
    process.stdout.write(`Fetching ${asset.url} ... `);
    const data = await fetchUrl(url);

    if (asset.text && asset.out === "index.html") {
      const html = sanitizeHtml(data.toString("utf8"));
      fs.writeFileSync(dest, html, "utf8");
      console.log(`ok (${html.length} bytes, sanitized)`);
    } else if (asset.text) {
      fs.writeFileSync(dest, data, "utf8");
      console.log(`ok (${data.length} bytes)`);
    } else {
      fs.writeFileSync(dest, data);
      console.log(`ok (${data.length} bytes)`);
    }
  }

  console.log(`\nMirrored to ${OUT}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
