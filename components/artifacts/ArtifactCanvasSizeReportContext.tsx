"use client";

import { createContext, useContext } from "react";

export type ArtifactContentAreaSize = { w: number; h: number };

const ArtifactCanvasSizeReportContext = createContext<
  ((size: ArtifactContentAreaSize) => void) | undefined
>(undefined);

export function ArtifactCanvasSizeReportProvider({
  onContentAreaSizeChange,
  children,
}: {
  onContentAreaSizeChange?: (size: ArtifactContentAreaSize) => void;
  children: React.ReactNode;
}) {
  return (
    <ArtifactCanvasSizeReportContext.Provider value={onContentAreaSizeChange}>
      {children}
    </ArtifactCanvasSizeReportContext.Provider>
  );
}

export function useArtifactCanvasSizeReport():
  | ((size: ArtifactContentAreaSize) => void)
  | undefined {
  return useContext(ArtifactCanvasSizeReportContext);
}
