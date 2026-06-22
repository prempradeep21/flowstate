import { NextResponse } from "next/server";
import { buildArtifactCatalogSnapshot } from "@/lib/buildArtifactCatalogCanvas";
import type { ArtifactCatalogCategory } from "@/lib/artifactCatalogSamples";

export const dynamic = "force-dynamic";

/**
 * Dev/demo helper: emits the artifact-catalog sample data as a single
 * canvas snapshot (all categories merged), in the same JSONB shape as a real
 * canvases.state. Used to bundle an offline demo canvas into the iOS app so
 * artifacts can be viewed without signing in.
 */
export async function GET() {
  const categories: ArtifactCatalogCategory[] = [
    "flowstate",
    "input",
    "custom-example",
  ];

  const sessionArtifacts: Record<string, unknown> = {};
  const canvasArtifactNodes: Record<string, unknown> = {};
  const canvasArtifactOrder: string[] = [];

  for (const cat of categories) {
    const snap = buildArtifactCatalogSnapshot(cat);
    for (const [id, art] of Object.entries(snap.sessionArtifacts ?? {})) {
      const newId = `${cat}-${id}`;
      sessionArtifacts[newId] = { ...(art as Record<string, unknown>), id: newId };
    }
    for (const nodeId of snap.canvasArtifactOrder ?? []) {
      const node = snap.canvasArtifactNodes?.[nodeId];
      if (!node) continue;
      const newNodeId = `${cat}-${nodeId}`;
      canvasArtifactNodes[newNodeId] = {
        ...node,
        id: newNodeId,
        artifactId: `${cat}-${node.artifactId}`,
      };
      canvasArtifactOrder.push(newNodeId);
    }
  }

  return NextResponse.json({
    id: "demo-catalog",
    title: "Sample artifacts",
    state: {
      version: 1,
      sessionArtifacts,
      canvasArtifactNodes,
      canvasArtifactOrder,
    },
  });
}
