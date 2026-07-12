#!/usr/bin/env node
/**
 * Automated canvas performance benchmark.
 *
 * Drives the /dev/perf fixture page through five interaction scenarios and
 * collects frame stats from the in-page `window.__flowstatePerf` bridge
 * (lib/perf/frameStats.ts). Results land in scratch/perf-results/*.json.
 *
 * Usage:
 *   npm run perf                       # web (Chromium), sizes 30/100/300
 *   npm run perf -- --sizes=100        # single size
 *   npm run perf -- --url=http://localhost:3000   # reuse a running server
 *   npm run perf:electron              # Electron app (requires dev server)
 *   npm run perf -- --no-budget        # record without failing on budgets
 *
 * Exits non-zero when any scenario misses its frame budget (unless
 * --no-budget). Requires `playwright` (devDependency) and a dev server —
 * starts `next dev` itself when --url is not supplied.
 */

import { mkdirSync, writeFileSync } from "node:fs";
import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..", "..");

const args = process.argv.slice(2);
const getFlag = (name) => {
  const hit = args.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.split("=").slice(1).join("=") : null;
};
const hasFlag = (name) => args.includes(`--${name}`);

const IS_ELECTRON = hasFlag("electron");
const NO_BUDGET = hasFlag("no-budget");
const SIZES = (getFlag("sizes") ?? "30,100,300")
  .split(",")
  .map((s) => Number(s.trim()))
  .filter((n) => [30, 100, 300].includes(n));
const EXTERNAL_URL = getFlag("url");
const PORT = Number(getFlag("port") ?? 3111);
const LABEL = getFlag("label") ?? (IS_ELECTRON ? "electron" : "web");

/**
 * Frame budgets, RELATIVE to the measured refresh interval so they hold on
 * both 60Hz (16.7ms cadence) and ProMotion (8.3ms) displays:
 *  - droppedPct: % of frames missing at least one vsync (delta > 1.5×refresh)
 *  - p99Factor: p99 frame delta must stay under refresh × factor
 *  - avgFactor: average delta under refresh × factor (steady cadence)
 *  - longTasks: max main-thread blocks >50ms during the scenario
 *
 * Calibration note: measured under `next dev` (dev-mode React) with CDP-
 * driven input — visually flawless scenarios still register 0.3–0.8%
 * dropped frames and the occasional long task from driver/GC jitter, while
 * genuinely janky interactions sit at 10–50% dropped with p99 in the
 * hundreds of ms. Budgets are set to separate those regimes; production
 * builds run meaningfully faster than these gates.
 */
const BUDGETS = {
  30: { droppedPct: 2, p99Factor: 2.2, avgFactor: 1.15, longTasks: 2 },
  100: { droppedPct: 3, p99Factor: 2.2, avgFactor: 1.15, longTasks: 3 },
  300: { droppedPct: 8, p99Factor: 4, avgFactor: 1.4, longTasks: 20 },
};

function log(msg) {
  process.stdout.write(`[perf] ${msg}\n`);
}

async function waitForServer(url, timeoutMs = 180_000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url, { redirect: "manual" });
      if (res.status < 500) return;
    } catch {
      /* not up yet */
    }
    await new Promise((r) => setTimeout(r, 1500));
  }
  throw new Error(`Server at ${url} not reachable after ${timeoutMs}ms`);
}

function startDevServer(port) {
  log(`starting next dev on :${port}…`);
  const child = spawn("npx", ["next", "dev", "-p", String(port)], {
    cwd: root,
    stdio: "pipe",
    env: { ...process.env },
    detached: false,
  });
  child.stdout.on("data", () => {});
  child.stderr.on("data", () => {});
  return child;
}

/** Drive one scenario; returns PerfSessionStats from the page bridge. */
async function runScenario(page, name, driver) {
  // Settle before sampling.
  await page.waitForTimeout(600);
  await page.evaluate((label) => window.__flowstatePerf.start(label), name);
  await driver();
  const stats = await page.evaluate(() => window.__flowstatePerf.stop());
  return stats;
}

async function centerOf(page) {
  const box = await page
    .locator("[data-perf-ready]")
    .first()
    .boundingBox();
  return {
    x: box.x + box.width / 2,
    y: box.y + box.height / 2,
    w: box.width,
    h: box.height,
  };
}

async function smoothWheel(page, cx, cy, dx, dy, steps, delayMs = 16) {
  for (let i = 0; i < steps; i++) {
    await page.mouse.wheel(dx, dy);
    await page.waitForTimeout(delayMs);
  }
}

function buildScenarios(page) {
  return {
    /** Two-finger trackpad style pan (wheel deltas), direction reversals. */
    "wheel-pan": async () => {
      const c = await centerOf(page);
      await page.mouse.move(c.x, c.y);
      for (const [dx, dy] of [
        [0, 14],
        [0, -14],
        [12, 0],
        [-12, 0],
        [8, 10],
        [-8, -10],
      ]) {
        await smoothWheel(page, c.x, c.y, dx, dy, 45);
      }
    },
    /** ctrl+wheel pinch-zoom in/out around the cursor. */
    "pinch-zoom": async () => {
      const c = await centerOf(page);
      await page.mouse.move(c.x, c.y);
      await page.keyboard.down("Control");
      for (const dir of [-1, 1, -1, 1]) {
        await smoothWheel(page, c.x, c.y, 0, dir * 12, 40);
      }
      await page.keyboard.up("Control");
    },
    /** Drag the first visible card in a circle. */
    "node-drag": async () => {
      const card = page.locator("[data-canvas-card]").first();
      const box = await card.boundingBox();
      if (!box) throw new Error("no card visible for node-drag");
      const sx = box.x + Math.min(40, box.width / 2);
      const sy = box.y + 16; // header area, avoids inputs
      await page.mouse.move(sx, sy);
      await page.mouse.down();
      const t0 = Date.now();
      let i = 0;
      while (Date.now() - t0 < 5000) {
        const angle = (i / 40) * Math.PI * 2;
        await page.mouse.move(
          sx + Math.cos(angle) * 180,
          sy + Math.sin(angle) * 120,
          { steps: 1 },
        );
        await page.waitForTimeout(12);
        i++;
      }
      await page.mouse.up();
    },
    /** Marquee select across the canvas. */
    marquee: async () => {
      const c = await centerOf(page);
      const x0 = c.x - c.w * 0.35;
      const y0 = c.y - c.h * 0.35;
      for (let pass = 0; pass < 3; pass++) {
        await page.mouse.move(x0, y0);
        await page.mouse.down();
        for (let i = 1; i <= 30; i++) {
          await page.mouse.move(
            x0 + (c.w * 0.7 * i) / 30,
            y0 + (c.h * 0.7 * i) / 30,
            { steps: 1 },
          );
          await page.waitForTimeout(12);
        }
        await page.mouse.up();
        await page.waitForTimeout(150);
      }
    },
    /** Marquee-select a region then drag the multi-selection. */
    "multi-drag": async () => {
      const c = await centerOf(page);
      const x0 = c.x - c.w * 0.3;
      const y0 = c.y - c.h * 0.3;
      await page.mouse.move(x0, y0);
      await page.mouse.down();
      await page.mouse.move(c.x + c.w * 0.3, c.y + c.h * 0.3, { steps: 20 });
      await page.mouse.up();
      await page.waitForTimeout(300);
      const card = page.locator("[data-canvas-card]").first();
      const box = await card.boundingBox();
      if (!box) throw new Error("no card for multi-drag");
      const sx = box.x + Math.min(40, box.width / 2);
      const sy = box.y + 16;
      await page.mouse.move(sx, sy);
      await page.mouse.down();
      const t0 = Date.now();
      let i = 0;
      while (Date.now() - t0 < 4000) {
        await page.mouse.move(sx + (i % 2 === 0 ? 160 : -160), sy + 80, {
          steps: 8,
        });
        await page.waitForTimeout(24);
        i++;
      }
      await page.mouse.up();
      await page.keyboard.press("Escape");
    },
  };
}

async function launchWeb(baseUrl) {
  const { chromium } = await import("playwright");
  const browser = await chromium.launch({
    headless: false, // headed: honest compositor/GPU path
    args: ["--force-device-scale-factor=2"],
  });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });
  const page = await context.newPage();
  return { page, close: () => browser.close(), baseUrl };
}

async function launchElectron(baseUrl) {
  const { _electron } = await import("playwright");
  const app = await _electron.launch({
    args: [path.join(root, "electron/main.js")],
    cwd: root,
    env: {
      ...process.env,
      ELECTRON_DEV: "1",
      ELECTRON_DEV_URL: baseUrl,
    },
  });
  const page = await app.firstWindow();
  await page.setViewportSize({ width: 1440, height: 900 });
  return { page, close: () => app.close(), baseUrl };
}

function checkBudget(size, stats) {
  const b = BUDGETS[size];
  const refresh = stats.refreshIntervalMs || 16.7;
  const failures = [];
  if (stats.droppedPct > b.droppedPct)
    failures.push(`dropped ${stats.droppedPct}% > ${b.droppedPct}%`);
  const p99Cap = refresh * b.p99Factor;
  if (stats.p99Ms > p99Cap)
    failures.push(`p99 ${stats.p99Ms}ms > ${p99Cap.toFixed(1)}ms (${b.p99Factor}×${refresh}ms)`);
  const avgCap = refresh * b.avgFactor;
  if (stats.avgMs > avgCap)
    failures.push(`avg ${stats.avgMs}ms > ${avgCap.toFixed(1)}ms`);
  if (stats.longTasks > b.longTasks)
    failures.push(`longTasks ${stats.longTasks} > ${b.longTasks}`);
  return failures;
}

async function main() {
  let server = null;
  let baseUrl = EXTERNAL_URL;
  if (!baseUrl) {
    server = startDevServer(PORT);
    baseUrl = `http://localhost:${PORT}`;
  }
  await waitForServer(`${baseUrl}/dev/perf`);
  log(`server ready at ${baseUrl}`);

  const target = IS_ELECTRON
    ? await launchElectron(baseUrl)
    : await launchWeb(baseUrl);

  const results = [];
  let failed = false;

  try {
    for (const size of SIZES) {
      const url = `${baseUrl}/dev/perf?nodes=${size}`;
      log(`fixture ${size} nodes → ${url}`);
      await target.page.goto(url, { waitUntil: "domcontentloaded" });
      await target.page.waitForSelector('[data-perf-ready="true"]', {
        timeout: 120_000,
      });
      // Let hydration/reveal settle fully.
      await target.page.waitForTimeout(2500);

      const scenarios = buildScenarios(target.page);
      for (const [name, driver] of Object.entries(scenarios)) {
        log(`  scenario: ${name}`);
        try {
          const stats = await runScenario(target.page, name, driver);
          const failures = NO_BUDGET ? [] : checkBudget(size, stats);
          if (failures.length > 0) failed = true;
          results.push({ target: LABEL, size, scenario: name, stats, failures });
          log(
            `    refresh=${stats.refreshIntervalMs}ms avg=${stats.avgMs}ms p99=${stats.p99Ms}ms dropped=${stats.droppedPct}% long=${stats.longTasks} commits=${stats.reactCommits}${
              failures.length ? `  ✗ ${failures.join("; ")}` : "  ✓"
            }`,
          );
        } catch (err) {
          failed = true;
          results.push({
            target: LABEL,
            size,
            scenario: name,
            error: String(err?.message ?? err),
          });
          log(`    ERROR: ${err?.message ?? err}`);
        }
      }
    }
  } finally {
    await target.close().catch(() => {});
    if (server) server.kill("SIGTERM");
  }

  const outDir = path.join(root, "scratch", "perf-results");
  mkdirSync(outDir, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const outFile = path.join(outDir, `${LABEL}-${stamp}.json`);
  writeFileSync(
    outFile,
    JSON.stringify(
      { label: LABEL, capturedAt: new Date().toISOString(), results },
      null,
      2,
    ),
  );
  log(`results → ${path.relative(root, outFile)}`);

  if (failed && !NO_BUDGET) {
    log("BUDGET FAILURES — see above.");
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
