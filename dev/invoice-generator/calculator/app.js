/**

 * Indian freelancer price calculator — websites, design systems, mobile app UI.

 * Rates reflect typical mid-market Indian freelance pricing (2024–26).

 */



const TIERS = {

  junior: { label: "Junior (0–2 yr)", mult: 1 },

  mid: { label: "Mid (2–5 yr)", mult: 1.65 },

  senior: { label: "Senior (5+ yr)", mult: 2.75 },

};



const CLIENT_TYPES = {

  indian_sme: { label: "Indian SME", mult: 1 },

  indian_startup: { label: "Indian startup", mult: 0.88 },

  international: { label: "International", mult: 1.45 },

};



const RUSH = {

  none: { label: "Standard timeline", mult: 1 },

  rush_2w: { label: "2-week rush (+25%)", mult: 1.25 },

  rush_1w: { label: "1-week rush (+50%)", mult: 1.5 },

};



const DELIVERABLES = {

  website: {

    label: "Website",

    icon: "◫",

    defaults: {

      landingPages: 1,

      innerPages: 4,

      stack: "static",

      ecommerce: false,

      seoSetup: false,

      contentPages: 0,

      maintenanceMonths: 0,

    },

  },

  design_system: {

    label: "Design system",

    icon: "◈",

    defaults: {

      componentSets: 3,

      hasTokens: true,

      hasDocs: true,

      figmaLibrary: true,

      a11yAudit: false,

    },

  },

  mobile_app: {

    label: "Mobile app UI",

    icon: "▢",

    defaults: {

      screens: 12,

      platform: "both",

      fidelity: "hifi",

      prototype: false,

      designSystemReuse: false,

    },

  },

};



const WEBSITE_STACK_MULT = {

  static: 1,

  cms: 1.35,

  custom: 1.85,

};



const MOBILE_PLATFORM_MULT = {

  ios: 1,

  android: 1,

  both: 1.55,

};



const MOBILE_FIDELITY_RATE = {

  wireframe: { junior: 3500, mid: 5500, senior: 9000 },

  hifi: { junior: 9000, mid: 15000, senior: 26000 },

};



const DEFAULT_STATE = {

  deliverable: "website",

  tier: "mid",

  clientType: "indian_sme",

  rush: "none",

  includeGst: true,

  extraRevisions: 0,

  fields: structuredClone(DELIVERABLES.website.defaults),

};



const fmt = new Intl.NumberFormat("en-IN", {

  style: "currency",

  currency: "INR",

  maximumFractionDigits: 0,

});



function clamp(n, min, max) {

  return Math.min(max, Math.max(min, n));

}



function parseIntSafe(value, fallback = 0) {

  const n = parseInt(String(value), 10);

  return Number.isFinite(n) ? n : fallback;

}



function roundInr(n) {

  return Math.round(n / 500) * 500;

}



function getTierKey() {

  return document.getElementById("tierSelect")?.value ?? "mid";

}



function getClientKey() {

  return document.getElementById("clientSelect")?.value ?? "indian_sme";

}



function getRushKey() {

  return document.getElementById("rushSelect")?.value ?? "none";

}



function getGlobalMult() {

  const tier = TIERS[getTierKey()]?.mult ?? 1;

  const client = CLIENT_TYPES[getClientKey()]?.mult ?? 1;

  const rush = RUSH[getRushKey()]?.mult ?? 1;

  return tier * client * rush;

}



function calcWebsite(fields, tierKey) {

  const tier = TIERS[tierKey]?.mult ?? 1;

  const landingBase = { junior: 12000, mid: 28000, senior: 52000 }[tierKey] ?? 28000;

  const innerBase = { junior: 6000, mid: 14000, senior: 26000 }[tierKey] ?? 14000;

  const stackMult = WEBSITE_STACK_MULT[fields.stack] ?? 1;



  const lines = [];



  const landing = roundInr(landingBase * fields.landingPages * stackMult);

  if (fields.landingPages > 0) {

    lines.push({

      desc: `Landing pages × ${fields.landingPages}`,

      amount: landing,

    });

  }



  const inner = roundInr(innerBase * fields.innerPages * stackMult);

  if (fields.innerPages > 0) {

    lines.push({

      desc: `Inner pages × ${fields.innerPages}`,

      amount: inner,

    });

  }



  if (fields.ecommerce) {

    const ecom = roundInr({ junior: 35000, mid: 65000, senior: 120000 }[tierKey] ?? 65000);

    lines.push({ desc: "E-commerce setup (catalog, cart, checkout UI)", amount: ecom });

  }



  if (fields.seoSetup) {

    const seo = roundInr({ junior: 8000, mid: 15000, senior: 25000 }[tierKey] ?? 15000);

    lines.push({ desc: "SEO & analytics setup", amount: seo });

  }



  if (fields.contentPages > 0) {

    const perPage = { junior: 2500, mid: 4000, senior: 6500 }[tierKey] ?? 4000;

    const content = roundInr(perPage * fields.contentPages);

    lines.push({ desc: `Content writing × ${fields.contentPages} pages`, amount: content });

  }



  if (fields.maintenanceMonths > 0) {

    const monthly = { junior: 5000, mid: 9000, senior: 16000 }[tierKey] ?? 9000;

    const maint = roundInr(monthly * fields.maintenanceMonths);

    lines.push({

      desc: `Maintenance retainer × ${fields.maintenanceMonths} mo`,

      amount: maint,

    });

  }



  const subtotal = lines.reduce((s, l) => s + l.amount, 0);

  return { lines, subtotal, tierMult: tier };

}



function calcDesignSystem(fields, tierKey) {

  const lines = [];



  const foundation = roundInr(

    { junior: 35000, mid: 65000, senior: 110000 }[tierKey] ?? 65000

  );

  lines.push({ desc: "Foundation (tokens, type scale, grid)", amount: foundation });



  if (fields.componentSets > 0) {

    const perSet = { junior: 12000, mid: 22000, senior: 38000 }[tierKey] ?? 22000;

    const comps = roundInr(perSet * fields.componentSets);

    lines.push({

      desc: `Component sets × ${fields.componentSets} (≈5 components each)`,

      amount: comps,

    });

  }



  if (fields.hasDocs) {

    const docs = roundInr({ junior: 18000, mid: 32000, senior: 55000 }[tierKey] ?? 32000);

    lines.push({ desc: "Documentation site & usage guidelines", amount: docs });

  }



  if (fields.figmaLibrary) {

    const figma = roundInr({ junior: 15000, mid: 28000, senior: 45000 }[tierKey] ?? 28000);

    lines.push({ desc: "Figma library & variants setup", amount: figma });

  }



  if (fields.a11yAudit) {

    const a11y = roundInr({ junior: 12000, mid: 22000, senior: 38000 }[tierKey] ?? 22000);

    lines.push({ desc: "Accessibility audit & fixes", amount: a11y });

  }



  const subtotal = lines.reduce((s, l) => s + l.amount, 0);

  return { lines, subtotal, tierMult: TIERS[tierKey]?.mult ?? 1 };

}



function calcMobileApp(fields, tierKey) {

  const lines = [];

  const perScreen = MOBILE_FIDELITY_RATE[fields.fidelity]?.[tierKey] ?? 15000;

  const platformMult = MOBILE_PLATFORM_MULT[fields.platform] ?? 1;

  const prototypeMult = fields.prototype ? 1.4 : 1;



  const screenTotal = roundInr(perScreen * fields.screens * platformMult * prototypeMult);

  const fidelityLabel =

    fields.fidelity === "wireframe" ? "Wireframes" : "Hi-fi UI screens";

  const platformLabel =

    fields.platform === "both" ? "iOS + Android" : fields.platform.toUpperCase();



  lines.push({

    desc: `${fidelityLabel} × ${fields.screens} (${platformLabel})`,

    amount: screenTotal,

  });



  if (fields.designSystemReuse) {

    const ds = roundInr({ junior: 20000, mid: 35000, senior: 60000 }[tierKey] ?? 35000);

    lines.push({ desc: "Lightweight mobile design system", amount: ds });

  }



  const subtotal = lines.reduce((s, l) => s + l.amount, 0);

  return { lines, subtotal, tierMult: TIERS[tierKey]?.mult ?? 1 };

}



function calcEstimate(state) {

  const tierKey = state.tier;

  const globalMult = getGlobalMult() / (TIERS[tierKey]?.mult ?? 1);



  let result;

  switch (state.deliverable) {

    case "design_system":

      result = calcDesignSystem(state.fields, tierKey);

      break;

    case "mobile_app":

      result = calcMobileApp(state.fields, tierKey);

      break;

    default:

      result = calcWebsite(state.fields, tierKey);

  }



  const adjustedLines = result.lines.map((line) => ({

    ...line,

    amount: roundInr(line.amount * globalMult),

  }));



  let subtotal = adjustedLines.reduce((s, l) => s + l.amount, 0);



  if (state.extraRevisions > 0) {

    const revCost = roundInr(5000 * state.extraRevisions * (TIERS[tierKey]?.mult ?? 1));

    adjustedLines.push({

      desc: `Extra revision rounds × ${state.extraRevisions}`,

      amount: revCost,

    });

    subtotal += revCost;

  }



  const gst = state.includeGst ? roundInr(subtotal * 0.18) : 0;

  const total = subtotal + gst;



  return { lines: adjustedLines, subtotal, gst, total };

}



function readFieldValues() {

  const deliverable = document.querySelector(".deliverable-tab.is-active")?.dataset.type ?? "website";

  const fields = {};



  document.querySelectorAll("[data-calc-field]").forEach((el) => {

    const key = el.dataset.calcField;

    if (el.type === "checkbox") {

      fields[key] = el.checked;

    } else if (el.type === "number") {

      fields[key] = parseIntSafe(el.value, 0);

    } else {

      fields[key] = el.value;

    }

  });



  return {

    deliverable,

    tier: getTierKey(),

    clientType: getClientKey(),

    rush: getRushKey(),

    includeGst: document.getElementById("gstToggle")?.checked ?? true,

    extraRevisions: parseIntSafe(document.getElementById("extraRevisions")?.value, 0),

    fields,

  };

}



function renderEstimate(estimate) {

  const linesEl = document.getElementById("estimateLines");

  const subtotalEl = document.getElementById("estimateSubtotal");

  const gstRow = document.getElementById("gstRow");

  const gstEl = document.getElementById("estimateGst");

  const totalEl = document.getElementById("estimateTotal");

  const metaEl = document.getElementById("estimateMeta");



  if (!linesEl || !subtotalEl || !totalEl) return;



  linesEl.replaceChildren();

  estimate.lines.forEach((line) => {

    const li = document.createElement("li");

    li.className = "estimate__line";

    li.innerHTML = `

      <span class="estimate__line-desc">${line.desc}</span>

      <span class="estimate__line-amt">${fmt.format(line.amount)}</span>

    `;

    linesEl.appendChild(li);

  });



  subtotalEl.textContent = fmt.format(estimate.subtotal);

  if (estimate.gst > 0) {

    gstRow.hidden = false;

    gstEl.textContent = fmt.format(estimate.gst);

  } else {

    gstRow.hidden = true;

  }

  totalEl.textContent = fmt.format(estimate.total);



  const state = readFieldValues();

  const tier = TIERS[state.tier]?.label ?? state.tier;

  const client = CLIENT_TYPES[state.clientType]?.label ?? state.clientType;

  const rush = RUSH[state.rush]?.label ?? state.rush;

  metaEl.innerHTML = `

    <strong>${DELIVERABLES[state.deliverable]?.label ?? "Estimate"}</strong> ·

    ${tier} · ${client} · ${rush}.

    Rates are indicative for Indian freelancers; adjust for scope, niche, and portfolio strength.

  `;

}



function recalc() {

  const state = readFieldValues();

  const estimate = calcEstimate(state);

  renderEstimate(estimate);

  window.__lastEstimate = { state, estimate };

}



function buildFormPanel(type) {

  const panel = document.createElement("div");

  panel.className = "form-panel";

  panel.dataset.panel = type;

  panel.hidden = type !== "website";



  if (type === "website") {

    panel.innerHTML = `

      <section class="form-section" aria-label="Website scope">

        <h3 class="form-section__heading">Page count</h3>

        <div class="form-grid">

          <div class="field">

            <label for="landingPages">Landing pages</label>

            <input type="number" id="landingPages" data-calc-field="landingPages" min="0" max="20" value="1" />

          </div>

          <div class="field">

            <label for="innerPages">Inner pages</label>

            <input type="number" id="innerPages" data-calc-field="innerPages" min="0" max="50" value="4" />

          </div>

          <div class="field field--full">

            <label for="stack">Build approach</label>

            <select id="stack" data-calc-field="stack">

              <option value="static">Static / Webflow export</option>

              <option value="cms">CMS (WordPress, Webflow CMS)</option>

              <option value="custom">Custom (React / Next.js)</option>

            </select>

          </div>

        </div>

      </section>

      <section class="form-section" aria-label="Website add-ons">

        <h3 class="form-section__heading">Add-ons</h3>

        <div class="check-row">

          <label class="check-chip"><input type="checkbox" data-calc-field="ecommerce" /> E-commerce</label>

          <label class="check-chip"><input type="checkbox" data-calc-field="seoSetup" /> SEO setup</label>

        </div>

        <div class="form-grid">

          <div class="field">

            <label for="contentPages">Content pages</label>

            <input type="number" id="contentPages" data-calc-field="contentPages" min="0" max="30" value="0" />

            <span class="field-hint">Copywriting per page</span>

          </div>

          <div class="field">

            <label for="maintenanceMonths">Maintenance (months)</label>

            <input type="number" id="maintenanceMonths" data-calc-field="maintenanceMonths" min="0" max="12" value="0" />

            <span class="field-hint">Post-launch retainer</span>

          </div>

        </div>

      </section>

    `;

  } else if (type === "design_system") {

    panel.innerHTML = `

      <section class="form-section" aria-label="Design system scope">

        <h3 class="form-section__heading">System scope</h3>

        <div class="form-grid">

          <div class="field">

            <label for="componentSets">Component sets</label>

            <input type="number" id="componentSets" data-calc-field="componentSets" min="1" max="15" value="3" />

            <span class="field-hint">≈5 components per set</span>

          </div>

        </div>

        <div class="check-row">

          <label class="check-chip"><input type="checkbox" data-calc-field="hasTokens" checked /> Design tokens</label>

          <label class="check-chip"><input type="checkbox" data-calc-field="hasDocs" checked /> Documentation</label>

          <label class="check-chip"><input type="checkbox" data-calc-field="figmaLibrary" checked /> Figma library</label>

          <label class="check-chip"><input type="checkbox" data-calc-field="a11yAudit" /> A11y audit</label>

        </div>

      </section>

    `;

  } else {

    panel.innerHTML = `

      <section class="form-section" aria-label="Mobile app scope">

        <h3 class="form-section__heading">Screens & platform</h3>

        <div class="form-grid">

          <div class="field">

            <label for="screens">Screen count</label>

            <input type="number" id="screens" data-calc-field="screens" min="1" max="80" value="12" />

          </div>

          <div class="field">

            <label for="platform">Platform</label>

            <select id="platform" data-calc-field="platform">

              <option value="ios">iOS only</option>

              <option value="android">Android only</option>

              <option value="both">iOS + Android</option>

            </select>

          </div>

          <div class="field field--full">

            <label for="fidelity">Fidelity</label>

            <select id="fidelity" data-calc-field="fidelity">

              <option value="wireframe">Wireframes</option>

              <option value="hifi" selected>Hi-fi UI</option>

            </select>

          </div>

        </div>

        <div class="check-row">

          <label class="check-chip"><input type="checkbox" data-calc-field="prototype" /> Interactive prototype</label>

          <label class="check-chip"><input type="checkbox" data-calc-field="designSystemReuse" /> Mobile design system</label>

        </div>

      </section>

    `;

  }



  panel.querySelectorAll("input, select").forEach((el) => {

    el.addEventListener("input", recalc);

    el.addEventListener("change", recalc);

  });



  return panel;

}



function initTabs() {

  const tabsEl = document.getElementById("deliverableTabs");

  const formsEl = document.getElementById("formPanels");

  if (!tabsEl || !formsEl) return;



  Object.entries(DELIVERABLES).forEach(([key, d]) => {

    const tab = document.createElement("button");

    tab.type = "button";

    tab.className = `deliverable-tab${key === "website" ? " is-active" : ""}`;

    tab.dataset.type = key;

    tab.innerHTML = `<span class="deliverable-tab__icon">${d.icon}</span>${d.label}`;

    tab.addEventListener("click", () => {

      tabsEl.querySelectorAll(".deliverable-tab").forEach((t) => t.classList.remove("is-active"));

      tab.classList.add("is-active");

      formsEl.querySelectorAll(".form-panel").forEach((p) => {

        p.hidden = p.dataset.panel !== key;

      });

      recalc();

    });

    tabsEl.appendChild(tab);

    formsEl.appendChild(buildFormPanel(key));

  });

}



function resetCalculator() {

  document.getElementById("tierSelect").value = DEFAULT_STATE.tier;

  document.getElementById("clientSelect").value = DEFAULT_STATE.clientType;

  document.getElementById("rushSelect").value = DEFAULT_STATE.rush;

  document.getElementById("gstToggle").checked = DEFAULT_STATE.includeGst;

  document.getElementById("extraRevisions").value = "0";



  const activeType =

    document.querySelector(".deliverable-tab.is-active")?.dataset.type ?? "website";

  const defaults = DELIVERABLES[activeType].defaults;



  document.querySelectorAll("[data-calc-field]").forEach((el) => {

    const key = el.dataset.calcField;

    const val = defaults[key];

    if (el.type === "checkbox") {

      el.checked = Boolean(val);

    } else if (val != null) {

      el.value = String(val);

    }

  });



  recalc();

}



function copyEstimate() {

  const data = window.__lastEstimate;

  if (!data) return;



  const { state, estimate } = data;

  const title = DELIVERABLES[state.deliverable]?.label ?? "Project";

  const lines = estimate.lines.map((l) => `  ${l.desc}: ${fmt.format(l.amount)}`).join("\n");

  const text = [

    `${title} — Price Estimate`,

    "",

    lines,

    "",

    `Subtotal: ${fmt.format(estimate.subtotal)}`,

    estimate.gst > 0 ? `GST (18%): ${fmt.format(estimate.gst)}` : null,

    `Total: ${fmt.format(estimate.total)}`,

    "",

    `${TIERS[state.tier]?.label} · ${CLIENT_TYPES[state.clientType]?.label}`,

  ]

    .filter(Boolean)

    .join("\n");



  navigator.clipboard.writeText(text).then(() => {

    const btn = document.getElementById("copyBtn");

    const label = btn?.querySelector(".toolbar-action-label");

    if (!label) return;

    const saved = label.textContent;

    label.textContent = "Copied!";

    setTimeout(() => {

      label.textContent = saved;

    }, 1600);

  });

}



function sendToInvoice() {

  const data = window.__lastEstimate;

  if (!data || typeof window.addInvoiceRows !== "function") return;



  const { state, estimate } = data;

  const title = DELIVERABLES[state.deliverable]?.label ?? "Project";

  const rows = estimate.lines.map((l) => ({ desc: l.desc, price: l.amount }));



  if (estimate.gst > 0) {

    rows.push({ desc: "GST (18%)", price: estimate.gst });

  }



  window.addInvoiceRows(rows, `${title} — Project`);



  const currencySelect = document.getElementById("currencySelect");

  if (currencySelect) {

    currencySelect.value = "INR";

    currencySelect.dispatchEvent(new Event("change"));

  }



  const btn = document.getElementById("sendInvoiceBtn");

  const label = btn?.querySelector(".toolbar-action-label");

  if (label) {

    const saved = label.textContent;

    label.textContent = "Sent!";

    setTimeout(() => {

      label.textContent = saved;

    }, 1600);

  }

}



function init() {

  if (!document.getElementById("calculatorStudio")) return;



  initTabs();



  ["tierSelect", "clientSelect", "rushSelect"].forEach((id) => {

    document.getElementById(id)?.addEventListener("change", recalc);

  });

  document.getElementById("gstToggle")?.addEventListener("change", recalc);

  document.getElementById("extraRevisions")?.addEventListener("input", recalc);



  document.getElementById("resetCalcBtn")?.addEventListener("click", resetCalculator);

  document.getElementById("copyBtn")?.addEventListener("click", copyEstimate);

  document.getElementById("sendInvoiceBtn")?.addEventListener("click", sendToInvoice);



  recalc();

}



if (document.readyState === "loading") {

  document.addEventListener("DOMContentLoaded", init);

} else {

  init();

}


