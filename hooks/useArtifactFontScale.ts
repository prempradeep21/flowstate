"use client";

import { useCallback, useEffect, useState } from "react";
import {
  ARTIFACT_FONT_SCALE_DEFAULT,
  loadArtifactFontScale,
  saveArtifactFontScale,
} from "@/lib/artifactFontScale";

export function useArtifactFontScale(artifactId?: string) {
  const [scale, setScale] = useState(ARTIFACT_FONT_SCALE_DEFAULT);

  useEffect(() => {
    setScale(loadArtifactFontScale(artifactId));
  }, [artifactId]);

  const setFontScale = useCallback(
    (next: number) => {
      setScale(next);
      saveArtifactFontScale(artifactId, next);
    },
    [artifactId],
  );

  return [scale, setFontScale] as const;
}
