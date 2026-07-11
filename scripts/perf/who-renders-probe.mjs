#!/usr/bin/env node
/**
 * Names the components that render during an in-place pan by installing a
 * minimal React DevTools hook (before React loads) and walking committed
 * fiber trees for PerformedWork nodes. Decisive attribution for the
 * "who re-renders per viewport store write" question.
 */
import { chromium } from "playwright";

const BASE = process.argv[2] ?? "http://localhost:3200";
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

await page.addInitScript(() => {
  const counts = new Map();
  let enabled = false;
  window.__whoRenders = {
    start() {
      counts.clear();
      enabled = true;
    },
    stop() {
      enabled = false;
      const entries = [...counts.entries()].sort((a, b) => b[1] - a[1]);
      const WATCH = [
        "AuthProvider",
        "Canvas",
        "PerfFixtureApp",
        "LazyMotion",
        "MotionConfig",
        "CanvasViewport",
        "ThemeApplier",
        "PerfHUD",
      ];
      return {
        roots: Object.fromEntries(
          entries.filter(([k]) => k.startsWith("ROOT:")).slice(0, 15),
        ),
        contexts: Object.fromEntries(
          entries.filter(([k]) => k.startsWith("CTX:")).slice(0, 15),
        ),
        watched: Object.fromEntries(
          WATCH.flatMap((n) => {
            const out = [];
            if (counts.has(n)) out.push([n, counts.get(n)]);
            if (counts.has("ROOT:" + n))
              out.push(["ROOT:" + n, counts.get("ROOT:" + n)]);
            return out;
          }),
        ),
        forensics: Object.fromEntries(
          entries.filter(([k]) => k.startsWith("FORENSIC:")),
        ),
        hooks: Object.fromEntries(
          entries
            .filter(
              ([k]) =>
                k.startsWith("HOOKV:") ||
                k.startsWith("SRC:") ||
                k.startsWith("SLOT:"),
            )
            .slice(0, 45),
        ),
        renders: Object.fromEntries(
          entries
            .filter(([k]) => !k.startsWith("ROOT:") && !k.startsWith("CTX:"))
            .slice(0, 10),
        ),
      };
    },
  };

  const PerformedWork = 1;
  const fiberName = (node) => {
    const t = node.type;
    return typeof t === "function"
      ? t.displayName || t.name || "anonymous-fn"
      : typeof t === "string"
        ? null // host elements — skip
        : t && typeof t === "object" && t.$$typeof
          ? t.displayName ||
            (t.render && (t.render.displayName || t.render.name)) ||
            "special"
          : null;
  };
  function walk(fiber, ancestorWorked) {
    let node = fiber;
    const workedStack = [ancestorWorked];
    const visit = (n, parentWorked) => {
      // A fiber only participated in THIS commit if it's on the changed
      // path — untouched fibers keep stale PerformedWork flags from their
      // last render, so the flag alone over-counts massively (every
      // mounted card would count on every commit). The changed path is
      // enforced by the traversal below (child-pointer comparison).
      const worked = Boolean(
        (n.flags & PerformedWork) | (n.effectTag & PerformedWork),
      );
      const name = fiberName(n);
      if (worked && name) {
        counts.set(name, (counts.get(name) ?? 0) + 1);
        // Hook-slot forensics for render ROOTS: which hook's state changed
        // vs the previous render, and what does the new value look like?
        // Hook order == call order, so the slot index maps to a useX call.
        const FORENSIC_TARGETS = new Set([
          "Canvas",
          "SelectionToolbar",
          "TextCardBody",
          "CardInner",
          "CanvasViewport",
        ]);
        if (FORENSIC_TARGETS.has(name) && n.alternate && !parentWorked) {
          const describe = (v, depth = 0) => {
            if (v === null) return "null";
            const t = typeof v;
            if (t !== "object" && t !== "function") {
              return t + ":" + String(v).slice(0, 24);
            }
            if (t === "function") return "fn:" + (v.name || "anon");
            if (Array.isArray(v)) {
              if (depth >= 1) return "array(" + v.length + ")";
              return (
                "array(" +
                v.length +
                ")[" +
                v.slice(0, 3).map((x) => describe(x, 1)).join("; ") +
                "]"
              );
            }
            return "obj{" + Object.keys(v).slice(0, 6).join(",") + "}";
          };
          counts.set(
            "SRC:" + name + "=" +
              String(n.type).replace(/\s+/g, " ").slice(0, 100),
            1,
          );
          // One-time hook-kind map for the first slots: distinguishes
          // useSyncExternalStore (queue = {value,getSnapshot}) from
          // useState (queue has dispatch) / useCallback (no queue).
          if (!counts.has("MAP:" + name)) {
            counts.set("MAP:" + name, 1);
            let h = n.memoizedState;
            let i = 0;
            while (h && i < 10) {
              const q = h.queue;
              const kind =
                q && typeof q === "object" && "getSnapshot" in q
                  ? "uSES(" + describe(q.value, 1) + ")"
                  : q && typeof q === "object" && "dispatch" in q
                    ? "state"
                    : "memo/cb/ref/effect";
              counts.set("SLOT:" + name + "#" + i + "=" + kind, 1);
              h = h.next;
              i++;
            }
          }
          // Only uSES snapshot slots (queue = {value,getSnapshot}) and
          // useState/useReducer slots (queue has dispatch) can CAUSE a
          // self-scheduled render. useCallback/useMemo/effect slots always
          // churn on any re-render (inline selectors/new deps) — noise.
          let a = n.memoizedState;
          let b = n.alternate.memoizedState;
          let idx = 0;
          let reported = 0;
          let anyCause = false;
          while (a && b && idx < 400 && reported < 4) {
            const q = a.queue;
            const isSesSlot =
              q && typeof q === "object" && "getSnapshot" in q;
            const isStateSlot =
              q && typeof q === "object" && "dispatch" in q;
            if (
              (isSesSlot || isStateSlot) &&
              !Object.is(a.memoizedState, b.memoizedState)
            ) {
              const kind = isSesSlot ? "store" : "state";
              const hk =
                "HOOKV:" + name + "#" + idx + "(" + kind + ")=" +
                describe(a.memoizedState);
              counts.set(hk, (counts.get(hk) ?? 0) + 1);
              reported++;
              anyCause = true;
            }
            a = a.next;
            b = b.next;
            idx++;
          }
          if (!anyCause) {
            const hk = "HOOKV:" + name + "#NO-CHANGED-HOOK";
            counts.set(hk, (counts.get(hk) ?? 0) + 1);
          }
        }
        if (!parentWorked) {
          // Render ROOT: this update originated here (its own state/store
          // subscription or a changed context), not via a parent re-render.
          const key = "ROOT:" + name;
          counts.set(key, (counts.get(key) ?? 0) + 1);
          // Attribute the context: dump the shape of consumed context values.
          let dep = n.dependencies && n.dependencies.firstContext;
          let d = 0;
          while (dep && d < 3) {
            const v = dep.context && dep.context._currentValue;
            const shape =
              v === null
                ? "null"
                : typeof v !== "object"
                  ? typeof v + ":" + String(v).slice(0, 20)
                  : Object.keys(v).slice(0, 6).join(",") || v.constructor?.name;
            const ckey = "CTX:" + name + " → {" + shape + "}";
            counts.set(ckey, (counts.get(ckey) ?? 0) + 1);
            dep = dep.next;
            d++;
          }
        }
      }
      return parentWorked || worked;
    };
    // Iterative DFS carrying the "ancestor performed work" flag.
    // Descend ONLY where this commit did work: a bailed-out subtree
    // reuses the previous child fiber (n.child === n.alternate.child),
    // so equal pointers mean nothing below rendered in this commit.
    // Invariant: every fiber on the stack was cloned this commit (fresh
    // flags). Children are only fresh when the fiber produced new child
    // fibers (child pointer differs from alternate's) — a bailout reuses
    // the old child fibers, whose flags are stale leftovers.
    const stack = [[fiber, ancestorWorked]];
    while (stack.length) {
      const [n, parentWorked] = stack.pop();
      const worked = visit(n, parentWorked);
      const childrenFresh = !n.alternate || n.child !== n.alternate.child;
      if (!childrenFresh) continue;
      let child = n.child;
      while (child) {
        stack.push([child, worked]);
        child = child.sibling;
      }
    }
    void node;
    void workedStack;
  }

  window.__REACT_DEVTOOLS_GLOBAL_HOOK__ = {
    renderers: new Map(),
    supportsFiber: true,
    inject: () => 1,
    onCommitFiberUnmount: () => {},
    onCommitFiberRoot: (_id, root) => {
      if (!enabled) return;
      try {
        walk(root.current, false);
      } catch {
        /* attribution is best-effort */
      }
    },
    onPostCommitFiberRoot: () => {},
    checkDCE: () => {},
  };
});

await page.goto(`${BASE}/dev/perf?nodes=100`, { waitUntil: "domcontentloaded" });
await page.waitForSelector('[data-perf-ready="true"]', {
  timeout: 120_000,
  state: "attached",
});
await page.waitForTimeout(2000);

const box = await page.locator("[data-perf-ready]").boundingBox();
await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);

await page.evaluate(() => window.__whoRenders.start());
for (let i = 0; i < 60; i++) {
  await page.mouse.wheel(0, i % 2 === 0 ? 8 : -8);
  await page.waitForTimeout(16);
}
const onCanvas = await page.evaluate(() => window.__whoRenders.stop());

// Discriminator: same wheel cadence dispatched OFF-canvas (body). If the
// storm persists, a global wheel/pointer listener is setting React state
// per event — independent of the canvas gesture pipeline.
await page.waitForTimeout(500);
await page.evaluate(() => window.__whoRenders.start());
await page.evaluate(async () => {
  for (let i = 0; i < 60; i++) {
    document.body.dispatchEvent(
      new WheelEvent("wheel", {
        bubbles: true,
        deltaY: i % 2 === 0 ? 8 : -8,
        deltaMode: 0,
      }),
    );
    await new Promise((r) => setTimeout(r, 16));
  }
});
const offCanvas = await page.evaluate(() => window.__whoRenders.stop());

// Second discriminator: pure mousemove (no wheel) — catches pointer-tracking
// state setters.
await page.waitForTimeout(500);
await page.evaluate(() => window.__whoRenders.start());
for (let i = 0; i < 60; i++) {
  await page.mouse.move(
    box.x + box.width / 2 + (i % 2 === 0 ? 6 : -6),
    box.y + box.height / 2,
  );
  await page.waitForTimeout(16);
}
const mouseOnly = await page.evaluate(() => window.__whoRenders.stop());

console.log(
  JSON.stringify(
    {
      onCanvasWheel: onCanvas.roots,
      onCanvasWatched: onCanvas.watched,
      onCanvasForensics: onCanvas.forensics,
      onCanvasHooks: onCanvas.hooks,
      onCanvasContexts: onCanvas.contexts,
      offCanvasWheel: offCanvas.roots,
      mouseMoveOnly: mouseOnly.roots,
    },
    null,
    2,
  ),
);
await browser.close();
