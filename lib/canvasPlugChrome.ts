/** Shared Tailwind classes for canvas side connector plugs (artifacts, assets, skills, cards). */

export type CanvasPlugGroup = "artifact" | "asset" | "skill" | "card";

const PLUG_POINTER_BY_GROUP: Record<CanvasPlugGroup, string> = {
  artifact:
    "group-hover/artifact:[&_button]:pointer-events-auto group-data-[chrome-hover]/artifact:[&_button]:pointer-events-auto group-data-[chrome-reveal]/artifact:[&_button]:pointer-events-auto",
  asset:
    "group-hover/asset:[&_button]:pointer-events-auto group-data-[chrome-hover]/asset:[&_button]:pointer-events-auto group-data-[chrome-reveal]/asset:[&_button]:pointer-events-auto",
  skill:
    "group-hover/skill:[&_button]:pointer-events-auto group-data-[chrome-hover]/skill:[&_button]:pointer-events-auto group-data-[chrome-reveal]/skill:[&_button]:pointer-events-auto",
  card:
    "group-hover/card:[&_button]:pointer-events-auto group-data-[chrome-hover]/card:[&_button]:pointer-events-auto group-data-[chrome-reveal]/card:[&_button]:pointer-events-auto",
};

const PLUG_VISIBILITY_BY_GROUP: Record<CanvasPlugGroup, string> = {
  artifact:
    "group-hover/artifact:opacity-100 group-hover/artifact:duration-200 group-data-[chrome-hover]/artifact:opacity-100",
  asset:
    "group-hover/asset:opacity-100 group-hover/asset:duration-200 group-data-[chrome-hover]/asset:opacity-100",
  skill:
    "group-hover/skill:opacity-100 group-hover/skill:duration-200 group-data-[chrome-hover]/skill:opacity-100",
  card:
    "group-hover/card:opacity-100 group-hover/card:duration-200 group-data-[chrome-hover]/card:opacity-100",
};

/** Gate plug button hits to hover, selection (data-chrome-hover), or spawn reveal. */
export function canvasSidePlugPointerClass(group: CanvasPlugGroup): string {
  return PLUG_POINTER_BY_GROUP[group];
}

/** Left/right plug column: hidden at rest, visible on group hover or selection reveal. */
export function canvasSidePlugWrapperClass(
  side: "left" | "right",
  group: CanvasPlugGroup,
  options?: { alwaysVisible?: boolean },
): string {
  const pos = side === "left" ? "left-0" : "right-0";
  const visibility = options?.alwaysVisible
    ? "opacity-100"
    : `opacity-0 transition-opacity duration-500 ease-out ${PLUG_VISIBILITY_BY_GROUP[group]}`;
  const pointer = options?.alwaysVisible
    ? "[&_button]:pointer-events-auto"
    : PLUG_POINTER_BY_GROUP[group];
  return `pointer-events-none absolute inset-y-0 ${pos} z-30 ${visibility} ${pointer}`;
}
