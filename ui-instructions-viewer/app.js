marked.setOptions({ gfm: true, breaks: true });

const SPEC_URL = "/ui-interaction-motion-instructions.md";

const nav = document.getElementById("nav");
const doc = document.getElementById("doc");
const search = document.getElementById("search");
const stats = document.getElementById("stats");
const sidebar = document.getElementById("sidebar");
const sidebarToggle = document.getElementById("sidebar-toggle");

function slugify(text) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function parseSections(markdown) {
  const lines = markdown.split("\n");
  const sections = [];
  let i = 0;

  while (i < lines.length && !lines[i].startsWith("## ")) i++;

  while (i < lines.length) {
    if (!lines[i].startsWith("## ")) {
      i++;
      continue;
    }
    const title = lines[i].slice(3).trim();
    if (title === "Table of contents") {
      i++;
      continue;
    }
    const body = [];
    i++;
    while (i < lines.length && !lines[i].startsWith("## ")) {
      body.push(lines[i]);
      i++;
    }
    const bodyText = body.join("\n").trim();
    const countMatch = bodyText.match(/^\d+\./gm);
    sections.push({
      title,
      id: slugify(title),
      body: bodyText,
      count: countMatch ? countMatch.length : 0,
    });
  }
  return sections;
}

function renderNav(sections) {
  nav.innerHTML = sections
    .map(
      (s) =>
        `<button type="button" class="nav-link" data-target="${s.id}"><span>${s.title}</span><span class="count">${s.count}</span></button>`,
    )
    .join("");

  nav.querySelectorAll(".nav-link").forEach((btn) => {
    btn.addEventListener("click", () => {
      const el = document.getElementById(btn.dataset.target);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
        nav.querySelectorAll(".nav-link").forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        sidebar.classList.remove("open");
      }
    });
  });
}

function renderDoc(sections, preamble) {
  const html = sections
    .map(
      (s) =>
        `<section id="${s.id}"><h2>${s.title}</h2>${marked.parse(s.body)}</section>`,
    )
    .join("");
  doc.innerHTML = preamble + html;
}

function updateStats(markdown) {
  const checks = (markdown.match(/^- \[ \]/gm) || []).length;
  const sections = (markdown.match(/^## \d+\./gm) || []).length;
  if (checks && sections) {
    stats.innerHTML = `<strong>${checks}</strong> checks · <strong>${sections}</strong> sections`;
  }
}

function applySearch(query) {
  const q = query.trim().toLowerCase();
  const sections = doc.querySelectorAll("section");
  let visibleSections = 0;
  let visibleItems = 0;

  sections.forEach((section) => {
    const items = section.querySelectorAll("ol > li");
    let sectionVisible = 0;

    items.forEach((li) => {
      const text = li.textContent.toLowerCase();
      const show = !q || text.includes(q);
      li.classList.toggle("hidden-match", !show);
      if (show) {
        sectionVisible++;
        visibleItems++;
      }
    });

    const headingMatch = section.querySelector("h2")?.textContent.toLowerCase().includes(q);
    const showSection = !q || headingMatch || sectionVisible > 0;
    section.classList.toggle("hidden-section", !showSection);
    if (showSection) visibleSections++;
  });

  let banner = doc.querySelector(".no-results");
  if (q && visibleItems === 0) {
    if (!banner) {
      banner = document.createElement("p");
      banner.className = "no-results";
      doc.prepend(banner);
    }
    banner.textContent = `No instructions match "${query}"`;
    banner.hidden = false;
  } else if (banner) {
    banner.hidden = true;
  }
}

async function init() {
  const res = await fetch(SPEC_URL);
  if (!res.ok) {
    doc.innerHTML = `<p class="no-results">Could not load ${SPEC_URL}</p>`;
    return;
  }
  const markdown = await res.text();
  updateStats(markdown);

  const preambleMatch = markdown.match(/^([\s\S]*?)---\s*\n\n## /);
  const preamble = preambleMatch
    ? marked.parse(preambleMatch[1].replace(/^---\s*$/gm, "").trim())
    : "";

  const sections = parseSections(markdown);
  renderNav(sections);
  renderDoc(sections, preamble);

  search.addEventListener("input", () => applySearch(search.value));

  sidebarToggle.addEventListener("click", () => {
    sidebar.classList.toggle("open");
  });

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          const id = entry.target.id;
          nav.querySelectorAll(".nav-link").forEach((b) => {
            b.classList.toggle("active", b.dataset.target === id);
          });
        }
      }
    },
    { rootMargin: "-20% 0px -60% 0px", threshold: 0 },
  );

  doc.querySelectorAll("section").forEach((s) => observer.observe(s));
}

init();
