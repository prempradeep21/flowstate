"use client";

import { ArtifactContentStage } from "@/components/artifacts/ArtifactContentStage";
import type { ArtifactPayload } from "@/lib/artifactTypes";

export function ThreeDArtifactContent({
  payload,
  fill = false,
}: {
  payload: Extract<ArtifactPayload, { type: "3d" }>;
  fill?: boolean;
}) {
  const { modelUrl, format = "glb" } = payload.data;

  if (fill) {
    return (
      <ArtifactContentStage fill className="h-full min-h-0">
        <div className="flex h-full min-h-0 flex-col items-center justify-center bg-[#1a1a1a] p-6 text-center">
          <p className="text-[13px] text-white/70">3D model preview</p>
          <a
            href={modelUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 max-w-full truncate text-[12px] text-violet-300 hover:underline"
          >
            Open {format.toUpperCase()} model
          </a>
          <p className="mt-4 text-[11px] text-white/40">
            Embed viewer loads in a future update; model URL is ready.
          </p>
        </div>
      </ArtifactContentStage>
    );
  }

  return (
    <ArtifactContentStage className="aspect-[4/3]">
      <div className="flex h-full min-h-[280px] flex-col items-center justify-center bg-[#1a1a1a] p-6 text-center">
        <p className="text-[13px] text-white/70">3D model preview</p>
        <a
          href={modelUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 max-w-full truncate text-[12px] text-violet-300 hover:underline"
        >
          Open {format.toUpperCase()} model
        </a>
        <p className="mt-4 text-[11px] text-white/40">
          Embed viewer loads in a future update; model URL is ready.
        </p>
      </div>
    </ArtifactContentStage>
  );
}
