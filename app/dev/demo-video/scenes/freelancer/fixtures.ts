import type { ArtifactPayload } from "@/lib/artifactTypes";
import type { CanvasAsset, CanvasTextLabel, Thread } from "@/lib/store";
import {
  createSessionArtifactFromPayload,
  type SessionArtifact,
} from "@/lib/sessionArtifacts";

/**
 * Fixtures for the "freelance OS" demo scene (~34.5s).
 * Sourced from the user's real "⭐ Freelance project canvas" (Supabase
 * 39183c72-30ed-4964-ad6a-b1c385dd9b52): the Openhouse client story, the
 * project timeline (Kick off → Delivery), the cadence sticky note, the
 * THB ↔ INR converter, the Thailand/India time-zone clocks and the invoice
 * generator. Deterministic edits are noted inline: the clock is frozen to a
 * fixed instant, the converter is pre-filled with the milestone quote, and
 * the invoice is seeded with the discovery-phase line items (₹, light theme).
 * Media localized to /demo-assets. Liquid Glass over ambient gradient.
 */

/* ------------------------------- threads ------------------------------- */

export const THREAD_TL = "fl_thread_tl";
export const THREAD_TODO = "fl_thread_todo";
export const THREAD_CONV = "fl_thread_conv";
export const THREAD_TZ = "fl_thread_tz";
export const THREAD_INV = "fl_thread_inv";

export const FL_THREADS: Record<string, Thread> = {
  [THREAD_TL]: { id: THREAD_TL, accentColour: "#6B4EFF" },
  [THREAD_TODO]: { id: THREAD_TODO, accentColour: "#6FCF97" },
  [THREAD_CONV]: { id: THREAD_CONV, accentColour: "#F2994A" },
  [THREAD_TZ]: { id: THREAD_TZ, accentColour: "#56CCF2" },
  [THREAD_INV]: { id: THREAD_INV, accentColour: "#F2C94C" },
};

/* ------------------------------ cursor cast ---------------------------- */

/** Prem — the freelancer (does the asks). */
export const CURSOR_PREM = { name: "Prem", color: "#64B5F6" };
/** Ananya — the client at Openhouse (drops the files, asks for the clock). */
export const CURSOR_ANANYA = { name: "Ananya", color: "#F06292" };

/* ------------------------------- cards --------------------------------- */

export const CARD_TL_Q = "fl_q_tl";
export const CARD_TODO_Q = "fl_q_todo";
export const CARD_CONV_Q = "fl_q_conv";
export const CARD_TZ_Q = "fl_q_tz";
export const CARD_INV_Q = "fl_q_inv";

/* Question copy is load-bearing (lib/artifactIntent.ts):
 * "milestones" ⇒ timeline · "task list" ⇒ todo · "widget"/"clock"/"form" ⇒
 * custom. Verified against resolvePrimaryArtifactKind — see the scene's
 * scratch vitest in the build notes. */
export const Q_TL = "Turn this brief into a project plan with milestones";
export const Q_TODO = "Break the design phase into a task list I can check off";
export const Q_CONV =
  "Make us a THB to INR converter widget — I quote in baht, Openhouse pays in rupees";
export const Q_TZ = "Add a clock widget with Bangkok and Bengaluru time";
export const Q_INV = "Draft an invoice form for the discovery phase — billed in rupees";

export const A_TL =
  "Here's your project plan — six milestones from kick-off on May 4 to delivery on June 22, with discovery, scoping, design and review in between.";
export const A_TODO =
  "Five tasks cover the design phase — wireframes through dev handoff, all due inside the May 25 – June 8 window.";
export const A_CONV =
  "Done — a THB ↔ INR converter pinned at 1 ฿ ≈ 2.47 ₹, pre-set with your ฿25,000 discovery quote.";
export const A_TZ =
  "A side-by-side clock for Bangkok and Bengaluru — Prem runs 1½ hours ahead of the Openhouse office.";
export const A_INV =
  "Invoice drafted for the discovery phase — three line items, ₹61,750 total, ready to export as a PDF.";

/* ------------------------------- world layout -------------------------- */
/* Four districts left → right in beat order: the brief (inputs) · the plan
 * (timeline + tasks) · the tools (converter + clocks) · getting paid
 * (invoice). Camera pans across, then zooms out to the wall. */

export const POS = {
  srcNda: { x: 40, y: 0 },
  srcBrief: { x: 580, y: -30 },
  srcFigma: { x: 30, y: 470 },
  srcSite: { x: 600, y: 450 },
  srcImg: { x: 1150, y: -10 },
  srcSticky: { x: 1230, y: 470 },

  qTl: { x: 1880, y: 30 },
  artTl: { x: 2400, y: 10 },
  qTodo: { x: 1880, y: 620 },
  artTodo: { x: 2400, y: 600 },

  qConv: { x: 5110, y: 20 },
  artConv: { x: 5650, y: -20 },
  qTz: { x: 5110, y: 700 },
  artTz: { x: 5650, y: 720 },

  qInv: { x: 6290, y: 30 },
  artInv: { x: 6830, y: -30 },
} as const;

/** Pinned node sizes. Timeline narrowed from the 1920 default so the wall
 *  stays compact; customs sized to their content so nothing scrolls. */
export const SIZES = {
  mdAsset: { w: 480, h: 360 },
  website: { w: 520, h: 400 },
  images: { w: 520, h: 400 },
  sticky: { w: 240, h: 248 },
  tl: { w: 2560, h: 480 },
  todo: { w: 520, h: 440 },
  conv: { w: 480, h: 700 },
  tz: { w: 560, h: 300 },
  inv: { w: 680, h: 880 },
} as const;

/* ----------------------------- text labels ----------------------------- */

export interface DemoLabel extends CanvasTextLabel {
  /** Which beat reveals it (0 = with the pile-up, 1..3 = with each district). */
  revealStep: number;
}

export const FL_LABELS: DemoLabel[] = [
  { id: "fl_lbl_client", text: "Openhouse — parent app redesign", fontSize: 38, position: { x: 44, y: -142 }, revealStep: 0 },
  { id: "fl_lbl_window", text: "May – Jun 2026", fontSize: 24, position: { x: 48, y: -84 }, revealStep: 0 },
  { id: "fl_lbl_plan", text: "The plan", fontSize: 34, position: { x: 1884, y: -96 }, revealStep: 1 },
  { id: "fl_lbl_tools", text: "The tools", fontSize: 34, position: { x: 5114, y: -110 }, revealStep: 2 },
  { id: "fl_lbl_paid", text: "Getting paid", fontSize: 34, position: { x: 6294, y: -122 }, revealStep: 3 },
];

/* ------------------------------- assets -------------------------------- */
/* Both documents render via TextBasedPreview (.md) — the canvas's real NDA
 * was a PDF, which paints blank in headless chromium. */

export const ASSET_NDA = "fl_asset_nda";
export const ASSET_BRIEF = "fl_asset_brief";
export const NODE_NDA = "fl_node_nda";
export const NODE_BRIEF = "fl_node_brief";

export const FL_CANVAS_ASSETS: Record<string, CanvasAsset> = {
  [ASSET_NDA]: {
    id: ASSET_NDA,
    canvasId: "freelancer",
    ownerId: "freelancer",
    name: "Openhouse_Freelancer_NDA.md",
    mimeType: "text/markdown",
    sizeBytes: 2048,
    storagePath: "/demo-assets/freelance-nda.md",
    publicUrl: "/demo-assets/freelance-nda.md",
    kind: "document",
    createdAt: 1700000000000,
  },
  [ASSET_BRIEF]: {
    id: ASSET_BRIEF,
    canvasId: "freelancer",
    ownerId: "freelancer",
    name: "Openhouse_Design_Brief.md",
    mimeType: "text/markdown",
    sizeBytes: 2048,
    storagePath: "/demo-assets/freelance-brief.md",
    publicUrl: "/demo-assets/freelance-brief.md",
    kind: "document",
    createdAt: 1700000000000,
  },
};

/* ------------------------------ artifacts ------------------------------ */

export const ART_FIGMA = "fl_art_figma";
export const ART_SITE = "fl_art_site";
export const ART_IMG = "fl_art_img";
export const ART_STICKY = "fl_art_sticky";
export const ART_TL = "fl_art_tl";
export const ART_TODO = "fl_art_todo";
export const ART_CONV = "fl_art_conv";
export const ART_TZ = "fl_art_tz";
export const ART_INV = "fl_art_inv";

export const ANODE_FIGMA = "fl_anode_figma";
export const ANODE_SITE = "fl_anode_site";
export const ANODE_IMG = "fl_anode_img";
export const ANODE_STICKY = "fl_anode_sticky";
export const ANODE_TL = "fl_anode_tl";
export const ANODE_TODO = "fl_anode_todo";
export const ANODE_CONV = "fl_anode_conv";
export const ANODE_TZ = "fl_anode_tz";
export const ANODE_INV = "fl_anode_inv";

/** The canvas's real Figma reference (Android UI Kit). Re-kinded from
 *  `embed` to a static website card — the live Figma iframe is
 *  nondeterministic offline. Cover art localized from the community page. */
const figmaPayload = {
  type: "website",
  title: "Android UI Kit — Figma",
  data: {
    url: "https://www.figma.com/design/rAMTMCwtw2tPXbriUMZqEd/Android-UI-Kit--Community-?node-id=0-1",
    title: "Android UI Kit — Figma",
    domainLabel: "Figma",
    faviconUrl: "/demo-assets/freelance-figma-favicon.png",
    previewImageUrl: "/demo-assets/freelance-figma-preview.png",
    embeddable: false,
  },
} satisfies ArtifactPayload;

/** Verbatim from the canvas ("Openhouse · Your Child"); media localized,
 *  embeddable forced off for the deterministic static preview. */
const sitePayload = {
  type: "website",
  title: "Openhouse · Your Child",
  data: {
    url: "https://openhouse.school/",
    title: "Openhouse · Your Child",
    domainLabel: "Openhouse",
    faviconUrl: "/demo-assets/freelance-openhouse-favicon.png",
    previewImageUrl: "/demo-assets/freelance-openhouse-preview.png",
    embeddable: false,
  },
} satisfies ArtifactPayload;

/** Verbatim from the canvas (youtube XpSw0s3Kr3A, verified via oembed);
 *  thumb localized. */
const IMG_TITLE = "Introducing Nothing OS 4.0";
const imgPayload = {
  type: "images",
  title: IMG_TITLE,
  data: {
    items: [
      {
        kind: "youtube",
        url: "https://www.youtube.com/watch?v=XpSw0s3Kr3A",
        thumb: "/demo-assets/freelance-nothing-os4.jpg",
        title: IMG_TITLE,
      },
    ],
  },
} satisfies ArtifactPayload;

/** Verbatim from the canvas (art_mqe81vbv_p8jp7, latest version). */
const stickyPayload = {
  type: "stickynote",
  title: "Sticky note",
  data: {
    text: "Set up a cadence with Openhouse every two weeks",
    colorId: "haiti",
  },
} satisfies ArtifactPayload;

/** Verbatim from the canvas (art_mqe9sp04_qf82o, latest version) minus the
 *  stray "Sample milestone" placeholder event; range trimmed to June 30 so
 *  the six real milestones fill the node. */
const timelinePayload = {
  type: "timeline",
  title: "Project timeline",
  description: "Freelance project stages by week",
  data: {
    // Day scale renders at a fixed 48px/day centered on the events' midpoint
    // (timelineDefaultCenterMs) — the 2560px node width in SIZES is what
    // keeps Kick off and Delivery both inside the window.
    scale: "day",
    rangeStart: "2026-05-01T00:00:00.000Z",
    rangeEnd: "2026-06-30T23:59:59.999Z",
    events: [
      { id: "evt_kickoff", at: "2026-05-04T09:00:00.000Z", label: "Kick off", highlight: true },
      { id: "evt_discovery", at: "2026-05-11T09:00:00.000Z", label: "Discovery" },
      { id: "evt_scope", at: "2026-05-18T09:00:00.000Z", label: "Scope alignment" },
      { id: "evt_design", at: "2026-05-25T09:00:00.000Z", label: "Design" },
      { id: "evt_review", at: "2026-06-08T09:00:00.000Z", label: "Review" },
      { id: "evt_delivery", at: "2026-06-22T09:00:00.000Z", label: "Delivery", highlight: true },
    ],
  },
} satisfies ArtifactPayload;

/** Authored in the product shape (the canvas's todo was an empty
 *  placeholder). Due dates sit inside the brief's Design → Review window. */
const todoPayload = {
  type: "todo",
  title: "Design phase — task list",
  data: {
    items: [
      { id: "fl_td_1", label: "Wireframes — parent onboarding flow", checked: true, dueDate: "2026-05-27", priority: "high" },
      { id: "fl_td_2", label: "Design system tokens & type scale", checked: true, dueDate: "2026-05-29" },
      { id: "fl_td_3", label: "Hi-fi screens — class discovery & booking", checked: false, dueDate: "2026-06-02", priority: "high" },
      { id: "fl_td_4", label: "Prototype for parent testing", checked: false, dueDate: "2026-06-04" },
      { id: "fl_td_5", label: "Handoff specs to Openhouse dev team", checked: false, dueDate: "2026-06-08" },
    ],
  },
} satisfies ArtifactPayload;

/* --- THB ↔ INR converter — verbatim from art_mqsgwcgx_qd3tc. Two edits:
 * template literals rewritten as string concat (fixture-file escaping), and
 * a pre-fill of the ฿25,000 discovery quote appended so the demo frame
 * shows a real conversion. --- */

const CONV_JS = [
  "const THB_TO_INR = 2.47;",
  "const INR_TO_THB = 1 / THB_TO_INR;",
  "",
  "const thbInput = document.getElementById('thb');",
  "const inrInput = document.getElementById('inr');",
  "const resultText = document.getElementById('resultText');",
  "",
  "function fmt(num) {",
  "  return new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(num);",
  "}",
  "",
  "function updateResult(fromCurrency, amount) {",
  "  if (!amount || isNaN(amount) || amount < 0) {",
  "    resultText.innerHTML = 'Enter an amount above to see the conversion.';",
  "    return;",
  "  }",
  "  if (fromCurrency === 'THB') {",
  "    const converted = amount * THB_TO_INR;",
  "    resultText.innerHTML = '<strong>฿' + fmt(amount) + '</strong> Thai Baht = <strong>₹' + fmt(converted) + '</strong> Indian Rupee';",
  "  } else {",
  "    const converted = amount * INR_TO_THB;",
  "    resultText.innerHTML = '<strong>₹' + fmt(amount) + '</strong> Indian Rupee = <strong>฿' + fmt(converted) + '</strong> Thai Baht';",
  "  }",
  "}",
  "",
  "thbInput.addEventListener('input', () => {",
  "  const val = parseFloat(thbInput.value);",
  "  if (thbInput.value === '' || isNaN(val)) {",
  "    inrInput.value = '';",
  "    resultText.innerHTML = 'Enter an amount above to see the conversion.';",
  "    return;",
  "  }",
  "  inrInput.value = (val * THB_TO_INR).toFixed(2);",
  "  updateResult('THB', val);",
  "});",
  "",
  "inrInput.addEventListener('input', () => {",
  "  const val = parseFloat(inrInput.value);",
  "  if (inrInput.value === '' || isNaN(val)) {",
  "    thbInput.value = '';",
  "    resultText.innerHTML = 'Enter an amount above to see the conversion.';",
  "    return;",
  "  }",
  "  thbInput.value = (val * INR_TO_THB).toFixed(2);",
  "  updateResult('INR', val);",
  "});",
  "",
  "document.getElementById('swapBtn').addEventListener('click', () => {",
  "  const thbVal = thbInput.value;",
  "  const inrVal = inrInput.value;",
  "  thbInput.value = inrVal;",
  "  inrInput.value = thbVal;",
  "  if (inrInput.value) {",
  "    updateResult('INR', parseFloat(inrInput.value));",
  "  } else {",
  "    resultText.innerHTML = 'Enter an amount above to see the conversion.';",
  "  }",
  "});",
  "",
  "document.querySelectorAll('.quick-btn').forEach(btn => {",
  "  btn.addEventListener('click', () => {",
  "    const val = parseFloat(btn.dataset.thb);",
  "    thbInput.value = val;",
  "    inrInput.value = (val * THB_TO_INR).toFixed(2);",
  "    updateResult('THB', val);",
  "  });",
  "});",
  "",
  "// Demo pre-fill: the milestone-1 quote (฿25,000 → ₹61,750).",
  "thbInput.value = '25000';",
  "inrInput.value = (25000 * THB_TO_INR).toFixed(2);",
  "updateResult('THB', 25000);",
].join("\n");

const CONV_CSS = [
  "* { box-sizing: border-box; margin: 0; padding: 0; }",
  "body { font-family: 'Segoe UI', sans-serif; background: linear-gradient(135deg, #1a1a2e 0%, #16213e 60%, #0f3460 100%); min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 20px; }",
  ".converter-wrapper { background: rgba(255,255,255,0.05); backdrop-filter: blur(16px); border: 1px solid rgba(255,255,255,0.12); border-radius: 24px; padding: 36px 32px; width: 100%; max-width: 440px; color: #fff; box-shadow: 0 24px 60px rgba(0,0,0,0.4); }",
  ".header { display: flex; align-items: center; justify-content: center; gap: 14px; margin-bottom: 6px; }",
  ".header h1 { font-size: 1.8rem; font-weight: 700; letter-spacing: 2px; background: linear-gradient(90deg, #f7c948, #ff6b6b); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }",
  ".flag { font-size: 2rem; }",
  ".rate-info { text-align: center; font-size: 0.8rem; color: rgba(255,255,255,0.5); margin-bottom: 28px; letter-spacing: 0.5px; }",
  ".card { background: rgba(255,255,255,0.07); border: 1px solid rgba(255,255,255,0.1); border-radius: 14px; padding: 18px 20px; margin-bottom: 10px; transition: border-color 0.3s; }",
  ".card:focus-within { border-color: #f7c948; }",
  ".card label { display: block; font-size: 0.75rem; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; color: rgba(255,255,255,0.55); margin-bottom: 10px; }",
  ".input-group { display: flex; align-items: center; gap: 10px; }",
  ".symbol { font-size: 1.5rem; font-weight: 700; color: #f7c948; min-width: 24px; }",
  "input[type='number'] { background: transparent; border: none; outline: none; font-size: 1.6rem; font-weight: 600; color: #fff; width: 100%; }",
  "input[type='number']::placeholder { color: rgba(255,255,255,0.25); font-size: 1.1rem; }",
  "input[type='number']::-webkit-inner-spin-button, input[type='number']::-webkit-outer-spin-button { -webkit-appearance: none; }",
  ".swap-row { display: flex; justify-content: center; margin: 4px 0; }",
  ".swap-btn { background: linear-gradient(135deg, #f7c948, #ff6b6b); border: none; border-radius: 50px; padding: 8px 22px; font-size: 0.9rem; font-weight: 700; color: #1a1a2e; cursor: pointer; transition: transform 0.2s, box-shadow 0.2s; letter-spacing: 0.5px; }",
  ".swap-btn:hover { transform: scale(1.06); box-shadow: 0 4px 18px rgba(247,201,72,0.4); }",
  ".swap-btn:active { transform: scale(0.97); }",
  ".result-box { background: linear-gradient(135deg, rgba(247,201,72,0.12), rgba(255,107,107,0.12)); border: 1px solid rgba(247,201,72,0.3); border-radius: 14px; padding: 16px 20px; margin-top: 18px; text-align: center; min-height: 60px; display: flex; align-items: center; justify-content: center; }",
  "#resultText { font-size: 1rem; color: rgba(255,255,255,0.65); line-height: 1.6; }",
  "#resultText strong { font-size: 1.25rem; color: #f7c948; }",
  ".quick-amounts { margin-top: 22px; }",
  ".quick-label { font-size: 0.72rem; text-transform: uppercase; letter-spacing: 1px; color: rgba(255,255,255,0.4); margin-bottom: 10px; }",
  ".quick-btns { display: flex; flex-wrap: wrap; gap: 8px; }",
  ".quick-btn { background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.15); border-radius: 8px; padding: 7px 14px; font-size: 0.82rem; font-weight: 600; color: #fff; cursor: pointer; transition: background 0.2s, border-color 0.2s, transform 0.15s; }",
  ".quick-btn:hover { background: rgba(247,201,72,0.2); border-color: #f7c948; color: #f7c948; transform: translateY(-2px); }",
  ".disclaimer { margin-top: 20px; font-size: 0.7rem; color: rgba(255,255,255,0.3); text-align: center; }",
].join("\n");

const CONV_HTML = [
  // Flag emojis dropped from the canvas original — headless chromium renders
  // them as regional-indicator letter pairs.
  '<div class="converter-wrapper">',
  '  <div class="header">',
  "    <h1>THB ↔ INR</h1>",
  "  </div>",
  '  <p class="rate-info">1 THB ≈ 2.47 INR &nbsp;|&nbsp; 1 INR ≈ 0.405 THB</p>',
  '  <div class="card">',
  '    <label for="thb">Thai Baht (฿)</label>',
  '    <div class="input-group">',
  '      <span class="symbol">฿</span>',
  '      <input type="number" id="thb" placeholder="Enter amount" min="0" />',
  "    </div>",
  "  </div>",
  '  <div class="swap-row">',
  '    <button class="swap-btn" id="swapBtn" title="Swap">⇅ Swap</button>',
  "  </div>",
  '  <div class="card">',
  '    <label for="inr">Indian Rupee (₹)</label>',
  '    <div class="input-group">',
  '      <span class="symbol">₹</span>',
  '      <input type="number" id="inr" placeholder="Enter amount" min="0" />',
  "    </div>",
  "  </div>",
  '  <div class="result-box" id="resultBox">',
  '    <p id="resultText">Enter an amount above to see the conversion.</p>',
  "  </div>",
  '  <div class="quick-amounts">',
  '    <p class="quick-label">Quick THB amounts:</p>',
  '    <div class="quick-btns">',
  '      <button class="quick-btn" data-thb="100">฿100</button>',
  '      <button class="quick-btn" data-thb="500">฿500</button>',
  '      <button class="quick-btn" data-thb="1000">฿1,000</button>',
  '      <button class="quick-btn" data-thb="5000">฿5,000</button>',
  '      <button class="quick-btn" data-thb="10000">฿10,000</button>',
  "    </div>",
  "  </div>",
  '  <p class="disclaimer">* Rate is approximate. For real-time rates, check a live forex source.</p>',
  "</div>",
].join("\n");

const convPayload = {
  type: "custom",
  title: "Thai Baht ↔ Indian Rupee Converter",
  description: "Live currency converter between THB and INR",
  data: { html: CONV_HTML, css: CONV_CSS, js: CONV_JS },
} satisfies ArtifactPayload;

/* --- Thailand & India time zones — verbatim from art_mqqv4hvy_gjs8c,
 * with the wall clock frozen to a fixed instant (new Date() + setInterval
 * would break frame determinism). 10:30Z ⇒ 17:30 Bangkok / 16:00 Bengaluru. --- */

const TZ_JS = [
  "// Demo determinism: frozen instant instead of the live wall clock.",
  "const FROZEN_NOW = new Date('2026-07-16T10:30:00Z');",
  "",
  "function formatTime(date, timeZone) {",
  "  return date.toLocaleTimeString('en-US', {",
  "    timeZone,",
  "    hour: '2-digit',",
  "    minute: '2-digit',",
  "    second: '2-digit',",
  "    hour12: false",
  "  });",
  "}",
  "",
  "function formatDate(date, timeZone) {",
  "  return date.toLocaleDateString('en-US', {",
  "    timeZone,",
  "    weekday: 'short',",
  "    month: 'short',",
  "    day: 'numeric'",
  "  });",
  "}",
  "",
  "function tick() {",
  "  const now = FROZEN_NOW;",
  "  document.getElementById('thai-time').textContent = formatTime(now, 'Asia/Bangkok');",
  "  document.getElementById('thai-date').textContent = formatDate(now, 'Asia/Bangkok');",
  "  document.getElementById('india-time').textContent = formatTime(now, 'Asia/Kolkata');",
  "  document.getElementById('india-date').textContent = formatDate(now, 'Asia/Kolkata');",
  "}",
  "",
  "tick();",
].join("\n");

const TZ_CSS = [
  "* { box-sizing: border-box; margin: 0; padding: 0; }",
  "body { background: #0f0f0f; display: flex; align-items: center; justify-content: center; min-height: 100vh; font-family: 'SF Mono', 'Fira Code', monospace; }",
  ".clocks { display: flex; align-items: center; gap: 0; background: #1a1a1a; border: 1px solid #2a2a2a; border-radius: 16px; overflow: hidden; }",
  ".clock-card { display: flex; flex-direction: column; align-items: center; padding: 36px 48px; gap: 6px; }",
  ".flag { font-size: 2rem; line-height: 1; margin-bottom: 4px; }",
  ".country { font-size: 0.75rem; font-weight: 600; letter-spacing: 0.12em; text-transform: uppercase; color: #666; }",
  ".tz-label { font-size: 0.65rem; letter-spacing: 0.08em; color: #444; margin-bottom: 8px; }",
  ".time { font-size: 2.6rem; font-weight: 300; letter-spacing: 0.04em; color: #f0f0f0; font-variant-numeric: tabular-nums; }",
  ".date { font-size: 0.7rem; color: #555; letter-spacing: 0.06em; margin-top: 4px; }",
  ".divider { width: 1px; height: 100px; background: #2a2a2a; }",
].join("\n");

const TZ_HTML = [
  // Flag emojis dropped (same headless-chromium rendering constraint).
  '<div class="clocks">',
  '  <div class="clock-card">',
  '    <div class="country">Thailand</div>',
  '    <div class="tz-label">ICT · UTC+7</div>',
  '    <div class="time" id="thai-time"></div>',
  '    <div class="date" id="thai-date"></div>',
  "  </div>",
  '  <div class="divider"></div>',
  '  <div class="clock-card">',
  '    <div class="country">India</div>',
  '    <div class="tz-label">IST · UTC+5:30</div>',
  '    <div class="time" id="india-time"></div>',
  '    <div class="date" id="india-date"></div>',
  "  </div>",
  "</div>",
].join("\n");

const tzPayload = {
  type: "custom",
  title: "Thailand & India Time Zones",
  description: "Side-by-side clock display",
  data: { html: TZ_HTML, css: TZ_CSS, js: TZ_JS },
} satisfies ArtifactPayload;

/* --- Invoice generator — verbatim from art_mqe9l7tt_h8g6k (light variant;
 * the dark-theme override on the last version is dropped to match the light
 * canvas). Edits: ₹ formatting, and the discovery-phase line items + party
 * details seeded so the payoff frame reads as a finished invoice. The
 * ₹61,750 total ties to the converter's ฿25,000 pre-fill. --- */

const INV_JS = [
  "let rowId = 0;",
  "",
  "function addRow(desc, qty, price) {",
  "  desc = desc || ''; qty = qty == null ? 1 : qty; price = price || 0;",
  "  const tb = document.getElementById('tbody');",
  "  const tr = document.createElement('tr');",
  "  const id = ++rowId;",
  "  tr.dataset.id = id;",
  "  tr.innerHTML =",
  "    '<td contenteditable=\"true\" data-ph=\"Item description\" class=\"desc-cell\">' + desc + '</td>' +",
  "    '<td contenteditable=\"true\" data-ph=\"1\" class=\"num-cell qty\">' + qty + '</td>' +",
  "    '<td contenteditable=\"true\" data-ph=\"0.00\" class=\"num-cell price\">' + (price > 0 ? price : '') + '</td>' +",
  "    '<td class=\"num-cell total-cell\">₹0.00</td>' +",
  "    '<td class=\"no-print\"><button class=\"del-btn\" onclick=\"delRow(' + id + ')\" title=\"Remove\">✕</button></td>';",
  "  tb.appendChild(tr);",
  "  tr.querySelectorAll('[contenteditable]').forEach(el => el.addEventListener('input', calc));",
  "  calc();",
  "}",
  "",
  "function delRow(id) {",
  "  const tr = document.querySelector('tr[data-id=\"' + id + '\"]');",
  "  if (tr) { tr.remove(); calc(); }",
  "}",
  "",
  "function parseNum(el) { return parseFloat(el.textContent.replace(/[^0-9.]/g, '')) || 0; }",
  "",
  "function fmt(n) { return '₹' + new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n); }",
  "",
  "function calc() {",
  "  let sub = 0;",
  "  document.querySelectorAll('#tbody tr').forEach(tr => {",
  "    const q = parseNum(tr.querySelector('.qty'));",
  "    const p = parseNum(tr.querySelector('.price'));",
  "    const t = q * p;",
  "    tr.querySelector('.total-cell').textContent = fmt(t);",
  "    sub += t;",
  "  });",
  "  const taxEl = document.getElementById('taxRate');",
  "  const rate = parseFloat(taxEl.textContent.replace(/[^0-9.]/g, '')) || 0;",
  "  const tax = sub * rate / 100;",
  "  document.getElementById('subtotal').textContent = fmt(sub);",
  "  document.getElementById('taxAmt').textContent = fmt(tax);",
  "  document.getElementById('grand').textContent = fmt(sub + tax);",
  "}",
  "",
  "function exportPDF() {",
  "  document.querySelectorAll('[contenteditable]').forEach(el => {",
  "    if (el.textContent.trim() === '') el.style.minWidth = '0';",
  "  });",
  "  window.print();",
  "  document.querySelectorAll('[contenteditable]').forEach(el => el.style.minWidth = '');",
  "}",
  "",
  "document.getElementById('taxRate').addEventListener('input', calc);",
  "",
  "// Demo seed: the discovery-phase invoice for Openhouse (₹61,750 total).",
  "const set = (ph, v) => {",
  "  const el = document.querySelector('[data-ph=\"' + ph + '\"]');",
  "  if (el) el.textContent = v;",
  "};",
  "set('Your Company Name', 'Prem Pradeep — Product Design');",
  "set('123 Street, City, Country', 'Sukhumvit 24, Bangkok 10110, Thailand');",
  "set('email@example.com', 'prem@premdesign.co');",
  "set('+1 000 000 0000', '+66 89 555 0117');",
  "set('INV-001', 'OH-2026-01');",
  "set('2025-01-01', '2026-05-18');",
  "set('2025-01-31', '2026-06-01');",
  "set('Client Name', 'Openhouse Learning Pvt. Ltd.');",
  "set('Client Address', 'HSR Layout, Bengaluru 560102, India');",
  "set('client@email.com', 'accounts@openhouse.school');",
  "set('Payment terms, bank details, or any other notes…', 'Milestone billing — Discovery (1 of 4). INR bank transfer as agreed; SWIFT details on file.');",
  "addRow('Discovery workshop & stakeholder interviews', 1, 28000);",
  "addRow('UX audit — parent onboarding flow', 1, 22750);",
  "addRow('Competitive teardown — 5 class-booking apps', 1, 11000);",
].join("\n");

const INV_CSS = [
  "*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }",
  "body { font-family: 'Segoe UI', sans-serif; background: #f0f2f5; color: #1a1a2e; font-size: 14px; }",
  "#toolbar { display:flex; justify-content:space-between; align-items:center; padding:12px 24px; background:#1a1a2e; position:sticky; top:0; z-index:10; }",
  "#brand { color:#fff; font-weight:700; font-size:16px; letter-spacing:.5px; }",
  "#tools { display:flex; gap:10px; }",
  "#tools button { padding:7px 16px; border:none; border-radius:6px; cursor:pointer; font-size:13px; font-weight:600; transition:opacity .15s; }",
  "#tools button:first-child { background:#e8f4ff; color:#1a1a2e; }",
  "#pdfBtn { background:#4f8ef7; color:#fff; }",
  "#tools button:hover { opacity:.85; }",
  "#invoice { max-width:780px; margin:24px auto 40px; background:#fff; border-radius:12px; padding:28px; box-shadow:0 4px 24px rgba(0,0,0,.10); }",
  "#header { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:28px; }",
  "#from { display:flex; flex-direction:column; gap:4px; }",
  ".big { font-size:22px; } .bold { font-weight:700; } .muted { color:#666; }",
  "#inv-meta { text-align:right; display:flex; flex-direction:column; gap:5px; align-items:flex-end; }",
  ".inv-label { font-size:28px; font-weight:800; color:#4f8ef7; letter-spacing:1px; margin-bottom:6px; }",
  ".meta-row { display:flex; gap:12px; align-items:center; }",
  ".ml { color:#888; font-size:12px; text-transform:uppercase; letter-spacing:.5px; white-space:nowrap; }",
  ".metaval { font-weight:600; min-width:80px; text-align:right; }",
  "#bill-to { background:#f7f9fc; border-radius:8px; padding:16px 20px; margin-bottom:22px; display:flex; flex-direction:column; gap:4px; }",
  ".section-label { font-size:11px; font-weight:700; letter-spacing:1px; color:#4f8ef7; text-transform:uppercase; margin-bottom:6px; }",
  "table { width:100%; border-collapse:collapse; margin-bottom:0; }",
  "th { background:#1a1a2e; color:#fff; padding:10px 12px; font-size:12px; text-transform:uppercase; letter-spacing:.5px; text-align:left; }",
  "th:nth-child(2),th:nth-child(3),th:nth-child(4) { text-align:right; }",
  ".desc-col { width:44%; }",
  "td { padding:10px 12px; border-bottom:1px solid #eef0f5; vertical-align:middle; }",
  "td:nth-child(2),td:nth-child(3),td:nth-child(4) { text-align:right; width:14%; }",
  "td:last-child { width:36px; text-align:center; }",
  "tr:last-child td { border-bottom:none; }",
  "tr:hover td { background:#fafbfe; }",
  ".del-btn { background:none; border:none; cursor:pointer; color:#ccc; font-size:16px; padding:2px 6px; border-radius:4px; transition:color .15s,background .15s; }",
  ".del-btn:hover { color:#e55; background:#fff0f0; }",
  "[contenteditable] { outline:none; min-width:20px; display:inline-block; }",
  // Rendering fix over the canvas original: inline-block on a <td> collapses
  // the table into anonymous rows — keep cells as cells.
  "td[contenteditable] { display:table-cell; }",
  "[contenteditable]:empty::before { content:attr(data-ph); color:#bbb; pointer-events:none; }",
  "[contenteditable]:focus { border-bottom:1.5px solid #4f8ef7; }",
  ".num-cell { text-align:right; }",
  "th, .num-cell, .metaval { white-space:nowrap; }",
  "#totals { display:flex; flex-direction:column; align-items:flex-end; gap:6px; margin-top:16px; padding:16px 0; border-top:2px solid #f0f2f5; }",
  ".tot-row { display:flex; gap:48px; font-size:13px; color:#555; }",
  ".tot-row span:last-child { font-weight:600; color:#1a1a2e; min-width:90px; text-align:right; }",
  ".grand { font-size:16px; padding-top:8px; border-top:2px solid #1a1a2e; margin-top:4px; }",
  ".grand span { color:#1a1a2e !important; font-weight:800 !important; }",
  "#notes-wrap { margin-top:24px; padding-top:18px; border-top:1px solid #eef0f5; display:flex; flex-direction:column; gap:4px; }",
].join("\n");

const INV_HTML = [
  '<div id="app">',
  '  <div id="toolbar">',
  '    <span id="brand">⚡ Invoice</span>',
  '    <div id="tools">',
  '      <button onclick="addRow()">+ Add Row</button>',
  '      <button id="pdfBtn" onclick="exportPDF()">⬇ Export PDF</button>',
  "    </div>",
  "  </div>",
  '  <div id="invoice">',
  '    <div id="header">',
  '      <div id="from">',
  '        <div contenteditable="true" class="big bold" data-ph="Your Company Name"></div>',
  '        <div contenteditable="true" class="muted" data-ph="123 Street, City, Country"></div>',
  '        <div contenteditable="true" class="muted" data-ph="email@example.com"></div>',
  '        <div contenteditable="true" class="muted" data-ph="+1 000 000 0000"></div>',
  "      </div>",
  '      <div id="inv-meta">',
  '        <div class="inv-label">INVOICE</div>',
  '        <div class="meta-row"><span class="ml">Invoice #</span><span contenteditable="true" data-ph="INV-001" class="metaval"></span></div>',
  '        <div class="meta-row"><span class="ml">Date</span><span contenteditable="true" data-ph="2025-01-01" class="metaval"></span></div>',
  '        <div class="meta-row"><span class="ml">Due Date</span><span contenteditable="true" data-ph="2025-01-31" class="metaval"></span></div>',
  "      </div>",
  "    </div>",
  '    <div id="bill-to">',
  '      <div class="section-label">BILL TO</div>',
  '      <div contenteditable="true" class="bold" data-ph="Client Name"></div>',
  '      <div contenteditable="true" class="muted" data-ph="Client Address"></div>',
  '      <div contenteditable="true" class="muted" data-ph="client@email.com"></div>',
  "    </div>",
  '    <table id="items">',
  "      <thead>",
  "        <tr>",
  '          <th class="desc-col">Description</th>',
  "          <th>Qty</th>",
  "          <th>Unit Price</th>",
  "          <th>Total</th>",
  '          <th class="no-print"></th>',
  "        </tr>",
  "      </thead>",
  '      <tbody id="tbody"></tbody>',
  "    </table>",
  '    <div id="totals">',
  '      <div class="tot-row"><span>Subtotal</span><span id="subtotal">₹0.00</span></div>',
  '      <div class="tot-row"><span>Tax <span contenteditable="true" id="taxRate" data-ph="0">0</span>%</span><span id="taxAmt">₹0.00</span></div>',
  '      <div class="tot-row grand"><span>Total</span><span id="grand">₹0.00</span></div>',
  "    </div>",
  '    <div id="notes-wrap">',
  '      <div class="section-label">NOTES</div>',
  '      <div contenteditable="true" class="muted" data-ph="Payment terms, bank details, or any other notes…"></div>',
  "    </div>",
  "  </div>",
  "</div>",
].join("\n");

const invPayload = {
  type: "custom",
  title: "Invoice Generator",
  description: "Editable invoice with PDF export",
  data: { html: INV_HTML, css: INV_CSS, js: INV_JS },
} satisfies ArtifactPayload;

/* --------------------------- session artifacts -------------------------- */

/** Deterministic SessionArtifact (stable ids for capture). */
function stableArtifact(
  id: string,
  payload: ArtifactPayload,
  sourceCardId: string,
): SessionArtifact {
  const art = createSessionArtifactFromPayload(payload, sourceCardId);
  const versionId = `${id}_v1`;
  return {
    ...art,
    id,
    versions: art.versions.map((v) => ({ ...v, id: versionId })),
    latestVersionId: versionId,
  };
}

export function buildSessionArtifacts(
  /** Artifacts still in their generating window: versions stay empty so the
   *  in-card pill reads "Version 1 · Generating…". */
  generatingIds?: ReadonlySet<string>,
): Record<string, SessionArtifact> {
  const artifacts = [
    stableArtifact(ART_FIGMA, figmaPayload, ""),
    stableArtifact(ART_SITE, sitePayload, ""),
    stableArtifact(ART_IMG, imgPayload, ""),
    stableArtifact(ART_STICKY, stickyPayload, ""),
    stableArtifact(ART_TL, timelinePayload, CARD_TL_Q),
    stableArtifact(ART_TODO, todoPayload, CARD_TODO_Q),
    stableArtifact(ART_CONV, convPayload, CARD_CONV_Q),
    stableArtifact(ART_TZ, tzPayload, CARD_TZ_Q),
    stableArtifact(ART_INV, invPayload, CARD_INV_Q),
  ];
  return Object.fromEntries(
    artifacts.map((a) => [
      a.id,
      generatingIds?.has(a.id) ? { ...a, versions: [] } : a,
    ]),
  );
}

export const ARTIFACT_VERSION_ID = (artifactId: string) => `${artifactId}_v1`;

/** Payload each emerging artifact streams onto its card while generating. */
export const GENERATING_PAYLOADS: Record<string, ArtifactPayload> = {
  [ART_TL]: timelinePayload,
  [ART_TODO]: todoPayload,
  [ART_CONV]: convPayload,
  [ART_TZ]: tzPayload,
  [ART_INV]: invPayload,
};

/* ------------------------------ brand copy ------------------------------ */

export const TITLE_LEAD = "run your freelance work on ";

export interface Chip {
  text: string;
  t0: number;
  t1: number;
}

export const CHIPS: Chip[] = [
  { text: "drop your briefs", t0: 1500, t1: 2300 },
  { text: "drop designs", t0: 2500, t1: 3200 },
  { text: "drop references", t0: 3400, t1: 4200 },
  { text: "one canvas per client", t0: 4400, t1: 5400 },
  { text: "Turn briefs into plans", t0: 6300, t1: 9400 },
  { text: "Break work into tasks", t0: 12900, t1: 15200 },
  { text: "Build your own tools", t0: 17400, t1: 21000 },
  { text: "They stay on your canvas", t0: 21600, t1: 24200 },
  { text: "Invoice without leaving", t0: 25000, t1: 28600 },
];
