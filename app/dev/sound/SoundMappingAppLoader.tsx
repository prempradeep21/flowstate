"use client";

import dynamic from "next/dynamic";

export const SoundMappingApp = dynamic(
  () => import("./SoundMappingApp").then((mod) => mod.SoundMappingApp),
  {
    ssr: false,
    loading: () => (
      <div className="flex min-h-[50vh] items-center justify-center bg-canvas-bg px-6 text-canvas-body-sm text-canvas-muted">
        Loading sound console…
      </div>
    ),
  },
);
