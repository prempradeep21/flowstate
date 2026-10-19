"use client";

import { useCallback, useEffect, useState } from "react";

/** Never shimmer forever over content whose load event went missing. */
const SETTLE_TIMEOUT_MS = 10_000;

/**
 * Tracks whether an <img> or <iframe> for `src` has finished loading, so a
 * skeleton can cover it until then. Errors also count as "loaded": the
 * element's own error state takes over instead of an endless shimmer. A new
 * `src` starts loading again; an image already in the browser cache is caught
 * by the ref on mount (its load event may have fired before React attached).
 */
export function useMediaLoaded(src: string | null | undefined) {
  const [settledSrc, setSettledSrc] = useState<string | null>(null);
  const key = src ?? null;
  const settle = useCallback(() => setSettledSrc(key), [key]);
  const imgRef = useCallback(
    (el: HTMLImageElement | null) => {
      if (el?.complete && el.naturalWidth > 0) setSettledSrc(key);
    },
    [key],
  );

  useEffect(() => {
    if (key === null) return;
    const timer = window.setTimeout(() => setSettledSrc(key), SETTLE_TIMEOUT_MS);
    return () => window.clearTimeout(timer);
  }, [key]);

  return {
    loaded: key !== null && settledSrc === key,
    onLoad: settle,
    onError: settle,
    imgRef,
  };
}
