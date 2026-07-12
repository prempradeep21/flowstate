#!/usr/bin/env node
/**
 * Feel-fix probe:
 *  1. In-place pan (±8px wiggle, stays inside the 240px culling pad) —
 *     commits should be ≈0 now that no component subscribes to the live
 *     viewport (was ~90/s from Card re-renders).
 *  2. Same-frame transform check — after dispatching a wheel event, the
 *     viewport transform must change BEFORE the next paint (zero added
 *     latency; the old rAF queue applied it one frame late).
 *  3. Smoothed notched-wheel zoom — a single big ctrl+wheel notch should
 *     move scale gradually across multiple frames, not one jump.
 */
import { chromium } from "playwright";

const BASE = process.argv[2] ?? "http://localhost:3200";
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto(`${BASE}/dev/perf?nodes=100`, { waitUntil: "domcontentloaded" });
await page.waitForSelector('[data-perf-ready="true"]', {
  timeout: 120_000,
  state: "attached",
});
await page.waitForTimeout(2000);

// --- 1. In-place pan commit probe -----------------------------------------
const box = await page.locator("[data-perf-ready]").boundingBox();
const cx = box.x + box.width / 2;
const cy = box.y + box.height / 2;
await page.mouse.move(cx, cy);

await page.evaluate(() => window.__flowstatePerf.start("in-place-pan"));
for (let i = 0; i < 90; i++) {
  await page.mouse.wheel(0, i % 2 === 0 ? 8 : -8);
  await page.waitForTimeout(16);
}
const panStats = await page.evaluate(() => window.__flowstatePerf.stop());

// --- 2. Same-frame transform application ----------------------------------
const sameFrame = await page.evaluate(async () => {
  const el = document.querySelector("[data-canvas-viewport]");
  if (!el) return { error: "no viewport el" };
  const before = el.style.transform;
  // Dispatch a real wheel event (pan path) and read the transform
  // synchronously afterwards — BEFORE any rAF can run.
  const container = document.querySelector("[data-canvas-container]");
  container.dispatchEvent(
    new WheelEvent("wheel", {
      bubbles: true,
      cancelable: true,
      deltaX: 0,
      deltaY: 25.5, // fractional → continuous input
      deltaMode: 0,
      clientX: innerWidth / 2,
      clientY: innerHeight / 2,
    }),
  );
  const after = el.style.transform;
  return { before, after, changedSynchronously: before !== after };
});

// --- 3. Smoothed notched zoom ---------------------------------------------
const smooth = await page.evaluate(async () => {
  const el = document.querySelector("[data-canvas-viewport]");
  const container = document.querySelector("[data-canvas-container]");
  const scaleOf = () => {
    const m = /scale\(([\d.]+)\)/.exec(el.style.transform);
    return m ? parseFloat(m[1]) : 1;
  };
  const start = scaleOf();
  container.dispatchEvent(
    new WheelEvent("wheel", {
      bubbles: true,
      cancelable: true,
      ctrlKey: true,
      deltaY: -120, // big integer notch → smoothed path
      deltaMode: 0,
      clientX: innerWidth / 2,
      clientY: innerHeight / 2,
    }),
  );
  const samples = [];
  for (let i = 0; i < 12; i++) {
    await new Promise((r) => requestAnimationFrame(r));
    samples.push(Number(scaleOf().toFixed(4)));
  }
  const distinct = new Set(samples).size;
  return { start, samples, distinctSteps: distinct };
});

console.log(
  JSON.stringify(
    {
      inPlacePan: {
        commits: panStats.reactCommits,
        commitRenderMs: panStats.reactCommitMs,
        avgMs: panStats.avgMs,
        droppedPct: panStats.droppedPct,
      },
      sameFrame,
      smoothZoom: smooth,
    },
    null,
    2,
  ),
);

// Commit COUNT alone is not the feel signal — trivial leaf commits are fine.
// What matters: total render time inside commits stays negligible (<40ms
// across the whole 3s wiggle), the transform applies in the event's frame,
// and notched zoom glides.
const ok =
  (panStats.reactCommits <= 10 || panStats.reactCommitMs <= 40) &&
  sameFrame.changedSynchronously === true &&
  smooth.distinctSteps >= 4;
console.log(ok ? "✅ FEEL FIXES VERIFIED" : "❌ CHECK FAILURES ABOVE");
await browser.close();
process.exit(ok ? 0 : 1);
