const IMAGE_EXT_RE = /\.(png|jpe?g|gif|webp|svg|bmp|avif)(\?|#|$)/i;

export function isImageMime(type: string): boolean {
  return type.startsWith("image/");
}

export function isImageUrl(url: string): boolean {
  const trimmed = url.trim();
  if (!trimmed) return false;
  if (trimmed.startsWith("data:image/")) return true;
  try {
    const parsed = new URL(trimmed);
    return IMAGE_EXT_RE.test(parsed.pathname);
  } catch {
    return false;
  }
}

export function getImageFilesFromDataTransfer(data: DataTransfer | null): File[] {
  if (!data) return [];
  const files: File[] = [];

  if (data.files?.length) {
    for (const file of Array.from(data.files)) {
      if (isImageMime(file.type)) files.push(file);
    }
  }

  if (!files.length && data.items?.length) {
    for (const item of Array.from(data.items)) {
      if (item.kind !== "file" || !isImageMime(item.type)) continue;
      const file = item.getAsFile();
      if (file) files.push(file);
    }
  }

  return files;
}

export function isExternalImageDrag(types: readonly string[]): boolean {
  if (types.includes("Files")) return true;
  if (types.includes("text/uri-list")) return true;
  if (types.includes("text/html")) return true;
  return false;
}

function firstUriFromList(raw: string): string | null {
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    return trimmed;
  }
  return null;
}

export function parseImageUrlFromDataTransfer(
  data: DataTransfer,
): string | null {
  const uri = firstUriFromList(data.getData("text/uri-list"));
  if (uri && isImageUrl(uri)) return uri;

  const html = data.getData("text/html");
  const imgMatch = html.match(/<img[^>]+src=["']([^"']+)["']/i);
  if (imgMatch?.[1] && isImageUrl(imgMatch[1])) return imgMatch[1];

  const plain = data.getData("text/plain").trim();
  if (plain && isImageUrl(plain)) return plain;

  return null;
}

export async function fetchImageUrlAsFile(url: string): Promise<File | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const blob = await res.blob();
    if (!isImageMime(blob.type)) return null;
    const ext = blob.type.split("/")[1]?.split("+")[0] || "png";
    const name = `dropped-image-${Date.now()}.${ext}`;
    return new File([blob], name, { type: blob.type });
  } catch {
    return null;
  }
}

export async function resolveImageFileFromDataTransfer(
  data: DataTransfer,
): Promise<File | null> {
  const files = getImageFilesFromDataTransfer(data);
  if (files.length > 0) return files[0]!;

  const url = parseImageUrlFromDataTransfer(data);
  if (!url) return null;
  return fetchImageUrlAsFile(url);
}
