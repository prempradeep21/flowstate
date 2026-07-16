import { notFound } from "next/navigation";
import { SampleCanvasPreviewApp } from "@/components/sampleCanvases/SampleCanvasPreviewApp";

/**
 * Dev-only mirror of the admin Sample Canvases preview — renders a registry
 * snapshot on the real canvas without the admin login gate, and exposes the
 * store to headless preview tooling. Pick a canvas with ?slug=<registry-slug>
 * (defaults to the first entry). Blocked in production.
 */
export default function SampleCanvasesDevPage() {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }

  return <SampleCanvasPreviewApp exposeStoreForTooling />;
}
