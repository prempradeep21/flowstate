/** Static artifact catalog data — mirrors lib/artifactRegistry + artifactPrompt. */

export const FLOWSTATE_ARTIFACTS = [
  {
    id: "table",
    name: "Tables",
    title: "Tabular data with columns and rows",
    description:
      "Organize metrics, comparisons, and structured lists in a sortable grid. Status and category labels appear as chips inside cells.",
    chips: ["financial planning", "product comparison", "research summaries", "metrics"],
  },
  {
    id: "code",
    name: "Code",
    title: "Multi-file source snippets",
    description:
      "Explore implementations across one or more files with syntax highlighting. Supports HTML, CSS, Python, TypeScript, and any text format.",
    chips: ["API design", "debugging", "implementation walkthroughs", "prototyping"],
  },
  {
    id: "3d",
    name: "3D preview",
    title: "GLB / GLTF model viewer",
    description:
      "Preview 3D models directly on the canvas. Point to a model URL and rotate or inspect the asset in context.",
    chips: ["product design", "architecture", "game assets", "visualization"],
  },
  {
    id: "map",
    name: "Maps",
    title: "Geographic place preview",
    description:
      "Pin a geocodable place — city, state, or country — for travel and location context. Saved pins persist when editing.",
    chips: ["travel", "geography", "trip planning", "location research"],
  },
  {
    id: "streetview",
    name: "Street view",
    title: "Ground-level venue preview",
    description:
      "Open Google Street View at a specific named venue — station, hotel, landmark, or address — for a street-level look.",
    chips: ["travel", "real estate", "venue scouting", "navigation"],
  },
  {
    id: "todo",
    name: "To-do lists",
    title: "Checklists with completion state",
    description:
      "Track actionable items with checkboxes, optional due dates, and priority levels. Use instead of prose lists for tasks.",
    chips: ["project planning", "packing lists", "sprint tasks", "errands"],
  },
  {
    id: "calendar",
    name: "Calendars",
    title: "Month grid with events",
    description:
      "View a month at a glance with highlighted dates and all-day events. Ideal for scheduling, not chronology over years.",
    chips: ["scheduling", "deadlines", "trip dates", "event planning"],
  },
  {
    id: "timeline",
    name: "Timelines",
    title: "Chronological event axis",
    description:
      "Map events across time on a horizontal axis. Use for history, roadmaps, and milestones — not month-grid scheduling.",
    chips: ["history", "roadmaps", "product milestones", "biographies"],
  },
  {
    id: "custom",
    name: "Custom UI",
    title: "Interactive HTML / CSS / JS widget",
    description:
      "Build self-contained interactive components — timers, forms, dashboards, calculators. The artifact is the deliverable.",
    chips: ["dashboards", "calculators", "forms", "widgets"],
  },
];

export const INPUT_ARTIFACTS = [
  {
    id: "website",
    name: "Websites",
    title: "Link preview for any URL",
    description:
      "Paste a generic URL to spawn a preview card with title, domain, favicon, and optional preview image.",
    chips: ["research", "documentation", "reference links", "bookmarks"],
  },
  {
    id: "images",
    name: "Images",
    title: "Image gallery and references",
    description:
      "Paste image URLs or search Wikimedia for real photographs of places, people, and things.",
    chips: ["mood boards", "reference photos", "visual research", "travel inspiration"],
  },
  {
    id: "video",
    name: "Videos",
    title: "YouTube and video embeds",
    description:
      "Paste a YouTube or video URL to create a grid of playable clips with thumbnails and titles.",
    chips: ["tutorials", "talks", "travel vlogs", "demos"],
  },
  {
    id: "audio-short",
    name: "Audio — short clip",
    title: "Voice memo with time-proportional waveform",
    description:
      "Drop MP3, WAV, M4A, AAC, OGG, or WebM audio. Waveform width scales with clip duration (10 MB max).",
    chips: ["voice memos", "interviews", "podcast clips", "field recordings"],
  },
  {
    id: "audio-long",
    name: "Audio — long clip",
    title: "Longer recordings span wider waveforms",
    description:
      "A 5-minute clip is five times the waveform width of a 1-minute clip when placed side by side.",
    chips: ["meetings", "lectures", "ambient", "music sketches"],
  },
  {
    id: "repo",
    name: "Repositories",
    title: "GitHub repo dashboard",
    description:
      "Paste a GitHub URL to explore a repository with overview, file structure, media, preview, tech stack, and built-by widgets.",
    chips: ["code exploration", "OSS evaluation", "onboarding", "due diligence"],
  },
  {
    id: "embed",
    name: "Embeds",
    title: "Social and content iframes",
    description:
      "Paste URLs from Reddit, Twitter, Instagram, Facebook, Medium, Substack, or Figma for embedded previews.",
    chips: ["social proof", "design refs", "threads", "articles"],
  },
  {
    id: "prompt",
    name: "Free-form prompts",
    title: "Any text the user types",
    description:
      "Open-ended questions and brainstorming spawn text cards and can trigger any artifact type the AI deems fit.",
    chips: ["brainstorming", "Q&A", "open-ended inquiry", "exploration"],
  },
];

export const CUSTOM_UI_EXAMPLES = [
  {
    id: "timezone",
    name: "Time zone converter",
    title: "Local ↔ foreign time",
    description:
      "Compare your local clock with any destination timezone. Handy when planning calls or arrivals abroad.",
    chips: ["travel", "remote work", "scheduling"],
    placeholder: true,
  },
  {
    id: "currency",
    name: "Currency converter",
    title: "Live exchange rates",
    description:
      "Convert amounts between currencies for trips, invoices, or cross-border purchases.",
    chips: ["travel", "financial planning", "shopping"],
    placeholder: true,
  },
  {
    id: "pixel-art",
    name: "Pixel art generator",
    title: "Grid-based sprite editor",
    description:
      "Paint and export small pixel sprites for games, icons, or retro-style illustrations.",
    chips: ["creative", "game dev", "icons"],
    placeholder: true,
  },
  {
    id: "pomodoro",
    name: "Pomodoro timer",
    title: "Focus intervals",
    description:
      "Run timed work and break cycles with start, pause, and reset controls built into the artifact.",
    chips: ["focus", "productivity", "study sessions"],
    placeholder: true,
  },
  {
    id: "units",
    name: "Unit converter",
    title: "Length, weight, temperature",
    description:
      "Convert between metric and imperial units for cooking, science experiments, or travel packing.",
    chips: ["cooking", "science", "travel"],
    placeholder: true,
  },
  {
    id: "budget",
    name: "Trip budget planner",
    title: "Expense breakdown by category",
    description:
      "Split a trip budget across flights, lodging, food, and activities with running totals.",
    chips: ["travel", "financial planning", "group trips"],
    placeholder: true,
  },
];

export const THEME_OPTIONS = [
  { id: "light", label: "Light", description: "Warm paper canvas" },
  { id: "dark", label: "Dark", description: "Warm near-black canvas" },
];

export const BACKGROUND_OPTIONS = [
  { id: "grid", label: "Dot grid", description: "Classic dotted canvas grid" },
  { id: "ambient-gradient", label: "Ambient", description: "Soft diffused color gradients" },
];

export const LIGHT_THEME_BACKGROUNDS = ["grid", "ambient-gradient"];

export const BODY_FONT_OPTIONS = [
  { id: "archivo", label: "Archivo", family: '"Archivo", sans-serif' },
  { id: "satoshi", label: "Satoshi", family: '"Satoshi", sans-serif', local: true },
  { id: "sanchez", label: "Sanchez", family: '"Sanchez", serif', google: "Sanchez" },
  { id: "figtree", label: "Figtree", family: '"Figtree", sans-serif', google: "Figtree" },
  { id: "parkinsans", label: "Parkinsans", family: '"Parkinsans", sans-serif', google: "Parkinsans" },
  { id: "urbanist", label: "Urbanist", family: '"Urbanist", sans-serif', google: "Urbanist" },
];

export const DISPLAY_FONT_OPTIONS = [
  { id: "denton", label: "Denton", family: '"Denton", serif', local: true },
  { id: "lora", label: "Lora", family: '"Lora", serif', google: "Lora" },
  { id: "abril-fatface", label: "Abril Fatface", family: '"Abril Fatface", serif', google: "Abril+Fatface" },
  { id: "unbounded", label: "Unbounded", family: '"Unbounded", sans-serif', google: "Unbounded" },
];
