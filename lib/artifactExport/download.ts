export function sanitizeExportFilename(title: string, ext: string): string {
  const safe =
    title
      .replace(/[^\w\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-")
      .slice(0, 48) || "artifact";
  const date = new Date().toISOString().slice(0, 10);
  const normalizedExt = ext.startsWith(".") ? ext.slice(1) : ext;
  return `${safe}-${date}.${normalizedExt}`;
}

export function downloadBlob(filename: string, blob: Blob): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function downloadText(
  title: string,
  content: string,
  ext: string,
  mimeType: string,
): void {
  downloadBlob(
    sanitizeExportFilename(title, ext),
    new Blob([content], { type: `${mimeType};charset=utf-8` }),
  );
}

export function dataUrlToBlob(dataUrl: string): Blob {
  const [header, base64] = dataUrl.split(",");
  const mime = header.match(/:(.*?);/)?.[1] ?? "image/png";
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new Blob([bytes], { type: mime });
}

export function downloadDataUrl(
  title: string,
  dataUrl: string,
  ext: "png" | "jpeg" | "svg",
): void {
  downloadBlob(sanitizeExportFilename(title, ext), dataUrlToBlob(dataUrl));
}
