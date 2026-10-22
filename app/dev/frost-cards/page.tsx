import { Suspense } from "react";
import { notFound } from "next/navigation";
import { FrostCardsHarness } from "./FrostCardsHarness";

/**
 * Dev-only harness for the Frost Q&A cards, canvas menus, minimap and field
 * (audit §4.5, §5, §6.2, §7, §8). Seeds the catalog canvas and exposes the
 * store on `window.__canvasStore` so headless tooling can force card states.
 * `?style=<pack id>` picks the pack (default frost). Blocked in production.
 */
export default function FrostCardsPage() {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }
  return (
    <Suspense>
      <FrostCardsHarness />
    </Suspense>
  );
}
