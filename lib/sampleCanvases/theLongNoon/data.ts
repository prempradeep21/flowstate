import {
  artifact,
  askPrompt,
  film,
  highlight,
  imageGrid,
  site,
  sticky,
  track,
  type ArtifactSpec,
  type Zone,
} from "@/lib/sampleCanvases/pipeline/content";
import type { StandalonePlacement } from "@/lib/sampleCanvases/pipeline/buildPipelineCanvas";

/**
 * "The Long Noon" — a fictional sci-fi film set on a tidally-locked exoplanet,
 * laid out as a filmmaker's production pipeline (see the `filmmaker-canvas` skill).
 *
 * The deliberate counterpart to the viennaExchange canvas: that one is grounded
 * and real-world (maps, street view, historical figures); this one is an invented
 * world, so it reaches for the other half of the artifact menu — invented
 * cartography (`custom`), concept models (`3d`), an on-screen prop UI (`code`),
 * worldbuilding `chart`s, a heavy VFX-shot-tracker `table`, and score `audio`.
 * It has no real map and no street view, on purpose.
 *
 * WHAT IS REAL vs INVENTED — load-bearing.
 *
 * REAL (verified live before authoring):
 *   - every YouTube id (oEmbed 200): Dune, Blade Runner 2049, Interstellar
 *     trailers, as tone reference.
 *   - every Wikimedia image (resolved from the Wikipedia REST summary API):
 *     astronomy and landscape references — Proxima Centauri b, red-dwarf light,
 *     salt flats, dunes, aurora, ice.
 *   - the real science the world bends: tidal locking, red-dwarf habitability,
 *     Proxima Centauri b — as Wikipedia research cards.
 *   - the `3d` concept models are real, publicly hosted glb files (modelviewer.dev
 *     shared assets), standing in for un-built concept sculpts.
 *
 * INVENTED (an original screenplay by a director who does not exist, "Sölas Vey"):
 *   - the planet, the colony "Meridian", the factions, the language, the script,
 *     the schedule, the budget, the VFX plan, the festival run.
 */

const WIKI = "https://en.wikipedia.org/wiki";
const MODEL = "https://modelviewer.dev/shared-assets/models";
const IMG = {
  proximaB:
    "https://upload.wikimedia.org/wikipedia/commons/thumb/8/81/Artist%E2%80%99s_impression_of_Proxima_Centauri_b_shown_hypothetically_as_an_arid_rocky_super-earth.jpg/330px-Artist%E2%80%99s_impression_of_Proxima_Centauri_b_shown_hypothetically_as_an_arid_rocky_super-earth.jpg",
  redDwarf:
    "https://upload.wikimedia.org/wikipedia/commons/thumb/9/95/New_shot_of_Proxima_Centauri%2C_our_nearest_neighbour.jpg/330px-New_shot_of_Proxima_Centauri%2C_our_nearest_neighbour.jpg",
  tidal:
    "https://upload.wikimedia.org/wikipedia/commons/thumb/5/56/Tidal_locking_of_the_Moon_with_the_Earth.gif/330px-Tidal_locking_of_the_Moon_with_the_Earth.gif",
  salar:
    "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4a/Salar_Uyuni_au01.jpg/330px-Salar_Uyuni_au01.jpg",
  atacama:
    "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7f/Atacama.png/330px-Atacama.png",
  aurora:
    "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d3/Aurora_borealis_over_Eielson_Air_Force_Base%2C_Alaska.jpg/330px-Aurora_borealis_over_Eielson_Air_Force_Base%2C_Alaska.jpg",
  dunes:
    "https://upload.wikimedia.org/wikipedia/commons/thumb/6/61/Dunas_de_Maspalomas.jpg/330px-Dunas_de_Maspalomas.jpg",
  iceberg:
    "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3d/Iceberg_in_the_Arctic_with_its_underside_exposed.jpg/330px-Iceberg_in_the_Arctic_with_its_underside_exposed.jpg",
} as const;

export const LONG_NOON_ZONE_X: Record<string, number> = {
  pitch: 0,
  story: 2600,
  world: 5600,
  prepro: 9200,
  production: 13200,
  post: 15600,
  distribution: 17800,
};

export const LONG_NOON_SEED = {
  question: "Show me where The Long Noon has got to.",
  answer:
    "**Fictional film — not a real production.** An original sci-fi feature set on a " +
    'tidally-locked exoplanet, written and directed by "Sölas Vey", a director who does ' +
    "not exist. Built as a Flowstate demo with the filmmaker-canvas skill.\n\n" +
    "The reference material is real and verified: the tone films, the astronomy and " +
    "landscape images, and the science the world bends — tidal locking, red-dwarf " +
    "habitability, Proxima Centauri b. The world itself — the colony Meridian, its " +
    "factions and language, the script, the budget, the VFX plan — is invented, and " +
    "because there is no real place, the concept work is invented cartography, concept " +
    "models and reference boards rather than photographs.\n\n" +
    "**Read it left to right.** The canvas is a production pipeline and the x-axis is time.",
};

// --- the master schedule, placed above the pipeline --------------------------

const TIMELINE: ArtifactSpec = artifact("timeline", {
  type: "timeline",
  title: "The Long Noon — development to release",
  data: {
    scale: "month",
    rangeStart: "2025-06-01T00:00:00.000Z",
    rangeEnd: "2027-12-31T23:59:59.999Z",
    events: [
      { id: "tl-1", at: "2025-06-01T00:00:00.000Z", label: "World bible + draft 1" },
      { id: "tl-2", at: "2025-10-01T00:00:00.000Z", label: "Concept + previs greenlit", highlight: true },
      { id: "tl-3", at: "2026-02-01T00:00:00.000Z", label: "Virtual-production stage build" },
      { id: "tl-4", at: "2026-05-01T00:00:00.000Z", label: "Principal photography", highlight: true },
      { id: "tl-5", at: "2026-07-15T00:00:00.000Z", label: "Wrap" },
      { id: "tl-6", at: "2026-08-01T00:00:00.000Z", label: "VFX turnover begins", highlight: true },
      { id: "tl-7", at: "2027-06-01T00:00:00.000Z", label: "Final VFX + DI" },
      { id: "tl-8", at: "2027-09-01T00:00:00.000Z", label: "Sitges premiere", highlight: true },
    ],
  },
});

export const LONG_NOON_STANDALONE: StandalonePlacement[] = [
  { spec: TIMELINE, position: { x: 0, y: -2900 } },
];

// --- zones -------------------------------------------------------------------

export const LONG_NOON_ZONES: Zone[] = [
  {
    key: "pitch",
    title: "THE PITCH",
    subtitle: "A world where the sun never moves · the one-sheet",
    columns: [
      {
        key: "onesheet",
        items: [
          artifact("keyart", {
            type: "custom",
            title: "Key art — THE LONG NOON",
            description: "Title treatment, working key art",
            data: {
              html: `<div class="k"><div class="sun"></div><div class="tag">ONE FACE TO THE SUN · FOREVER</div><h1>THE<br/>LONG NOON</h1><div class="rule"></div><p>She mapped the only place light and dark agree to share.</p><div class="dir">a film by SÖLAS VEY</div></div>`,
              css: `.k{position:relative;height:100%;overflow:hidden;background:linear-gradient(100deg,#f4b24a 0%,#c8631f 26%,#3a1e33 52%,#0a1626 78%,#04070f 100%);color:#f3e9d6;font-family:'Trebuchet MS',system-ui,sans-serif;display:flex;flex-direction:column;justify-content:center;padding:26px 30px;box-sizing:border-box}.sun{position:absolute;top:-70px;left:-70px;width:220px;height:220px;border-radius:50%;background:radial-gradient(circle,#fff2cf 0%,#ffd257 40%,transparent 70%);opacity:.85}.tag{position:relative;font-family:ui-monospace,monospace;font-size:11px;letter-spacing:.3em;color:#20303f;font-weight:700;mix-blend-mode:screen}.k h1{position:relative;font-size:44px;line-height:.98;margin:12px 0 0;letter-spacing:.04em;font-weight:800;text-shadow:0 2px 30px rgba(0,0,0,.5)}.rule{position:relative;height:2px;width:70px;background:#7fd3d0;margin:16px 0}.k p{position:relative;margin:0;font-size:14px;max-width:340px;color:#e7dcc6}.dir{position:relative;margin-top:auto;font-family:ui-monospace,monospace;font-size:10px;letter-spacing:.24em;color:#9fb6c2}`,
            },
          }),
          sticky(
            "logline",
            "Logline",
            "On a world where the sun never moves, the last cartographer of the Terminator — the twilight ring where humans can survive — walks into the frozen Nightside to recover the map that proves the colony is dying.",
            "chalk",
          ),
          sticky(
            "tone",
            "Tone",
            "Dune's scale and Blade Runner 2049's stillness, but the light never changes — no sunrise, no sunset, just an endless amber noon and shadows that never move. Beauty as a threat.",
            "haiti",
          ),
          sticky(
            "disclaimer",
            "Read this first",
            "This is a FICTIONAL FILM built as a Flowstate demo. The director and film do not exist. The reference science and images are real; the world and production work are invented.",
            "turbo",
          ),
        ],
      },
    ],
  },
  {
    key: "story",
    title: "THE STORY",
    subtitle: "Synopsis, beats, factions, pages · development",
    columns: [
      {
        key: "outline",
        label: "Synopsis & structure",
        items: [
          sticky(
            "synopsis",
            "Synopsis",
            "Wren is Meridian's last cartographer — the colony survives only in the thin habitable ring between a burning Dayside and a frozen Nightside, and that ring is narrowing. The one map that shows how fast lies in a station abandoned deep in the Long Dark. To save everyone she must walk out of the light.",
            "chalk",
          ),
          artifact("beats", {
            type: "table",
            title: "Beat sheet — three acts",
            data: {
              columns: [
                { key: "beat", label: "Beat" },
                { key: "page", label: "Pg" },
                { key: "turn", label: "Turn" },
              ],
              rows: [
                { beat: { value: "The ring is narrowing", tags: [{ label: "Act I", tone: "info" }] }, page: "1", turn: "Wren's survey proves Meridian is shrinking." },
                { beat: "The Sunward refuse it", page: "16", turn: "The Dayside cult calls the map heresy." },
                { beat: { value: "Into the Nightside", tags: [{ label: "Act II", tone: "warning" }] }, page: "34", turn: "Wren crosses the Terminator on foot." },
                { beat: "The dead station", page: "62", turn: "The old map is real — and older than the colony." },
                { beat: { value: "The walk back into light", tags: [{ label: "Act III", tone: "danger" }] }, page: "95", turn: "The Nightside won't let her leave whole." },
                { beat: "Redrawing the line", page: "108", turn: "Wren maps a new ring the colony must migrate to." },
              ],
            },
          }),
        ],
      },
      {
        key: "factions",
        label: "People of the ring",
        items: [
          sticky("char-wren", "Wren — the cartographer", "The colony's last mapmaker, 34. Reads terrain like scripture. Believes a place is only real once it's drawn. Walks into the dark because no one else can chart the way back.", "violet"),
          sticky("faction-ferry", "The Ferrymen", "Terminator-dwellers who live by the moving light-line, migrating meters a year to keep the sun at the horizon. Wren's people. Pragmatic, exhausted, dwindling.", "violet"),
          sticky("faction-sunward", "The Sunward", "A Dayside sect who believe the still sun is a god and the shrinking ring a test of faith. To map the decline is blasphemy. The film's human antagonist.", "violet"),
        ],
      },
      {
        key: "pages",
        label: "Pages & chronology",
        items: [
          artifact("script", {
            type: "code",
            title: "Sc. 51 — THE TERMINATOR — 'DAY'",
            description: "Draft 3 excerpt — crossing into the dark",
            data: {
              files: [
                {
                  path: "sc51.txt",
                  language: "text",
                  content: `THE LONG NOON — Sc. 51
Draft 3 / S. Vey / 8 Feb 2026

EXT. THE TERMINATOR - CONTINUOUS

A line drawn across the world. Behind WREN, amber
noon. Ahead, a wall of blue shadow that does not
move and never will. Her suit lamp clicks on
before she has decided to cross.

          WREN (V.O.)
     On the maps we draw the terminator as
     a line. It isn't. It's the only place
     the sun and the dark ever agree to
     share.

She steps across. Her shadow, which has pointed
the same way her whole life, swings — and stops,
pointing back at the light like a hand that
won't let go.

          WREN
     (quiet)
     ...oh.

She keeps walking. The light gets no further away.
That is the horror of it. It just stays.

CUT TO:`,
                },
              ],
            },
          }),
          artifact("chronology", {
            type: "table",
            title: "World chronology (in-story)",
            data: {
              columns: [
                { key: "when", label: "Colony year" },
                { key: "event", label: "Event" },
              ],
              rows: [
                { when: "Year 0", event: "The Founding. Meridian settles the ring." },
                { when: "Year 40", event: "The ring first measured to be narrowing." },
                { when: "Year 61", event: "The Sunward schism." },
                { when: "Year 74 (now)", event: "Wren's survey. The walk." },
                { when: "Year 74+", event: "The migration to the new ring begins." },
              ],
            },
          }),
          askPrompt("ask-structure", "does the shadow-swing moment work better silent or with Wren's V.O.?"),
        ],
      },
    ],
  },
  {
    key: "world",
    title: "THE WORLD & RESEARCH",
    subtitle: "Invented cartography, concept models, the real science · worldbuilding",
    columns: [
      {
        key: "cartography",
        label: "The planet & concept models",
        items: [
          artifact("worldmap", {
            type: "custom",
            title: "Invented cartography — Dayside · Terminator · Nightside",
            description: "There is no real place, so the map is drawn, not scouted",
            data: {
              html: `<div class="w"><div class="disk"><div class="ring"></div><div class="pin"></div></div><ul class="leg"><li><i class="d"></i>Dayside — uninhabitable, 90°C</li><li><i class="t"></i>The Terminator — the habitable ring</li><li><i class="n"></i>Nightside — frozen, −120°C</li><li><i class="m"></i>Meridian colony</li></ul></div>`,
              css: `.w{height:100%;background:#06080f;color:#cdd7e2;font-family:system-ui,sans-serif;display:flex;gap:16px;align-items:center;padding:16px 18px;box-sizing:border-box}.disk{position:relative;width:150px;height:150px;border-radius:50%;flex:none;background:linear-gradient(90deg,#ffcf6b 0%,#e08a2c 34%,#5b3b46 50%,#16233a 66%,#0a1220 100%);box-shadow:inset 0 0 30px rgba(0,0,0,.6),0 0 24px rgba(255,180,80,.15)}.ring{position:absolute;left:50%;top:0;bottom:0;width:16px;transform:translateX(-50%);background:repeating-linear-gradient(180deg,#7fd3d0 0 6px,transparent 6px 12px);opacity:.9}.pin{position:absolute;left:50%;top:44%;width:9px;height:9px;border-radius:50%;background:#fff;transform:translate(-50%,-50%);box-shadow:0 0 8px #fff}.leg{list-style:none;margin:0;padding:0;font-size:12px;line-height:1.9}.leg i{display:inline-block;width:10px;height:10px;border-radius:2px;margin-right:8px;vertical-align:middle}.leg .d{background:#e08a2c}.leg .t{background:#7fd3d0}.leg .n{background:#16233a;border:1px solid #34506f}.leg .m{background:#fff;border-radius:50%}`,
            },
          }),
          artifact("colony-ui", {
            type: "code",
            title: "Set prop — Meridian life-support terminal",
            description: "The on-screen UI, built as code so the art dept can render it",
            data: {
              files: [
                {
                  path: "terminal.txt",
                  language: "text",
                  content: `MERIDIAN // RING INTEGRITY MONITOR
--------------------------------------
HABITABLE BAND ....... 41.2 km  (-0.6 / yr)
TERMINATOR DRIFT ..... 2.3 m / day sunward
DAYSIDE EDGE TEMP .... 88.4 C  [HIGH]
NIGHTSIDE EDGE TEMP .. -118.7 C [CRITICAL]
POP. UNDER COVER ..... 9,140
SURVEY: CARTOGRAPHER WREN ...... IN FIELD
LAST FIX ............. NIGHTSIDE +14.2 km
--------------------------------------
> the ring will not hold. migrate.`,
                },
              ],
            },
          }),
          artifact("model-suit", {
            type: "3d",
            title: "Concept model — Terminator survey suit",
            description: "Stand-in concept sculpt (real hosted glb)",
            data: { modelUrl: `${MODEL}/Astronaut.glb`, format: "glb" },
          }),
          artifact("model-walker", {
            type: "3d",
            title: "Concept model — Nightside walker",
            description: "Stand-in concept sculpt (real hosted glb)",
            data: { modelUrl: `${MODEL}/RobotExpressive.glb`, format: "glb" },
          }),
        ],
      },
      {
        key: "science",
        label: "The real science we bend",
        items: [
          site("wiki-tidal", `${WIKI}/Tidal_locking`, "Wikipedia", "Tidal locking - Wikipedia", IMG.tidal, true),
          site("wiki-proxima", `${WIKI}/Proxima_Centauri_b`, "Wikipedia", "Proxima Centauri b - Wikipedia", IMG.proximaB, true),
          site("wiki-reddwarf", `${WIKI}/Red_dwarf`, "Wikipedia", "Red dwarf - Wikipedia", IMG.redDwarf, true),
          highlight("hl-science", "Real physics: a tidally-locked world keeps one face to its star forever, so a red-dwarf planet's only temperate zone is the terminator ring. We bend the timescale; we don't invent the ring."),
        ],
      },
      {
        key: "concept",
        label: "Concept & mood",
        items: [
          imageGrid("moodboard", "Concept board — light that never moves", [
            { url: IMG.proximaB, alt: "Artist's impression of an arid tidally-locked exoplanet" },
            { url: IMG.dunes, alt: "Dune field — Dayside reference" },
            { url: IMG.atacama, alt: "Atacama Desert — Dayside reference" },
            { url: IMG.salar, alt: "Salt flat — the Terminator floor" },
            { url: IMG.aurora, alt: "Aurora — Terminator sky reference" },
            { url: IMG.iceberg, alt: "Ice — Nightside reference" },
            { url: IMG.redDwarf, alt: "Red-dwarf star — the still sun" },
            { url: IMG.tidal, alt: "Tidal locking diagram" },
          ]),
        ],
      },
      {
        key: "films",
        label: "Reference films",
        items: [
          film("ref-dune", "2zoe0RlNEak", "Dune (2021) — scale & desert light, reference"),
          film("ref-br2049", "gCcx85zbxz4", "Blade Runner 2049 — stillness & color, reference"),
          film("ref-interstellar", "zSWdZVtXT7E", "Interstellar — scope & score, reference"),
        ],
      },
      {
        key: "sound-lex",
        label: "Sound & language",
        items: [
          track("score-drone", "Score — the still-sun drone (temp)", 42, 3),
          artifact("lexicon", {
            type: "table",
            title: "Invented language — the Ferry tongue",
            data: {
              columns: [
                { key: "word", label: "Word" },
                { key: "means", label: "Meaning" },
                { key: "note", label: "Note" },
              ],
              rows: [
                { word: "longnoon", means: "the unmoving day", note: "also the film's title" },
                { word: "sunward", means: "toward the burning edge", note: "the Sunward faction's name" },
                { word: "coldwalk", means: "to cross into the Nightside", note: "what Wren does" },
                { word: "ringfall", means: "the narrowing of the habitable band", note: "the central threat" },
              ],
            },
          }),
          askPrompt("ask-score", "what real instruments could sell a sun that hums but never rises?"),
        ],
      },
    ],
  },
  {
    key: "prepro",
    title: "PRE-PRODUCTION",
    subtitle: "Budget, stage, cast, asset build · the build",
    columns: [
      {
        key: "budget",
        label: "Budget",
        items: [
          artifact("budget-split", {
            type: "chart",
            title: "Budget split — $14M (VFX-led)",
            description: "Invented figures — spec production",
            data: {
              chartType: "pie",
              slices: [
                { name: "VFX & virtual production", value: 38 },
                { name: "Cast", value: 14 },
                { name: "Crew", value: 18 },
                { name: "Stage & build", value: 14 },
                { name: "Post & score", value: 10 },
                { name: "Contingency", value: 6 },
              ],
              unit: "% of budget",
              source: "The Long Noon — invented spec production figure",
            },
          }),
          artifact("budget-lines", {
            type: "table",
            title: "Top line items",
            data: {
              columns: [
                { key: "line", label: "Line" },
                { key: "usd", label: "$" },
                { key: "status", label: "Status" },
              ],
              rows: [
                { line: "LED volume stage (6 wk)", usd: "1.9M", status: { value: "Booked", tags: [{ label: "Booked", tone: "success" }] } },
                { line: "Terminator suit builds (4)", usd: "620K", status: { value: "In fab", tags: [{ label: "Building", tone: "warning" }] } },
                { line: "Nightside environments (VFX)", usd: "3.1M", status: { value: "Bid out", tags: [{ label: "Bidding", tone: "info" }] } },
                { line: "Still-sun lighting rig", usd: "410K", status: { value: "R&D", tags: [{ label: "At risk", tone: "danger" }] } },
              ],
            },
          }),
        ],
      },
      {
        key: "stage",
        label: "Stage & environments",
        items: [
          artifact("cal-shoot", {
            type: "calendar",
            title: "Stage block — May 2026",
            data: {
              viewYear: 2026,
              viewMonth: 5,
              highlightedDates: ["2026-05-04", "2026-05-05", "2026-05-06", "2026-05-07", "2026-05-08"],
              events: [
                { id: "s1", title: "Volume D1 — Terminator ring", startDate: "2026-05-04", endDate: "2026-05-04" },
                { id: "s2", title: "Volume D2 — Terminator ring", startDate: "2026-05-05", endDate: "2026-05-05" },
                { id: "s3", title: "Volume D3 — Nightside station", startDate: "2026-05-06", endDate: "2026-05-06" },
                { id: "s4", title: "Volume D4 — Nightside station", startDate: "2026-05-07", endDate: "2026-05-07" },
                { id: "s5", title: "Location D5 — salt flat plate unit", startDate: "2026-05-08", endDate: "2026-05-08" },
              ],
            },
          }),
          artifact("env-table", {
            type: "table",
            title: "Environments — how each is made",
            data: {
              columns: [
                { key: "env", label: "Environment" },
                { key: "how", label: "Method" },
                { key: "status", label: "Status" },
              ],
              rows: [
                { env: "Terminator ring", how: "LED volume + partial set", status: { value: "Previs locked", tags: [{ label: "Locked", tone: "success" }] } },
                { env: "Dayside", how: "Salt-flat plates + CG sky", status: { value: "Plate scout", tags: [{ label: "Scout", tone: "warning" }] } },
                { env: "Nightside", how: "Full CG", status: { value: "Bidding", tags: [{ label: "Bidding", tone: "info" }] } },
                { env: "Dead station int.", how: "Practical set", status: { value: "Building", tags: [{ label: "Building", tone: "warning" }] } },
              ],
            },
          }),
        ],
      },
      {
        key: "cast-crew",
        label: "Cast & crew",
        items: [
          artifact("cast", {
            type: "table",
            title: "Cast board",
            data: {
              columns: [
                { key: "role", label: "Role" },
                { key: "status", label: "Status" },
              ],
              rows: [
                { role: "Wren (lead)", status: { value: "Attached", tags: [{ label: "Attached", tone: "success" }] } },
                { role: "Sunward elder", status: { value: "Offer out", tags: [{ label: "Offer", tone: "warning" }] } },
                { role: "Ferry captain", status: { value: "Casting", tags: [{ label: "Casting", tone: "info" }] } },
                { role: "Station voice (V.O.)", status: { value: "Open", tags: [{ label: "Open", tone: "neutral" }] } },
              ],
            },
          }),
          artifact("crew", {
            type: "table",
            title: "Key crew",
            data: {
              columns: [
                { key: "dept", label: "Dept" },
                { key: "name", label: "Head" },
              ],
              rows: [
                { dept: "VFX supervisor", name: "— (leads the show)" },
                { dept: "Virtual production", name: "— (volume + Unreal)" },
                { dept: "Production design", name: "— (the ring & the station)" },
                { dept: "Composer", name: "— (drone + choir)" },
              ],
            },
          }),
        ],
      },
      {
        key: "prep",
        label: "Previs & asset build",
        items: [
          artifact("previs", {
            type: "table",
            title: "Previs — Sc. 51, the crossing",
            data: {
              columns: [
                { key: "shot", label: "Shot" },
                { key: "unit", label: "Unit" },
                { key: "note", label: "Note" },
              ],
              rows: [
                { shot: { value: "51A — the line, wide", tags: [{ label: "Hero", tone: "success" }] }, unit: "Volume", note: "The one image the film is sold on." },
                { shot: { value: "51B — the shadow swings", tags: [{ label: "VFX", tone: "info" }] }, unit: "CG", note: "Shadow direction is the whole scene." },
                { shot: "51C — Wren steps across", unit: "Volume", note: "Practical suit, CG far dark." },
                { shot: "51D — light stays", unit: "CG", note: "The sun must NOT recede. Note for VFX." },
              ],
            },
          }),
          artifact("asset-build", {
            type: "todo",
            title: "Asset build",
            data: {
              items: [
                { id: "a1", label: "Terminator suit — hero sculpt", checked: true, dueDate: "2026-03-10", priority: "high" },
                { id: "a2", label: "Nightside walker — model + rig", checked: false, dueDate: "2026-04-05", priority: "high" },
                { id: "a3", label: "Still-sun HDRI / lighting model", checked: false, dueDate: "2026-04-15", priority: "high" },
                { id: "a4", label: "Meridian terminal UI (playback)", checked: true, dueDate: "2026-03-20", priority: "medium" },
                { id: "a5", label: "Ferry-tongue subtitle font", checked: false, dueDate: "2026-04-20", priority: "low" },
              ],
            },
          }),
          highlight("hl-prepro", "The still-sun lighting rig is the make-or-break: if the light ever reads as a sunset the world dies. It's in R&D and it's the riskiest line in the budget."),
        ],
      },
    ],
  },
  {
    key: "production",
    title: "PRODUCTION",
    subtitle: "What changes every stage day · living trackers",
    columns: [
      {
        key: "tracker",
        label: "Stage tracker",
        items: [
          artifact("shot-tracker", {
            type: "table",
            title: "Scene tracker — as of Volume D3",
            description: "Updated each wrap",
            data: {
              columns: [
                { key: "sc", label: "Scene" },
                { key: "day", label: "Day" },
                { key: "status", label: "Status" },
              ],
              rows: [
                { sc: "44 — the survey", day: "D1", status: { value: "Shot", tags: [{ label: "Shot", tone: "success" }] } },
                { sc: "51 — the crossing", day: "D2", status: { value: "Shot — 51D to VFX", tags: [{ label: "Shot", tone: "success" }] } },
                { sc: "63 — the dead station", day: "D3", status: { value: "Shooting", tags: [{ label: "Today", tone: "info" }] } },
                { sc: "70 — the walk back", day: "D6", status: { value: "Pending suit #2", tags: [{ label: "Pickup", tone: "warning" }] } },
                { sc: "88 — Nightside reveal", day: "—", status: { value: "Full CG — no stage", tags: [{ label: "Post", tone: "danger" }] } },
              ],
            },
          }),
          highlight("hl-continuity", "Continuity that will break in the edit: shadow direction. Every shadow points sunward, always. One flipped plate and the world's rule is broken. Flagged for VFX on every 51-series shot."),
        ],
      },
      {
        key: "notes",
        label: "Dailies & notes",
        items: [
          artifact("dailies", {
            type: "table",
            title: "Dailies log",
            data: {
              columns: [
                { key: "day", label: "Day" },
                { key: "circled", label: "Circled take" },
                { key: "note", label: "Note" },
              ],
              rows: [
                { day: "D1", circled: "44 / T3", note: "Volume amber reads perfectly on skin." },
                { day: "D2", circled: "51 / T6", note: "The 'oh' is the take. Hold the silence." },
                { day: "D3", circled: "63 / T2", note: "Practical frost too blue — note for DI." },
              ],
            },
          }),
          sticky("note-vfxsup", "VFX supervisor", "Keep the sun locked to the same screen coordinate across the whole crossing sequence. It is a horror device, not a light source.", "haiti"),
          askPrompt("ask-tracker", "draft a one-line VFX brief for Sc. 88, the full-CG Nightside reveal."),
        ],
      },
    ],
  },
  {
    key: "post",
    title: "POST",
    subtitle: "VFX, sound, deliverables · the long tail",
    columns: [
      {
        key: "vfx",
        label: "VFX (the long pole)",
        items: [
          artifact("vfx-tracker", {
            type: "table",
            title: "VFX shot tracker",
            description: "The living heart of a sci-fi post — 640 shots",
            data: {
              columns: [
                { key: "seq", label: "Sequence" },
                { key: "shots", label: "Shots" },
                { key: "status", label: "Status" },
              ],
              rows: [
                { seq: "Terminator ring", shots: "180", status: { value: "Final", tags: [{ label: "Final", tone: "success" }] } },
                { seq: "The crossing (Sc. 51)", shots: "64", status: { value: "In comp", tags: [{ label: "Comp", tone: "info" }] } },
                { seq: "Nightside environments", shots: "210", status: { value: "Lighting", tags: [{ label: "Lighting", tone: "warning" }] } },
                { seq: "Nightside reveal (Sc. 88)", shots: "96", status: { value: "Blocked — asset", tags: [{ label: "Blocked", tone: "danger" }] } },
                { seq: "Meridian city", shots: "90", status: { value: "Awaiting brief", tags: [{ label: "Queued", tone: "neutral" }] } },
              ],
            },
          }),
          artifact("vfx-chart", {
            type: "chart",
            title: "VFX shots by sequence",
            description: "Invented figures — spec production",
            data: {
              chartType: "bar",
              categories: ["Ring", "Crossing", "Nightside env", "Reveal", "City"],
              series: [{ name: "Shots", data: [180, 64, 210, 96, 90] }],
              unit: "shots",
              source: "The Long Noon — invented spec production figure",
            },
          }),
          highlight("hl-post", "640 VFX shots on a $14M budget is only survivable because the Terminator ring is a real LED-volume plate, not full CG. The Nightside — 300+ shots — is the part that can sink the schedule."),
        ],
      },
      {
        key: "finishing",
        label: "Sound & deliverables",
        items: [
          artifact("cues", {
            type: "table",
            title: "Music & sound cues",
            data: {
              columns: [
                { key: "cue", label: "Cue" },
                { key: "where", label: "Scene" },
                { key: "status", label: "Status" },
              ],
              rows: [
                { cue: "Still-sun drone", where: "main title / Sc. 1", status: { value: "Temp", tags: [{ label: "Temp", tone: "warning" }] } },
                { cue: "Choir — the crossing", where: "Sc. 51", status: { value: "Scoring", tags: [{ label: "WIP", tone: "info" }] } },
                { cue: "Silence — the dark", where: "Sc. 63", status: { value: "Locked", tags: [{ label: "Locked", tone: "success" }] } },
              ],
            },
          }),
          track("score-choir", "Score — the crossing choir (sketch)", 34, 8),
          artifact("deliverables", {
            type: "todo",
            title: "Festival deliverables",
            data: {
              items: [
                { id: "d1", label: "4K DCP + HDR pass", checked: false, dueDate: "2027-08-01", priority: "high" },
                { id: "d2", label: "Atmos + 5.1 mix", checked: false, dueDate: "2027-07-20", priority: "high" },
                { id: "d3", label: "VFX final QC — shadow direction", checked: false, dueDate: "2027-07-10", priority: "high" },
                { id: "d4", label: "Subtitles + Ferry-tongue titling", checked: false, dueDate: "2027-08-05", priority: "medium" },
              ],
            },
          }),
        ],
      },
    ],
  },
  {
    key: "distribution",
    title: "DISTRIBUTION",
    subtitle: "Genre festivals, press, the run · getting seen",
    columns: [
      {
        key: "festivals",
        label: "Festival plan",
        items: [
          artifact("festivals", {
            type: "table",
            title: "Festival submissions",
            description: "Genre-first — sci-fi lives at the fantastic festivals",
            data: {
              columns: [
                { key: "fest", label: "Festival" },
                { key: "deadline", label: "Deadline" },
                { key: "status", label: "Status" },
              ],
              rows: [
                { fest: "Sitges (premiere target)", deadline: "2027-06-30", status: { value: "Priority", tags: [{ label: "Priority", tone: "success" }] } },
                { fest: "Fantastic Fest", deadline: "2027-07-15", status: { value: "Planned", tags: [{ label: "Planned", tone: "info" }] } },
                { fest: "SXSW", deadline: "2027-11-01", status: { value: "Backup", tags: [{ label: "Backup", tone: "neutral" }] } },
                { fest: "Sundance (Midnight)", deadline: "2027-09-20", status: { value: "If post holds", tags: [{ label: "At risk", tone: "warning" }] } },
              ],
            },
          }),
          highlight("hl-dist", "Sci-fi with ideas premieres at the fantastic festivals, not the prestige ones. Sitges gives the film its audience; the prestige circuit can come after a genre bow."),
        ],
      },
      {
        key: "assets",
        label: "Key art & press",
        items: [
          artifact("onesheet", {
            type: "custom",
            title: "One-sheet concept — festival poster",
            data: {
              html: `<div class="p"><div class="frame"><div class="sun"></div><div class="t">THE LONG NOON</div><div class="s">The sun never sets. Neither does the fear.</div><div class="c">A FILM BY SÖLAS VEY</div></div></div>`,
              css: `.p{height:100%;background:#04070f;display:flex;align-items:center;justify-content:center;padding:16px;box-sizing:border-box}.frame{position:relative;overflow:hidden;border:1px solid #2a3a49;width:100%;height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;background:linear-gradient(160deg,#c8631f,#3a1e33 55%,#04070f);color:#f3e9d6;font-family:'Trebuchet MS',sans-serif}.sun{position:absolute;top:-40px;width:120px;height:120px;border-radius:50%;background:radial-gradient(circle,#ffe6a6,#ffce5e 45%,transparent 70%)}.t{position:relative;font-size:22px;letter-spacing:.08em;text-align:center;font-weight:800}.s{position:relative;font-style:italic;color:#e7dcc6;font-size:12px;text-align:center;padding:0 14px}.c{position:relative;font-family:ui-monospace,monospace;font-size:9px;letter-spacing:.24em;color:#b7c6cf;margin-top:8px}`,
            },
          }),
          imageGrid("keyframes", "Key frames — pull for the sales deck", [
            { url: IMG.proximaB, alt: "The world from orbit — concept" },
            { url: IMG.salar, alt: "The Terminator floor — concept" },
            { url: IMG.aurora, alt: "The Terminator sky — concept" },
          ]),
          askPrompt("ask-dist", "draft a genre-press angle that leads with the shadow that never moves."),
        ],
      },
      {
        key: "press",
        label: "Contacts",
        items: [
          artifact("press", {
            type: "table",
            title: "Press & sales contacts",
            data: {
              columns: [
                { key: "who", label: "Who" },
                { key: "role", label: "Role" },
                { key: "status", label: "Status" },
              ],
              rows: [
                { who: "Genre sales agent", role: "World sales", status: { value: "Attached", tags: [{ label: "Attached", tone: "success" }] } },
                { who: "Sitges programmer", role: "Premiere liaison", status: { value: "In talks", tags: [{ label: "Talking", tone: "warning" }] } },
                { who: "Genre press outlets", role: "Exclusive concept art", status: { value: "Teed up", tags: [{ label: "Ready", tone: "info" }] } },
              ],
            },
          }),
        ],
      },
    ],
  },
];
