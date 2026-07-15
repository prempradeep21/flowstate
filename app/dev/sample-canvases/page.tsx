import { notFound } from "next/navigation";
import { SampleCanvasPreviewApp } from "./SampleCanvasPreviewApp";

/**
 * Dev-only mirror of the admin Sample Canvases section — renders a registry
 * snapshot on the real canvas without the admin login gate. Pick a canvas with
 * ?slug=<registry-slug> (defaults to the first entry). Blocked in production.
 */
export default function SampleCanvasesDevPage() {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }

  return <SampleCanvasPreviewApp />;
}
