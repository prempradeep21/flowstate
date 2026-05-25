/**
 * One-off: generate canvas card position rules PDF (no Puppeteer).
 * Run: node scripts/generate-position-rules-pdf.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import PDFDocument from "pdfkit";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const mdPath = path.join(root, "docs", "canvas-card-position-rules.md");
const outPath = path.join(root, "docs", "canvas-card-position-rules.pdf");

const PAGE_W = 612;
const PAGE_H = 792;
const MARGIN = 54;
const CONTENT_W = PAGE_W - MARGIN * 2;
const BODY_SIZE = 10;
const H1_SIZE = 18;
const H2_SIZE = 14;
const H3_SIZE = 12;
const LINE_GAP = 4;

function stripMdInline(text) {
  return text
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");
}

function parseTableRow(line) {
  return line
    .split("|")
    .map((c) => c.trim())
    .filter((c, i, arr) => !(i === 0 && c === "") && !(i === arr.length - 1 && c === ""));
}

function isTableSeparator(line) {
  return /^\|?[\s\-:|]+\|?$/.test(line.trim());
}

const doc = new PDFDocument({
  size: "LETTER",
  margins: { top: MARGIN, bottom: MARGIN, left: MARGIN, right: MARGIN },
  info: {
    Title: "Card Position Rules on the Canvas",
    Author: "Branch AI",
    Subject: "Canvas layout reference",
  },
});

const stream = fs.createWriteStream(outPath);
doc.pipe(stream);

let y = doc.y;

function ensureSpace(needed) {
  if (y + needed > PAGE_H - MARGIN) {
    doc.addPage();
    y = MARGIN;
    doc.y = y;
  }
}

function setY(newY) {
  y = newY;
  doc.y = y;
}

function writeParagraph(text, opts = {}) {
  const size = opts.size ?? BODY_SIZE;
  const font = opts.font ?? "Helvetica";
  const indent = opts.indent ?? 0;
  const width = CONTENT_W - indent;
  doc.font(font).fontSize(size);
  const h = doc.heightOfString(text, { width });
  ensureSpace(h + LINE_GAP);
  doc.text(text, MARGIN + indent, y, { width, lineGap: 2 });
  setY(doc.y + LINE_GAP);
}

function writeHeading(text, level) {
  const size = level === 1 ? H1_SIZE : level === 2 ? H2_SIZE : H3_SIZE;
  const font = level <= 2 ? "Helvetica-Bold" : "Helvetica-Bold";
  setY(y + (level === 1 ? 8 : 6));
  writeParagraph(stripMdInline(text), { size, font });
}

function drawTable(headers, rows) {
  const colCount = headers.length;
  const colW = CONTENT_W / colCount;
  const cellPad = 4;
  const fontSize = 9;
  doc.font("Helvetica-Bold").fontSize(fontSize);
  const headerH = Math.max(
    ...headers.map((h) => doc.heightOfString(h, { width: colW - cellPad * 2 })),
  );
  const rowHeights = rows.map((row) =>
    Math.max(
      ...row.map((cell, i) =>
        doc
          .font("Helvetica")
          .fontSize(fontSize)
          .heightOfString(String(cell), { width: colW - cellPad * 2 }),
      ),
    ),
  );
  doc.font("Helvetica-Bold").fontSize(fontSize);
  const totalH =
    headerH + cellPad * 2 + rowHeights.reduce((s, h) => s + h + cellPad * 2, 0) + 8;
  ensureSpace(totalH);

  let tableY = y;
  doc.font("Helvetica-Bold").fontSize(fontSize);
  headers.forEach((h, i) => {
    doc.text(h, MARGIN + i * colW + cellPad, tableY + cellPad, {
      width: colW - cellPad * 2,
    });
  });
  tableY += headerH + cellPad * 2;
  doc
    .moveTo(MARGIN, tableY)
    .lineTo(MARGIN + CONTENT_W, tableY)
    .strokeColor("#cccccc")
    .stroke();

  rows.forEach((row, ri) => {
    const rh = rowHeights[ri] + cellPad * 2;
    row.forEach((cell, i) => {
      doc.font("Helvetica").fontSize(fontSize).text(
        String(cell),
        MARGIN + i * colW + cellPad,
        tableY + cellPad,
        { width: colW - cellPad * 2 },
      );
    });
    tableY += rh;
    if (ri < rows.length - 1) {
      doc
        .moveTo(MARGIN, tableY)
        .lineTo(MARGIN + CONTENT_W, tableY)
        .strokeColor("#eeeeee")
        .stroke();
    }
  });
  setY(tableY + 10);
}

function writeCodeBlock(lines) {
  const text = lines.join("\n");
  doc.font("Courier").fontSize(9);
  const h = doc.heightOfString(text, { width: CONTENT_W - 16 });
  ensureSpace(h + 16);
  const boxY = y;
  doc.rect(MARGIN, boxY, CONTENT_W, h + 12).fillColor("#f5f5f5").fill();
  doc.fillColor("#000000");
  doc.text(text, MARGIN + 8, boxY + 6, { width: CONTENT_W - 16, lineGap: 1 });
  setY(boxY + h + 18);
  doc.font("Helvetica").fontSize(BODY_SIZE);
}

const raw = fs.readFileSync(mdPath, "utf8");
const lines = raw.split(/\r?\n/);

let i = 0;
let codeBuffer = null;
let tableBuffer = null;

while (i < lines.length) {
  const line = lines[i];

  if (codeBuffer !== null) {
    if (line.startsWith("```")) {
      writeCodeBlock(codeBuffer);
      codeBuffer = null;
      i++;
      continue;
    }
    codeBuffer.push(line);
    i++;
    continue;
  }

  if (line.startsWith("```")) {
    codeBuffer = [];
    i++;
    continue;
  }

  if (tableBuffer !== null) {
    if (line.trim().startsWith("|")) {
      if (!isTableSeparator(line)) {
        tableBuffer.rows.push(parseTableRow(line));
      }
      i++;
      continue;
    }
    drawTable(tableBuffer.headers, tableBuffer.rows);
    tableBuffer = null;
    continue;
  }

  if (line.trim().startsWith("|") && !isTableSeparator(line)) {
    const headers = parseTableRow(line);
    i++;
    if (i < lines.length && isTableSeparator(lines[i])) i++;
    tableBuffer = { headers, rows: [] };
    continue;
  }

  if (line.startsWith("# ")) {
    writeHeading(line.slice(2), 1);
    i++;
    continue;
  }
  if (line.startsWith("## ")) {
    writeHeading(line.slice(3), 2);
    i++;
    continue;
  }
  if (line.startsWith("### ")) {
    writeHeading(line.slice(4), 3);
    i++;
    continue;
  }

  if (line.trim() === "---") {
    setY(y + 6);
    doc
      .moveTo(MARGIN, y)
      .lineTo(MARGIN + CONTENT_W, y)
      .strokeColor("#dddddd")
      .stroke();
    setY(y + 10);
    i++;
    continue;
  }

  if (line.trim() === "") {
    setY(y + 6);
    i++;
    continue;
  }

  if (line.startsWith("- ")) {
    writeParagraph("• " + stripMdInline(line.slice(2)), { indent: 12 });
    i++;
    continue;
  }

  if (/^\d+\.\s/.test(line)) {
    writeParagraph(stripMdInline(line), { indent: 12 });
    i++;
    continue;
  }

  writeParagraph(stripMdInline(line));
  i++;
}

if (tableBuffer) drawTable(tableBuffer.headers, tableBuffer.rows);
if (codeBuffer) writeCodeBlock(codeBuffer);

doc.end();

stream.on("finish", () => {
  console.log("Wrote", outPath);
});
stream.on("error", (err) => {
  console.error(err);
  process.exit(1);
});
