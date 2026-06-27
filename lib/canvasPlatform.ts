/** Client-safe macOS detection for canvas input routing. */
export function isMacOS(): boolean {
  if (typeof navigator === "undefined") return false;
  const platform = navigator.platform ?? "";
  const ua = navigator.userAgent ?? "";
  return /Mac|iPhone|iPad|iPod/i.test(platform) || /Mac OS X/i.test(ua);
}
