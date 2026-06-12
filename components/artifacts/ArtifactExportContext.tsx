"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  type ReactNode,
} from "react";
import type {
  ChartExportHandle,
  ChartExportMeta,
  ExportContext,
} from "@/lib/artifactExport/types";
import type { ArtifactKind, ArtifactPayload } from "@/lib/artifactTypes";
import { useCanvasStore } from "@/lib/store";

interface ArtifactExportContextValue {
  exportRootRef: React.MutableRefObject<HTMLDivElement | null>;
  setChartHandle: (handle: ChartExportHandle | null) => void;
  setChartMeta: (meta: ChartExportMeta | null) => void;
  setCodeActiveFile: (content: string | null, path: string | null) => void;
  buildExportContext: (
    kind: ArtifactKind,
    payload: ArtifactPayload,
    title: string,
    artifactId?: string,
  ) => ExportContext;
}

const ArtifactExportContext = createContext<ArtifactExportContextValue | null>(null);

export function ArtifactExportProvider({ children }: { children: ReactNode }) {
  const exportRootRef = useRef<HTMLDivElement | null>(null);
  const chartHandleRef = useRef<ChartExportHandle | null>(null);
  const chartMetaRef = useRef<ChartExportMeta | null>(null);
  const codeContentRef = useRef<string | null>(null);
  const codePathRef = useRef<string | null>(null);
  const canvasTheme = useCanvasStore((s) => s.canvasTheme);

  const setChartHandle = useCallback((handle: ChartExportHandle | null) => {
    chartHandleRef.current = handle;
  }, []);

  const setChartMeta = useCallback((meta: ChartExportMeta | null) => {
    chartMetaRef.current = meta;
  }, []);

  const setCodeActiveFile = useCallback((content: string | null, path: string | null) => {
    codeContentRef.current = content;
    codePathRef.current = path;
  }, []);

  const buildExportContext = useCallback(
    (
      kind: ArtifactKind,
      payload: ArtifactPayload,
      title: string,
      artifactId?: string,
    ): ExportContext => ({
      kind,
      payload,
      title,
      artifactId,
      exportRootEl: exportRootRef.current,
      chartHandle: chartHandleRef.current,
      chartMeta: chartMetaRef.current,
      codeActiveContent: codeContentRef.current,
      codeActivePath: codePathRef.current,
      isDark: canvasTheme === "dark",
    }),
    [canvasTheme],
  );

  const value = useMemo(
    () => ({
      exportRootRef,
      setChartHandle,
      setChartMeta,
      setCodeActiveFile,
      buildExportContext,
    }),
    [buildExportContext, setChartHandle, setChartMeta, setCodeActiveFile],
  );

  return (
    <ArtifactExportContext.Provider value={value}>{children}</ArtifactExportContext.Provider>
  );
}

export function useArtifactExport(): ArtifactExportContextValue {
  const ctx = useContext(ArtifactExportContext);
  if (!ctx) {
    throw new Error("useArtifactExport must be used within ArtifactExportProvider");
  }
  return ctx;
}

export function useArtifactExportOptional(): ArtifactExportContextValue | null {
  return useContext(ArtifactExportContext);
}
