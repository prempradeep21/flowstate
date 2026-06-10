import type { ArtifactPayload } from "@/lib/artifactTypes";
import { createRepoPayload } from "@/lib/repoArtifact";
import { createWebsitePayload } from "@/lib/websiteArtifact";
import { createEmbedPayload } from "@/lib/embedArtifact";

/** Cubbon Park, Bengaluru — canonical map / street-view focus for catalog previews. */
export const CATALOG_CUBBON_PARK = {
  name: "Cubbon Park, Bengaluru",
  lat: 12.976663,
  lng: 77.59234,
} as const;

export type ArtifactCatalogCategory = "flowstate" | "input" | "custom-example";

export interface ArtifactCatalogEntry {
  id: string;
  category: ArtifactCatalogCategory;
  name: string;
  title: string;
  description: string;
  chips: string[];
  payload?: ArtifactPayload;
  /** Text-card preview for free-form prompts (no artifact payload). */
  previewKind?: "text-card";
  textCard?: { question: string; answer: string };
}

const repoPayload = createRepoPayload("https://github.com/vercel/next.js");

export const ARTIFACT_CATALOG_ENTRIES: ArtifactCatalogEntry[] = [
  {
    id: "table",
    category: "flowstate",
    name: "Tables",
    title: "Tabular data with columns and rows",
    description:
      "Organize metrics, comparisons, and structured lists in a sortable grid. Status and category labels appear as chips inside cells.",
    chips: ["financial planning", "product comparison", "research summaries", "metrics"],
    payload: {
      type: "table",
      title: "Trip budget comparison",
      data: {
        columns: [
          { key: "city", label: "City" },
          { key: "nights", label: "Nights" },
          { key: "lodging", label: "Lodging" },
          { key: "status", label: "Status" },
        ],
        rows: [
          {
            city: "Lisbon",
            nights: "4",
            lodging: "€420",
            status: { value: "Booked", tags: [{ label: "Confirmed", tone: "success" }] },
          },
          {
            city: "Porto",
            nights: "3",
            lodging: "€310",
            status: { value: "Shortlist", tags: [{ label: "Compare", tone: "info" }] },
          },
          {
            city: "Madrid",
            nights: "2",
            lodging: "€240",
            status: { value: "Draft", tags: [{ label: "Pending", tone: "warning" }] },
          },
        ],
      },
    },
  },
  {
    id: "chart-bar",
    category: "flowstate",
    name: "Charts — bar",
    title: "Monthly coffee spend",
    description:
      "Compare categories with bar charts. Switch type and style via the toolbar — ECharts or visx, plain background.",
    chips: ["budgeting", "spending", "personal finance", "comparison"],
    payload: {
      type: "chart",
      title: "Monthly coffee spend",
      data: {
        chartType: "bar",
        categories: ["Café", "Beans", "Takeaway"],
        series: [{ name: "Spend", data: [12, 28, 8] }],
        unit: "€",
      },
    },
  },
  {
    id: "chart-area",
    category: "flowstate",
    name: "Charts — area",
    title: "Running distance this year",
    description:
      "Filled trends with visx AreaClosed curves by default. Try stream graph when you have multiple series.",
    chips: ["fitness", "running", "trends", "health"],
    payload: {
      type: "chart",
      title: "Running distance this year",
      data: {
        chartType: "area",
        categories: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
        series: [
          { name: "Road", data: [12, 18, 22, 28, 35, 42] },
          { name: "Trail", data: [8, 10, 14, 16, 20, 24] },
        ],
        unit: "km",
      },
    },
  },
  {
    id: "chart-line",
    category: "flowstate",
    name: "Charts — line",
    title: "Sleep hours — last 14 nights",
    description:
      "Time-series line graphs with smooth visx curves. Toggle ECharts straight or smooth styles.",
    chips: ["sleep", "wellness", "habits", "tracking"],
    payload: {
      type: "chart",
      title: "Sleep hours — last 14 nights",
      data: {
        chartType: "line",
        categories: [
          "D1", "D2", "D3", "D4", "D5", "D6", "D7",
          "D8", "D9", "D10", "D11", "D12", "D13", "D14",
        ],
        series: [
          {
            name: "Hours",
            data: [6.5, 7, 6.8, 7.2, 6.9, 7.5, 7.1, 7.3, 7.6, 7.4, 7.8, 7.2, 7.5, 7.7],
          },
        ],
        unit: "hrs",
      },
    },
  },
  {
    id: "chart-pie",
    category: "flowstate",
    name: "Charts — pie",
    title: "How I spend my weekend",
    description:
      "Share-of-whole breakdowns for personal time, budget slices, or habit splits.",
    chips: ["weekend", "time management", "lifestyle", "balance"],
    payload: {
      type: "chart",
      title: "How I spend my weekend",
      data: {
        chartType: "pie",
        slices: [
          { name: "Rest", value: 40 },
          { name: "Social", value: 25 },
          { name: "Chores", value: 20 },
          { name: "Hobbies", value: 15 },
        ],
      },
    },
  },
  {
    id: "chart-gauge",
    category: "flowstate",
    name: "Charts — gauge",
    title: "Emergency fund progress",
    description:
      "Track progress toward a personal goal with a plain gauge or progress bar.",
    chips: ["savings", "goals", "finance", "progress"],
    payload: {
      type: "chart",
      title: "Emergency fund progress",
      data: {
        chartType: "gauge",
        gaugeValue: 4200,
        gaugeMax: 6000,
        gaugeLabel: "Emergency fund",
        unit: "€",
      },
    },
  },
  {
    id: "code",
    category: "flowstate",
    name: "Code",
    title: "Multi-file source snippets",
    description:
      "Explore implementations across one or more files with syntax highlighting. Supports HTML, CSS, Python, TypeScript, and any text format.",
    chips: ["API design", "debugging", "implementation walkthroughs", "prototyping"],
    payload: {
      type: "code",
      title: "Rate limiter",
      data: {
        files: [
          {
            path: "limiter.ts",
            language: "typescript",
            content: `const windowMs = 60_000;
const maxRequests = 100;

export function checkLimit(count: number): boolean {
  return count <= maxRequests;
}`,
          },
          {
            path: "README.md",
            language: "markdown",
            content: "# Rate limiter\n\nToken-bucket helper for API routes.",
          },
        ],
      },
    },
  },
  {
    id: "3d",
    category: "flowstate",
    name: "3D preview",
    title: "GLB / GLTF model viewer",
    description:
      "Preview 3D models directly on the canvas. Point to a model URL and rotate or inspect the asset in context.",
    chips: ["product design", "architecture", "game assets", "visualization"],
    payload: {
      type: "3d",
      title: "Desk lamp",
      data: {
        modelUrl: "https://modelviewer.dev/shared-assets/models/Astronaut.glb",
        format: "glb",
      },
    },
  },
  {
    id: "map",
    category: "flowstate",
    name: "Maps",
    title: "Geographic place preview",
    description:
      "Pin a geocodable place — city, state, or country — for travel and location context. Saved pins persist when editing.",
    chips: ["travel", "geography", "trip planning", "location research"],
    payload: {
      type: "map",
      title: "Cubbon Park, Bengaluru",
      data: {
        place: {
          name: CATALOG_CUBBON_PARK.name,
          lat: CATALOG_CUBBON_PARK.lat,
          lng: CATALOG_CUBBON_PARK.lng,
        },
        zoom: 15,
        savedPlaces: [
          {
            id: "pin_bandstand",
            label: "Band Stand",
            lat: 12.9769,
            lng: 77.5935,
            type: "landmark",
          },
        ],
      },
    },
  },
  {
    id: "streetview",
    category: "flowstate",
    name: "Street view",
    title: "Ground-level venue preview",
    description:
      "Open Google Street View at a specific named venue — station, hotel, landmark, or address — for a street-level look.",
    chips: ["travel", "real estate", "venue scouting", "navigation"],
    payload: {
      type: "streetview",
      title: "Cubbon Park",
      data: {
        place: {
          name: CATALOG_CUBBON_PARK.name,
          lat: CATALOG_CUBBON_PARK.lat,
          lng: CATALOG_CUBBON_PARK.lng,
        },
        heading: 110,
        pitch: 0,
        fov: 90,
      },
    },
  },
  {
    id: "todo",
    category: "flowstate",
    name: "To-do lists",
    title: "Checklists with completion state",
    description:
      "Track actionable items with checkboxes, optional due dates, and priority levels. Use instead of prose lists for tasks.",
    chips: ["project planning", "packing lists", "sprint tasks", "errands"],
    payload: {
      type: "todo",
      title: "Weekend trip prep",
      data: {
        items: [
          { id: "t1", label: "Book train tickets", checked: true, priority: "high" },
          { id: "t2", label: "Pack camera", checked: false, dueDate: "2026-06-14", priority: "medium" },
          { id: "t3", label: "Download offline maps", checked: false, priority: "low" },
        ],
      },
    },
  },
  {
    id: "calendar",
    category: "flowstate",
    name: "Calendars",
    title: "Month grid with events",
    description:
      "View a month at a glance with highlighted dates and all-day events. Ideal for scheduling, not chronology over years.",
    chips: ["scheduling", "deadlines", "trip dates", "event planning"],
    payload: {
      type: "calendar",
      title: "June 2026",
      data: {
        viewYear: 2026,
        viewMonth: 6,
        highlightedDates: ["2026-06-14", "2026-06-15", "2026-06-20"],
        events: [
          { id: "e1", title: "Fly to Lisbon", startDate: "2026-06-14", endDate: "2026-06-14" },
          { id: "e2", title: "Design review", startDate: "2026-06-20", endDate: "2026-06-20" },
        ],
      },
    },
  },
  {
    id: "timeline",
    category: "flowstate",
    name: "Timelines",
    title: "Chronological event axis",
    description:
      "Map events across time on a horizontal axis. Use for history, roadmaps, and milestones — not month-grid scheduling.",
    chips: ["history", "roadmaps", "product milestones", "biographies"],
    payload: {
      type: "timeline",
      title: "Product roadmap",
      data: {
        scale: "month",
        events: [
          { id: "ev1", label: "Alpha release", at: "2026-03-01T12:00:00.000Z" },
          { id: "ev2", label: "Beta launch", at: "2026-05-15T12:00:00.000Z", highlight: true },
          { id: "ev3", label: "Public launch", at: "2026-08-01T12:00:00.000Z" },
        ],
      },
    },
  },
  {
    id: "custom",
    category: "flowstate",
    name: "Custom UI",
    title: "Interactive HTML / CSS / JS widget",
    description:
      "Build self-contained interactive components — timers, forms, dashboards, calculators. The artifact is the deliverable.",
    chips: ["dashboards", "calculators", "forms", "widgets"],
    payload: {
      type: "custom",
      title: "Pomodoro timer",
      data: {
        html: `<div class="wrap"><p class="label">Focus session</p><p class="time" id="time">25:00</p><div class="btns"><button type="button" id="start">Start</button><button type="button" id="pause">Pause</button><button type="button" id="reset">Reset</button></div></div>`,
        css: `.wrap{font-family:system-ui,sans-serif;text-align:center;padding:28px 20px}.label{margin:0 0 8px;font-size:13px;color:#8b8680;text-transform:uppercase;letter-spacing:.06em}.time{margin:0 0 20px;font-size:52px;font-weight:700;font-variant-numeric:tabular-nums}.btns{display:flex;gap:8px;justify-content:center}button{padding:8px 14px;border-radius:8px;border:1px solid #e6e4df;background:#fff;cursor:pointer;font-size:13px}button:hover{border-color:#6b4eff;color:#6b4eff}`,
        js: `let s=25*60,t=null,running=false;const el=document.getElementById('time');function draw(){const m=String(Math.floor(s/60)).padStart(2,'0');const sec=String(s%60).padStart(2,'0');el.textContent=m+':'+sec}document.getElementById('start').onclick=()=>{if(running)return;running=true;t=setInterval(()=>{if(s<=0){clearInterval(t);running=false;return}s--;draw()},1000)};document.getElementById('pause').onclick=()=>{clearInterval(t);running=false};document.getElementById('reset').onclick=()=>{clearInterval(t);running=false;s=25*60;draw()};draw();`,
      },
    },
  },
  {
    id: "website",
    category: "input",
    name: "Websites",
    title: "Link preview for any URL",
    description:
      "Paste a generic URL to spawn a preview card with title, domain, favicon, and optional preview image.",
    chips: ["research", "documentation", "reference links", "bookmarks"],
    payload: createWebsitePayload("https://nextjs.org", "nextjs.org"),
  },
  {
    id: "images",
    category: "input",
    name: "Images",
    title: "Image gallery and references",
    description:
      "Paste image URLs or search Wikimedia for real photographs of places, people, and things.",
    chips: ["mood boards", "reference photos", "visual research", "travel inspiration"],
    payload: {
      type: "images",
      title: "Visual references",
      data: {
        items: [
          {
            kind: "image",
            url: "/catalog/potato-growth-stages.png",
            alt: "Potato growth stages infographic",
          },
          {
            kind: "image",
            url: "/catalog/jathiratnalu-poster.png",
            alt: "Jathiratnalu standup comedy show poster",
          },
        ],
      },
    },
  },
  {
    id: "video",
    category: "input",
    name: "Videos",
    title: "YouTube and video embeds",
    description:
      "Paste a YouTube or video URL to create a grid of playable clips with thumbnails and titles.",
    chips: ["tutorials", "talks", "travel vlogs", "demos"],
    payload: {
      type: "video",
      title: "Talks to watch",
      data: {
        items: [
          {
            url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
            thumb: "https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg",
            title: "Conference keynote",
          },
        ],
      },
    },
  },
  ...(repoPayload
    ? [
        {
          id: "repo",
          category: "input" as const,
          name: "Repositories",
          title: "GitHub repo dashboard",
          description:
            "Paste a GitHub URL to explore a repository with overview, file structure, media, preview, tech stack, and built-by widgets.",
          chips: ["code exploration", "OSS evaluation", "onboarding", "due diligence"],
          payload: repoPayload,
        },
      ]
    : []),
  {
    id: "embed",
    category: "input",
    name: "Embeds",
    title: "Social and content iframes",
    description:
      "Paste URLs from Reddit, Twitter, Instagram, Facebook, Medium, Substack, or Figma for embedded previews.",
    chips: ["social proof", "design refs", "threads", "articles"],
    payload: createEmbedPayload(
      "https://www.reddit.com/r/nextjs/comments/example/",
      "reddit",
    ),
  },
  {
    id: "prompt",
    category: "input",
    name: "Free-form prompts",
    title: "Any text the user types",
    description:
      "Open-ended questions and brainstorming spawn text cards and can trigger any artifact type the AI deems fit.",
    chips: ["brainstorming", "Q&A", "open-ended inquiry", "exploration"],
    previewKind: "text-card",
    textCard: {
      question: "What are good day-trip options from Lisbon?",
      answer:
        "Sintra and Cascais are the easiest wins — both are under an hour by train and pair well with a long weekend in the city.",
    },
  },
  {
    id: "timezone",
    category: "custom-example",
    name: "Time zone converter",
    title: "Local ↔ foreign time",
    description:
      "Compare your local clock with any destination timezone. Handy when planning calls or arrivals abroad.",
    chips: ["travel", "remote work", "scheduling"],
    payload: {
      type: "custom",
      title: "Time zone converter",
      data: {
        html: `<div class="wrap"><label>Local<input type="time" id="local" value="09:00"/></label><label>Tokyo (+9)<input type="time" id="tokyo" value="23:00" readonly/></label></div>`,
        css: `.wrap{display:grid;gap:12px;padding:24px;font-family:system-ui,sans-serif}label{display:grid;gap:6px;font-size:12px;color:#8b8680;text-transform:uppercase;letter-spacing:.05em}input{padding:10px 12px;border-radius:8px;border:1px solid #e6e4df;font-size:16px}`,
        js: `const local=document.getElementById('local');const tokyo=document.getElementById('tokyo');local.onchange=()=>{const [h,m]=local.value.split(':').map(Number);const utc=h*60+m;const t=(utc+9*60)%(24*60);tokyo.value=String(Math.floor(t/60)).padStart(2,'0')+':'+String(t%60).padStart(2,'0')};`,
      },
    },
  },
  {
    id: "currency",
    category: "custom-example",
    name: "Currency converter",
    title: "Live exchange rates",
    description:
      "Convert amounts between currencies for trips, invoices, or cross-border purchases.",
    chips: ["travel", "financial planning", "shopping"],
    payload: {
      type: "custom",
      title: "Currency converter",
      data: {
        html: `<div class="wrap"><label>USD<input type="number" id="usd" value="100"/></label><p id="eur">€92.00 EUR</p></div>`,
        css: `.wrap{padding:24px;font-family:system-ui,sans-serif}label{display:grid;gap:6px;font-size:12px;color:#8b8680;margin-bottom:12px}input{padding:10px 12px;border-radius:8px;border:1px solid #e6e4df;font-size:18px;width:100%}#eur{margin:0;font-size:28px;font-weight:600}`,
        js: `const usd=document.getElementById('usd');const eur=document.getElementById('eur');usd.oninput=()=>{const v=Number(usd.value||0);eur.textContent='€'+(v*0.92).toFixed(2)+' EUR'};`,
      },
    },
  },
  {
    id: "units",
    category: "custom-example",
    name: "Unit converter",
    title: "Length, weight, temperature",
    description:
      "Convert between metric and imperial units for cooking, science experiments, or travel packing.",
    chips: ["cooking", "science", "travel"],
    payload: {
      type: "custom",
      title: "Unit converter",
      data: {
        html: `<div class="wrap"><label>Miles<input type="number" id="mi" value="10"/></label><p id="km">16.1 km</p></div>`,
        css: `.wrap{padding:24px;font-family:system-ui,sans-serif}label{display:grid;gap:6px;font-size:12px;color:#8b8680}input{padding:10px 12px;border-radius:8px;border:1px solid #e6e4df;font-size:18px;width:100%}#km{margin:12px 0 0;font-size:28px;font-weight:600}`,
        js: `const mi=document.getElementById('mi');const km=document.getElementById('km');mi.oninput=()=>{km.textContent=(Number(mi.value||0)*1.60934).toFixed(1)+' km'};`,
      },
    },
  },
  {
    id: "budget",
    category: "custom-example",
    name: "Trip budget planner",
    title: "Expense breakdown by category",
    description:
      "Split a trip budget across flights, lodging, food, and activities with running totals.",
    chips: ["travel", "financial planning", "group trips"],
    payload: {
      type: "custom",
      title: "Trip budget planner",
      data: {
        html: `<div class="wrap"><div class="row"><span>Flights</span><input type="number" class="cost" value="420"/></div><div class="row"><span>Lodging</span><input type="number" class="cost" value="680"/></div><div class="row"><span>Food</span><input type="number" class="cost" value="240"/></div><p class="total">Total: €1340</p></div>`,
        css: `.wrap{padding:20px;font-family:system-ui,sans-serif}.row{display:flex;justify-content:space-between;align-items:center;gap:12px;margin-bottom:10px;font-size:14px}.cost{width:88px;padding:6px 8px;border-radius:8px;border:1px solid #e6e4df;text-align:right}.total{margin:16px 0 0;font-size:22px;font-weight:700}`,
        js: `function sum(){return [...document.querySelectorAll('.cost')].reduce((a,i)=>a+Number(i.value||0),0)}function draw(){document.querySelector('.total').textContent='Total: €'+sum()}document.querySelectorAll('.cost').forEach(i=>i.oninput=draw);`,
      },
    },
  },
];

export const CATALOG_SECTIONS: {
  id: ArtifactCatalogCategory;
  title: string;
  description: string;
}[] = [
  {
    id: "flowstate",
    title: "Flowstate artifacts",
    description: "Structured outputs the AI emits via emit_artifact",
  },
  {
    id: "input",
    title: "Input artifacts",
    description: "Created from pasted URLs, media, and free-form user input",
  },
  {
    id: "custom-example",
    title: "Custom UI examples",
    description: "Interactive widgets built inside the Custom UI artifact",
  },
];
