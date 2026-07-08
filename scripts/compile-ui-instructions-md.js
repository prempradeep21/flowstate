/**
 * Legacy: compile raw transcript scan into categorized list (not the published checklist).
 * Prefer editing docs/ui-interaction-motion-instructions.md directly.
 */
const fs = require("fs");
const path = require("path");

const RAW = path.join(__dirname, "..", "docs", "ui-instructions-raw.json");
const OUT_MD = path.join(__dirname, "..", "docs", "ui-interaction-motion-instructions.md");

const EXCLUDE_PATTERNS = [
  /^write all the suggestions/i,
  /^give me just a simple table/i,
  /^for each of the suggestions/i,
  /^yes, implement and show me the status/i,
  /^pull a new branch called/i,
  /^explore the (branch ai|workspace)/i,
  /^you are reviewing local code changes/i,
  /^goal unselected \/ unclicked/i,
  /^smooth real-time collaborator cursors implement the plan/i,
  /^i want you to go through all the chats from the last 2 weeks/i,
  /saved to the workspace for future use/i,
  /^what formats does my custom ui component support/i,
  /^how can i build better so that none of my earlier/i,
  /return: key file paths/i,
  /search for:/i,
  /do not edit the plan file/i,
  /to-do's from the plan have already been created/i,
  /supabase/i,
  /api keys/i,
  /set api keys/i,
  /eslint/i,
  /react hook/i,
  /warning:/i,
  /will this considerably increase the token/i,
  /can you tell me other alternatives/i,
  /go through the entire codebase and explore/i,
  /how are "input artifacts"/i,
  /find sessionartifact type/i,
  /find artifact rendering components/i,
  /how does canvas paste handle/i,
  /^\d{2}:\d{2}:\d{2}/,
  /either include them or remove the dependency/i,
  /^how can an instruction that was executed/i,
  /^do you not refer to the earlier instructions/i,
  /^i don't see that happening at all in the product\.?$/i,
  /^can you (pull|show|give|list|tell|explain|check|verify|run|create a plan)/i,
  /^what (is|are|does|do|happens|would)/i,
  /^how (do|does|can|should|would|is)/i,
  /^where (is|are|does|do)/i,
  /^is there /i,
  /^are there /i,
  /^tell me /i,
  /^show me (a |the )?(table|list|status|plan|diff|log)/i,
];

const UI_DIRECTIVE =
  /\b(make|ensure|should|must|need|want|remove|add|introduce|retain|keep|stop|never|always|only|visible|visibility|hover|smooth|smoothly|animation|transition|motion|fade|opacity|affordance|resize|drag|drop|scroll|zoom|click|double.?click|cursor|icon|iconography|sidebar|toolbar|responsive|layout|theme|dark mode|light mode|border|shadow|radius|padding|spacing|align|position|pop up|appear|disappear|hide|show|feel|look|design|polish|janky|snappy|fluid|instant|keyboard|shortcut|cmd|ctrl|alt drag|right click|context menu|focus|blur|connector|plug|handle|grab|pill|attachment|waveform|pencil|sticky|collapse|expand|toggle|undo|redo|copy|paste|duplicate|sound|haptic|landing|hero|marketing|bounding box|group|inert|interactable|selected|unselected|chrome|controls|version history|outer container|flowstate)\b/i;

const CATEGORY_ORDER = [
  "Hover states & chrome",
  "Visibility & affordance",
  "Motion, transitions & smoothness",
  "Scroll, zoom & canvas navigation",
  "Click-to-activate & interaction model",
  "Drag, drop, resize & grab handles",
  "Focus, keyboard & shortcuts",
  "Layout & responsiveness",
  "Visual style, iconography & theming",
  "Feedback, loading & states",
  "Sidebar, toolbar & panels",
  "Artifacts & canvas nodes",
  "Copy, paste & duplication",
  "Collaboration & cursors",
  "Sound & haptics",
  "Landing page & marketing UI",
  "Auto-collapse & idle behavior",
  "General UI / interaction",
];

function remapCategory(text) {
  const t = text.toLowerCase();
  const out = new Set();

  if (/\b(hover|on hover|hover state|hover reveal|show on hover|hover chrome|hover functionality|hover functions|resize icon should come)\b/.test(t))
    out.add("Hover states & chrome");
  if (/\b(visible|visibility|invisible|hidden|affordance|indication|can't see|cannot see|hard to see|too subtle|make visible|default visible|always visible|only visible|pop up|should never happen|unnecessary|see that|discoverable)\b/.test(t))
    out.add("Visibility & affordance");
  if (/\b(smooth|smoothly|motion|animation|animate|transition|ease|duration|spring|stagger|fade|slide|scale|snappy|janky|lag|fluid|polish|instant|150ms|200ms|300ms|framer|view transition|prefers-reduced-motion|timing|easing|delay|comfortable)\b/.test(t))
    out.add("Motion, transitions & smoothness");
  if (/\b(scroll|zoom|pan|wheel|overscroll|canvas bounds|edge|cropped|inertia|rubber band|scroll into view|scroll reveal|parallax|two minutes of inactivity|collapse)\b/.test(t))
    out.add("Scroll, zoom & canvas navigation");
  if (/\b(click(ed|ing)?|unclicked|unselected|selected|active|interactable|inert|pointer-events|only when clicked|become interactable|clicked state|double.?click|done inside|save button|edit button)\b/.test(t))
    out.add("Click-to-activate & interaction model");
  if (/\b(drag|drop|resize|grab|handle|alt drag|alt-drag|draggable|cursor-grab|cursor-grabbing|cursor-move|cursor-resize|resize handle|drag handle|grab area|hitbox|column width|resize the column|1\.5×|1.5x)\b/.test(t))
    out.add("Drag, drop, resize & grab handles");
  if (/\b(keyboard|shortcut|cmd\+|ctrl\+|meta\+|shift\+|hotkey|right click|context menu|command z|cmd z|undo|redo|focus ring|tab order|tabindex|enter while)\b/.test(t))
    out.add("Focus, keyboard & shortcuts");
  if (/\b(layout|responsive|grid|flex|align|alignment|position|spacing|padding|margin|gap|width|height|size|overflow|viewport|mobile|desktop|clamp|aspect ratio|container|shell|card|panel|bounding box|extra space|containing the contents)\b/.test(t))
    out.add("Layout & responsiveness");
  if (/\b(color|colour|theme|dark mode|light mode|contrast|font|typography|icon|iconography|border|radius|shadow|blur|backdrop|glass|gradient|transparent|opacity|muted|accent|highlight|look|feel|appearance|visual|design|styling|style|flowstate icon|logo|decimals of seconds|seconds as the least)\b/.test(t))
    out.add("Visual style, iconography & theming");
  if (/\b(loading|skeleton|shimmer|spinner|empty state|error state|toast|tooltip|popover|modal|dialog|feedback|pulse|bounce|done button|save button|edit button|generating)\b/.test(t))
    out.add("Feedback, loading & states");
  if (/\b(sidebar|toolbar|bottom bar|top bar|top right bar|top left|collapsed state|chevron|pie menu|popup|dropdown|menu|retain it in the pi menu)\b/.test(t))
    out.add("Sidebar, toolbar & panels");
  if (/\b(canvas|artifact|artefact|node|question node|answer node|skill|input artifact|output artifact|ghost|preview|placement|version history|outer container|sticky note|pencil|waveform|chart|table|map|github|google doc|attachment|pill|mp3|wav|audio|invoice|custom ui|group cta|untitled group)\b/.test(t))
    out.add("Artifacts & canvas nodes");
  if (/\b(copy|paste|duplicate|clipboard|alt drag)\b/.test(t))
    out.add("Copy, paste & duplication");
  if (/\b(cursor|collaborat|multi-cursor|figma|figjam|real-time|presence|live cursor)\b/.test(t))
    out.add("Collaboration & cursors");
  if (/\b(sound|haptic|audio feedback)\b/.test(t))
    out.add("Sound & haptics");
  if (/\b(landing|marketing|website|hero|showcase|flowstate\.com|flowstatetool|10x designer|pixel perfection|motion graphics)\b/.test(t))
    out.add("Landing page & marketing UI");
  if (/\b(two minutes|inactivity|collapse|idle|auto.?collapse)\b/.test(t))
    out.add("Auto-collapse & idle behavior");

  if (!out.size) out.add("General UI / interaction");
  return [...out];
}

function shouldExclude(text) {
  const t = cleanText(text);
  if (t.length < 25) return true;
  for (const re of EXCLUDE_PATTERNS) {
    if (re.test(t)) return true;
  }
  if (!UI_DIRECTIVE.test(t)) return true;
  return false;
}

function cleanText(text) {
  return text
    .replace(/\[Image\]/gi, "")
    .replace(/The following images were provided by the user[^]*?other locations\./gi, "")
    .replace(/C:\\Users\\[^ ]+\.(png|jpg|jpeg|webp|gif)/gi, "")
    .replace(/\d+\.\s*C:\\Users\\[^\n]+/g, "")
    .replace(/Thursday, [^,]+,\s*\d{1,2}:\d{2}\s*[AP]M[^)]*\)\s*/gi, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function primaryCategory(cats) {
  const priority = CATEGORY_ORDER;
  for (const p of priority) {
    if (cats.includes(p)) return p;
  }
  return cats[0];
}

function main() {
  const raw = JSON.parse(fs.readFileSync(RAW, "utf8"));
  const byCategory = Object.fromEntries(CATEGORY_ORDER.map((c) => [c, []]));
  const seen = new Set();

  for (const item of raw.items) {
    const text = cleanText(item.text);
    if (shouldExclude(text)) continue;
    const key = text.toLowerCase().replace(/[^\w\s]/g, "").replace(/\s+/g, " ").trim().slice(0, 140);
    if (seen.has(key)) continue;
    seen.add(key);

    const cats = remapCategory(text);
    const cat = primaryCategory(cats);
    byCategory[cat].push({
      text,
      chatId: item.chatId,
      date: item.mtime.slice(0, 10),
      also: cats.filter((c) => c !== cat),
    });
  }

  for (const cat of CATEGORY_ORDER) {
    byCategory[cat]?.sort((a, b) => b.date.localeCompare(a.date) || a.text.localeCompare(b.text));
  }

  const total = seen.size;
  const lines = [];
  lines.push("# Flowstate UI, Interaction & Motion Instructions");
  lines.push("");
  lines.push(`> Compiled from Cursor agent transcripts (**last ${raw.days} days**). Generated ${raw.generatedAt.slice(0, 10)}.`);
  lines.push(`> **${total}** distinct user instructions across **${CATEGORY_ORDER.filter((c) => byCategory[c]?.length).length}** categories.`);
  lines.push("");
  lines.push("Explicit UI, interaction, motion, visibility, hover, smoothness, and affordance instructions from development chats. Use as a design contract when implementing or reviewing changes.");
  lines.push("");
  lines.push("## Table of contents");
  lines.push("");
  for (const cat of CATEGORY_ORDER) {
    const n = byCategory[cat]?.length || 0;
    if (!n) continue;
    const anchor = cat.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    lines.push(`- [${cat}](#${anchor}) (${n})`);
  }
  lines.push("");
  lines.push("---");
  lines.push("");

  for (const cat of CATEGORY_ORDER) {
    const items = byCategory[cat];
    if (!items?.length) continue;
    lines.push(`## ${cat}`);
    lines.push("");
    items.forEach((item, i) => {
      lines.push(`${i + 1}. ${item.text}`);
      const also = item.also.length ? ` · also: ${item.also.join(", ")}` : "";
      lines.push(`   - *Source:* \`${item.chatId.slice(0, 8)}…\` · ${item.date}${also}`);
      lines.push("");
    });
  }

  lines.push("---");
  lines.push("");
  lines.push("## Cross-cutting principles (synthesized)");
  lines.push("");
  lines.push("Recurring themes distilled from the instructions above:");
  lines.push("");
  lines.push("| Principle | Detail |");
  lines.push("|-----------|--------|");
  lines.push("| **Visible affordances** | Resize bars, drag handles, and interactive controls must be visible by default—not only on hover (e.g. table column resize bars at 75% accent opacity, full on hover/focus). |");
  lines.push("| **Hover chrome vs. click-to-activate body** | Plugs, connectors, borders, shadows, and resize handles still appear on hover. Scrolling over an unselected artifact zooms the canvas; inner content (maps, answers, composers) becomes interactable only after click/selection. |");
  lines.push("| **Selection keeps controls alive** | While selected, resize handles and artifact controls remain visible even when the pointer exits the artifact bounds. |");
  lines.push("| **Smooth canvas feel** | Pan/zoom at edges must not feel cropped or janky; render extra canvas margin beyond the artifact limit for comfortable zooming. |");
  lines.push("| **Consistent artifact language** | Input artifacts (files, links, audio, Google Docs, attachments) share the same hover, drag, connector, and chrome behaviors. |");
  lines.push("| **Iconography over text** | Use Flowstate icon family in toolbars; remove redundant labels (e.g. \"Chats\" / \"Artifacts\" in top-right bar). |");
  lines.push("| **Sidebar discipline** | Dropping links or adding artifacts must not auto-open the sidebar. |");
  lines.push("| **Keyboard parity** | Standard copy/paste shortcuts; Cmd/Ctrl+Z for pencil; remove conflicting shortcuts (sticky `S` removed from keyboard, kept in pie menu). |");
  lines.push("| **Copy scope** | Only input artifacts, output artifacts, and skills copy (not Q&A nodes)—via shortcuts, context menu Copy, and Alt-drag; includes outer container + version history. |");
  lines.push("| **Responsive contents** | Charts, attachments, pills, and custom UI scale responsively inside artifact bounds; waveform length reflects real duration. |");
  lines.push("| **Auto-collapse on idle** | After ~2 minutes of inactivity, nodes should collapse (regression noted Jun 14). |");
  lines.push("| **Real-time cursors** | Collaborator cursors should feel smooth like Figma/FigJam. |");
  lines.push("| **Landing = product UI** | Marketing site should reuse the same artifact/chat components as the product; motion and interactions at principal-design-lead quality. |");
  lines.push("");

  fs.writeFileSync(OUT_MD, lines.join("\n"));
  console.log(`Wrote ${OUT_MD} (${total} instructions)`);
}

main();
