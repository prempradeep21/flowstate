/*
 * Resolve every transcript-import website preview once, offline, and commit the
 * result.
 *
 * The transcript playground canvases are code-defined: the playground rebuilds
 * each one from its builder on every mount, so anything fetched at runtime is
 * discarded on the next load. spawnWebsite used to paper over that by storing a
 * live api.microlink.io call as the <img src>, which meant every card hotlinked
 * a rate-limited third party on every render — the blank artifacts.
 *
 * So the images are resolved ahead of render instead, exactly as the authored
 * sample canvases do it. This walks the website artifacts in every builder,
 * resolves a real og:image through the same scraper the app uses, downloads the
 * bytes into public/, and writes a manifest the builders read at build time.
 *
 * Run it manually and commit both outputs:
 *   node scripts/prefetch-transcript-previews.mjs
 */
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { buildDesignToolsCanvasSection } from "../lib/transcriptImport/buildDesignToolsCanvasSection";
import { buildHubermanCanvasSection } from "../lib/transcriptImport/buildHubermanCanvasSection";
import { buildJagadambaCanvasSection } from "../lib/transcriptImport/buildJagadambaCanvasSection";
import { buildLightconeEmergentCanvasSection } from "../lib/transcriptImport/buildLightconeEmergentCanvasSection";
import { buildPrashantKishorCanvasSection } from "../lib/transcriptImport/buildPrashantKishorCanvasSection";
import { buildRanaDaggubatiCanvasSection } from "../lib/transcriptImport/buildRanaDaggubatiCanvasSection";
import { buildYcInterviewCanvasSection } from "../lib/transcriptImport/buildYcInterviewCanvasSection";
import { fetchLinkPreview, validateLinkPreviewUrl } from "../lib/linkPreview";
import { readImageDimensions } from "../lib/imageDimensions";

const ROOT = path.resolve(__dirname, "..");
const OUT_DIR = path.join(ROOT, "public", "transcript-import", "previews");
const MANIFEST = path.join(ROOT, "lib", "transcriptImport", "websitePreviews.ts");
const PUBLIC_PREFIX = "/transcript-import/previews";

const EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/gif": "gif",
  "image/webp": "webp",
};

const BUILDERS = [
  buildDesignToolsCanvasSection,
  buildHubermanCanvasSection,
  buildJagadambaCanvasSection,
  buildLightconeEmergentCanvasSection,
  buildPrashantKishorCanvasSection,
  buildRanaDaggubatiCanvasSection,
  buildYcInterviewCanvasSection,
];

interface Entry {
  path: string;
  mime: string;
  sizeBytes: number;
  width: number;
  height: number;
}

/** Every distinct website URL across all five transcript canvases. */
function collectUrls(): string[] {
  const urls = new Set<string>();
  for (const build of BUILDERS) {
    const section = build();
    for (const artifact of Object.values(section.sessionArtifacts)) {
      const version = artifact.versions.find(
        (v) => v.id === artifact.latestVersionId,
      );
      if (version?.payload.type === "website") {
        urls.add(version.payload.data.url);
      }
    }
  }
  return [...urls].sort();
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Politeness delay between requests — see the throttling note in main(). */
const REQUEST_DELAY_MS = 1200;

/**
 * Wikimedia serves a descriptive User-Agent policy and rate-limits bursts. A
 * first pass without this throttling lost most of the Wikipedia images to 429s
 * even though each URL fetched fine on its own, so requests are spaced and
 * retried with backoff rather than fired as fast as the loop runs.
 */
async function download(
  url: string,
  attempts = 3,
): Promise<{ bytes: Uint8Array; mime: string } | { error: string }> {
  let lastError = "unknown";
  for (let attempt = 1; attempt <= attempts; attempt++) {
    if (attempt > 1) await sleep(REQUEST_DELAY_MS * attempt * 2);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 20000);
    try {
      const res = await fetch(url, {
        signal: controller.signal,
        headers: {
          Accept:
            "image/avif,image/webp,image/png,image/jpeg,image/gif,*/*;q=0.5",
          "User-Agent":
            "FlowstateTranscriptPreview/1.0 (build-time preview cache; contact via repository)",
        },
      });
      if (!res.ok) {
        lastError = `HTTP ${res.status}`;
        continue;
      }
      const mime = (res.headers.get("content-type") ?? "")
        .split(";")[0]!
        .trim()
        .toLowerCase();
      if (!EXT[mime]) return { error: `type ${mime || "unknown"}` };
      const bytes = new Uint8Array(await res.arrayBuffer());
      if (bytes.byteLength === 0) {
        lastError = "empty body";
        continue;
      }
      if (bytes.byteLength > 10 * 1024 * 1024) return { error: "too large" };
      return { bytes, mime };
    } catch (e) {
      lastError = e instanceof Error ? e.name : "threw";
    } finally {
      clearTimeout(timer);
    }
  }
  return { error: lastError };
}

async function main() {
  const urls = collectUrls();
  console.log(`${urls.length} website artifacts across ${BUILDERS.length} canvases\n`);
  mkdirSync(OUT_DIR, { recursive: true });

  const entries: Record<string, Entry> = {};
  let ok = 0;
  for (const url of urls) {
    if (!validateLinkPreviewUrl(url)) {
      console.log(`  skip (blocked)  ${url}`);
      continue;
    }
    await sleep(REQUEST_DELAY_MS);
    let imageUrl: string | undefined;
    try {
      imageUrl = (await fetchLinkPreview(url)).previewImageUrl;
    } catch {
      imageUrl = undefined;
    }
    if (!imageUrl) {
      console.log(`  no og:image     ${url}`);
      continue;
    }
    const got = await download(imageUrl);
    if ("error" in got) {
      console.log(`  failed (${got.error})  ${url}\n                  -> ${imageUrl}`);
      await sleep(REQUEST_DELAY_MS);
      continue;
    }
    const size = readImageDimensions(got.bytes, got.mime);
    if (!size) {
      console.log(`  bad header      ${url}`);
      continue;
    }
    const slug = createHash("sha1").update(url).digest("hex").slice(0, 12);
    const file = `${slug}.${EXT[got.mime]}`;
    writeFileSync(path.join(OUT_DIR, file), got.bytes);
    entries[url] = {
      path: `${PUBLIC_PREFIX}/${file}`,
      mime: got.mime,
      sizeBytes: got.bytes.byteLength,
      width: size.width,
      height: size.height,
    };
    ok++;
    await sleep(REQUEST_DELAY_MS);
    console.log(`  ok ${String(size.width).padStart(5)}x${String(size.height).padEnd(5)} ${url}`);
  }

  const body = Object.entries(entries)
    .map(
      ([url, e]) =>
        `  ${JSON.stringify(url)}: {\n` +
        `    path: ${JSON.stringify(e.path)},\n` +
        `    mime: ${JSON.stringify(e.mime)},\n` +
        `    sizeBytes: ${e.sizeBytes},\n` +
        `    width: ${e.width},\n` +
        `    height: ${e.height},\n` +
        `  },`,
    )
    .join("\n");

  writeFileSync(
    MANIFEST,
    `/*\n` +
      ` * Generated by scripts/prefetch-transcript-previews.mjs — do not edit by hand.\n` +
      ` *\n` +
      ` * Preview images for the transcript-import canvases, resolved once and stored\n` +
      ` * under public/. The canvases are rebuilt from code on every mount, so a\n` +
      ` * runtime fetch could never persist; baking them here is what lets a website\n` +
      ` * card render from this app's own origin instead of hotlinking a third party.\n` +
      ` */\n\n` +
      `export interface TranscriptWebsitePreview {\n` +
      `  path: string;\n  mime: string;\n  sizeBytes: number;\n  width: number;\n  height: number;\n}\n\n` +
      `export const TRANSCRIPT_WEBSITE_PREVIEWS: Record<string, TranscriptWebsitePreview> = {\n` +
      `${body}\n};\n\n` +
      `export function transcriptWebsitePreview(\n  url: string,\n): TranscriptWebsitePreview | undefined {\n` +
      `  return TRANSCRIPT_WEBSITE_PREVIEWS[url];\n}\n`,
  );

  console.log(`\n${ok}/${urls.length} resolved -> ${path.relative(ROOT, MANIFEST)}`);
}

void main();
