"use client";

import { useMemo } from "react";
import { buildCustomSrcdoc } from "@/lib/customArtifact";
import type { CustomArtifactData } from "@/lib/artifactTypes";

interface DynamicUiFrameProps {
  data: CustomArtifactData;
}

export function DynamicUiFrame({ data }: DynamicUiFrameProps) {
  const srcdoc = useMemo(() => buildCustomSrcdoc(data), [data]);

  if (!data.html.trim()) {
    return (
      <div className="flex h-full items-center justify-center p-4 text-center">
        <p className="text-canvas-body-sm text-canvas-muted">
          No UI source received. Ask again to regenerate the interface.
        </p>
      </div>
    );
  }

  return (
    <iframe
      title="Custom UI preview"
      sandbox="allow-scripts"
      srcDoc={srcdoc}
      className="h-full w-full border-0 bg-white"
    />
  );
}
