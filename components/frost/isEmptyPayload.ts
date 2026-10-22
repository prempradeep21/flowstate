import type { ArtifactPayload } from "@/lib/artifactTypes";

/** Whether a payload has nothing to draw (the body would be blank). */
export function isEmptyPayload(payload: ArtifactPayload): boolean {
  switch (payload.type) {
    case "todo":
      return payload.data.items.length === 0;
    case "table":
      return (payload.data.rows ?? []).length === 0;
    case "timeline":
      return payload.data.events.length === 0;
    case "images":
      return payload.data.items.length === 0;
    case "linkgroup":
      return payload.data.sections.every((s) => (s.links ?? []).length === 0);
    case "chart": {
      const d = payload.data;
      if (d.chartType === "gauge") return d.gaugeValue == null;
      if (d.chartType === "pie") return (d.slices?.length ?? d.categories?.length ?? 0) === 0;
      // A freshly dropped chart is all zeros: nothing to draw yet, not a
      // headline "0" over a flat row of empty columns.
      return (
        (d.categories?.length ?? 0) === 0 ||
        (d.series?.length ?? 0) === 0 ||
        d.series!.every((s) => s.data.every((v) => !v))
      );
    }
    default:
      return false;
  }
}
