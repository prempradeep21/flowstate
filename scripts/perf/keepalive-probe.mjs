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

// Keep-alive probe: culled nodes must be HIDDEN (display:none), not
// unmounted — pan far away and back, then verify the exact same DOM node
// (identity-marked) is still attached. A remount would have reloaded any
// iframe/WebGL/media content the node held.
const box0 = await page.locator("[data-perf-ready]").boundingBox();
await page.mouse.move(box0.x + box0.width / 2, box0.y + box0.height / 2);

// The fixture's initial viewport sits in mostly-empty space — pan up into
// the card grid first so there is real on-screen content to track.
for (let i = 0; i < 30; i++) {
  await page.mouse.wheel(0, -120);
  await page.waitForTimeout(10);
}
await page.waitForTimeout(900);

const target = await page.evaluate(() => {
  // Pick a STATEFUL keep-alive node (artifact) that is visible here so
  // the round trip has a deterministic subject.
  const el = [...document.querySelectorAll("[data-canvas-artifact]")].find((c) => {
    if (getComputedStyle(c.parentElement).display === "none") return false;
    const r = c.getBoundingClientRect();
    return r.width > 0 && r.right > 0 && r.left < innerWidth;
  });
  if (!el) return null;
  el.__keepAliveMarker = "alive";
  return el.getAttribute("data-canvas-node-id");
});
if (!target) throw new Error("no visible artifact found");

const viewportOf = () =>
  page.evaluate(() => window.__canvasStore?.getState?.().viewport ?? null);
const startViewport = await viewportOf();

const box = await page.locator("[data-perf-ready]").boundingBox();
await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);

// Pan far right so the marked artifact leaves the padded viewport.
for (let i = 0; i < 40; i++) {
  await page.mouse.wheel(200, 0);
  await page.waitForTimeout(10);
}
await page.waitForTimeout(600);

const whileCulled = await page.evaluate((id) => {
  const el = document.querySelector(`[data-canvas-node-id="${id}"]`);
  if (!el) return { state: "UNMOUNTED" };
  return {
    state: "mounted",
    wrapperDisplay: getComputedStyle(el.parentElement).display,
    markerIntact: el.__keepAliveMarker === "alive",
  };
}, target);

// Pan back.
for (let i = 0; i < 40; i++) {
  await page.mouse.wheel(-200, 0);
  await page.waitForTimeout(10);
}
await page.waitForTimeout(900);

const afterReturn = await page.evaluate((id) => {
  const el = document.querySelector(`[data-canvas-node-id="${id}"]`);
  if (!el) return { state: "UNMOUNTED" };
  return {
    state: "mounted",
    sameDomNode: el.__keepAliveMarker === "alive",
    wrapperDisplay: getComputedStyle(el.parentElement).display,
  };
}, target);

const endViewport = await viewportOf();
const result = { target, startViewport, whileCulled, endViewport, afterReturn };
console.log(JSON.stringify(result, null, 2));

const pass =
  whileCulled.state === "mounted" &&
  whileCulled.wrapperDisplay === "none" &&
  whileCulled.markerIntact &&
  afterReturn.sameDomNode &&
  afterReturn.wrapperDisplay === "contents";
console.log(
  pass
    ? "✅ KEEP-ALIVE OK — culled node hidden, DOM identity preserved"
    : "❌ keep-alive failed",
);
await browser.close();
process.exit(pass ? 0 : 1);
