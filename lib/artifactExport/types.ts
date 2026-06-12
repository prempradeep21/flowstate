import type { MutableRefObject } from "react";
import type { ArtifactKind, ArtifactPayload } from "@/lib/artifactTypes";
import type { UIChartType } from "@/lib/chartTypes";

export type ExportImageFormat = "png" | "jpeg";

export interface ChartExportMeta {
  styleId: string;
  uiChartType: UIChartType;
  isDark: boolean;
}

export interface ChartExportHandle {
  getPngDataUrl: (pixelRatio?: number) => Promise<string | null>;
}

export interface ExportContext {
  kind: ArtifactKind;
  payload: ArtifactPayload;
  title: string;
  artifactId?: string;
  exportRootEl: HTMLElement | null;
  chartHandle: ChartExportHandle | null;
  chartMeta: ChartExportMeta | null;
  codeActiveContent: string | null;
  codeActivePath: string | null;
  isDark: boolean;
}

export type ExportActionKind =
  | "image-png"
  | "image-jpeg"
  | "json"
  | "csv"
  | "xls"
  | "xlsx"
  | "markdown"
  | "html-file"
  | "html-embed"
  | "ics"
  | "geojson"
  | "text"
  | "download-url"
  | "google-sheets"
  | "code-file"
  | "code-zip"
  | "svg";

export interface ExportMenuItem {
  id: string;
  label: string;
  kind: ExportActionKind;
  section?: "image" | "data" | "google" | "download";
  disabled?: boolean;
  hint?: string;
}

export type CodeVariantId =
  | "json"
  | "html"
  | "react"
  | "markdown"
  | "csv"
  | "embed"
  | "geojson"
  | "ics";

export interface CodeVariant {
  id: CodeVariantId;
  label: string;
}

export interface ExportHandlesRef {
  exportRootRef: MutableRefObject<HTMLElement | null>;
  chartHandleRef: MutableRefObject<ChartExportHandle | null>;
  chartMetaRef: MutableRefObject<ChartExportMeta | null>;
  codeActiveContentRef: MutableRefObject<string | null>;
  codeActivePathRef: MutableRefObject<string | null>;
}
