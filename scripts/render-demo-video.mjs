/**
 * Frame-steps a /dev/demo-video scene with Playwright and encodes an MP4.
 *
 * Usage:
 *   node scripts/render-demo-video.mjs --url http://localhost:3000 [options]
 *
 * Options:
 *   --scene <id>       branching (default, 15s) | assets (36s)
 *   --url <origin>     Dev server origin (spawns its own on :4123 if omitted)
 *   --every <n>        Render every nth frame (sparse preview passes)
 *   --range <a-b>      Frame range, inclusive
 *   --dsf <n>          deviceScaleFactor (default 2 = supersampled)
 *   --skip-encode      Capture frames only
 *   --encode-only      Encode existing frames only
 */
import { spawn } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, rmSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import ffmpegPath from "ffmpeg-static";

const FPS = 60;
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

/** Per-scene capture spec (mirrors app/dev/demo-video/scenes/registry.ts). */
const SCENES = {
  branching: {
    durationMs: 15000,
    framesDir: path.join(ROOT, "demo-video", "frames"),
    outFile: path.join(ROOT, "demo-video", "flowstate-branching-demo.mp4"),
    warmupMs: [],
    settleExtraMs: {},
  },
  assets: {
    durationMs: 36000,
    framesDir: path.join(ROOT, "demo-video", "frames-assets"),
    outFile: path.join(ROOT, "demo-video", "flowstate-assets-demo.mp4"),
    // Pre-seek points that pull network content into the HTTP cache:
    // map tiles + pins, street view iframe, pie chart, full finale.
    warmupMs: [10000, 19200, 23600, 35000],
    // Wall-clock content that needs a fixed extra wait the first time the
    // capture loop crosses it: leaflet tile decode at map morph, the street
    // view iframe (cross-origin, unobservable), echarts' mount animation.
    settleExtraMs: {
      [Math.round((9000 / 1000) * FPS)]: 2500, // map morph
      [Math.round((19000 / 1000) * FPS)]: 4000, // street view morph
      [Math.round((23300 / 1000) * FPS)]: 1800, // pie chart morph
    },
  },
  disney: {
    durationMs: 36500,
    framesDir: path.join(ROOT, "demo-video", "frames-disney"),
    outFile: path.join(ROOT, "demo-video", "flowstate-disney-demo.mp4"),
    // Map tiles (WDW, zoom 10) at the map beat + pin drop + finale wall.
    warmupMs: [21800, 22300, 35000],
    // echarts bar-chart morph + leaflet tile decode at the map morph.
    settleExtraMs: {
      [Math.round((11350 / 1000) * FPS)]: 1800,
      [Math.round((21600 / 1000) * FPS)]: 2500,
    },
  },
  // 3s brand idents (white background, no network content).
  ...Object.fromEntries(
    ["logo-draw", "logo-type", "logo-o", "logo-lockup", "logo-nodes"].map(
      (id) => [
        id,
        {
          durationMs: 3000,
          framesDir: path.join(ROOT, "demo-video", `frames-${id}`),
          outFile: path.join(ROOT, "demo-video", `flowstate-${id}.mp4`),
          warmupMs: [],
          settleExtraMs: {},
        },
      ],
    ),
  ),
};

const args = process.argv.slice(2);
const getArg = (name, dflt) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : dflt;
};
const hasFlag = (name) => args.includes(`--${name}`);

const sceneId = getArg("scene", "branching");
const scene = SCENES[sceneId];
if (!scene) {
  console.error(`Unknown scene "${sceneId}" (expected: ${Object.keys(SCENES).join(", ")})`);
  process.exit(1);
}
const TOTAL_FRAMES = Math.round((scene.durationMs / 1000) * FPS);

const every = Number(getArg("every", "1"));
const [rangeA, rangeB] = getArg("range", `0-${TOTAL_FRAMES - 1}`)
  .split("-")
  .map(Number);
const dsf = Number(getArg("dsf", "2"));

async function waitForServer(origin, timeoutMs = 120_000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(`${origin}/dev/demo-video`);
      if (res.ok) return;
    } catch {}
    await new Promise((r) => setTimeout(r, 1000));
  }
  throw new Error(`Server at ${origin} not ready after ${timeoutMs}ms`);
}

async function waitSettled(page, timeout = 20_000) {
  try {
    await page.waitForFunction(
      () => (window.__demoSettled ? window.__demoSettled() : true),
      { timeout },
    );
  } catch {
    console.warn("  settle wait timed out — capturing anyway");
  }
}

async function main() {
  let url = getArg("url", null);
  let serverProc = null;

  if (!hasFlag("encode-only")) {
    if (!url) {
      const port = 4123;
      console.log(`Starting dev server on :${port} (dist .next-demo)...`);
      serverProc = spawn(
        process.platform === "win32" ? "npx.cmd" : "npx",
        ["next", "dev", "-p", String(port)],
        {
          cwd: ROOT,
          env: { ...process.env, NEXT_DIST_DIR: ".next-demo" },
          stdio: "pipe",
          shell: process.platform === "win32",
        },
      );
      url = `http://localhost:${port}`;
    }
    await waitForServer(url);
    console.log(`Server ready at ${url} — scene "${sceneId}", ${TOTAL_FRAMES} frames`);

    if (every === 1 && rangeA === 0 && existsSync(scene.framesDir)) {
      rmSync(scene.framesDir, { recursive: true, force: true });
    }
    mkdirSync(scene.framesDir, { recursive: true });

    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
      viewport: { width: 1920, height: 1080 },
      deviceScaleFactor: dsf,
      reducedMotion: "reduce",
    });
    const page = await context.newPage();
    page.on("pageerror", (e) => console.error("[pageerror]", e.message));

    console.log("Loading scene (first compile can take a minute)...");
    await page.goto(
      `${url}/dev/demo-video?scene=${sceneId}&capture=1&w=1920&h=1080`,
      { waitUntil: "domcontentloaded", timeout: 180_000 },
    );
    await page.waitForFunction(() => typeof window.__seek === "function", {
      timeout: 120_000,
    });
    await page.evaluate(() => window.__demoReady);
    await page.evaluate(() => document.fonts.ready);

    // Warm-up: pull network content (tiles, iframes, imgs) into cache.
    for (const tMs of scene.warmupMs) {
      console.log(`  warm-up seek ${tMs}ms`);
      await page.evaluate((t) => window.__seek(t), tMs);
      await waitSettled(page);
      await page.waitForTimeout(2500);
    }
    if (scene.warmupMs.length) {
      await page.evaluate(() => window.__seek(0));
      await waitSettled(page);
    }
    console.log("Scene ready. Capturing frames...");

    const settleExtra = { ...scene.settleExtraMs };
    const t0 = Date.now();
    let captured = 0;
    for (let f = rangeA; f <= rangeB; f += every) {
      const tMs = (f * 1000) / FPS;
      await page.evaluate((t) => window.__seek(t), tMs);
      // Fixed extra waits fire once, at the first captured frame at/after
      // their trigger frame (works for sparse passes too).
      for (const key of Object.keys(settleExtra)) {
        if (f >= Number(key)) {
          const wait = settleExtra[key];
          delete settleExtra[key];
          await waitSettled(page);
          await page.waitForTimeout(wait);
        }
      }
      await waitSettled(page, 8000);
      await page.screenshot({
        path: path.join(scene.framesDir, `${String(f).padStart(4, "0")}.png`),
        animations: "allow",
      });
      captured++;
      if (captured % 60 === 0) {
        const rate = captured / ((Date.now() - t0) / 1000);
        console.log(
          `  frame ${f}/${rangeB} (${rate.toFixed(1)} fps capture, ~${Math.round((rangeB - f) / every / rate)}s left)`,
        );
      }
    }
    console.log(`Captured ${captured} frames in ${Math.round((Date.now() - t0) / 1000)}s`);

    await browser.close();
    if (serverProc) serverProc.kill();
  }

  if (hasFlag("skip-encode")) return;
  if (every !== 1) {
    console.log("Sparse pass — skipping encode.");
    return;
  }

  const frameCount = readdirSync(scene.framesDir).filter((f) =>
    f.endsWith(".png"),
  ).length;
  console.log(`Encoding ${frameCount} frames -> ${scene.outFile}`);
  await new Promise((resolve, reject) => {
    const ff = spawn(
      ffmpegPath,
      [
        "-y",
        "-framerate", String(FPS),
        "-i", path.join(scene.framesDir, "%04d.png"),
        "-vf", "scale=1920:1080:flags=lanczos",
        "-c:v", "libx264",
        "-preset", "slow",
        "-crf", "18",
        "-pix_fmt", "yuv420p",
        "-movflags", "+faststart",
        scene.outFile,
      ],
      { stdio: ["ignore", "inherit", "inherit"] },
    );
    ff.on("close", (code) =>
      code === 0 ? resolve() : reject(new Error(`ffmpeg exited ${code}`)),
    );
  });
  console.log(`Done: ${scene.outFile}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
