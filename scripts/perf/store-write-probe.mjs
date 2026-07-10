#!/usr/bin/env node
/**
 * Diffs canvas-store writes key-by-key during an in-place pan wiggle.
 * Answers: which state keys change identity per viewport commit? Any key
 * beyond `viewport` explains why components with non-viewport selectors
 * re-render on every write.
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

const box = await page.locator("[data-perf-ready]").boundingBox();
await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);

await page.evaluate(() => {
  const store = window.__canvasStore;
  const changed = new Map();
  let writes = 0;
  const unsub = store.subscribe((state, prev) => {
    writes++;
    for (const k of Object.keys(state)) {
      if (!Object.is(state[k], prev[k])) {
        changed.set(k, (changed.get(k) ?? 0) + 1);
      }
    }
  });
  window.__storeProbe = {
    stop() {
      unsub();
      return {
        writes,
        changedKeys: Object.fromEntries(
          [...changed.entries()].sort((a, b) => b[1] - a[1]),
        ),
      };
    },
  };
});

for (let i = 0; i < 60; i++) {
  await page.mouse.wheel(0, i % 2 === 0 ? 8 : -8);
  await page.waitForTimeout(16);
}
await page.waitForTimeout(400);

const result = await page.evaluate(() => window.__storeProbe.stop());
console.log(JSON.stringify(result, null, 2));
await browser.close();
