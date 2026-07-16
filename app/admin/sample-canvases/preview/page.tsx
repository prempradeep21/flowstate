import { redirect } from "next/navigation";
import { SampleCanvasPreviewApp } from "@/components/sampleCanvases/SampleCanvasPreviewApp";
import { getAdminUser } from "@/lib/adminAccess.server";

/**
 * Read-only preview of a registry sample canvas, opened in a new tab from the
 * admin Sample Canvases section. Pick a canvas with ?slug=<registry-slug>
 * (defaults to the first entry). Nothing is written to the admin's account —
 * see SampleCanvasPreviewApp for how the preview session isolates persistence.
 */
export default async function AdminSampleCanvasPreviewPage() {
  const user = await getAdminUser();
  if (!user) redirect("/");

  return <SampleCanvasPreviewApp />;
}
