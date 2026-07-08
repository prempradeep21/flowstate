/**
 * Scan agent transcripts for UI-related chat messages (candidate mining only).
 * The published source of truth is docs/ui-interaction-motion-instructions.md (curated checklist).
 */
const fs = require("fs");
const path = require("path");

const TRANSCRIPTS_DIR = path.join(
  process.env.USERPROFILE || process.env.HOME,
  ".cursor",
  "projects",
  "d-Cursor-projects-Branch-AI",
  "agent-transcripts",
);
const DAYS = 14;
const OUT_JSON = path.join(__dirname, "..", "docs", "ui-instructions-raw.json");

const UI_KEYWORDS =
  /\b(hover|transition|animation|motion|smooth|smoothly|fade|opacity|visible|visibility|hidden|show|hide|appear|disappear|ease|duration|spring|stagger|animate|animated|interactive|affordance|cursor|pointer|drag|drop|resize|scroll|focus|blur|keyboard|shortcut|right.?click|context.?menu|tooltip|popover|modal|sheet|sidebar|toolbar|button|click|tap|touch|gesture|swipe|pinch|zoom|pan|scale|transform|layout|responsive|spacing|padding|margin|border|radius|shadow|blur|backdrop|glass|opacity|transparent|opacity|visible|invisible|fade.?in|fade.?out|slide|collapse|expand|toggle|expand|collapse|micro.?interaction|polish|feel|fluid|snappy|janky|jank|lag|delay|timing|easing|framer|css.?transition|150ms|200ms|300ms|ease-in|ease-out|ease-in-out|cubic-bezier|visible by default|on hover|when hovering|hover state|active state|focus state|pressed|disabled|loading|skeleton|placeholder|ghost|preview|affordance|indication|indicate|interact|interaction|ui|ux|design|look|feel|appearance|visual|style|styling|theme|dark mode|light mode|contrast|legible|readable|font|typography|icon|alignment|align|center|left|right|overflow|clip|truncate|ellipsis|sticky|fixed|floating|overlay|z-index|layer|depth|elevation|card|container|shell|chrome|header|footer|menu|dropdown|popup|panel|drawer|slide.?in|slide.?out|enter|exit|reveal|unveil|peek|subtle|prominent|bold|muted|accent|highlight|glow|pulse|bounce|wiggle|shake|spin|rotate|flip|scale up|scale down|grow|shrink|minimize|maximize|fullscreen|expandable|collapsible|accordion|tab|switch|toggle|checkbox|radio|slider|handle|grab|grabbable|draggable|droppable|snap|magnetic|inertia|momentum|physics|springy|bouncy|crisp|sharp|soft|rounded|corner|edge|bevel|gradient|backdrop-filter|filter|brightness|saturate|desaturate|grayscale|monochrome|color|colour|palette|scheme|brand|token|design system|component|widget|control|input|output|canvas|node|artifact|artefact|sidebar|bottom bar|top bar|floating|pill|chip|badge|tag|label|caption|heading|title|subtitle|body|text|link|anchor|underline|strikethrough|selection|selected|unselected|active|inactive|enabled|disabled|readonly|editable|focus ring|outline|ring|border|stroke|fill|background|foreground|surface|elevated|raised|depressed|inset|outset|neumorphism|flat|material|ios|macos|windows|platform|native|feel native|apple.?like|cursor.?like|notion.?like|figma.?like|linear.?like|vercel.?like|shadcn|tailwind|css|scss|globals\.css|framer-motion|motion\.|variants|initial|animate|exit|whileHover|whileTap|whileFocus|whileDrag|layoutId|AnimatePresence|useSpring|useAnimation|prefers-reduced-motion|reduced motion|accessibility|a11y|aria|screen reader|keyboard nav|focus trap|focus management|tab order|tabindex|skip link|hit area|touch target|min.?width|min.?height|44px|48px|pointer-events|user-select|cursor-grab|cursor-grabbing|cursor-pointer|cursor-default|cursor-not-allowed|cursor-move|cursor-resize|cursor-col-resize|cursor-row-resize|cursor-nwse-resize|cursor-ew-resize|cursor-ns-resize|resize handle|drag handle|grab area|hitbox|hotspot|target area|click area|tap target|hover area|hover zone|hover card|hover menu|hover tooltip|hover reveal|hover show|hover hide|show on hover|hide on hover|only on hover|until hover|after hover|before hover|default visible|always visible|never visible|only visible|make visible|make invisible|should be visible|should not be visible|can't see|cannot see|hard to see|too subtle|too loud|too bright|too dark|too small|too big|too fast|too slow|too janky|not smooth|more smooth|smoother|less janky|snappier|faster|slower|instant|immediate|no delay|with delay|debounce|throttle|requestAnimationFrame|will-change|gpu|hardware acceleration|transform3d|translateZ|backface-visibility|contain|isolation|stacking context|overflow hidden|overflow auto|overflow scroll|overflow visible|scrollbar|scroll bar|scroll snap|scroll behavior|smooth scroll|auto scroll|scroll into view|scroll reveal|parallax|sticky header|sticky footer|fixed header|fixed footer|floating action|fab|speed dial|pie menu|radial menu|contextual|context sensitive|progressive disclosure|expand on click|collapse on blur|auto hide|auto show|auto dismiss|dismiss|close|open|open state|closed state|expanded|collapsed|minimized|maximized|fullscreen|picture.?in.?picture|split view|dual pane|master detail|list detail|navigation|nav|breadcrumb|back button|forward|history|undo|redo|copy|paste|duplicate|alt drag|alt-drag|keyboard shortcut|cmd\+|ctrl\+|meta\+|shift\+|hotkey|keybind|binding|gesture|multi.?touch|pinch zoom|two finger|trackpad|mouse wheel|scroll wheel|wheel|delta|inertia scroll|momentum scroll|rubber band|overscroll|bounce scroll|elastic|stretch|squash|squish|morph|shape|path|svg animation|lottie|rive|gif|video|media|image|thumbnail|preview|placeholder|skeleton loader|shimmer|spinner|loader|loading state|empty state|error state|success state|warning state|info state|toast|snackbar|notification|banner|alert|dialog|alert dialog|confirm|prompt|popover|dropdown menu|select menu|combobox|autocomplete|search|filter|sort|group|collapse group|tree|nested|indent|outdent|hierarchy|level|depth|tier|rank|order|sequence|flow|step|wizard|onboarding|tour|coach mark|spotlight|highlight|dim|dimmed|backdrop|scrim|veil|mask|clip path|reveal|wipe|iris|circle reveal|blur in|blur out|scale in|scale out|slide in|slide out|slide up|slide down|slide left|slide right|push|cover|uncover|flip|rotate|fold|unfold|page turn|card flip|3d|perspective|rotateX|rotateY|rotateZ|translate|skew|matrix|filter blur|drop shadow|box shadow|text shadow|inner shadow|glow|neon|glassmorphism|frosted|frost|translucent|transparent|semi.?transparent|alpha|rgb|rgba|hsl|hsla|oklch|color mix|mix blend|blend mode|multiply|screen|overlay|darken|lighten|difference|exclusion|hue|saturation|color|luminosity|backdrop blur|backdrop filter|filter|brightness|contrast|saturate|sepia|invert|grayscale|hue rotate|opacity filter|visibility hidden|display none|display block|display flex|display grid|grid|flex|stack|hstack|vstack|zstack|overlay|underlay|layer|layered|elevation|raised|sunken|inset|outset|emboss|deboss|neumorphic|skeuomorphic|flat design|material design|human interface|hig|wcag|contrast ratio|color blind|colorblind|daltonism|protanopia|deuteranopia|tritanopia|high contrast|large text|dynamic type|font scaling|responsive text|fluid typography|clamp|min|max|vw|vh|dvh|svh|lvh|rem|em|px|pt|percent|%|aspect ratio|object fit|object position|cover|contain|fill|scale down|none|intrinsic|min content|max content|fit content|auto|stretch|start|end|center|baseline|space between|space around|space evenly|justify|align|place|gap|row gap|column gap|grid template|grid area|grid column|grid row|flex wrap|flex nowrap|flex direction|flex grow|flex shrink|flex basis|order|align self|justify self|place self|margin auto|position absolute|position relative|position fixed|position sticky|top|right|bottom|left|inset|transform origin|transform box|perspective origin|backface|preserve 3d|flat|children|child|parent|sibling|ancestor|descendant|nth|first|last|only|empty|not|has|is|where|focus visible|focus within|focus not|hover not|active not|disabled|enabled|checked|indeterminate|required|optional|valid|invalid|in range|out of range|placeholder shown|autofill|read write|read only|default|target|lang|dir|root|host|host context|slotted|part|state|popover|modal|fullscreen|picture in picture|paused|playing|seeking|buffering|stalled|muted|volume|captions|subtitles|orientation|portrait|landscape|prefers color scheme|prefers contrast|prefers reduced motion|prefers reduced transparency|hover hover|pointer fine|pointer coarse|any hover|any pointer|screen|print|speech|all|and|or|not|only|min width|max width|min height|max height|aspect ratio|resolution|scan|grid|update|overflow block|overflow inline|display mode|standalone|browser|minimal ui|orientation|hover|pointer|any hover|any pointer|scripting|supports|container|layer|scope|starting style|view transition|view transition name|view transition class|::view-transition|document start view transition|startViewTransition|cross fade|shared element|hero|hero animation|matched geometry|shared transition|morph transition|container query|container type|container name|@container|cqw|cqh|cqi|cqb|cqmin|cqmax|size container|inline size|block size|style container|custom property|css variable|var\(|calc\(|min\(|max\(|clamp\(|env\(|constant\(|attr\(|url\(|linear gradient|radial gradient|conic gradient|repeating|from|to|via|deg|turn|rad|grad|color stop|interpolation|color space|srgb|display p3|rec2020|lab|lch|oklab|oklch|hwb|color function|relative color|light dark|color mix|color contrast|accent color|accent-color|caret color|outline color|border color|background color|text decoration color|column rule color|flood color|lighting color|stop color|stroke|fill|marker|mask|clip|filter|backdrop|mix blend mode|isolation|opacity|visibility|display|position|float|clear|overflow|overscroll|scroll snap|scroll behavior|scroll margin|scroll padding|scrollbar|scrollbar width|scrollbar color|scrollbar gutter|touch action|user select|pointer events|cursor|resize|outline|outline offset|box shadow|text shadow|transform|transform origin|transform style|perspective|perspective origin|backface visibility|translate|rotate|scale|skew|matrix|matrix3d|translate3d|rotate3d|scale3d|filter|backdrop filter|will change|contain|content visibility|contain intrinsic size|appearance|accent color|color scheme|forced color adjust|print color adjust|color adjust|image rendering|image orientation|object fit|object position|object view box|vertical align|line height|letter spacing|word spacing|text indent|text transform|text overflow|white space|word break|overflow wrap|hyphens|text align|text align last|text justify|text underline|text decoration|text emphasis|text shadow|tab size|writing mode|direction|unicode bidi|text orientation|text combine|initial letter|initial letter align|initial letter wrap|hanging punctuation|line break|word spacing|overflow anchor|orphans|widows|break before|break after|break inside|column count|column width|column fill|column gap|column rule|column span|columns|gap|row gap|column gap|place content|place items|place self|justify content|justify items|justify self|align content|align items|align self|flex direction|flex wrap|flex flow|flex grow|flex shrink|flex basis|flex|order|grid template|grid template areas|grid template columns|grid template rows|grid auto columns|grid auto rows|grid auto flow|grid|grid area|grid column|grid row|grid column start|grid column end|grid row start|grid row end|column|row|float|clear|isolation|z index|top|right|bottom|left|inset|inset block|inset inline|inset block start|inset block end|inset inline start|inset inline end|position|position anchor|position area|position try|position visibility|position try order|position try fallback|anchor name|anchor scope|position fallback|position fallback bounds|position fallback order|position fallback|position visibility|position try|position try order|position try fallback|position try options|position try tactics|position try strategy|position try|position visibility|position area|position anchor|position|top|right|bottom|left|inset|margin|padding|border|width|height|min width|max width|min height|max height|block size|inline size|min block size|max block size|min inline size|max inline size|aspect ratio|box sizing|overflow|overflow x|overflow y|overflow clip margin|overflow anchor|overscroll behavior|scroll snap|scroll snap type|scroll snap align|scroll snap stop|scroll margin|scroll padding|scroll behavior|scrollbar|scrollbar width|scrollbar color|scrollbar gutter|touch action|user select|pointer events|visibility|content visibility|contain|contain intrinsic size|will change|isolation|z index|transform|transform origin|transform style|perspective|perspective origin|backface visibility|translate|rotate|scale|filter|backdrop filter|clip path|mask|mask image|mask mode|mask repeat|mask position|mask size|mask origin|mask clip|mask composite|mask type|mask border|mask border source|mask border slice|mask border width|mask border outset|mask border repeat|mask border mode|mix blend mode|background|background color|background image|background repeat|background attachment|background position|background size|background origin|background clip|background blend mode|border|border width|border style|border color|border radius|border image|border image source|border image slice|border image width|border image outset|border image repeat|outline|outline width|outline style|outline color|outline offset|box shadow|text shadow|opacity|color|caret color|accent color|color scheme|forced color adjust|print color adjust|color adjust|font|font family|font style|font variant|font weight|font stretch|font size|font size adjust|font synthesis|font kerning|font feature settings|font variation settings|font optical sizing|font palette|font display|line height|letter spacing|word spacing|text indent|text transform|text overflow|white space|word break|overflow wrap|hyphens|text align|text align last|text justify|text decoration|text emphasis|text shadow|tab size|writing mode|direction|unicode bidi|text orientation|text combine|initial letter|initial letter align|initial letter wrap|hanging punctuation|line break|orphans|widows|break before|break after|break inside|column count|column width|column fill|column gap|column rule|column span|columns|gap|animation|animation name|animation duration|animation timing function|animation delay|animation iteration count|animation direction|animation fill mode|animation play state|animation composition|animation range|animation range start|animation range end|animation timeline|transition|transition property|transition duration|transition timing function|transition delay|transition behavior|view transition name|view transition class|interpolate size|interpolate size allow keywords|offset|offset path|offset distance|offset rotate|offset anchor|offset position|scroll timeline|scroll timeline name|scroll timeline axis|view timeline|view timeline name|view timeline axis|view timeline inset|animation timeline|timeline scope|will change|contain|content visibility|contain intrinsic size|appearance|cursor|resize|pointer events|user select|touch action|scroll behavior|overscroll behavior|scrollbar|scrollbar width|scrollbar color|scrollbar gutter|accent color|color scheme|forced color adjust|print color adjust|color adjust|image rendering|image orientation|object fit|object position|object view box|vertical align|initial letter|initial letter align|initial letter wrap|hanging punctuation|line break|orphans|widows|break before|break after|break inside|column count|column width|column fill|column gap|column rule|column span|columns|gap|place content|place items|place self|justify content|justify items|justify self|align content|align items|align self|flex direction|flex wrap|flex flow|flex grow|flex shrink|flex basis|flex|order|grid template|grid template areas|grid template columns|grid template rows|grid auto columns|grid auto rows|grid auto flow|grid|grid area|grid column|grid row|grid column start|grid column end|grid row start|grid row end|column|row|float|clear|isolation|z index|top|right|bottom|left|inset|margin|padding|border|width|height|min width|max width|min height|max height|block size|inline size|min block size|max block size|min inline size|max inline size|aspect ratio|box sizing|overflow|overflow x|overflow y|overflow clip margin|overflow anchor|overscroll behavior|scroll snap|scroll snap type|scroll snap align|scroll snap stop|scroll margin|scroll padding|scroll behavior|scrollbar|scrollbar width|scrollbar color|scrollbar gutter|touch action|user select|pointer events|visibility|content visibility|contain|contain intrinsic size|will change|isolation|z index|transform|transform origin|transform style|perspective|perspective origin|backface visibility|translate|rotate|scale|filter|backdrop filter|clip path|mask|mix blend mode|background|border|outline|box shadow|text shadow|opacity|color|font|animation|transition|view transition|cursor|resize|pointer events|user select|touch action|scroll behavior|overscroll behavior|scrollbar|accent color|color scheme|forced color adjust|print color adjust|color adjust|image rendering|object fit|object position|vertical align|line height|letter spacing|word spacing|text indent|text transform|text overflow|white space|word break|overflow wrap|hyphens|text align|text decoration|text shadow|tab size|writing mode|direction|unicode bidi|text orientation|text combine|initial letter|hanging punctuation|line break|orphans|widows|break before|break after|break inside|column|columns|gap|place|justify|align|flex|grid|float|clear|isolation|z-index|position|top|right|bottom|left|inset|margin|padding|border|width|height|min|max|aspect|box|overflow|overscroll|scroll|scrollbar|touch|pointer|visibility|contain|will-change|transform|filter|backdrop|clip|mask|blend|background|outline|shadow|opacity|color|font|animation|transition|view|cursor|resize|select|behavior|accent|scheme|adjust|rendering|fit|position|align|height|spacing|indent|transform|overflow|wrap|hyphens|align|decoration|shadow|size|mode|direction|bidi|orientation|combine|letter|punctuation|break|orphans|widows|break|column|columns|gap|place|justify|align|flex|grid|float|clear|isolation|index|position|inset|margin|padding|border|width|height|aspect|box|overflow|scroll|touch|pointer|visibility|contain|transform|filter|clip|mask|blend|background|outline|shadow|opacity|color|font|animation|transition|cursor|resize|select|behavior|accent|scheme|adjust|rendering|fit|position|align|height|spacing|indent|transform|overflow|wrap|hyphens|decoration|shadow|size|mode|direction|orientation|letter|punctuation|break|orphans|widows|column|gap|place|justify|align|flex|grid|float|clear|isolation|position|inset|margin|padding|border|width|height|aspect|overflow|scroll|touch|pointer|visibility|transform|filter|clip|mask|background|outline|shadow|opacity|color|font|animation|transition|cursor|resize|select|behavior|rendering|fit|align|height|spacing|overflow|wrap|decoration|shadow|size|mode|direction|letter|break|column|gap|justify|align|flex|grid|float|position|inset|margin|padding|border|width|height|overflow|scroll|touch|pointer|visibility|transform|filter|background|outline|shadow|opacity|color|font|animation|transition|cursor|resize|select|behavior|rendering|align|height|spacing|overflow|decoration|shadow|size|mode|break|gap|justify|align|flex|grid|position|inset|margin|padding|border|width|height|overflow|scroll|touch|pointer|visibility|transform|background|outline|shadow|opacity|color|font|animation|transition|cursor|resize|select|behavior|align|height|spacing|overflow|decoration|shadow|size|gap|justify|align|flex|position|inset|margin|padding|border|width|height|overflow|scroll|touch|pointer|visibility|transform|background|outline|shadow|opacity|color|font|animation|transition|cursor|resize|align|height|spacing|overflow|decoration|shadow|gap|justify|align|position|inset|margin|padding|border|width|height|overflow|scroll|touch|pointer|visibility|transform|background|outline|shadow|opacity|color|font|animation|transition|cursor|align|height|spacing|overflow|decoration|gap|justify|position|inset|margin|padding|border|width|height|overflow|scroll|touch|pointer|visibility|transform|background|outline|shadow|opacity|color|font|animation|transition|align|height|spacing|overflow|gap|justify|position|inset|margin|padding|border|width|height|overflow|scroll|touch|pointer|visibility|transform|background|outline|shadow|opacity|color|font|animation|align|height|spacing|overflow|gap|position|inset|margin|padding|border|width|height|overflow|scroll|touch|pointer|visibility|transform|background|outline|shadow|opacity|color|font|align|height|spacing|overflow|gap|position|inset|margin|padding|border|width|height|overflow|scroll|touch|pointer|visibility|transform|background|outline|shadow|opacity|color|align|height|spacing|overflow|gap|position|inset|margin|padding|border|width|height|overflow|scroll|touch|pointer|visibility|transform|background|outline|shadow|opacity|align|height|spacing|overflow|gap|position|inset|margin|padding|border|width|height|overflow|scroll|touch|pointer|visibility|transform|background|outline|shadow|align|height|spacing|overflow|gap|position|inset|margin|padding|border|width|height|overflow|scroll|touch|pointer|visibility|transform|background|outline|align|height|spacing|overflow|gap|position|inset|margin|padding|border|width|height|overflow|scroll|touch|pointer|visibility|transform|background|align|height|spacing|overflow|gap|position|inset|margin|padding|border|width|height|overflow|scroll|touch|pointer|visibility|transform|align|height|spacing|overflow|gap|position|inset|margin|padding|border|width|height|overflow|scroll|touch|pointer|visibility|align|height|spacing|overflow|gap|position|inset|margin|padding|border|width|height|overflow|scroll|touch|pointer|align|height|spacing|overflow|gap|position|inset|margin|padding|border|width|height|overflow|scroll|touch|align|height|spacing|overflow|gap|position|inset|margin|padding|border|width|height|overflow|scroll|align|height|spacing|overflow|gap|position|inset|margin|padding|border|width|height|overflow|align|height|spacing|overflow|gap|position|inset|margin|padding|border|width|height|align|height|spacing|overflow|gap|position|inset|margin|padding|border|width|align|height|spacing|overflow|gap|position|inset|margin|padding|border|align|height|spacing|overflow|gap|position|inset|margin|padding|align|height|spacing|overflow|gap|position|inset|margin|align|height|spacing|overflow|gap|position|inset|align|height|spacing|overflow|gap|position|align|height|spacing|overflow|gap|align|height|spacing|overflow|gap|height|spacing|overflow|gap|spacing|overflow|gap|overflow|gap|gap)\b/i;

const STRONG_UI =
  /\b(hover|transition|animation|motion|smooth|fade|opacity|visible|visibility|affordance|interactive|drag|resize handle|right.?click|context menu|keyboard shortcut|alt drag|ease|duration|spring|stagger|animate|micro.?interaction|show on hover|hide on hover|make (it |them )?(visible|invisible|smooth|smoother)|too (subtle|fast|slow|janky)|not smooth|feels? (janky|laggy|sluggish|snappy|smooth|fluid|polished|native)|150ms|200ms|300ms|ease-in|ease-out|framer|whileHover|AnimatePresence|prefers-reduced-motion|focus.?visible|focus ring|cursor-grab|pointer-events|scroll snap|smooth scroll|view transition|slide in|slide out|fade in|fade out|scale in|scale out|backdrop|glass|skeleton|shimmer|spinner|loading state|empty state|toast|popover|tooltip|sidebar|toolbar|bottom bar|floating|overlay|z-index|transform|translate|scale|rotate|blur|shadow|border radius|rounded|padding|spacing|alignment|responsive|layout|design|look and feel|visual|styling|theme|dark mode|light mode|contrast|legible|typography|icon|overflow|sticky|fixed|floating|card|container|shell|menu|dropdown|popup|panel|drawer|accordion|tab|toggle|slider|handle|grab|draggable|snap|inertia|springy|crisp|soft|gradient|transparent|semi.?transparent|highlight|glow|pulse|bounce|wiggle|peek|subtle|prominent|muted|accent|polish|fluid|snappy|janky|lag|delay|timing|easing|interaction|ui|ux|appearance|feel native|apple.?like|cursor.?like|notion.?like|figma.?like|linear.?like|shadcn|tailwind|globals\.css|framer-motion|variants|initial|animate|exit|layoutId|useSpring|a11y|aria|focus trap|tab order|tabindex|hit area|touch target|44px|48px|cursor-pointer|cursor-grab|cursor-grabbing|cursor-move|cursor-resize|cursor-col-resize|cursor-row-resize|cursor-ew-resize|cursor-ns-resize|resize handle|drag handle|grab area|hitbox|hotspot|click area|tap target|hover area|hover zone|hover reveal|default visible|always visible|only visible|make visible|should be visible|can't see|cannot see|hard to see|too subtle|too loud|more smooth|smoother|snappier|instant|no delay|debounce|throttle|will-change|smooth scroll|auto scroll|scroll into view|scroll reveal|parallax|sticky header|auto hide|auto show|auto dismiss|progressive disclosure|expand on click|collapse on blur|open state|closed state|expanded|collapsed|picture.?in.?picture|split view|navigation|breadcrumb|undo|redo|copy|paste|duplicate|alt drag|keyboard shortcut|cmd\+|ctrl\+|gesture|pinch zoom|trackpad|mouse wheel|inertia scroll|rubber band|overscroll|morph|lottie|skeleton loader|shimmer|spinner|toast|snackbar|dialog|popover|dropdown menu|combobox|autocomplete|dim|scrim|veil|mask|clip path|wipe|blur in|blur out|scale in|scale out|slide in|slide out|glassmorphism|frosted|translucent|backdrop blur|mix blend|box shadow|text shadow|inner shadow|glow|neon|elevation|raised|sunken|inset|outset|neumorphic|flat design|material design|hig|wcag|contrast ratio|high contrast|large text|dynamic type|fluid typography|clamp|aspect ratio|object fit|grid|flex|stack|overlay|underlay|layer|layered|position absolute|position fixed|position sticky|transform origin|perspective|preserve 3d|filter blur|drop shadow|color mix|accent color|caret color|outline color|border color|background color|scrollbar|scroll bar|scroll snap|scroll behavior|touch action|user select|pointer events|visibility hidden|display none|display flex|display grid|@container|view transition|startViewTransition|cross fade|shared element|hero animation|matched geometry|morph transition|prefers color scheme|prefers contrast|prefers reduced motion|prefers reduced transparency|pointer fine|pointer coarse|any hover|any pointer|screen reader|keyboard nav|skip link|min.?width|min.?height|44px|48px)\b/i;

function walkJsonlFiles(dir, results = []) {
  if (!fs.existsSync(dir)) return results;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walkJsonlFiles(full, results);
    else if (entry.name.endsWith(".jsonl") && !entry.name.includes("subagent"))
      results.push(full);
  }
  return results;
}

function extractUserText(lineObj) {
  if (lineObj.role !== "user") return null;
  const parts = lineObj.message?.content;
  if (!Array.isArray(parts)) return null;
  const texts = parts
    .filter((p) => p.type === "text" && typeof p.text === "string")
    .map((p) => p.text);
  if (!texts.length) return null;
  let text = texts.join("\n");
  text = text.replace(/<user_query>\s*/gi, "").replace(/\s*<\/user_query>/gi, "");
  text = text.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  return text || null;
}

function isUiRelated(text) {
  if (!text || text.length < 8) return false;
  if (STRONG_UI.test(text)) return true;
  const lower = text.toLowerCase();
  const uiPhrases = [
    "look",
    "feel",
    "design",
    "layout",
    "position",
    "align",
    "size",
    "width",
    "height",
    "color",
    "colour",
    "font",
    "icon",
    "button",
    "menu",
    "popup",
    "sidebar",
    "toolbar",
    "canvas",
    "node",
    "artifact",
    "artefact",
    "visible",
    "hide",
    "show",
    "display",
    "move",
    "drag",
    "resize",
    "click",
    "hover",
    "smooth",
    "animation",
    "transition",
    "interaction",
    "ui",
    "ux",
    "appearance",
    "style",
    "theme",
    "responsive",
    "mobile",
    "desktop",
    "screen",
    "viewport",
    "scroll",
    "overflow",
    "border",
    "shadow",
    "radius",
    "padding",
    "margin",
    "spacing",
    "gap",
    "grid",
    "flex",
    "stack",
    "overlay",
    "modal",
    "dialog",
    "toast",
    "tooltip",
    "popover",
    "dropdown",
    "context",
    "right click",
    "keyboard",
    "shortcut",
    "focus",
    "blur",
    "opacity",
    "fade",
    "slide",
    "scale",
    "transform",
    "motion",
    "animate",
    "ease",
    "duration",
    "spring",
    "snappy",
    "janky",
    "lag",
    "polish",
    "native",
    "affordance",
    "grab",
    "handle",
    "cursor",
    "pointer",
    "touch",
    "tap",
    "swipe",
    "pinch",
    "zoom",
    "pan",
  ];
  let hits = 0;
  for (const p of uiPhrases) {
    if (lower.includes(p)) hits++;
  }
  return hits >= 2 || (hits >= 1 && text.length < 200);
}

function categorize(text) {
  const lower = text.toLowerCase();
  const cats = [];
  const rules = [
    ["Hover states", /\b(hover|on hover|when hover|hover state|hover reveal|show on hover|hide on hover)\b/i],
    ["Visibility & affordance", /\b(visible|visibility|invisible|hidden|show|hide|appear|disappear|affordance|indication|indicate|can't see|cannot see|hard to see|too subtle|default visible|always visible|only visible|make visible|see that| indication)\b/i],
    ["Motion & transitions", /\b(motion|animation|animate|transition|smooth|smoothly|ease|duration|spring|stagger|fade|slide|scale|transform|framer|150ms|200ms|300ms|ease-in|ease-out|cubic-bezier|AnimatePresence|whileHover|whileTap|layoutId|view transition|prefers-reduced-motion|snappy|janky|lag|delay|timing|easing|fluid|polish|instant|no delay)\b/i],
    ["Drag, drop & resize", /\b(drag|drop|resize|grab|handle|alt drag|alt-drag|draggable|droppable|cursor-grab|cursor-grabbing|cursor-move|cursor-resize|resize handle|drag handle|grab area|hitbox|hotspot|snap|magnetic|inertia)\b/i],
    ["Focus, keyboard & shortcuts", /\b(keyboard|shortcut|cmd\+|ctrl\+|meta\+|shift\+|hotkey|keybind|focus|blur|focus ring|focus-visible|tab order|tabindex|focus trap|keyboard nav|right click|context menu|alt drag)\b/i],
    ["Layout & responsiveness", /\b(layout|responsive|grid|flex|stack|align|alignment|position|spacing|padding|margin|gap|width|height|size|overflow|viewport|mobile|desktop|clamp|aspect ratio|object fit|container|shell|card|panel|sidebar|toolbar|bottom bar|top bar|floating|fixed|sticky)\b/i],
    ["Visual style & theming", /\b(color|colour|theme|dark mode|light mode|contrast|font|typography|icon|border|radius|shadow|blur|backdrop|glass|gradient|transparent|opacity|muted|accent|highlight|glow|palette|scheme|styling|style|look|feel|appearance|visual|design|polish|native|apple|cursor|notion|figma|linear|shadcn|tailwind)\b/i],
    ["Feedback & states", /\b(loading|skeleton|shimmer|spinner|empty state|error state|success|toast|snackbar|tooltip|popover|modal|dialog|active|inactive|disabled|enabled|selected|unselected|pressed|hover|focus|loading state|feedback|pulse|bounce|wiggle)\b/i],
    ["Scroll & overflow", /\b(scroll|scrollbar|scroll snap|smooth scroll|auto scroll|scroll into view|scroll reveal|parallax|overscroll|rubber band|overflow|clip|truncate|ellipsis)\b/i],
    ["Canvas & artifacts UI", /\b(canvas|artifact|artefact|node|question node|answer node|skill|input artifact|output artifact|toolbar|pie menu|ghost|preview|placement|sidebar tile|version history|outer container)\b/i],
  ];
  for (const [cat, re] of rules) {
    if (re.test(lower)) cats.push(cat);
  }
  return cats.length ? cats : ["General UI / interaction"];
}

function dedupeKey(text) {
  return text.toLowerCase().replace(/[^\w\s]/g, "").replace(/\s+/g, " ").trim().slice(0, 120);
}

function main() {
  const cutoff = Date.now() - DAYS * 24 * 60 * 60 * 1000;
  const files = walkJsonlFiles(TRANSCRIPTS_DIR).filter((f) => {
    try {
      return fs.statSync(f).mtimeMs >= cutoff;
    } catch {
      return false;
    }
  });

  const items = [];
  const seen = new Set();

  for (const file of files) {
    const chatId = path.basename(file, ".jsonl");
    const lines = fs.readFileSync(file, "utf8").split("\n").filter(Boolean);
    let msgIndex = 0;
    for (const line of lines) {
      let obj;
      try {
        obj = JSON.parse(line);
      } catch {
        continue;
      }
      const text = extractUserText(obj);
      if (!text) continue;
      msgIndex++;
      if (!isUiRelated(text)) continue;
      const key = dedupeKey(text);
      if (seen.has(key)) continue;
      seen.add(key);
      items.push({
        chatId,
        messageIndex: msgIndex,
        text,
        categories: categorize(text),
        source: path.relative(process.cwd(), file).replace(/\\/g, "/"),
        mtime: fs.statSync(file).mtime.toISOString(),
      });
    }
  }

  items.sort((a, b) => new Date(b.mtime) - new Date(a.mtime));

  fs.mkdirSync(path.dirname(OUT_JSON), { recursive: true });
  fs.writeFileSync(OUT_JSON, JSON.stringify({ generatedAt: new Date().toISOString(), days: DAYS, count: items.length, items }, null, 2));
  console.log(`Extracted ${items.length} UI-related user instructions from ${files.length} transcripts`);
  console.log(`Wrote ${OUT_JSON}`);
}

main();
