/*
 * Pixel dimensions straight from an image's header bytes.
 *
 * The browser path reads dimensions with an <img> element, which the server has
 * no equivalent for. Only the four MIME types the asset pipeline accepts are
 * handled (see IMAGE_ASSET_MIME_TYPES) — enough to avoid pulling in an image
 * library for what is a few header reads.
 *
 * Dimensions matter beyond bookkeeping: getCanvasAssetBounds falls back to a 1:1
 * aspect when they are missing, so an asset without them lays out as a square.
 */

/** Width and height in pixels, or null when the header cannot be read. */
export function readImageDimensions(
  bytes: Uint8Array,
  mimeType: string,
): { width: number; height: number } | null {
  switch (mimeType) {
    case "image/png":
      return pngSize(bytes);
    case "image/gif":
      return gifSize(bytes);
    case "image/jpeg":
      return jpegSize(bytes);
    case "image/webp":
      return webpSize(bytes);
    default:
      return null;
  }
}

const u32be = (b: Uint8Array, i: number) =>
  ((b[i]! << 24) | (b[i + 1]! << 16) | (b[i + 2]! << 8) | b[i + 3]!) >>> 0;
const u16be = (b: Uint8Array, i: number) => (b[i]! << 8) | b[i + 1]!;
const u16le = (b: Uint8Array, i: number) => b[i]! | (b[i + 1]! << 8);
const u24le = (b: Uint8Array, i: number) =>
  b[i]! | (b[i + 1]! << 8) | (b[i + 2]! << 16);

/** 8-byte signature, then an IHDR chunk whose first two fields are the size. */
function pngSize(b: Uint8Array) {
  if (b.length < 24 || b[0] !== 0x89 || b[1] !== 0x50) return null;
  return { width: u32be(b, 16), height: u32be(b, 20) };
}

/** Logical screen descriptor sits right after the 6-byte "GIF89a" header. */
function gifSize(b: Uint8Array) {
  if (b.length < 10 || b[0] !== 0x47 || b[1] !== 0x49) return null;
  return { width: u16le(b, 6), height: u16le(b, 8) };
}

/** Walk the segment chain to the start-of-frame marker, which carries the size. */
function jpegSize(b: Uint8Array) {
  if (b.length < 4 || b[0] !== 0xff || b[1] !== 0xd8) return null;
  let i = 2;
  while (i + 9 < b.length) {
    if (b[i] !== 0xff) {
      i++;
      continue;
    }
    const marker = b[i + 1]!;
    // SOF0..SOF15 carry the frame size; C4/C8/CC are tables, not frames.
    if (
      marker >= 0xc0 &&
      marker <= 0xcf &&
      marker !== 0xc4 &&
      marker !== 0xc8 &&
      marker !== 0xcc
    ) {
      return { height: u16be(b, i + 5), width: u16be(b, i + 7) };
    }
    if (marker === 0xd8 || (marker >= 0xd0 && marker <= 0xd9)) {
      i += 2;
      continue;
    }
    const length = u16be(b, i + 2);
    if (length < 2) return null;
    i += 2 + length;
  }
  return null;
}

/** RIFF container with three payload flavours: lossy, lossless, extended. */
function webpSize(b: Uint8Array) {
  if (b.length < 30) return null;
  const tag = String.fromCharCode(b[12]!, b[13]!, b[14]!, b[15]!);
  if (tag === "VP8 ") {
    return { width: u16le(b, 26) & 0x3fff, height: u16le(b, 28) & 0x3fff };
  }
  if (tag === "VP8L") {
    const bits = u32be(b, 21);
    // 14-bit width and height, minus one, packed little-endian after the signature.
    const packed = b[21]! | (b[22]! << 8) | (b[23]! << 16) | (b[24]! << 24);
    void bits;
    return {
      width: (packed & 0x3fff) + 1,
      height: ((packed >> 14) & 0x3fff) + 1,
    };
  }
  if (tag === "VP8X") {
    return { width: u24le(b, 24) + 1, height: u24le(b, 27) + 1 };
  }
  return null;
}
