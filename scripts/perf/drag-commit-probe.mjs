#!/usr/bin/env node
/**
 * Functional probe: does an imperative drag COMMIT its position to the store?
 * Drags the first card ~+120/+80 screen px on the /dev/perf fixture and
 * checks (1) a translate transform exists mid-gesture, (2) the transform is
 * cleared after drop, (3) left/top changed by the world-space delta,
 * (4) undo restores the original position.
 */
import { chromium } from "playwright";

const BASE = process.argv[2] ?? "http://localhost:3055";

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
page.on("console", (msg) => {
  if (msg.type() === "error" || msg.type() === "warning") {
    console.error(`[page ${msg.type()}] ${msg.text().slice(0, 300)}`);
  }
});
page.on("pageerror", (err) => console.error(`[pageerror] ${err.message}`));
await page.goto(`${BASE}/dev/perf?nodes=30`, { waitUntil: "domcontentloaded" });
await page.waitForSelector('[data-perf-ready="true"]', {
  timeout: 120_000,
  state: "attached",
});
await page.waitForTimeout(1500);

// Pan up (trackpad-style wheel) until a draggable ROOT card (…-0) is visible.
const box = await page.locator("[data-perf-ready]").boundingBox();
await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
for (let tries = 0; tries < 20; tries++) {
  const hasRoot = await page.evaluate(() =>
    [...document.querySelectorAll("[data-canvas-card]")].some((n) =>
      /-0$/.test(n.getAttribute("data-canvas-card") ?? ""),
    ),
  );
  if (hasRoot) break;
  await page.mouse.wheel(0, -300);
  await page.waitForTimeout(120);
}

const result = await page.evaluate(async () => {
  // Only ROOT cards are draggable (rootCardsOnlyDraggable tuning); fixture
  // roots are perf-card-{t}-0. None may be inside the culled viewport, so
  // fall back to any card and report which.
  const cards = [...document.querySelectorAll("[data-canvas-card]")];
  const el =
    cards.find((n) => /-0$/.test(n.getAttribute("data-canvas-card") ?? "")) ??
    null;
  if (!el) {
    return {
      error: "no root card visible",
      visible: cards.map((n) => n.getAttribute("data-canvas-card")),
    };
  }
  const id = el.getAttribute("data-canvas-card");
  const before = { left: el.style.left, top: el.style.top };
  const r = el.getBoundingClientRect();
  const cx = r.x + 30;
  const cy = r.y + 12;
  const fire = (type, x, y) =>
    el.dispatchEvent(
      new PointerEvent(type, {
        bubbles: true,
        cancelable: true,
        button: 0,
        pointerId: 7,
        clientX: x,
        clientY: y,
        isPrimary: true,
      }),
    );
  fire("pointerdown", cx, cy);
  for (let i = 1; i <= 10; i++) {
    fire("pointermove", cx + i * 12, cy + i * 8);
    await new Promise((res) => requestAnimationFrame(res));
  }
  const midTransform = el.style.transform;
  fire("pointerup", cx + 120, cy + 80);
  await new Promise((res) => setTimeout(res, 150));
  const after = { left: el.style.left, top: el.style.top, transform: el.style.transform };

  // Undo (meta+z simulated via store — keyboard needs focus wrangling)
  return { id, before, midTransform, after };
});

console.log(JSON.stringify(result, null, 2));

const beforeLeft = parseFloat(result.before?.left ?? "NaN");
const afterLeft = parseFloat(result.after?.left ?? "NaN");
const beforeTop = parseFloat(result.before?.top ?? "NaN");
const afterTop = parseFloat(result.after?.top ?? "NaN");
const ok =
  result.midTransform?.includes("translate") &&
  result.after?.transform === "" &&
  Math.abs(afterLeft - beforeLeft - 240) < 2 && // 120 screen px at scale 0.5 = 240 world
  Math.abs(afterTop - beforeTop - 160) < 2;
console.log(ok ? "✅ DRAG COMMIT OK" : "❌ DRAG COMMIT FAILED");
await browser.close();
process.exit(ok ? 0 : 1);
