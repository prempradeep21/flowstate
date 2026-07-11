/**
 * Inline boot script (rendered as the first element of <body> in
 * app/layout.tsx) that re-applies the persisted theme stylesheet before the
 * app paints, so themed reloads don't flash factory colors. Kept dependency-
 * free and dumb on purpose: the CSS text is precomputed at save time by
 * themeStorage.persistTheme.
 *
 * It also seeds html[data-theme] from the persisted mode; on canvas pages the
 * per-canvas ThemeApplier takes over after hydration.
 */
export const THEME_NO_FLASH_SCRIPT = `(function(){try{var raw=localStorage.getItem("flowstate:theme:v1");if(!raw)return;var d=JSON.parse(raw);if(!d||d.v!==1)return;if(d.mode==="dark"){document.documentElement.dataset.theme="dark"}if(d.css){var s=document.createElement("style");s.id="flowstate-theme-overrides";s.textContent=d.css;document.head.appendChild(s)}}catch(e){}})();`;
