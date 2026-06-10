import type { MediaItem } from "@/lib/github/types";

const MIN_DISPLAY_WIDTH = 720;

const SMALL_ASSET_RE =
  /shields\.io|badge|img\.shields|travis-ci|codecov|coveralls|dependabot|github\.com\/.*\/badge|\.svg$/i;

/** Skip known badges and tiny assets without probing. */
export function isLikelySmallAsset(url: string): boolean {
  return SMALL_ASSET_RE.test(url);
}

/** Read width/height from PNG, GIF, or JPEG buffer headers. */
export function parseImageDimensions(buf: Uint8Array): { width: number; height: number } | null {
  if (buf.length < 10) return null;

  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47 && buf.length >= 24) {
    const width = (buf[16]! << 24) | (buf[17]! << 16) | (buf[18]! << 8) | buf[19]!;
    const height = (buf[20]! << 24) | (buf[21]! << 16) | (buf[22]! << 8) | buf[23]!;
    return width > 0 && height > 0 ? { width, height } : null;
  }

  if (buf[0] === 0x47 && buf[1] === 0x49 && buf[2] === 0x46 && buf.length >= 10) {
    const width = buf[6]! | (buf[7]! << 8);
    const height = buf[8]! | (buf[9]! << 8);
    return width > 0 && height > 0 ? { width, height } : null;
  }

  if (buf[0] === 0xff && buf[1] === 0xd8) {
    let i = 2;
    while (i < buf.length - 8) {
      if (buf[i] !== 0xff) {
        i += 1;
        continue;
      }
      const marker = buf[i + 1];
      if (marker === 0xc0 || marker === 0xc2 || marker === 0xc1) {
        const height = (buf[i + 5]! << 8) | buf[i + 6]!;
        const width = (buf[i + 7]! << 8) | buf[i + 8]!;
        return width > 0 && height > 0 ? { width, height } : null;
      }
      const len = (buf[i + 2]! << 8) | buf[i + 3]!;
      i += 2 + len;
    }
  }

  return null;
}

export async function probeImageWidth(url: string): Promise<number | null> {
  if (isLikelySmallAsset(url)) return null;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { Range: "bytes=0-65535" },
      next: { revalidate: 3600 },
    });
    clearTimeout(timeout);
    if (!res.ok) return null;
    const buf = new Uint8Array(await res.arrayBuffer());
    const dims = parseImageDimensions(buf);
    return dims?.width ?? null;
  } catch {
    return null;
  }
}

/** Keep only images wider than 720px; videos excluded (thumbnails are too small). */
export async function filterDisplayableMedia(items: MediaItem[]): Promise<MediaItem[]> {
  const images = items.filter((i) => i.kind === "image");
  const probed = await Promise.all(
    images.map(async (item) => {
      const width = await probeImageWidth(item.url);
      return width && width > MIN_DISPLAY_WIDTH ? { ...item, width } : null;
    }),
  );
  return probed.filter((i): i is MediaItem & { width: number } => i !== null);
}

export const MEDIA_MIN_DISPLAY_WIDTH = MIN_DISPLAY_WIDTH;
