/** Canvas background renderer — vanilla port of components/canvasBackgrounds. */

const BLOB_DEFS = [
  { r: 0.45, color: "#C8E6A0", dx: 0.08, dy: 0.05, phase: 0 },
  { r: 0.4, color: "#A8D4F5", dx: -0.06, dy: 0.07, phase: 1.2 },
  { r: 0.35, color: "#F5D4A8", dx: 0.05, dy: -0.06, phase: 2.4 },
  { r: 0.38, color: "#D4C8F5", dx: -0.04, dy: -0.05, phase: 3.6 },
];

let activeCleanup = null;
let vantaEffect = null;
let particlesInstance = null;
let ambientRaf = 0;
let neatRaf = 0;

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

function renderGradientGrid(container) {
  const wrap = document.createElement("div");
  wrap.className = "bg-layer bg-gradient-grid";
  wrap.innerHTML =
    '<div class="bg-grid-lines"></div><div class="bg-grid-glow"></div>';
  container.appendChild(wrap);
  activeCleanup = () => {};
}

function renderRisingSun(container) {
  const el = document.createElement("div");
  el.className = "bg-layer bg-rising-sun";
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
  const rects = [];
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
    rects.push(rect);
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

function renderNeatGradient(container, animate) {
  const canvas = document.createElement("canvas");
  canvas.className = "bg-layer bg-neat-canvas";
  container.appendChild(canvas);

  const ctx = canvas.getContext("2d");
  let w = 0;
  let h = 0;

  const resize = () => {
    w = container.clientWidth;
    h = container.clientHeight;
    canvas.width = w;
    canvas.height = h;
  };
  resize();

  const ro = new ResizeObserver(resize);
  ro.observe(container);

  const draw = (t) => {
    if (!ctx || w === 0 || h === 0) return;
    const g = ctx.createLinearGradient(0, 0, w, h);
    const phase = animate ? t * 0.00015 : 0;
    g.addColorStop(0, `hsl(${220 + Math.sin(phase) * 8}, 45%, ${12 + Math.sin(phase * 2) * 3}%)`);
    g.addColorStop(0.5, `hsl(${240 + Math.cos(phase) * 10}, 50%, ${18 + Math.cos(phase) * 4}%)`);
    g.addColorStop(1, `hsl(${260 + Math.sin(phase * 1.5) * 6}, 40%, ${10 + Math.sin(phase) * 2}%)`);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);

    const rg = ctx.createRadialGradient(
      w * 0.7,
      h * 0.3,
      0,
      w * 0.7,
      h * 0.3,
      w * 0.5,
    );
    rg.addColorStop(0, "rgba(80, 120, 255, 0.25)");
    rg.addColorStop(1, "transparent");
    ctx.fillStyle = rg;
    ctx.fillRect(0, 0, w, h);
  };

  if (animate) {
    const loop = (t) => {
      draw(t);
      neatRaf = requestAnimationFrame(loop);
    };
    neatRaf = requestAnimationFrame(loop);
  } else {
    draw(0);
  }

  activeCleanup = () => {
    cancelAnimationFrame(neatRaf);
    neatRaf = 0;
    ro.disconnect();
  };
}

async function loadScript(src) {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) {
      resolve();
      return;
    }
    const s = document.createElement("script");
    s.src = src;
    s.onload = resolve;
    s.onerror = reject;
    document.head.appendChild(s);
  });
}

async function renderSky(container) {
  const el = document.createElement("div");
  el.id = "vanta-sky";
  el.className = "bg-layer";
  container.appendChild(el);

  try {
    await loadScript("https://cdn.jsdelivr.net/npm/three@0.134.0/build/three.min.js");
    await loadScript("https://cdn.jsdelivr.net/npm/vanta@0.5.24/dist/vanta.clouds.min.js");
    if (window.VANTA && window.VANTA.CLOUDS) {
      vantaEffect = window.VANTA.CLOUDS({
        el,
        mouseControls: false,
        touchControls: false,
        gyroControls: false,
        minHeight: 200,
        minWidth: 200,
        skyColor: 0x0a1628,
        cloudColor: 0x1a3050,
        cloudShadowColor: 0x050a14,
        sunColor: 0x4060a0,
        sunGlareColor: 0x203060,
        sunlightColor: 0x304878,
        speed: 0.4,
      });
    }
  } catch {
    el.style.background = "linear-gradient(180deg, #0a1628 0%, #1a3050 50%, #2a4878 100%)";
  }

  activeCleanup = () => {
    if (vantaEffect) {
      vantaEffect.destroy();
      vantaEffect = null;
    }
  };
}

async function renderNetwork(container) {
  const el = document.createElement("div");
  el.id = "particles-network";
  el.className = "bg-layer";
  el.style.backgroundColor = "rgb(var(--canvas-bg))";
  container.appendChild(el);

  try {
    await loadScript("https://cdn.jsdelivr.net/npm/particles.js@2.0.0/particles.min.js");
    if (window.particlesJS) {
      window.particlesJS("particles-network", {
        particles: {
          number: { value: 60, density: { enable: true, value_area: 800 } },
          color: { value: "#8b8680" },
          shape: { type: "circle" },
          opacity: { value: 0.35, random: false },
          size: { value: 2, random: true },
          line_linked: {
            enable: true,
            distance: 140,
            color: "#5a5650",
            opacity: 0.25,
            width: 1,
          },
          move: {
            enable: true,
            speed: 0.8,
            direction: "none",
            random: true,
            out_mode: "out",
          },
        },
        interactivity: {
          detect_on: "canvas",
          events: { onhover: { enable: false }, onclick: { enable: false } },
        },
        retina_detect: true,
      });
      particlesInstance = true;
    }
  } catch {
    el.classList.add("bg-grid");
  }

  activeCleanup = () => {
    particlesInstance = null;
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
    case "grid":
      renderGrid(container);
      break;
    case "ambient-gradient":
      renderAmbient(container, animate);
      break;
    case "gradient-grid":
      renderGradientGrid(container);
      break;
    case "rising-sun":
      renderRisingSun(container);
      break;
    case "neat-gradient":
      renderNeatGradient(container, animate);
      break;
    case "sky":
      await renderSky(container);
      break;
    case "network":
      await renderNetwork(container);
      break;
    default:
      renderGrid(container);
  }
}

export function isBackgroundAllowedForTheme(styleId, theme) {
  if (theme === "light") {
    return styleId === "grid" || styleId === "ambient-gradient";
  }
  return true;
}

export function resolveBackgroundForTheme(styleId, theme) {
  return isBackgroundAllowedForTheme(styleId, theme) ? styleId : "grid";
}
