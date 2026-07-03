import type { ReactNode } from "react";
import {
  CodeFileIcon,
  CopyIcon,
  DocumentIcon,
  DownloadIcon,
  ImageIcon,
  ShareIcon,
} from "@/components/MenuIcons";
import type { ExportMenuItem } from "@/lib/artifactExport/types";

export function exportMenuItemIcon(item: ExportMenuItem): ReactNode {
  if (item.section === "image" || item.kind === "image-png" || item.kind === "image-jpeg") {
    return <ImageIcon />;
  }
  if (item.section === "google" || item.kind === "google-sheets") {
    return <ShareIcon />;
  }
  if (item.section === "download" || item.kind === "code-file" || item.kind === "download-url") {
    return <DownloadIcon />;
  }
  if (item.kind === "svg") {
    return <ImageIcon />;
  }
  return <DocumentIcon />;
}

export function copyCodeMenuIcon(): ReactNode {
  return <CopyIcon />;
}

export function copyVariantMenuIcon(): ReactNode {
  return <CodeFileIcon />;
}
