const CURRENCY_SYMBOLS = {
  USD: "$",
  EUR: "€",
  GBP: "£",
  INR: "₹",
};

const DEFAULT_ROWS = [
  { desc: "Website Redesign and Development", price: 10000 },
  { desc: "Marketplace Design and Development", price: 20000 },
];

const SAMPLE = {
  projectTitle: "Riviga Website Design",
  projectDesc:
    "Revamping the current Riviga website to a modern, professional design with a focus on user experience and conversion optimization. The project includes a complete redesign of the homepage, product pages, and checkout flow.",
  fields: {
    clientName: "Peter Gregory",
    clientCompany: "Riviga Ventures",
    clientEmail: "peter@riviga.com",
    clientPhone: "+1 8733 983 9283",
    billName: "Richard Hendricks",
    billCompany: "Pied Piper",
    billAddress: "5230 Newell Road, Palo Alto",
    invoiceNumber: "#00872",
    issueDate: "17/09/21",
    dueDate: "21/09/21",
    contactName: "Richard Hendricks",
    contactEmail: "richard@piedpiper.com",
    contactPhone: "+1 8733 983 9283",
    wireName: "Richard Hendricks",
    wireAccount: "1234567890",
    wireIfsc: "ABCD0123456",
    wireGpay: "richard@piedpiper.com",
  },
  rows: DEFAULT_ROWS,
  advancePct: 20,
  currency: "USD",
  theme: "light",
  fontScale: 1,
};

const FONT_SCALE = { min: 0.75, max: 1.5, step: 0.05 };
const A4_PX = 794;
const A4_HEIGHT_PX = Math.round(A4_PX * (297 / 210));

const lineBody = document.getElementById("lineBody");
const totalDisplay = document.getElementById("totalDisplay");
const advanceDisplay = document.getElementById("advanceDisplay");
const advancePct = document.getElementById("advancePct");
const currencySelect = document.getElementById("currencySelect");
const invoiceRoot = document.getElementById("invoiceRoot");
const invoiceScaleWrapper = document.getElementById("invoiceScaleWrapper");
const documentScroll = document.getElementById("documentScroll");
const logoBox = document.getElementById("logoBox");
const logoInput = document.getElementById("logoInput");
const logoImg = document.getElementById("logoImg");
const logoHint = document.getElementById("logoHint");
const downloadPdfBtn = document.getElementById("downloadPdfBtn");

let fontScale = 1;
let fitScale = 1;

function clamp(n, min, max) {
  return Math.min(max, Math.max(min, n));
}

function updateFitScale() {
  const pad = 24;
  const available = documentScroll.clientWidth - pad;
  fitScale = available > 0 ? clamp(available / A4_PX, 0.35, 1) : 1;
}

function applyLayout() {
  updateFitScale();
  invoiceRoot.style.setProperty("--inv-zoom-font", String(fontScale));
  invoiceRoot.style.setProperty("--inv-overall", "1");
  invoiceScaleWrapper.style.transform = `scale(${fitScale})`;
  invoiceScaleWrapper.style.marginBottom = `${A4_PX * 1.414 * (fitScale - 1)}px`;
}

function setFontScale(scale) {
  fontScale = clamp(Number(scale.toFixed(2)), FONT_SCALE.min, FONT_SCALE.max);
  applyLayout();
}

function formatMoney(amount, currency) {
  const sym = CURRENCY_SYMBOLS[currency] ?? "$";
  const n = Number.isFinite(amount) ? amount : 0;
  return `${sym} ${n.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function parsePrice(value) {
  const n = parseFloat(String(value).replace(/[^\d.-]/g, ""));
  return Number.isFinite(n) ? n : 0;
}

function createRow(desc = "", price = 0) {
  const tr = document.createElement("tr");
  tr.innerHTML = `
    <td>
      <input type="text" class="line-desc" value="${escapeAttr(desc)}" aria-label="Deliverable" />
    </td>
    <td class="col-price">
      <input type="number" class="line-price" min="0" step="0.01" value="${price}" aria-label="Price" />
    </td>
    <td class="col-actions">
      <button type="button" class="row-remove" title="Remove" aria-label="Remove row">×</button>
    </td>
  `;

  tr.querySelector(".line-desc").addEventListener("input", recalc);
  tr.querySelector(".line-price").addEventListener("input", recalc);
  tr.querySelector(".row-remove").addEventListener("click", () => {
    if (lineBody.children.length <= 1) return;
    tr.remove();
    recalc();
  });

  return tr;
}

function escapeAttr(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;");
}

function recalc() {
  const currency = currencySelect.value;
  let total = 0;
  lineBody.querySelectorAll("tr").forEach((row) => {
    total += parsePrice(row.querySelector(".line-price").value);
  });
  const pct = Math.min(100, Math.max(0, parsePrice(advancePct.value)));
  totalDisplay.textContent = formatMoney(total, currency);
  advanceDisplay.textContent = formatMoney(total * (pct / 100), currency);
}

function setRows(rows) {
  lineBody.replaceChildren();
  rows.forEach((r) => lineBody.appendChild(createRow(r.desc, r.price)));
  recalc();
}

function applySample(sample) {
  document.getElementById("projectTitle").value = sample.projectTitle;
  document.getElementById("projectDesc").value = sample.projectDesc;
  document.querySelectorAll("[data-field]").forEach((el) => {
    const key = el.dataset.field;
    if (sample.fields[key] != null) el.value = sample.fields[key];
  });
  advancePct.value = sample.advancePct;
  currencySelect.value = sample.currency;
  invoiceRoot.dataset.theme = sample.theme ?? "light";
  fontScale = sample.fontScale ?? 1;
  applyLayout();
  setRows(sample.rows);
  clearLogo();
}

function clearLogo() {
  logoImg.src = "";
  logoImg.hidden = true;
  logoHint.hidden = false;
}

function copyInvoiceState(fromRoot, toRoot) {
  const mapValue = (selector) => {
    const fromEl = fromRoot.querySelector(selector);
    const toEl = toRoot.querySelector(selector);
    if (fromEl && toEl && "value" in fromEl && "value" in toEl) {
      toEl.value = fromEl.value;
    }
  };

  mapValue("#projectTitle");
  mapValue("#projectDesc");
  mapValue("#advancePct");

  fromRoot.querySelectorAll("[data-field]").forEach((fromEl) => {
    const key = fromEl.dataset.field;
    const toEl = toRoot.querySelector(`[data-field="${key}"]`);
    if (toEl && "value" in toEl) toEl.value = fromEl.value;
  });

  const fromRows = fromRoot.querySelectorAll("#lineBody tr");
  const toRows = toRoot.querySelectorAll("#lineBody tr");
  fromRows.forEach((fromRow, index) => {
    const toRow = toRows[index];
    if (!toRow) return;
    const fromDesc = fromRow.querySelector(".line-desc");
    const toDesc = toRow.querySelector(".line-desc");
    const fromPrice = fromRow.querySelector(".line-price");
    const toPrice = toRow.querySelector(".line-price");
    if (fromDesc && toDesc) toDesc.value = fromDesc.value;
    if (fromPrice && toPrice) toPrice.value = fromPrice.value;
  });

  const fromTotal = fromRoot.querySelector("#totalDisplay");
  const toTotal = toRoot.querySelector("#totalDisplay");
  if (fromTotal && toTotal) toTotal.textContent = fromTotal.textContent;

  const fromAdvanceAmt = fromRoot.querySelector("#advanceDisplay");
  const toAdvanceAmt = toRoot.querySelector("#advanceDisplay");
  if (fromAdvanceAmt && toAdvanceAmt) toAdvanceAmt.textContent = fromAdvanceAmt.textContent;

  const fromLogo = fromRoot.querySelector("#logoImg");
  const toLogo = toRoot.querySelector("#logoImg");
  const toHint = toRoot.querySelector("#logoHint");
  if (fromLogo && toLogo && !fromLogo.hidden && fromLogo.src) {
    toLogo.src = fromLogo.src;
    toLogo.hidden = false;
    if (toHint) toHint.hidden = true;
  }
}

function buildPdfCaptureRoot() {
  const sourceRoot = invoiceRoot;
  const cloneRoot = sourceRoot.cloneNode(true);
  cloneRoot.id = "invoiceRoot-pdf";
  cloneRoot.style.cssText = sourceRoot.style.cssText;
  cloneRoot.classList.add("is-pdf-capture");

  const fileInput = cloneRoot.querySelector("#logoInput");
  if (fileInput) fileInput.remove();

  copyInvoiceState(sourceRoot, cloneRoot);

  const sandbox = document.createElement("div");
  sandbox.id = "pdf-export-sandbox";
  sandbox.setAttribute("aria-hidden", "true");
  sandbox.appendChild(cloneRoot);
  document.body.appendChild(sandbox);

  return { sandbox, invoiceEl: cloneRoot.querySelector("#invoice") };
}

async function downloadPdf() {
  if (typeof html2pdf === "undefined") {
    alert("PDF library still loading — try again in a moment.");
    return;
  }

  const invoiceNumber =
    document.querySelector("[data-field='invoiceNumber']")?.value?.trim() ||
    "invoice";
  const safeName = invoiceNumber.replace(/[^\w.-]+/g, "_");

  downloadPdfBtn.disabled = true;
  downloadPdfBtn.setAttribute("aria-busy", "true");
  const downloadLabel = downloadPdfBtn.querySelector(".toolbar-download-label");
  const savedLabel = downloadLabel?.textContent ?? "Download";
  if (downloadLabel) downloadLabel.textContent = "Generating…";

  const { sandbox, invoiceEl } = buildPdfCaptureRoot();

  try {
    await document.fonts.ready;
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));

    const bg = getComputedStyle(invoiceEl).backgroundColor || "#f8f6f2";

    await html2pdf()
      .set({
        margin: 0,
        filename: `${safeName}.pdf`,
        image: { type: "jpeg", quality: 0.98 },
        pagebreak: { mode: ["avoid-all"] },
        html2canvas: {
          scale: 2,
          width: A4_PX,
          height: A4_HEIGHT_PX,
          windowWidth: A4_PX,
          windowHeight: A4_HEIGHT_PX,
          scrollX: 0,
          scrollY: 0,
          useCORS: true,
          logging: false,
          backgroundColor: bg,
        },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
      })
      .from(invoiceEl)
      .save();
  } catch (err) {
    console.error(err);
    alert("Could not generate PDF. Try again in a moment.");
  } finally {
    sandbox.remove();
    downloadPdfBtn.disabled = false;
    downloadPdfBtn.removeAttribute("aria-busy");
    if (downloadLabel) downloadLabel.textContent = savedLabel;
  }
}

document.getElementById("addRowBtn").addEventListener("click", () => {
  lineBody.appendChild(createRow("New deliverable", 0));
  recalc();
});

advancePct.addEventListener("input", recalc);

function stepAdvancePct(delta) {
  const next = clamp(parsePrice(advancePct.value) + delta, 0, 100);
  advancePct.value = String(next);
  recalc();
}

document.getElementById("advancePctDown").addEventListener("click", () => stepAdvancePct(-5));
document.getElementById("advancePctUp").addEventListener("click", () => stepAdvancePct(5));

currencySelect.addEventListener("change", recalc);

document.getElementById("resetBtn").addEventListener("click", () => {
  applySample(structuredClone(SAMPLE));
});

downloadPdfBtn.addEventListener("click", downloadPdf);

document.getElementById("fontUpBtn").addEventListener("click", () => setFontScale(fontScale + FONT_SCALE.step));
document.getElementById("fontDownBtn").addEventListener("click", () => setFontScale(fontScale - FONT_SCALE.step));

logoBox.addEventListener("click", () => logoInput.click());
logoInput.addEventListener("change", () => {
  const file = logoInput.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    logoImg.src = reader.result;
    logoImg.hidden = false;
    logoHint.hidden = true;
  };
  reader.readAsDataURL(file);
});

window.addEventListener("resize", () => applyLayout());
new ResizeObserver(() => applyLayout()).observe(documentScroll);

/** Called from price calculator — replace line items and optional project title. */
window.addInvoiceRows = function addInvoiceRows(rows, projectTitle) {
  if (projectTitle) {
    const titleEl = document.getElementById("projectTitle");
    if (titleEl) titleEl.value = projectTitle;
  }
  if (Array.isArray(rows) && rows.length) {
    setRows(rows);
  }
  recalc();
};

applySample(structuredClone(SAMPLE));
