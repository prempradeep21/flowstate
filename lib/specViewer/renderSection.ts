import { marked } from "marked";

const CHRONOLOGY_CATEGORIES: Record<string, string> = {
  Canvas: "cat-canvas",
  Cards: "cat-cards",
  Branching: "cat-branching",
  Artifacts: "cat-artifacts",
  Sessions: "cat-sessions",
  Collaboration: "cat-collaboration",
  "API & Context": "cat-api",
  "Auth & Onboarding": "cat-auth",
  "UI & Navigation": "cat-ui",
  Technical: "cat-technical",
};

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-");
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function categoryBadge(label: string): string {
  const trimmed = label.trim();
  const cls = CHRONOLOGY_CATEGORIES[trimmed] ?? "cat-default";
  return `<span class="chrono-cat ${cls}">${escapeHtml(trimmed)}</span>`;
}

function parseSessionLabel(label: string): { dateDay: string; period: string } {
  const parts = label.split(", ").map((part) => part.trim());
  const weekdays = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
  ];
  if (parts.length >= 3 && weekdays.includes(parts[1])) {
    return {
      dateDay: `${parts[0]}, ${parts[1]}`,
      period: parts.slice(2).join(", "),
    };
  }
  return { dateDay: label, period: "" };
}

function enhancePrinciples(html: string): string {
  const match = html.match(
    /(<h3[^>]*>Governing principles<\/h3>\s*)(<ol>[\s\S]*?<\/ol>)/i,
  );
  if (!match) return html;

  const items = [...match[2].matchAll(/<li><strong>(.*?)<\/strong>\.\s*(.*?)<\/li>/g)];
  const list = `<ol class="principle-list">${items
    .map(
      ([, title, body], idx) =>
        `<li><span class="principle-num">${idx + 1}</span><div><strong>${title}.</strong> ${body}</div></li>`,
    )
    .join("")}</ol>`;

  return html.replace(match[0], match[1] + list);
}

function enhanceChronology(html: string, sectionIdValue: string): string {
  const introEnd = html.indexOf("<hr>");
  const intro = introEnd >= 0 ? html.slice(0, introEnd) : "";
  const body = introEnd >= 0 ? html.slice(introEnd) : html;

  const sessionBlocks = body.split(/(?=<h3>Session ·)/g).filter(Boolean);

  const sessions = sessionBlocks
    .map((block) => {
      const titleMatch = block.match(/<h3>(Session · [^<]+)<\/h3>/);
      if (!titleMatch) return "";

      const title = titleMatch[1];
      let inner = block.replace(/<h3>Session · [^<]+<\/h3>/, "");

      const metaMatch = inner.match(/<p><strong>([\s\S]*?)<\/strong><\/p>/);
      const meta = metaMatch ? metaMatch[1] : "";
      if (metaMatch) inner = inner.replace(metaMatch[0], "");

      inner = inner.replace(/<table>[\s\S]*?<\/table>/g, (tableHtml) => {
        const wrapped = tableHtml.replace("<table>", '<table class="chrono-table">');
        return `<div class="table-wrap chrono-table-wrap">${wrapped}</div>`;
      });

      const table = inner.match(
        /<div class="table-wrap chrono-table-wrap">[\s\S]*?<\/div>/,
      );
      let tableContent = table ? table[0] : "";
      tableContent = tableContent.replace(
        /<tr>\s*<td>([^<]*)<\/td>\s*<td>([^<]*)<\/td>\s*<td>([\s\S]*?)<\/td>\s*<\/tr>/g,
        (_, time, category, update) =>
          `<tr><td class="chrono-time">${escapeHtml(time.trim())}</td><td>${categoryBadge(category)}</td><td>${update.trim()}</td></tr>`,
      );

      const label = title.replace(/^Session · /, "").trim();
      const { dateDay, period } = parseSessionLabel(label);
      const anchorId = `${sectionIdValue}-${slugify(title)}`;

      return `
        <article class="chronology-session" id="${anchorId}">
          <div class="chrono-marker" aria-hidden="true"></div>
          <div class="chrono-session-card">
            <header class="chrono-session-header">
              <p class="chrono-date">${escapeHtml(dateDay)}</p>
              <h3 class="chrono-session-title">${escapeHtml(period)}</h3>
              ${meta ? `<p class="chrono-meta">${meta}</p>` : ""}
            </header>
            ${tableContent}
          </div>
        </article>`;
    })
    .join("");

  const rulesTable = intro.replace(
    /<table>[\s\S]*?<\/table>/,
    (table) =>
      `<div class="table-wrap chrono-rules-wrap">${table.replace("<table>", '<table class="chrono-rules">')}</div>`,
  );

  return `${rulesTable}<div class="chronology-timeline">${sessions}</div>`;
}

function wrapGenericTables(html: string): string {
  return html.replace(
    /<table>/g,
    '<div class="table-wrap"><table>',
  ).replace(/<\/table>/g, "</table></div>");
}

export function renderSpecSectionHtml(
  title: string,
  body: string,
  sectionIdValue: string,
): string {
  marked.setOptions({ gfm: true, breaks: false });
  let html = marked.parse(body) as string;

  if (title.includes("Philosophy")) {
    html = enhancePrinciples(html);
  }
  if (title.includes("Chronology")) {
    html = enhanceChronology(html, sectionIdValue);
  } else if (!title.includes("Chronology")) {
    html = wrapGenericTables(html);
  }

  return html;
}
