#!/usr/bin/env node
/**
 * Pan/zoom frame-budget benchmark helper (manual console capture).
 *
 * NOTE: the automated suite lives at scripts/perf/run-benchmark.mjs
 * (`npm run perf` / `npm run perf:electron`) — it drives the /dev/perf
 * fixture page through pan/zoom/drag/marquee scenarios with budget gates.
 * This snippet remains for quick ad-hoc checks on arbitrary canvases.
 *
 * Usage:
 *   1. Start the app: npm run dev
 *   2. Open http://localhost:3000 with a canvas that has 20+ cards
 *   3. Open DevTools → Console and paste the snippet printed below
 *   4. Space+drag or scroll to pan/zoom for ~5 seconds
 *   5. Copy the JSON result for baseline comparison across commits
 */

const SNIPPET = `
(async () => {
  const samples = [];
  let running = true;
  let last = performance.now();
  const loop = () => {
    if (!running) return;
    const now = performance.now();
    samples.push(now - last);
    last = now;
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
  await new Promise((r) => setTimeout(r, 5000));
  running = false;
  samples.sort((a, b) => a - b);
  const avg = samples.reduce((s, v) => s + v, 0) / samples.length;
  const p99 = samples[Math.floor(samples.length * 0.99)] ?? 0;
  const over16 = samples.filter((s) => s > 16.7).length;
  const result = {
    label: "pan-zoom-frame-budget",
    sampleCount: samples.length,
    avgMs: Number(avg.toFixed(2)),
    p99Ms: Number(p99.toFixed(2)),
    framesOver16ms: over16,
    pctOver16: Number(((over16 / samples.length) * 100).toFixed(1)),
    capturedAt: new Date().toISOString(),
  };
  console.log(JSON.stringify(result, null, 2));
  return result;
})();
`.trim();

console.log("Pan/zoom benchmark — manual capture\n");
console.log("Paste this in the browser console while panning/zooming:\n");
console.log(SNIPPET);
console.log("\nTarget: avgMs < 8, p99Ms < 16.7, pctOver16 < 5% during space+drag on 20+ cards.");
