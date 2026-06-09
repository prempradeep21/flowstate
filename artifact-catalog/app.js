import {
  FLOWSTATE_ARTIFACTS,
  INPUT_ARTIFACTS,
  CUSTOM_UI_EXAMPLES,
  THEME_OPTIONS,
  BACKGROUND_OPTIONS,
  LIGHT_THEME_BACKGROUNDS,
  BODY_FONT_OPTIONS,
  DISPLAY_FONT_OPTIONS,
} from "./artifacts.js";
import {
  setBackground,
  resolveBackgroundForTheme,
  isBackgroundAllowedForTheme,
} from "./backgrounds.js";

const STORAGE_KEYS = {
  theme: "artifact-catalog-theme",
  bg: "artifact-catalog-bg",
  bodyFont: "artifact-catalog-body-font",
  displayFont: "artifact-catalog-display-font",
};

const state = {
  theme: localStorage.getItem(STORAGE_KEYS.theme) || "light",
  background: localStorage.getItem(STORAGE_KEYS.bg) || "grid",
  bodyFont: localStorage.getItem(STORAGE_KEYS.bodyFont) || "parkinsans",
  displayFont: localStorage.getItem(STORAGE_KEYS.displayFont) || "denton",
};

function persist() {
  localStorage.setItem(STORAGE_KEYS.theme, state.theme);
  localStorage.setItem(STORAGE_KEYS.bg, state.background);
  localStorage.setItem(STORAGE_KEYS.bodyFont, state.bodyFont);
  localStorage.setItem(STORAGE_KEYS.displayFont, state.displayFont);
}

function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
}

function applyFonts(bodyId, displayId) {
  const body = BODY_FONT_OPTIONS.find((o) => o.id === bodyId) || BODY_FONT_OPTIONS[4];
  const display =
    DISPLAY_FONT_OPTIONS.find((o) => o.id === displayId) || DISPLAY_FONT_OPTIONS[0];
  document.documentElement.style.setProperty("--font-body", body.family);
  document.documentElement.style.setProperty("--font-display", display.family);
}

function renderArtifactCard(item, { showPlaceholder = false } = {}) {
  const card = document.createElement("article");
  card.className = "artifact-card";
  card.dataset.id = item.id;

  const nameCol = document.createElement("div");
  nameCol.className = "artifact-name";
  nameCol.textContent = item.name;

  const body = document.createElement("div");
  body.className = "artifact-body";

  const title = document.createElement("h4");
  title.className = "artifact-title";
  title.textContent = item.title;
  if (showPlaceholder && item.placeholder) {
    const badge = document.createElement("span");
    badge.className = "badge-soon";
    badge.textContent = "Coming soon";
    title.appendChild(badge);
  }

  const desc = document.createElement("p");
  desc.className = "artifact-desc";
  desc.textContent = item.description;

  const chips = document.createElement("div");
  chips.className = "chip-row";
  for (const label of item.chips) {
    const chip = document.createElement("span");
    chip.className = "chip";
    chip.textContent = label;
    chips.appendChild(chip);
  }

  body.appendChild(title);
  body.appendChild(desc);
  body.appendChild(chips);

  if (showPlaceholder && item.placeholder) {
    const box = document.createElement("div");
    box.className = "placeholder-box";
    box.setAttribute("aria-hidden", "true");
    const label = document.createElement("span");
    label.textContent = "Widget preview";
    box.appendChild(label);
    body.appendChild(box);
  }

  card.appendChild(nameCol);
  card.appendChild(body);
  return card;
}

function renderGrid(containerId, items, options) {
  const grid = document.getElementById(containerId);
  grid.innerHTML = "";
  for (const item of items) {
    grid.appendChild(renderArtifactCard(item, options));
  }
}

function renderThemeOptions() {
  const container = document.getElementById("theme-options");
  container.innerHTML = "";
  for (const opt of THEME_OPTIONS) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "pill";
    btn.textContent = opt.label;
    btn.title = opt.description;
    btn.setAttribute("aria-pressed", String(state.theme === opt.id));
    btn.dataset.id = opt.id;
    btn.addEventListener("click", () => {
      state.theme = opt.id;
      state.background = resolveBackgroundForTheme(state.background, state.theme);
      persist();
      applyTheme(state.theme);
      renderThemeOptions();
      renderBackgroundOptions();
      applyBackground();
    });
    container.appendChild(btn);
  }
}

function renderBackgroundOptions() {
  const container = document.getElementById("bg-options");
  container.innerHTML = "";
  for (const opt of BACKGROUND_OPTIONS) {
    if (!isBackgroundAllowedForTheme(opt.id, state.theme)) continue;
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "pill";
    btn.textContent = opt.label;
    btn.title = opt.description;
    btn.setAttribute("aria-pressed", String(state.background === opt.id));
    btn.dataset.id = opt.id;
    btn.addEventListener("click", () => {
      state.background = opt.id;
      persist();
      renderBackgroundOptions();
      applyBackground();
    });
    container.appendChild(btn);
  }
}

function renderFontSelects() {
  const bodySelect = document.getElementById("body-font");
  const displaySelect = document.getElementById("display-font");

  bodySelect.innerHTML = "";
  for (const opt of BODY_FONT_OPTIONS) {
    const el = document.createElement("option");
    el.value = opt.id;
    el.textContent = opt.label;
    el.style.fontFamily = opt.family;
    bodySelect.appendChild(el);
  }
  bodySelect.value = state.bodyFont;

  displaySelect.innerHTML = "";
  for (const opt of DISPLAY_FONT_OPTIONS) {
    const el = document.createElement("option");
    el.value = opt.id;
    el.textContent = opt.label;
    el.style.fontFamily = opt.family;
    displaySelect.appendChild(el);
  }
  displaySelect.value = state.displayFont;

  bodySelect.addEventListener("change", () => {
    state.bodyFont = bodySelect.value;
    persist();
    applyFonts(state.bodyFont, state.displayFont);
  });

  displaySelect.addEventListener("change", () => {
    state.displayFont = displaySelect.value;
    persist();
    applyFonts(state.bodyFont, state.displayFont);
  });
}

async function applyBackground() {
  const container = document.getElementById("canvas-bg");
  await setBackground(container, state.background);
}

function init() {
  if (!isBackgroundAllowedForTheme(state.background, state.theme)) {
    state.background = LIGHT_THEME_BACKGROUNDS.includes(state.background)
      ? state.background
      : "grid";
  }
  state.background = resolveBackgroundForTheme(state.background, state.theme);

  applyTheme(state.theme);
  applyFonts(state.bodyFont, state.displayFont);

  renderThemeOptions();
  renderBackgroundOptions();
  renderFontSelects();

  renderGrid("flowstate-grid", FLOWSTATE_ARTIFACTS);
  renderGrid("input-grid", INPUT_ARTIFACTS);
  renderGrid("custom-grid", CUSTOM_UI_EXAMPLES, { showPlaceholder: true });

  applyBackground();
}

init();
