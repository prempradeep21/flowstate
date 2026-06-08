marked.setOptions({
  gfm: true,
  breaks: false,
});

const SECTION_META = {
  "1. Chronology of Updates": { num: 1, desc: "Main-branch pushes grouped into working sessions" },
  "2. Product Vision": { num: 2, desc: "What Flowstate is and who it's for" },
  "3. Philosophy & Governing Principles": { num: 3, desc: "Core beliefs and decision filters" },
  "4. User Stories": { num: 4, desc: "V1 requirements as actor–action–outcome stories" },
  "5. Out of Scope": { num: 5, desc: "Explicitly deferred features" },
  "6. Decisions & Design Rationale": { num: 6, desc: "Every decision with rationale and provenance" },
  "7. User Interface Specification": { num: 7, desc: "Visual and layout specifications" },
  "8. Interaction Model": { num: 8, desc: "How users start threads, branch, and inherit context" },
  "9. Version Roadmap": { num: 9, desc: "V1, V2, V3 and unscheduled ideas" },
  "10. Technical Implementation": { num: 10, desc: "Stack, canvas, state, and persistence" },
  "11. API Handling": { num: 11, desc: "Browser-direct LLM calls and context construction" },
  "12. Onboarding": { num: 12, desc: "Developer landing flow and key validation" },
  "13. Open Questions": { num: 13, desc: "Unresolved decisions logged for later" },
  "14. Acceptance Checklist": { num: 14, desc: "Ship criteria for V1 completion" },
};

const CHRONOLOGY_CATEGORIES = {
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

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-");
}

function sectionId(title) {
  return "section-" + slugify(title.replace(/^\d+\.\s*/, ""));
}

function parseSections(markdown) {
  const lines = markdown.split("\n");
  let heroLines = [];
  let i = 0;

  while (i < lines.length && !lines[i].startsWith("## 1.")) {
    heroLines.push(lines[i]);
    i++;
  }

  let hero = heroLines.join("\n").trim();
  hero = hero.replace(/\n## Table of Contents[\s\S]*?(?=\n---\s*$)/m, "").trim();
  const sections = [];

  while (i < lines.length) {
    const line = lines[i];
    if (!line.startsWith("## ")) {
      i++;
      continue;
    }

    const title = line.slice(3).trim();
    if (title === "Table of Contents") {
      i++;
      continue;
    }

    const bodyLines = [];
    i++;
    while (i < lines.length && !lines[i].startsWith("## ")) {
      bodyLines.push(lines[i]);
      i++;
    }

    let body = bodyLines.join("\n").trim();
    body = body.replace(/^---\s*$/gm, "").trim();

    const subsections = [];
    const subRegex = /^### (.+)$/gm;
    let match;
    while ((match = subRegex.exec(body)) !== null) {
      subsections.push(match[1]);
    }

    sections.push({
      title,
      id: sectionId(title),
      body,
      subsections,
      meta: SECTION_META[title] || { num: sections.length + 1, desc: "" },
    });
  }

  return { hero, sections };
}

function decidedByBadge(text) {
  const t = text.trim();
  if (!t) return text;
  if (/prem.*ai|ai.*prem/i.test(t)) {
    return `<span class="badge badge-both">${escapeHtml(t)}</span>`;
  }
  if (/^ai\b/i.test(t) || t === "AI") {
    return `<span class="badge badge-ai">${escapeHtml(t)}</span>`;
  }
  if (/^prem/i.test(t)) {
    return `<span class="badge badge-prem">${escapeHtml(t)}</span>`;
  }
  return escapeHtml(t);
}

function escapeHtml(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function enhanceDecisionTables(container) {
  container.querySelectorAll("table").forEach((table) => {
    const headers = [...table.querySelectorAll("thead th")].map((th) =>
      th.textContent.trim().toLowerCase()
    );
    if (!headers.includes("decided by")) return;

    table.classList.add("decision-table");
    const wrap = document.createElement("div");
    wrap.className = "table-wrap";
    table.parentNode.insertBefore(wrap, table);
    wrap.appendChild(table);

    table.querySelectorAll("tbody tr").forEach((row) => {
      const cells = row.querySelectorAll("td");
      if (cells.length >= 3) {
        const last = cells[cells.length - 1];
        last.innerHTML = decidedByBadge(last.textContent);
      }
    });
  });
}

function enhanceOpenQuestions(container) {
  container.querySelectorAll("table").forEach((table) => {
    const headers = [...table.querySelectorAll("thead th")].map((th) =>
      th.textContent.trim().toLowerCase()
    );
    if (!headers.includes("priority")) return;

    const wrap = document.createElement("div");
    wrap.className = "table-wrap";
    table.parentNode.insertBefore(wrap, table);
    wrap.appendChild(table);

    const priorityIdx = headers.indexOf("priority");
    table.querySelectorAll("tbody tr").forEach((row) => {
      const cells = row.querySelectorAll("td");
      const priorityCell = cells[priorityIdx];
      if (!priorityCell) return;

      const text = priorityCell.textContent.trim();
      if (/resolved/i.test(text)) {
        priorityCell.innerHTML = `<span class="badge badge-resolved">${escapeHtml(text)}</span>`;
      } else if (/high/i.test(text)) {
        priorityCell.innerHTML = `<span class="badge badge-priority-high">${escapeHtml(text)}</span>`;
      } else if (/medium/i.test(text)) {
        priorityCell.innerHTML = `<span class="badge badge-priority-medium">${escapeHtml(text)}</span>`;
      } else if (/low/i.test(text)) {
        priorityCell.innerHTML = `<span class="badge badge-priority-low">${escapeHtml(text)}</span>`;
      }
    });
  });
}

function categoryBadge(label) {
  const trimmed = label.trim();
  const cls = CHRONOLOGY_CATEGORIES[trimmed] || "cat-default";
  return `<span class="chrono-cat ${cls}">${escapeHtml(trimmed)}</span>`;
}

function parseSessionLabel(label) {
  const parts = label.split(", ").map((p) => p.trim());
  const weekdays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  if (parts.length >= 3 && weekdays.includes(parts[1])) {
    return {
      dateDay: `${parts[0]}, ${parts[1]}`,
      period: parts.slice(2).join(", "),
    };
  }
  return { dateDay: label, period: "" };
}

function enhanceChronology(html, sectionId) {
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
        const wrapped = tableHtml.replace(/<table>/, '<table class="chrono-table">');
        return `<div class="table-wrap chrono-table-wrap">${wrapped}</div>`;
      });

      const table = inner.match(/<div class="table-wrap chrono-table-wrap">[\s\S]*?<\/div>/);
      let tableContent = table ? table[0] : "";
      tableContent = tableContent.replace(
        /<tr>\s*<td>([^<]*)<\/td>\s*<td>([^<]*)<\/td>\s*<td>([\s\S]*?)<\/td>\s*<\/tr>/g,
        (_, time, category, update) =>
          `<tr><td class="chrono-time">${escapeHtml(time.trim())}</td><td>${categoryBadge(category)}</td><td>${update.trim()}</td></tr>`
      );

      const label = title.replace(/^Session · /, "").trim();
      const { dateDay, period } = parseSessionLabel(label);
      const anchorId = `${sectionId}-${slugify(title)}`;

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
    (t) => `<div class="table-wrap chrono-rules-wrap">${t.replace("<table>", '<table class="chrono-rules">')}</div>`
  );

  return `${rulesTable}<div class="chronology-timeline">${sessions}</div>`;
}

function enhanceUserStories(html) {
  return html.replace(
    /<p><strong>(US-\d+)<\/strong>\s*—\s*(.*?)<\/p>/g,
    (_, id, text) =>
      `<div class="user-story"><span class="user-story-id">${id}</span><p class="user-story-text">${text}</p></div>`
  );
}

function enhancePrinciples(html) {
  const match = html.match(
    /(<h3[^>]*>Governing principles<\/h3>\s*)(<ol>[\s\S]*?<\/ol>)/
  );
  if (!match) return html;

  const items = [...match[2].matchAll(/<li><strong>(.*?)<\/strong>\.\s*(.*?)<\/li>/g)];
  const list = `<ol class="principle-list">${items
    .map(
      ([, title, body], idx) =>
        `<li><span class="principle-num">${idx + 1}</span><div><strong>${title}.</strong> ${body}</div></li>`
    )
    .join("")}</ol>`;

  return html.replace(match[0], match[1] + list);
}

function enhanceOutOfScope(html) {
  const match = html.match(/<p><strong>Not in V1:<\/strong><\/p>\s*<ul>([\s\S]*?)<\/ul>/);
  if (!match) return html;

  const items = [...match[1].matchAll(/<li>(.*?)<\/li>/g)].map((m) => m[1]);
  const list = `<ul class="scope-list">${items.map((item) => `<li>${item}</li>`).join("")}</ul>`;
  return html.replace(match[0], `<p><strong>Not in V1:</strong></p>${list}`);
}

function enhanceChecklist(html) {
  return html.replace(
    /<h3([^>]*)>(.*?)<\/h3>\s*<ul>([\s\S]*?)<\/ul>/g,
    (full, attrs, title, listBody) => {
      if (!listBody.includes("[ ]") && !listBody.includes("[x]")) return full;

      const items = [...listBody.matchAll(/<li>\[ \]\s*(.*?)<\/li>/g)].map((m) => m[1]);
      if (!items.length) return full;

      const checklist = `<ul class="checklist">${items
        .map(
          (item) =>
            `<li><span class="check-box" aria-hidden="true"></span><span>${item}</span></li>`
        )
        .join("")}</ul>`;

      return `<div class="checklist-group"><h3${attrs}>${title}</h3>${checklist}</div>`;
    }
  );
}

function enhanceRoadmap(html) {
  return html.replace(
    /<h3>(V(\d) — ([^<]+))<\/h3>\s*([\s\S]*?)(?=<h3|$)/g,
    (_, _full, ver, shortTitle, content) =>
      `<div class="version-block"><h3><span class="version-tag v${ver}">V${ver}</span> ${shortTitle.trim()}</h3>${content.trim()}</div>`
  );
}

function wrapGenericTables(container) {
  container.querySelectorAll("table").forEach((table) => {
    if (table.closest(".table-wrap")) return;
    const wrap = document.createElement("div");
    wrap.className = "table-wrap";
    table.parentNode.insertBefore(wrap, table);
    wrap.appendChild(table);
  });
}

function renderSectionContent(section) {
  let html = marked.parse(section.body);

  if (section.title.includes("User Stories")) {
    html = enhanceUserStories(html);
  }
  if (section.title.includes("Philosophy")) {
    html = enhancePrinciples(html);
  }
  if (section.title.includes("Out of Scope")) {
    html = enhanceOutOfScope(html);
  }
  if (section.title.includes("Acceptance Checklist")) {
    html = enhanceChecklist(html);
  }
  if (section.title.includes("Version Roadmap")) {
    html = enhanceRoadmap(html);
  }
  if (section.title.includes("Chronology")) {
    html = enhanceChronology(html, section.id);
  }

  const container = document.createElement("div");
  container.innerHTML = html;

  if (section.title.includes("Decisions")) {
    enhanceDecisionTables(container);
  } else if (section.title.includes("Open Questions")) {
    enhanceOpenQuestions(container);
  } else if (!section.title.includes("Chronology")) {
    wrapGenericTables(container);
  }

  return container.innerHTML;
}

function renderHero(heroMd, sections) {
  const parsed = marked.parse(heroMd);
  const decisionCount = sections
    .find((s) => s.title.includes("Decisions"))
    ?.body.match(/^\| [^|]/gm)?.length || 0;
  const storyCount = (sections.find((s) => s.title.includes("User Stories"))?.body.match(/\*\*US-\d+/g) || []).length;
  const openCount = (sections.find((s) => s.title.includes("Open Questions"))?.body.match(/^\| OQ-/gm) || []).length;
  const sessionCount = (sections.find((s) => s.title.includes("Chronology"))?.body.match(/^### Session ·/gm) || []).length;

  return `
    ${parsed.replace("<h1", '<h1 class="hero-title"').replace("<h3", '<p class="subtitle"').replace(/<\/h3>/, "</p>")}
    <div class="hero-stats">
      <span class="stat-pill"><strong>${sections.length}</strong> sections</span>
      <span class="stat-pill"><strong>${storyCount}</strong> user stories</span>
      <span class="stat-pill"><strong>${decisionCount}+</strong> decisions logged</span>
      <span class="stat-pill"><strong>${openCount}</strong> open questions</span>
      <span class="stat-pill"><strong>${sessionCount}</strong> work sessions</span>
    </div>
  `;
}

function buildNav(sections) {
  const nav = document.getElementById("nav");
  nav.innerHTML = sections
    .map((section) => {
      const num = section.meta.num;
      const shortTitle = section.title.replace(/^\d+\.\s*/, "");
      let html = `<div class="nav-group">
        <a class="nav-link" href="#${section.id}" data-section="${section.id}">
          <span class="nav-num">${num}.</span> ${shortTitle}
        </a>`;

      if (section.title.includes("Decisions") && section.subsections.length) {
        html += section.subsections
          .map(
            (sub) =>
              `<a class="nav-link sub" href="#${section.id}-${slugify(sub)}" data-section="${section.id}">${sub}</a>`
          )
          .join("");
      }

      if (section.title.includes("Chronology") && section.subsections.length) {
        html += section.subsections
          .filter((sub) => sub.startsWith("Session ·"))
          .map((sub) => {
            const short = sub.replace(/^Session · /, "");
            return `<a class="nav-link sub" href="#${section.id}-${slugify(sub)}" data-section="${section.id}">${short}</a>`;
          })
          .join("");
      }

      html += "</div>";
      return html;
    })
    .join("");
}

function renderSections(sections) {
  const container = document.getElementById("sections");
  container.innerHTML = sections
    .map((section) => {
      const num = section.meta.num;
      const shortTitle = section.title.replace(/^\d+\.\s*/, "");
      const bodyHtml = renderSectionContent(section);

      return `
        <article class="section" id="${section.id}">
          <header class="section-header">
            <div class="section-number">${num}</div>
            <div class="section-title-wrap">
              <h2>${shortTitle}</h2>
              ${section.meta.desc ? `<p>${section.meta.desc}</p>` : ""}
            </div>
          </header>
          <div class="section-body">${bodyHtml}</div>
        </article>
      `;
    })
    .join("");

  container.innerHTML += `<footer class="doc-footer">
    This viewer reads live from branch-ai.md. Edit the markdown and refresh to see updates.
  </footer>`;

  sections.forEach((section) => {
    if (!section.title.includes("Decisions") && !section.title.includes("Chronology")) return;
    container.querySelectorAll(`#${CSS.escape(section.id)} h3`).forEach((h3) => {
      const label = h3.textContent.trim();
      if (section.subsections.includes(label)) {
        h3.id = `${section.id}-${slugify(label)}`;
      }
    });
  });
}

function setupScrollSpy() {
  const links = document.querySelectorAll(".nav-link:not(.sub)");
  const sections = [...document.querySelectorAll(".section")];

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          links.forEach((link) => {
            link.classList.toggle("active", link.dataset.section === entry.target.id);
          });
        }
      });
    },
    { rootMargin: "-20% 0px -70% 0px", threshold: 0 }
  );

  sections.forEach((section) => observer.observe(section));
}

function setupSearch(sections) {
  const input = document.getElementById("search");
  input.addEventListener("input", () => {
    const q = input.value.trim().toLowerCase();
    document.querySelectorAll(".nav-group").forEach((group, idx) => {
      const section = sections[idx];
      const text = (section.title + " " + section.body + " " + section.subsections.join(" ")).toLowerCase();
      const match = !q || text.includes(q);
      group.querySelectorAll(".nav-link").forEach((link) => {
        link.classList.toggle("hidden", !match);
      });
    });
  });
}

function setupSidebarToggle() {
  const toggle = document.getElementById("sidebar-toggle");
  const sidebar = document.getElementById("sidebar");
  toggle.addEventListener("click", () => sidebar.classList.toggle("open"));
  document.getElementById("main").addEventListener("click", () => {
    sidebar.classList.remove("open");
  });
}

async function init() {
  const heroEl = document.getElementById("hero");
  const sectionsEl = document.getElementById("sections");

  heroEl.innerHTML = `<div class="loading">Loading spec…</div>`;
  sectionsEl.innerHTML = "";

  try {
    const res = await fetch("/branch-ai.md");
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const markdown = await res.text();
    const { hero, sections } = parseSections(markdown);

    heroEl.innerHTML = renderHero(hero, sections);
    buildNav(sections);
    renderSections(sections);
    setupScrollSpy();
    setupSearch(sections);
    setupSidebarToggle();
  } catch (err) {
    heroEl.innerHTML = `<div class="error">
      <strong>Could not load branch-ai.md</strong><br>
      Run <code>npm run dev:spec</code> from the project root, then open
      <code>http://localhost:3030</code>.<br><br>
      ${escapeHtml(err.message)}
    </div>`;
  }
}

init();
