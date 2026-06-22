"use client";

import { createContext, useContext } from "react";

/**
 * When true, every ArtifactContentStage hides its control strip (Aa font size,
 * chart/style pickers, etc.) regardless of local props. Used by the read-only
 * mobile renderer so artifacts show content only.
 */
export const HideArtifactControlsContext = createContext(false);

export function useHideArtifactControls(): boolean {
  return useContext(HideArtifactControlsContext);
}
