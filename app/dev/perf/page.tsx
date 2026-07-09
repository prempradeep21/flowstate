import { notFound } from "next/navigation";
import { PerfFixtureApp } from "./PerfFixtureApp";

/**
 * Canvas performance benchmark page.
 *
 * Dev-only by default; allow in production builds (e.g. packaged Electron
 * benchmarks) by setting NEXT_PUBLIC_ENABLE_PERF_PAGE=1 at build time.
 */
export default function PerfFixturePage() {
  if (
    process.env.NODE_ENV === "production" &&
    process.env.NEXT_PUBLIC_ENABLE_PERF_PAGE !== "1"
  ) {
    notFound();
  }

  return <PerfFixtureApp />;
}
