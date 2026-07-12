/**
 * Frame-steps the /dev/demo-video scene with Playwright and encodes an MP4.
 *
 * Usage:
 *   node scripts/render-demo-video.mjs --url http://localhost:3000 [options]
 *
 * Options:
 *   --url <origin>     Dev server origin (spawns its own on :4123 if omitted)
 *   --every <n>        Render every nth frame (sparse preview passes)
 *   --range <a-b>      Frame range, inclusive (default 0-899)
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
const TOTAL_FRAMES = 900;
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const FRAMES_DIR = path.join(ROOT, "demo-video", "frames");
const OUT_FILE = path.join(ROOT, "demo-video", "flowstate-branching-demo.mp4");

const args = process.argv.slice(2);
const getArg = (name, dflt) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : dflt;
};
const hasFlag = (name) => args.includes(`--${name}`);

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
    console.log(`Server ready at ${url}`);

    if (every === 1 && rangeA === 0 && existsSync(FRAMES_DIR)) {
      rmSync(FRAMES_DIR, { recursive: true, force: true });
    }
    mkdirSync(FRAMES_DIR, { recursive: true });

    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
      viewport: { width: 1920, height: 1080 },
      deviceScaleFactor: dsf,
      reducedMotion: "reduce",
    });
    const page = await context.newPage();
    page.on("pageerror", (e) => console.error("[pageerror]", e.message));

    console.log("Loading scene (first compile can take a minute)...");
    await page.goto(`${url}/dev/demo-video?capture=1&w=1920&h=1080`, {
      waitUntil: "domcontentloaded",
      timeout: 180_000,
    });
    await page.waitForFunction(() => typeof window.__seek === "function", {
      timeout: 120_000,
    });
    await page.evaluate(() => window.__demoReady);
    await page.evaluate(() => document.fonts.ready);
    console.log("Scene ready. Capturing frames...");

    const t0 = Date.now();
    let captured = 0;
    for (let f = rangeA; f <= rangeB; f += every) {
      const tMs = (f * 1000) / FPS;
      await page.evaluate((t) => window.__seek(t), tMs);
      await page.screenshot({
        path: path.join(FRAMES_DIR, `${String(f).padStart(4, "0")}.png`),
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

  const frameCount = readdirSync(FRAMES_DIR).filter((f) => f.endsWith(".png")).length;
  console.log(`Encoding ${frameCount} frames -> ${OUT_FILE}`);
  await new Promise((resolve, reject) => {
    const ff = spawn(
      ffmpegPath,
      [
        "-y",
        "-framerate", String(FPS),
        "-i", path.join(FRAMES_DIR, "%04d.png"),
        "-vf", "scale=1920:1080:flags=lanczos",
        "-c:v", "libx264",
        "-preset", "slow",
        "-crf", "18",
        "-pix_fmt", "yuv420p",
        "-movflags", "+faststart",
        OUT_FILE,
      ],
      { stdio: ["ignore", "inherit", "inherit"] },
    );
    ff.on("close", (code) =>
      code === 0 ? resolve() : reject(new Error(`ffmpeg exited ${code}`)),
    );
  });
  console.log(`Done: ${OUT_FILE}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
