import { chromium } from "playwright";

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto("http://localhost:3055/dev/perf?nodes=100", {
  waitUntil: "domcontentloaded",
});
await page.waitForSelector('[data-perf-ready="true"]', {
  timeout: 120_000,
  state: "attached",
});
await page.waitForTimeout(1500);

const box = await page.locator("[data-perf-ready]").boundingBox();
await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
await page.keyboard.down("Control");
for (let i = 0; i < 60; i++) {
  await page.mouse.wheel(0, 10);
  await page.waitForTimeout(20);
}
await page.keyboard.up("Control");
await page.waitForTimeout(800); // let settled scale flip the LOD

const stats = await page.evaluate(() => ({
  placeholders: document.querySelectorAll('[data-card-lod="placeholder"]')
    .length,
  fullCards: document.querySelectorAll(
    "[data-canvas-card]:not([data-card-lod])",
  ).length,
}));
console.log(JSON.stringify(stats));
await page.screenshot({ path: "/tmp/lod-zoomed-out.png" });
await browser.close();
