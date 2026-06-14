# Invoice Generator — Full Source

Self-contained invoice editor (A4 layout, live totals, PDF export via [html2pdf.js](https://github.com/eKoopmans/html2pdf.js)).

**Files in this folder:** `index.html`, `styles.css`, `app.js`

**Run locally:** `npx serve . -l 3060` then open http://localhost:3060

---

## HTML (`index.html`)

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Invoice Generator</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link
    href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,700&family=Literata:opsz,wght@7..72,400;7..72,600&display=swap"
    rel="stylesheet"
  />
  <link rel="stylesheet" href="styles.css" />
</head>
<body>
  <div class="page">
    <main class="studio" id="studio" aria-label="Invoice studio">
      <!-- Controls (top) -->
      <header class="controls" aria-label="Document controls">
        <div class="controls__head">
          <h1 class="controls__title">Invoice Generator</h1>
          <p class="controls__sub">A4 document · edit below · export when ready</p>
        </div>

        <div class="toolbar" role="toolbar" aria-label="Invoice toolbar">
          <select id="currencySelect" class="toolbar-currency-select" aria-label="Currency">
            <option value="USD">USD ($)</option>
            <option value="EUR">EUR (€)</option>
            <option value="GBP">GBP (£)</option>
            <option value="INR">INR (₹)</option>
          </select>

          <div class="toolbar__font" aria-label="Font size">
            <button type="button" class="toolbar-font-btn" id="fontDownBtn" aria-label="Smaller text">
              <span class="toolbar-font-glyph toolbar-font-glyph--sm">a</span>
            </button>
            <button type="button" class="toolbar-font-btn" id="fontUpBtn" aria-label="Larger text">
              <span class="toolbar-font-glyph toolbar-font-glyph--lg">A</span>
            </button>
          </div>

          <div class="toolbar__spacer" aria-hidden="true"></div>

          <button type="button" class="toolbar-text-btn" id="resetBtn">Reset</button>
          <button
            type="button"
            class="toolbar-download-btn"
            id="downloadPdfBtn"
            aria-label="Download PDF"
          >
            <svg class="toolbar-download-icon" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
              <path
                d="M12 4v10m0 0l3.5-3.5M12 14l-3.5-3.5M5 19h14"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
            <span class="toolbar-download-label">Download</span>
          </button>
        </div>
      </header>

      <!-- Editable A4 document (bottom) -->
      <section class="document" aria-label="Editable invoice">
        <div class="document__scroll" id="documentScroll">
          <div class="document__fit" id="documentFit">
            <div class="scale-layer" id="invoiceScaleWrapper">
              <div class="page-frame" id="invoiceRoot" data-theme="light">
                <article class="invoice" id="invoice">
                  <header class="invoice__banner">
                    <span class="invoice__banner-prefix">Invoice</span>
                    <span class="invoice__banner-sep">|</span>
                    <input
                      class="invoice__banner-title"
                      type="text"
                      id="projectTitle"
                      value="Riviga Website Design"
                      aria-label="Project title"
                    />
                  </header>

                  <div class="invoice__body">
                    <section class="invoice__cards" aria-label="Invoice metadata">
                      <div class="info-card">
                        <h2 class="info-card__heading">Client</h2>
                        <dl class="field-list">
                          <div class="field-row"><dt>Name</dt><dd><input type="text" data-field="clientName" value="Peter Gregory" /></dd></div>
                          <div class="field-row"><dt>Company</dt><dd><input type="text" data-field="clientCompany" value="Riviga Ventures" /></dd></div>
                          <div class="field-row"><dt>Email</dt><dd><input type="email" data-field="clientEmail" value="peter@riviga.com" /></dd></div>
                          <div class="field-row"><dt>Phone</dt><dd><input type="text" data-field="clientPhone" value="+1 8733 983 9283" /></dd></div>
                        </dl>
                      </div>
                      <div class="info-card">
                        <h2 class="info-card__heading">Billed to</h2>
                        <dl class="field-list">
                          <div class="field-row"><dt>Name</dt><dd><input type="text" data-field="billName" value="Richard Hendricks" /></dd></div>
                          <div class="field-row"><dt>Company</dt><dd><input type="text" data-field="billCompany" value="Pied Piper" /></dd></div>
                          <div class="field-row"><dt>Address</dt><dd><textarea data-field="billAddress" rows="2">5230 Newell Road, Palo Alto</textarea></dd></div>
                        </dl>
                      </div>
                      <div class="info-card">
                        <h2 class="info-card__heading">Invoice details</h2>
                        <dl class="field-list">
                          <div class="field-row"><dt>Number</dt><dd><input type="text" data-field="invoiceNumber" value="#00872" /></dd></div>
                          <div class="field-row"><dt>Issued</dt><dd><input type="text" data-field="issueDate" value="17/09/21" /></dd></div>
                          <div class="field-row"><dt>Due</dt><dd><input type="text" data-field="dueDate" value="21/09/21" /></dd></div>
                        </dl>
                      </div>
                    </section>

                    <section class="invoice__project" aria-label="Project details">
                      <h2 class="section-title">Project details</h2>
                      <textarea
                        class="project-desc"
                        id="projectDesc"
                        rows="2"
                        aria-label="Project description"
                      >Revamping the current Riviga website to a modern, professional design with a focus on user experience and conversion optimization. The project includes a complete redesign of the homepage, product pages, and checkout flow.</textarea>

                      <div class="table-wrap">
                        <table class="line-table" id="lineTable">
                          <thead>
                            <tr>
                              <th scope="col">Deliverables</th>
                              <th scope="col" class="col-price">Price</th>
                              <th scope="col" class="col-actions" aria-label="Actions"></th>
                            </tr>
                          </thead>
                          <tbody id="lineBody"></tbody>
                          <tfoot>
                            <tr class="row-total">
                              <th scope="row">TOTAL</th>
                              <td class="col-price" id="totalDisplay">$ 0.00</td>
                              <td></td>
                            </tr>
                            <tr class="row-advance">
                              <th scope="row">
                                Advance
                                <label class="advance-label">
                                  <input type="number" id="advancePct" min="0" max="100" value="20" aria-label="Advance percent" />
                                  <span>%</span>
                                </label>
                              </th>
                              <td class="col-price" id="advanceDisplay">$ 0.00</td>
                              <td></td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                      <button type="button" class="invoice-inline-btn" id="addRowBtn">+ Add line</button>
                    </section>

                    <footer class="invoice__footer">
                      <button type="button" class="logo-placeholder" id="logoBox" title="Upload logo">
                        <img id="logoImg" alt="" hidden />
                        <span id="logoHint">Logo</span>
                      </button>
                      <input type="file" id="logoInput" accept="image/*" hidden />
                      <div class="footer-col">
                        <h3>Contact</h3>
                        <dl class="footer-fields">
                          <div><dt>Name</dt><dd><input type="text" data-field="contactName" value="Richard Hendricks" /></dd></div>
                          <div><dt>Email</dt><dd><input type="email" data-field="contactEmail" value="richard@piedpiper.com" /></dd></div>
                          <div><dt>Phone</dt><dd><input type="text" data-field="contactPhone" value="+1 8733 983 9283" /></dd></div>
                        </dl>
                      </div>
                      <div class="footer-col">
                        <h3>Payment</h3>
                        <dl class="footer-fields">
                          <div><dt>Name</dt><dd><input type="text" data-field="wireName" value="Richard Hendricks" /></dd></div>
                          <div><dt>Account</dt><dd><input type="text" data-field="wireAccount" value="1234567890" /></dd></div>
                          <div><dt>IFSC</dt><dd><input type="text" data-field="wireIfsc" value="ABCD0123456" /></dd></div>
                          <div><dt>G-pay</dt><dd><input type="text" data-field="wireGpay" value="richard@piedpiper.com" /></dd></div>
                        </dl>
                      </div>
                    </footer>
                  </div>
                </article>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  </div>

  <script src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js" defer></script>
  <script src="app.js" defer></script>
</body>
</html>
```

---

## CSS (`styles.css`)

```css
/* Bencium-inspired: warm industrial editorial — stone neutrals + terracotta accent */
:root {
  --stone-50: #f7f3ee;
  --stone-100: #ebe4da;
  --stone-200: #d9cfc3;
  --stone-700: #4a433c;
  --stone-900: #2a2622;
  --terra: #c45d3e;
  --terra-dark: #a34a30;
  --terra-soft: rgba(196, 93, 62, 0.12);
  --surface: #fffcf8;
  --shadow: 0 24px 64px rgba(42, 38, 34, 0.14);
  --radius: 14px;
  --font-display: "Fraunces", Georgia, serif;
  --font-body: "Literata", Georgia, serif;
  --a4-width: 210mm;
  --a4-height: 297mm;
  --studio-max: 520px;
  --ease: cubic-bezier(0.22, 1, 0.36, 1);
}

*,
*::before,
*::after {
  box-sizing: border-box;
}

html {
  font-size: 16px;
}

body {
  margin: 0;
  min-height: 100dvh;
  font-family: var(--font-body);
  font-size: 0.9375rem;
  line-height: 1.5;
  color: var(--stone-900);
  background:
    radial-gradient(ellipse 120% 80% at 50% -20%, var(--terra-soft), transparent 55%),
    var(--stone-50);
  -webkit-font-smoothing: antialiased;
}

.page {
  min-height: 100dvh;
  padding: 12px;
  display: flex;
  align-items: stretch;
  justify-content: center;
}

/* Tall narrow main component */
.studio {
  width: 100%;
  max-width: var(--studio-max);
  min-height: calc(100dvh - 24px);
  max-height: calc(100dvh - 24px);
  display: flex;
  flex-direction: column;
  background: var(--surface);
  border: 1px solid var(--stone-200);
  border-radius: var(--radius);
  box-shadow: var(--shadow);
  overflow: hidden;
}

@media (min-width: 640px) {
  .page {
    padding: 20px;
  }

  .studio {
    min-height: min(920px, calc(100dvh - 40px));
    max-height: min(920px, calc(100dvh - 40px));
  }
}

/* ── Controls (top) ─────────────────────────────────────────── */
.controls {
  flex-shrink: 0;
  padding: 16px 14px 12px;
  border-bottom: 1px solid var(--stone-200);
  background: linear-gradient(180deg, #fff 0%, var(--stone-50) 100%);
}

.controls__title {
  margin: 0;
  font-family: var(--font-display);
  font-size: 1.75rem;
  font-weight: 700;
  letter-spacing: -0.02em;
  line-height: 1.1;
  color: var(--stone-900);
}

.controls__sub {
  margin: 4px 0 0;
  font-size: 0.75rem;
  color: var(--stone-700);
  opacity: 0.85;
}

.toolbar {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 12px;
  flex-wrap: wrap;
}

.toolbar-currency-select {
  border: 1px solid var(--stone-200);
  border-radius: 8px;
  padding: 6px 10px;
  height: 32px;
  background: #fff;
  font-family: inherit;
  font-size: 0.8125rem;
  color: var(--stone-900);
  flex-shrink: 0;
}

.toolbar__font {
  display: flex;
  align-items: center;
  gap: 4px;
}

.toolbar-font-btn {
  width: 32px;
  height: 32px;
  flex-shrink: 0;
  border: 1px solid var(--stone-200);
  border-radius: 8px;
  background: #fff;
  color: var(--stone-900);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: border-color 0.15s var(--ease), color 0.15s var(--ease), transform 0.1s;
}

.toolbar-font-btn:hover {
  border-color: var(--terra);
  color: var(--terra);
}

.toolbar-font-btn:active {
  transform: scale(0.96);
}

.toolbar-font-glyph {
  font-family: var(--font-body);
  line-height: 1;
  font-weight: 600;
}

.toolbar-font-glyph--sm {
  font-size: 0.75rem;
}

.toolbar-font-glyph--lg {
  font-size: 1.05rem;
}

.toolbar__spacer {
  flex: 1;
  min-width: 8px;
}

.toolbar-text-btn {
  border: 1px solid var(--stone-200);
  border-radius: 8px;
  padding: 0 12px;
  height: 32px;
  background: #fff;
  color: var(--stone-900);
  font-family: inherit;
  font-size: 0.8125rem;
  font-weight: 600;
  cursor: pointer;
  flex-shrink: 0;
  transition: border-color 0.15s var(--ease), background 0.15s var(--ease);
}

.toolbar-text-btn:hover {
  border-color: var(--stone-700);
  background: var(--stone-50);
}

.toolbar-download-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 32px;
  padding: 0 12px;
  border: none;
  border-radius: 8px;
  background: var(--terra);
  color: #fff;
  font-family: inherit;
  font-size: 0.8125rem;
  font-weight: 600;
  cursor: pointer;
  flex-shrink: 0;
  transition: background 0.15s var(--ease), opacity 0.15s;
}

.toolbar-download-btn:hover {
  background: var(--terra-dark);
}

.toolbar-download-btn:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.toolbar-download-icon {
  display: block;
  color: #fff;
  flex-shrink: 0;
}

.toolbar-download-label {
  line-height: 1;
}

/* ── Document area (bottom) ─────────────────────────────────── */
.document {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  background:
    repeating-linear-gradient(
      -12deg,
      transparent,
      transparent 11px,
      rgba(42, 38, 34, 0.03) 11px,
      rgba(42, 38, 34, 0.03) 12px
    ),
    var(--stone-100);
}

.document__scroll {
  flex: 1;
  min-height: 0;
  overflow: auto;
  -webkit-overflow-scrolling: touch;
  padding: 12px 10px 16px;
}

.document__fit {
  display: flex;
  justify-content: center;
  min-height: min-content;
}

.scale-layer {
  transform-origin: top center;
  transition: transform 0.15s var(--ease);
  width: var(--a4-width);
}

.page-frame {
  width: var(--a4-width);
}

/* ── Invoice (A4) ───────────────────────────────────────────── */
#invoiceRoot {
  --inv-zoom-font: 1;
  --inv-overall: 1;
}

.invoice {
  --inv-base: calc(0.78rem * var(--inv-zoom-font) * var(--inv-overall));
  --inv-space: calc(0.75rem * var(--inv-overall));
  --inv-gap: calc(0.4rem * var(--inv-overall));
  --inv-r: calc(6px * var(--inv-overall));

  box-sizing: border-box;
  width: var(--a4-width);
  height: var(--a4-height);
  min-height: var(--a4-height);
  max-height: var(--a4-height);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  font-family: var(--font-body);
  font-size: var(--inv-base);
  background: var(--inv-bg);
  color: var(--inv-text);
  border-radius: 2px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.18);
}

#invoiceRoot[data-theme="light"] {
  --inv-bg: #f8f6f2;
  --inv-surface: #ffffff;
  --inv-banner: #2a2622;
  --inv-text: #2a2622;
  --inv-muted: #6b635a;
  --inv-border: #e0d8ce;
  --inv-total-bg: #ebe4da;
  --inv-footer-bg: #f0ebe4;
  --inv-focus: var(--terra);
}

#invoiceRoot[data-theme="dark"] {
  --inv-bg: #1e1c1a;
  --inv-surface: #2c2926;
  --inv-banner: #0f0e0d;
  --inv-text: #f5f0eb;
  --inv-muted: #a39a90;
  --inv-border: #3d3833;
  --inv-total-bg: #3a3530;
  --inv-footer-bg: #252220;
  --inv-focus: #e07a5f;
}

.invoice__banner {
  flex-shrink: 0;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.3rem 0.45rem;
  padding: calc(0.7rem * var(--inv-overall)) calc(0.9rem * var(--inv-overall));
  background: var(--inv-banner);
  color: #fff;
  font-weight: 600;
  font-size: calc(1.05rem * var(--inv-zoom-font) * var(--inv-overall));
}

.invoice__banner-prefix,
.invoice__banner-sep {
  color: #f5f0eb;
}

.invoice__banner-title {
  flex: 1 1 80px;
  min-width: 0;
  border: none;
  background: transparent;
  color: #e8eef6;
  -webkit-text-fill-color: #e8eef6;
  caret-color: #fff;
  font: inherit;
  font-weight: 600;
  padding: 2px 4px;
  border-radius: 3px;
  outline: none;
}

.invoice__banner-title:focus {
  background: rgba(255, 255, 255, 0.1);
}

.invoice__body {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: var(--inv-gap);
  overflow: hidden;
  padding: var(--inv-space);
}

.invoice__cards {
  flex-shrink: 0;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: var(--inv-gap);
  margin-bottom: 0;
}

@media (max-width: 400px) {
  .invoice__cards {
    grid-template-columns: 1fr;
  }
}

.info-card {
  background: var(--inv-surface);
  border: 1px solid var(--inv-border);
  border-radius: var(--inv-r);
  padding: calc(0.5rem * var(--inv-overall));
  min-width: 0;
}

.info-card__heading {
  margin: 0 0 calc(0.35rem * var(--inv-overall));
  font-size: calc(0.8rem * var(--inv-zoom-font) * var(--inv-overall));
  font-weight: 600;
}

.section-title {
  margin: 0;
  font-size: calc(0.8rem * var(--inv-zoom-font) * var(--inv-overall));
  font-weight: 600;
}

.field-list {
  margin: 0;
}

.field-row {
  display: grid;
  grid-template-columns: minmax(52px, 36%) 1fr;
  gap: 2px 4px;
  margin-bottom: 2px;
}

.field-row dt {
  font-size: calc(0.65rem * var(--inv-zoom-font));
  color: var(--inv-muted);
  margin: 0;
  padding-top: 3px;
}

.field-row dd {
  margin: 0;
  min-width: 0;
}

.invoice input,
.invoice textarea,
.invoice select {
  width: 100%;
  border: 1px solid transparent;
  border-radius: 3px;
  background: transparent;
  color: var(--inv-text);
  font: inherit;
  font-size: inherit;
  padding: 2px 3px;
  outline: none;
  min-width: 0;
}

.invoice input:focus,
.invoice textarea:focus {
  border-color: var(--inv-focus);
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--inv-focus) 28%, transparent);
}

.invoice textarea {
  resize: none;
  min-height: 2rem;
}

.invoice__project {
  flex: 1 1 auto;
  min-height: 0;
  display: grid;
  grid-template-rows: auto minmax(2.25rem, 0.9fr) minmax(3.5rem, 1.6fr) auto;
  gap: calc(0.35rem * var(--inv-overall));
  overflow: hidden;
  background: var(--inv-surface);
  border: 1px solid var(--inv-border);
  border-radius: var(--inv-r);
  padding: var(--inv-space);
  margin-bottom: 0;
}

.project-desc {
  width: 100%;
  min-height: 0;
  height: 100%;
  margin: 0;
  line-height: 1.4;
  overflow: auto;
  -webkit-overflow-scrolling: touch;
}

.table-wrap {
  min-height: 0;
  height: 100%;
  overflow: auto;
  -webkit-overflow-scrolling: touch;
  border: 1px solid var(--inv-border);
  border-radius: calc(4px * var(--inv-overall));
}

.line-table {
  width: 100%;
  border-collapse: collapse;
  min-width: 180px;
}

.line-table th,
.line-table td {
  padding: calc(0.3rem * var(--inv-overall)) calc(0.35rem * var(--inv-overall));
  border-bottom: 1px solid var(--inv-border);
  vertical-align: middle;
}

.line-table thead th {
  font-size: calc(0.68rem * var(--inv-zoom-font));
  font-weight: 600;
  color: var(--inv-muted);
  text-align: left;
}

.col-price {
  width: 30%;
  min-width: 64px;
  text-align: right;
}

.col-actions {
  width: 24px;
}

.col-price input {
  text-align: right;
}

.row-total th,
.row-total td {
  font-weight: 700;
  background: var(--inv-total-bg);
  border-bottom: none;
}

.row-advance th,
.row-advance td {
  font-weight: 600;
  border-bottom: none;
}

.advance-label {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  margin-left: 4px;
  font-weight: 500;
  color: var(--inv-muted);
}

.advance-label input {
  width: 2rem;
  text-align: center;
}

.row-remove {
  border: none;
  background: transparent;
  color: var(--inv-muted);
  cursor: pointer;
  padding: 0;
  font-size: 1rem;
  line-height: 1;
  min-width: 24px;
  min-height: 24px;
}

.row-remove:hover {
  color: #c45d3e;
}

.invoice-inline-btn {
  margin-top: 0;
  flex-shrink: 0;
  border: 1px dashed var(--inv-border);
  border-radius: 6px;
  padding: 6px 10px;
  background: transparent;
  color: var(--inv-focus);
  font: inherit;
  font-size: calc(0.75rem * var(--inv-zoom-font));
  font-weight: 600;
  cursor: pointer;
}

.invoice-inline-btn:hover {
  border-color: var(--inv-focus);
  background: color-mix(in srgb, var(--inv-focus) 8%, transparent);
}

.invoice__footer {
  flex-shrink: 0;
  display: grid;
  grid-template-columns: 56px 1fr 1fr;
  gap: var(--inv-gap);
  padding: var(--inv-space);
  min-height: calc(4.75rem * var(--inv-overall));
  background: var(--inv-footer-bg);
  border-radius: var(--inv-r);
}

@media (max-width: 360px) {
  .invoice__footer {
    grid-template-columns: 1fr;
  }
}

.logo-placeholder {
  width: 52px;
  height: 52px;
  border: 2px dashed var(--inv-border);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  overflow: hidden;
  background: var(--inv-surface);
  color: var(--inv-muted);
  font-size: calc(0.6rem * var(--inv-zoom-font));
  font-weight: 600;
  padding: 0;
}

.logo-placeholder img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.footer-col h3 {
  margin: 0 0 3px;
  font-size: calc(0.62rem * var(--inv-zoom-font));
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--inv-muted);
}

.footer-fields {
  margin: 0;
}

.footer-fields > div {
  display: grid;
  grid-template-columns: minmax(48px, 38%) 1fr;
  gap: 2px 4px;
}

.footer-fields dt {
  font-size: calc(0.6rem * var(--inv-zoom-font));
  color: var(--inv-muted);
  margin: 0;
  padding-top: 2px;
}

.footer-fields dd {
  margin: 0;
  min-width: 0;
}

/* PDF export: reveal scrolled regions so line items are captured */
.invoice.is-exporting {
  height: auto !important;
  max-height: none !important;
}

.invoice.is-exporting .invoice__body,
.invoice.is-exporting .invoice__project,
.invoice.is-exporting .table-wrap,
.invoice.is-exporting .project-desc {
  overflow: visible !important;
  height: auto !important;
  max-height: none !important;
}

.invoice.is-exporting .invoice__project {
  display: block;
}

@media (max-width: 380px) {
  .controls {
    padding: 12px 10px 10px;
  }

  .controls__title {
    font-size: 1.5rem;
  }

  .toolbar__spacer {
    display: none;
  }

  .toolbar-download-btn {
    flex: 1 1 auto;
    justify-content: center;
  }
}
```

---

## JavaScript (`app.js`)

```javascript
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

async function downloadPdf() {
  if (typeof html2pdf === "undefined") {
    alert("PDF library still loading — try again in a moment.");
    return;
  }

  const invoice = document.getElementById("invoice");
  const invoiceNumber =
    document.querySelector("[data-field='invoiceNumber']")?.value?.trim() ||
    "invoice";
  const safeName = invoiceNumber.replace(/[^\w.-]+/g, "_");

  downloadPdfBtn.disabled = true;
  downloadPdfBtn.setAttribute("aria-busy", "true");
  const downloadLabel = downloadPdfBtn.querySelector(".toolbar-download-label");
  const savedLabel = downloadLabel?.textContent ?? "Download";
  if (downloadLabel) downloadLabel.textContent = "Generating…";

  const savedTransform = invoiceScaleWrapper.style.transform;
  invoiceScaleWrapper.style.transform = "none";
  invoiceScaleWrapper.style.marginBottom = "0";
  invoice.classList.add("is-exporting");

  try {
    await html2pdf()
      .set({
        margin: [8, 8, 8, 8],
        filename: `${safeName}.pdf`,
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, logging: false, backgroundColor: null },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
      })
      .from(invoice)
      .save();
  } catch (err) {
    console.error(err);
    alert("Could not generate PDF. Try again or reduce content size.");
  } finally {
    invoice.classList.remove("is-exporting");
    invoiceScaleWrapper.style.transform = savedTransform;
    applyLayout();
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

applySample(structuredClone(SAMPLE));
```
