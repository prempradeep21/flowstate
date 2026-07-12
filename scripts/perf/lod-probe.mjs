import { chromium } from "playwright";

const BASE = process.argv[2] ?? "http://localhost:3055";

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto(`${BASE}/dev/perf?nodes=100`, {
  waitUntil: "domcontentloaded",
});
await page.waitForSelector('[data-perf-ready="true"]', {
  timeout: 120_000,
  state: "attached",
});
await page.waitForTimeout(1500);

// Gesture-mount policy probe: while data-gesturing is set, culling reveals
// must mount PLACEHOLDERS only — a full node subtree mounting mid-gesture is
// the pop-in/jank this guards against. Hydrations (placeholder → full) must
// land after the gesture settles, time-sliced across frames.
await page.evaluate(() => {
  const stats = {
    fullMountsDuringGesture: 0,
    placeholderMountsDuringGesture: 0,
    hydrationFrameTimes: [],
  };
  window.__lodProbe = stats;
  const container = document.querySelector("[data-canvas-container]");
  const isGesturing = () => container?.hasAttribute("data-gesturing");
  const isNodeRoot = (el) =>
    el.hasAttribute?.("data-canvas-card") ||
    el.hasAttribute?.("data-canvas-artifact") ||
    el.hasAttribute?.("data-canvas-asset") ||
    el.hasAttribute?.("data-canvas-skill") ||
    el.hasAttribute?.("data-canvas-3d");
  const isPlaceholder = (el) =>
    el.matches?.(
      "[data-card-lod], [data-artifact-lod], [data-asset-lod], [data-skill-lod], [data-3d-lod]",
    );
  const mo = new MutationObserver((mutations) => {
    for (const m of mutations) {
      for (const added of m.addedNodes) {
        if (!(added instanceof HTMLElement) || !isNodeRoot(added)) continue;
        if (isGesturing()) {
          if (isPlaceholder(added)) stats.placeholderMountsDuringGesture++;
          else stats.fullMountsDuringGesture++;
        } else if (!isPlaceholder(added)) {
          // Post-settle hydration (or normal mount) — record the frame time
          // so the drain's time-slicing is observable.
          stats.hydrationFrameTimes.push(performance.now());
        }
      }
    }
  });
  mo.observe(document.querySelector("[data-canvas-viewport]") ?? document.body, {
    childList: true,
    subtree: true,
  });
});

const box = await page.locator("[data-perf-ready]").boundingBox();
await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
await page.keyboard.down("Control");
for (let i = 0; i < 60; i++) {
  await page.mouse.wheel(0, 10);
  await page.waitForTimeout(20);
}
await page.keyboard.up("Control");
await page.waitForTimeout(1200); // settle + hydration drain

const stats = await page.evaluate(() => {
  const probe = window.__lodProbe;
  const times = probe.hydrationFrameTimes;
  // Distinct animation frames the hydrations landed in (>4ms apart ⇒ new frame).
  let frames = 0;
  let last = -Infinity;
  for (const t of times) {
    if (t - last > 4) frames++;
    last = t;
  }
  return {
    placeholders: document.querySelectorAll('[data-card-lod="placeholder"]')
      .length,
    fullCards: document.querySelectorAll(
      "[data-canvas-card]:not([data-card-lod])",
    ).length,
    fullMountsDuringGesture: probe.fullMountsDuringGesture,
    placeholderMountsDuringGesture: probe.placeholderMountsDuringGesture,
    postSettleHydrations: times.length,
    hydrationFramesSpanned: frames,
  };
});
console.log(JSON.stringify(stats));

const pass = stats.fullMountsDuringGesture === 0;
console.log(
  pass
    ? "✅ NO FULL-SUBTREE MOUNTS MID-GESTURE"
    : `❌ ${stats.fullMountsDuringGesture} full mounts happened mid-gesture`,
);
await page.screenshot({ path: "/tmp/lod-zoomed-out.png" });
await browser.close();
process.exit(pass ? 0 : 1);
