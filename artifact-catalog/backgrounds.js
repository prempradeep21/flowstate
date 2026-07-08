/** Canvas background renderer — vanilla port of components/canvasBackgrounds. */

const BLOB_DEFS = [
  { r: 0.45, color: "#C8E6A0", dx: 0.08, dy: 0.05, phase: 0 },
  { r: 0.4, color: "#A8D4F5", dx: -0.06, dy: 0.07, phase: 1.2 },
  { r: 0.35, color: "#F5D4A8", dx: 0.05, dy: -0.06, phase: 2.4 },
  { r: 0.38, color: "#D4C8F5", dx: -0.04, dy: -0.05, phase: 3.6 },
];

let activeCleanup = null;
let ambientRaf = 0;

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function clearContainer(container) {
  if (activeCleanup) {
    activeCleanup();
    activeCleanup = null;
  }
  container.innerHTML = "";
}

function renderGrid(container) {
  const el = document.createElement("div");
  el.className = "bg-layer bg-grid";
  container.appendChild(el);
  activeCleanup = () => {};
}

function renderAmbient(container, animate) {
  const uid = `amb-${Date.now()}`;
  const blurId = `${uid}-blur`;
  const grainId = `${uid}-grain`;

  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("class", "bg-layer bg-ambient-svg");
  svg.setAttribute("viewBox", "0 0 100 100");
  svg.setAttribute("preserveAspectRatio", "none");

  const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
  defs.innerHTML = `
    <filter id="${blurId}" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="8" />
    </filter>
    <filter id="${grainId}" x="0" y="0" width="100%" height="100%">
      <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="4" stitchTiles="stitch" />
      <feColorMatrix type="saturate" values="0" />
    </filter>
  `;
  svg.appendChild(defs);

  const base = document.createElementNS("http://www.w3.org/2000/svg", "rect");
  base.setAttribute("width", "100");
  base.setAttribute("height", "100");
  base.setAttribute("class", "base");
  svg.appendChild(base);

  const gBlur = document.createElementNS("http://www.w3.org/2000/svg", "g");
  gBlur.setAttribute("filter", `url(#${blurId})`);
  svg.appendChild(gBlur);

  const gradients = [];
  for (let i = 0; i < BLOB_DEFS.length; i++) {
    const grad = document.createElementNS("http://www.w3.org/2000/svg", "radialGradient");
    grad.id = `${blurId}-grad-${i}`;
    grad.innerHTML = `
      <stop offset="0%" stop-color="${BLOB_DEFS[i].color}" stop-opacity="0.55" />
      <stop offset="100%" stop-color="${BLOB_DEFS[i].color}" stop-opacity="0" />
    `;
    defs.appendChild(grad);
    gradients.push(grad);

    const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    rect.setAttribute("width", "100");
    rect.setAttribute("height", "100");
    rect.setAttribute("fill", `url(#${blurId}-grad-${i})`);
    gBlur.appendChild(rect);
  }

  const grain = document.createElementNS("http://www.w3.org/2000/svg", "rect");
  grain.setAttribute("width", "100");
  grain.setAttribute("height", "100");
  grain.setAttribute("filter", `url(#${grainId})`);
  grain.setAttribute("opacity", "0.04");
  grain.style.mixBlendMode = "multiply";
  svg.appendChild(grain);

  container.appendChild(svg);

  if (!animate) {
    const positions = BLOB_DEFS.map((b, i) => ({
      cx: 0.3 + (i % 2) * 0.35,
      cy: 0.25 + Math.floor(i / 2) * 0.35,
    }));
    positions.forEach((p, i) => {
      gradients[i].setAttribute("cx", `${p.cx * 100}%`);
      gradients[i].setAttribute("cy", `${p.cy * 100}%`);
      gradients[i].setAttribute("r", `${BLOB_DEFS[i].r * 100}%`);
    });
    activeCleanup = () => {};
    return;
  }

  const start = performance.now();
  const tick = (now) => {
    const t = (now - start) / 1000;
    BLOB_DEFS.forEach((b, i) => {
      const cx =
        0.5 + Math.sin(t * 0.15 + b.phase) * b.dx + (i % 2 === 0 ? -0.15 : 0.15);
      const cy =
        0.5 + Math.cos(t * 0.12 + b.phase) * b.dy + (i < 2 ? -0.1 : 0.1);
      gradients[i].setAttribute("cx", `${cx * 100}%`);
      gradients[i].setAttribute("cy", `${cy * 100}%`);
      gradients[i].setAttribute("r", `${b.r * 100}%`);
    });
    ambientRaf = requestAnimationFrame(tick);
  };
  ambientRaf = requestAnimationFrame(tick);

  activeCleanup = () => {
    cancelAnimationFrame(ambientRaf);
    ambientRaf = 0;
  };
}

/**
 * @param {HTMLElement} container
 * @param {string} styleId
 */
export async function setBackground(container, styleId) {
  clearContainer(container);
  const animate = !prefersReducedMotion();

  switch (styleId) {
    case "ambient-gradient":
      renderAmbient(container, animate);
      break;
    case "grid":
    default:
      renderGrid(container);
      break;
  }
}

export function isBackgroundAllowedForTheme(styleId, _theme) {
  return styleId === "grid" || styleId === "ambient-gradient";
}

export function resolveBackgroundForTheme(styleId, theme) {
  return isBackgroundAllowedForTheme(styleId, theme) ? styleId : "grid";
}
