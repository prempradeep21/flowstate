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
 * "The Vienna Exchange" — a fictional 1961 Cold War spy thriller, laid out as a
 * filmmaker's production pipeline (see the `filmmaker-canvas` skill).
 *
 * WHAT IS REAL vs INVENTED — load-bearing.
 *
 * REAL (verified live before authoring):
 *   - every YouTube id (oEmbed 200 + i.ytimg thumb 200): The Third Man, Bridge of
 *     Spies and Tinker Tailor Soldier Spy trailers, as tone reference.
 *   - every Wikimedia image (resolved from the Wikipedia REST summary API, so the
 *     upload.wikimedia.org URL and the page title are real).
 *   - every Wikipedia URL + its real page title.
 *   - every lat/lng (real Vienna / Berlin / Havana / London landmarks).
 *   - the historical figures and events the story touches: George Blake (MI6
 *     officer exposed in 1961), Operation Gold (the Berlin tunnel), the June 1961
 *     Vienna Summit, Checkpoint Charlie, the Glienicke Bridge, Anton Karas.
 *
 * INVENTED (an original screenplay by a director who does not exist, "Petra Vogel"):
 *   - the film, its characters (Mariam Resch, Karl Reiner), the script, the
 *     schedule, the budget, the shot lists, the trackers, the festival plan.
 *
 * Nothing here is a real film. The seed card and a disclaimer sticky say so.
 */

const WIKI = "https://en.wikipedia.org/wiki";
const IMG = {
  blake:
    "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1c/George_Blake_spy.jpg/330px-George_Blake_spy.jpg",
  tunnel:
    "https://upload.wikimedia.org/wikipedia/commons/thumb/c/ce/Bundesarchiv_Bild_183-37695-0003%2C_Altglienicke%2C_Sowjetischer_Offizier_in_Spionagetunnel.jpg/330px-Bundesarchiv_Bild_183-37695-0003%2C_Altglienicke%2C_Sowjetischer_Offizier_in_Spionagetunnel.jpg",
  summit:
    "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7e/John_Kennedy%2C_Nikita_Khrushchev_1961.jpg/330px-John_Kennedy%2C_Nikita_Khrushchev_1961.jpg",
  checkpoint:
    "https://upload.wikimedia.org/wikipedia/commons/thumb/7/75/Berlin_-_Checkpoint_Charlie_1963.jpg/330px-Berlin_-_Checkpoint_Charlie_1963.jpg",
  wall:
    "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5d/Berlinermauer.jpg/330px-Berlinermauer.jpg",
  cafe:
    "https://upload.wikimedia.org/wikipedia/commons/thumb/9/92/Palais_Ferstel.jpg/330px-Palais_Ferstel.jpg",
  hotel:
    "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e4/The_Hotel_Nacional%2C_Havana%2C_Cuba_LCCN2010638840.jpg/330px-The_Hotel_Nacional%2C_Havana%2C_Cuba_LCCN2010638840.jpg",
  glienicke:
    "https://upload.wikimedia.org/wikipedia/commons/thumb/4/48/Glienicker_Br%C3%BCcke.JPG/330px-Glienicker_Br%C3%BCcke.JPG",
  karas:
    "https://upload.wikimedia.org/wikipedia/commons/thumb/2/23/Anton_Karas_%281906-1985%29.jpg/330px-Anton_Karas_%281906-1985%29.jpg",
  prater:
    "https://upload.wikimedia.org/wikipedia/commons/thumb/7/78/Wien_02_Prater_a.jpg/330px-Wien_02_Prater_a.jpg",
  thirdman:
    "https://upload.wikimedia.org/wikipedia/commons/thumb/7/77/The_Third_Man_%281949_American_theatrical_poster%29.jpg/330px-The_Third_Man_%281949_American_theatrical_poster%29.jpg",
  berlinale:
    "https://upload.wikimedia.org/wikipedia/en/thumb/8/88/Berlin_International_Film_Festival_logo.svg/330px-Berlin_International_Film_Festival_logo.svg.png",
} as const;

export const VIENNA_ZONE_X: Record<string, number> = {
  pitch: 0,
  story: 2600,
  world: 5600,
  prepro: 9200,
  production: 13200,
  post: 15600,
  distribution: 17800,
};

export const VIENNA_SEED = {
  question: "Show me where The Vienna Exchange has got to.",
  answer:
    "**Fictional film — not a real production.** An original 1961 Cold War thriller " +
    'written and directed by "Petra Vogel", a director who does not exist. Built as a ' +
    "Flowstate demo with the filmmaker-canvas skill.\n\n" +
    "The reference material is real and verified: the tone films, the archival images, " +
    "the Vienna / Berlin / Havana / London locations, and the historical figures the " +
    "story brushes against — George Blake, Operation Gold, the June 1961 Vienna Summit. " +
    "The film itself — script, cast, schedule, budget, shot lists, festival plan — is invented.\n\n" +
    "**Read it left to right.** The canvas is a production pipeline and the x-axis is time: " +
    "the pitch, the story, the world we researched, then pre-production, the shoot, the " +
    "cut, and the festival run. The schedule band up top is the whole job at a glance.",
};

// --- the master schedule, placed above the pipeline --------------------------

const TIMELINE: ArtifactSpec = artifact("timeline", {
  type: "timeline",
  title: "The Vienna Exchange — development to festival",
  data: {
    scale: "month",
    rangeStart: "2025-09-01T00:00:00.000Z",
    rangeEnd: "2027-03-31T23:59:59.999Z",
    events: [
      { id: "tl-1", at: "2025-09-15T00:00:00.000Z", label: "Draft 1 locked" },
      { id: "tl-2", at: "2025-11-10T00:00:00.000Z", label: "Financing closed", highlight: true },
      { id: "tl-3", at: "2026-01-20T00:00:00.000Z", label: "Location recce — Vienna" },
      { id: "tl-4", at: "2026-03-02T00:00:00.000Z", label: "Cast locked" },
      { id: "tl-5", at: "2026-04-06T00:00:00.000Z", label: "Principal photography", highlight: true },
      { id: "tl-6", at: "2026-05-15T00:00:00.000Z", label: "Wrap" },
      { id: "tl-7", at: "2026-09-01T00:00:00.000Z", label: "Picture lock" },
      { id: "tl-8", at: "2026-11-01T00:00:00.000Z", label: "Sound mix + grade" },
      { id: "tl-9", at: "2027-02-12T00:00:00.000Z", label: "Berlinale premiere", highlight: true },
    ],
  },
});

export const VIENNA_STANDALONE: StandalonePlacement[] = [
  { spec: TIMELINE, position: { x: 0, y: -2900 } },
];

// --- zones -------------------------------------------------------------------

export const VIENNA_ZONES: Zone[] = [
  {
    key: "pitch",
    title: "THE PITCH",
    subtitle: "One winter, one crossing, one ghost · the one-sheet",
    columns: [
      {
        key: "onesheet",
        items: [
          artifact("keyart", {
            type: "custom",
            title: "Key art — THE VIENNA EXCHANGE",
            description: "Title treatment, working key art",
            data: {
              html: `<div class="k"><div class="tag">1961 · VIENNA · BERLIN · HAVANA</div><h1>THE VIENNA<br/>EXCHANGE</h1><div class="rule"></div><p>Some people you bury twice.</p><div class="dir">a film by PETRA VOGEL</div></div>`,
              css: `.k{height:100%;background:radial-gradient(120% 120% at 30% 0%,#14202e 0%,#0a0f16 60%,#05080c 100%);color:#d9e2ec;font-family:Georgia,'Times New Roman',serif;display:flex;flex-direction:column;justify-content:center;padding:26px 30px;box-sizing:border-box}.tag{font-family:ui-monospace,monospace;font-size:11px;letter-spacing:.32em;color:#7c93a8}.k h1{font-size:40px;line-height:1.02;margin:14px 0 0;letter-spacing:.02em;font-weight:600}.rule{height:1px;width:64px;background:#c8a24b;margin:16px 0}.k p{font-style:italic;color:#9fb0c0;margin:0;font-size:15px}.dir{margin-top:auto;font-family:ui-monospace,monospace;font-size:10px;letter-spacing:.24em;color:#5f7386}`,
            },
          }),
          sticky(
            "logline",
            "Logline",
            "Winter 1961. A disgraced MI6 cryptographer is sent to Vienna to broker a defector's crossing — and finds the defector is the man she was ordered to bury a decade ago.",
            "chalk",
          ),
          sticky(
            "tone",
            "Tone",
            "Le Carré patience with The Third Man's wet cobblestones. Cold, quiet, procedural. The violence is paperwork; the heartbreak is a signature.",
            "haiti",
          ),
          sticky(
            "disclaimer",
            "Read this first",
            "This is a FICTIONAL FILM built as a Flowstate demo. The director and film do not exist. The reference material is real; the production work is invented.",
            "turbo",
          ),
        ],
      },
    ],
  },
  {
    key: "story",
    title: "THE STORY",
    subtitle: "Synopsis, beats, characters, pages · development",
    columns: [
      {
        key: "outline",
        label: "Synopsis & structure",
        items: [
          sticky(
            "synopsis",
            "Synopsis",
            "Mariam Resch decoded the message that got Karl Reiner killed in 1951 — or so the file says. Ten years later London sends her to receive a defector in Vienna. The defector is Karl. Now she must decide whether the man is a gift, a trap, or a debt.",
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
                { beat: { value: "Cold open — the 1951 signal", tags: [{ label: "Act I", tone: "info" }] }, page: "1", turn: "We see the message; not who died." },
                { beat: "The Vienna posting", page: "14", turn: "Mariam is sent to receive a defector." },
                { beat: { value: "The face at Café Central", tags: [{ label: "Act II", tone: "warning" }] }, page: "31", turn: "The defector is Karl. He is alive." },
                { beat: "The tunnel file", page: "58", turn: "Karl's proof implicates London, not Moscow." },
                { beat: { value: "The bridge", tags: [{ label: "Act III", tone: "danger" }] }, page: "92", turn: "She must choose who crosses at Glienicke." },
                { beat: "The signature", page: "104", turn: "Mariam signs. We finally read the 1951 name." },
              ],
            },
          }),
        ],
      },
      {
        key: "characters",
        label: "Characters",
        items: [
          sticky("char-mariam", "Mariam Resch", "MI6 cryptographer, 38. Precise, unforgiven, fluent in five languages and trusting of none. Believes she killed Karl with a decoding error. Wants absolution she won't name.", "violet"),
          sticky("char-karl", "Karl Reiner", "The defector. Was Mariam's asset and more. Ten years 'dead' in the East. Carries a file that is either salvation or a hook. We never fully learn which.", "violet"),
          sticky("char-control", "Control (London)", "Mariam's handler. Sent her precisely because she is compromised — a broker who cannot afford to ask questions is the most useful kind.", "violet"),
        ],
      },
      {
        key: "pages",
        label: "Pages & chronology",
        items: [
          artifact("script", {
            type: "code",
            title: "Sc. 42 — CAFÉ CENTRAL, VIENNA — DAY",
            description: "Draft 4 excerpt — the reveal",
            data: {
              files: [
                {
                  path: "sc42.txt",
                  language: "text",
                  content: `THE VIENNA EXCHANGE — Sc. 42
Draft 4 / P. Vogel / 2 Mar 2026

INT. CAFÉ CENTRAL, VIENNA - DAY

Marble, coffee, a pianist who is not very good.
MARIAM waits, a saucer untouched. A MAN sits
across from her without asking.

She does not look up.

          MARIAM
     The table is taken.

          THE MAN
     I know. I took it in 1949.

She looks up. It is KARL. Ten years older.
Alive. She does not move. The pianist finishes
a phrase. Nobody claps.

          MARIAM
     You're a file. I closed you.

          KARL
     Then I'm the first file that pays
     for its own coffee.

He turns her saucer a quarter-turn — an old
signal between them. Her hand, under the table,
finds the edge of it and stops.

CUT TO:`,
                },
              ],
            },
          }),
          artifact("chronology", {
            type: "table",
            title: "In-story chronology (vs shoot order)",
            data: {
              columns: [
                { key: "when", label: "Story date" },
                { key: "event", label: "Event" },
              ],
              rows: [
                { when: "Mar 1951", event: "The intercepted signal. Karl 'dies'." },
                { when: "Dec 1961", event: "Mariam arrives in Vienna." },
                { when: "Dec 1961", event: "Café Central — the reveal." },
                { when: "Jan 1962", event: "Berlin. The tunnel file surfaces." },
                { when: "Jan 1962", event: "Glienicke Bridge. The crossing." },
              ],
            },
          }),
          askPrompt("ask-structure", "does the 1951 name land harder as a cold open or a final reveal?"),
        ],
      },
    ],
  },
  {
    key: "world",
    title: "THE WORLD & RESEARCH",
    subtitle: "Real places, real figures, the mood · what we looked at",
    columns: [
      {
        key: "locations",
        label: "Locations — four cities",
        items: [
          artifact("map", {
            type: "map",
            title: "Story geography & scout — Vienna · Berlin · Havana · London",
            description: "Pins grouped by city",
            data: {
              place: { name: "Café Central, Vienna, Austria", lat: 48.2106, lng: 16.3663 },
              zoom: 5,
              savedPlaces: [
                { id: "v1", label: "Café Central — the reveal", lat: 48.2106, lng: 16.3663, type: "Scene", group: "Vienna" },
                { id: "v2", label: "Wiener Prater — the tail", lat: 48.2167, lng: 16.3958, type: "Scene", group: "Vienna" },
                { id: "v3", label: "State Opera — the drop", lat: 48.2029, lng: 16.369, type: "Scene", group: "Vienna" },
                { id: "b1", label: "Checkpoint Charlie", lat: 52.5075, lng: 13.3904, type: "Scene", group: "Berlin" },
                { id: "b2", label: "Glienicke Bridge — the crossing", lat: 52.4136, lng: 13.0899, type: "Scene", group: "Berlin" },
                { id: "b3", label: "Brandenburg Gate", lat: 52.5163, lng: 13.3777, type: "Establishing", group: "Berlin" },
                { id: "h1", label: "Hotel Nacional — Karl's exile", lat: 23.1443, lng: -82.383, type: "Flashback", group: "Havana" },
                { id: "l1", label: "Century House — Control", lat: 51.4986, lng: -0.1116, type: "Interior", group: "London" },
              ],
            },
          }),
          artifact("sv-cafe", {
            type: "streetview",
            title: "Scout — Café Central façade, Vienna",
            data: {
              place: { name: "Café Central, Herrengasse, Vienna, Austria", lat: 48.2106, lng: 16.3663 },
              heading: 210,
              pitch: 6,
              fov: 80,
              viewMode: "rectangle",
            },
          }),
          artifact("sv-checkpoint", {
            type: "streetview",
            title: "Scout — Checkpoint Charlie site, Berlin",
            data: {
              place: { name: "Checkpoint Charlie, Friedrichstraße, Berlin, Germany", lat: 52.5075, lng: 13.3904 },
              heading: 180,
              pitch: 0,
              fov: 75,
              viewMode: "circle",
            },
          }),
        ],
      },
      {
        key: "figure-blake",
        label: "Historical figure",
        items: [
          site("wiki-blake", `${WIKI}/George_Blake`, "Wikipedia", "George Blake - Wikipedia", IMG.blake, true),
          artifact("dossier-blake", {
            type: "table",
            title: "George Blake — real vs what we dramatize",
            description: "The film brushes the real 1961 exposure",
            data: {
              columns: [
                { key: "fact", label: "The record" },
                { key: "use", label: "Our use" },
              ],
              rows: [
                { fact: { value: "MI6 officer, exposed as a KGB agent, 1961", tags: [{ label: "Real", tone: "success" }] }, use: "The atmosphere Mariam works inside — trust is already gone." },
                { fact: { value: "Betrayed Operation Gold from the start", tags: [{ label: "Real", tone: "success" }] }, use: "Karl's tunnel file rhymes with it; not the same op." },
                { fact: { value: "Escaped Wormwood Scrubs, 1966", tags: [{ label: "Real", tone: "success" }] }, use: "Out of our window; referenced, never shown." },
                { fact: { value: "Mariam & Karl", tags: [{ label: "Invented", tone: "warning" }] }, use: "Composite characters — not Blake, not any real officer." },
              ],
            },
          }),
          imageGrid("portrait-blake", "George Blake — reference", [
            { url: IMG.blake, alt: "George Blake, MI6 officer and Soviet agent" },
          ]),
        ],
      },
      {
        key: "figure-events",
        label: "Historical events",
        items: [
          site("wiki-gold", `${WIKI}/Operation_Gold`, "Wikipedia", "Operation Gold - Wikipedia", IMG.tunnel, true),
          site("wiki-summit", `${WIKI}/Vienna_summit`, "Wikipedia", "Vienna Summit - Wikipedia", IMG.summit, true),
          highlight("hl-summit", "The June 1961 Vienna Summit (Kennedy–Khrushchev) sets our winter: a city everyone is still watching. Real event; our story is six months later."),
        ],
      },
      {
        key: "mood-films",
        label: "Mood & reference films",
        items: [
          imageGrid("moodboard", "Mood board — cold light, wet stone, the East", [
            { url: IMG.checkpoint, alt: "Checkpoint Charlie, 1963" },
            { url: IMG.wall, alt: "The Berlin Wall" },
            { url: IMG.cafe, alt: "Palais Ferstel — Café Central, Vienna" },
            { url: IMG.glienicke, alt: "Glienicke Bridge — the exchange bridge" },
            { url: IMG.hotel, alt: "Hotel Nacional, Havana" },
            { url: IMG.summit, alt: "Kennedy and Khrushchev, Vienna 1961" },
            { url: IMG.tunnel, alt: "Soviet officer in the Operation Gold tunnel" },
            { url: IMG.prater, alt: "The Wiener Prater" },
          ]),
          film("ref-thirdman", "WpHiHZcg37Y", "The Third Man (1949) — Vienna, tone reference"),
          film("ref-bridge", "7JnC2LIJdR0", "Bridge of Spies — the exchange, reference"),
          film("ref-tinker", "VW-F1H-Nonk", "Tinker Tailor Soldier Spy — procedure, reference"),
        ],
      },
      {
        key: "sound",
        label: "Sound world",
        items: [
          track("tone-zither", "Tone — solo zither motif (Karas homage)", 36, 2),
          site("wiki-thirdman", `${WIKI}/The_Third_Man`, "Wikipedia", "The Third Man - Wikipedia", IMG.thirdman, true),
          askPrompt("ask-score", "should the zither be diegetic — the bad café pianist — or only score?"),
        ],
      },
    ],
  },
  {
    key: "prepro",
    title: "PRE-PRODUCTION",
    subtitle: "Budget, schedule, cast, crew, clearances · the build",
    columns: [
      {
        key: "budget",
        label: "Budget",
        items: [
          artifact("budget-split", {
            type: "chart",
            title: "Budget split — €1.8M indie",
            description: "Invented figures — spec production",
            data: {
              chartType: "pie",
              slices: [
                { name: "Cast", value: 22 },
                { name: "Crew", value: 26 },
                { name: "Locations & travel", value: 18 },
                { name: "Art / wardrobe (period)", value: 16 },
                { name: "Post & music", value: 12 },
                { name: "Contingency", value: 6 },
              ],
              unit: "% of budget",
              source: "The Vienna Exchange — invented spec production figure",
            },
          }),
          artifact("budget-lines", {
            type: "table",
            title: "Top line items",
            data: {
              columns: [
                { key: "line", label: "Line" },
                { key: "eur", label: "€" },
                { key: "status", label: "Status" },
              ],
              rows: [
                { line: "Period picture cars (7)", eur: "84,000", status: { value: "Quoted", tags: [{ label: "Quoted", tone: "info" }] } },
                { line: "Vienna permits + fixer", eur: "61,000", status: { value: "Approved", tags: [{ label: "OK", tone: "success" }] } },
                { line: "Wardrobe build (1961)", eur: "120,000", status: { value: "In build", tags: [{ label: "Building", tone: "warning" }] } },
                { line: "Glienicke Bridge day", eur: "45,000", status: { value: "Pending permit", tags: [{ label: "At risk", tone: "danger" }] } },
              ],
            },
          }),
        ],
      },
      {
        key: "logistics",
        label: "Schedule & locations",
        items: [
          artifact("cal-shoot", {
            type: "calendar",
            title: "Shoot block — April 2026 (Vienna)",
            data: {
              viewYear: 2026,
              viewMonth: 4,
              highlightedDates: ["2026-04-06", "2026-04-07", "2026-04-08", "2026-04-09", "2026-04-10"],
              events: [
                { id: "s1", title: "D1 — Café Central (int.)", startDate: "2026-04-06", endDate: "2026-04-06" },
                { id: "s2", title: "D2 — Café Central (int.)", startDate: "2026-04-07", endDate: "2026-04-07" },
                { id: "s3", title: "D3 — Prater (ext., night)", startDate: "2026-04-08", endDate: "2026-04-08" },
                { id: "s4", title: "D4 — State Opera (ext.)", startDate: "2026-04-09", endDate: "2026-04-09" },
                { id: "s5", title: "D5 — company move to Berlin", startDate: "2026-04-10", endDate: "2026-04-10" },
              ],
            },
          }),
          artifact("loc-table", {
            type: "table",
            title: "Locations status",
            data: {
              columns: [
                { key: "loc", label: "Location" },
                { key: "city", label: "City" },
                { key: "status", label: "Status" },
              ],
              rows: [
                { loc: "Café Central (or double)", city: "Vienna", status: { value: "Locked", tags: [{ label: "Locked", tone: "success" }] } },
                { loc: "Wiener Prater", city: "Vienna", status: { value: "Permit filed", tags: [{ label: "Filed", tone: "info" }] } },
                { loc: "Glienicke Bridge", city: "Berlin", status: { value: "Contested", tags: [{ label: "At risk", tone: "danger" }] } },
                { loc: "Hotel Nacional (2nd unit)", city: "Havana", status: { value: "Scouting", tags: [{ label: "Scout", tone: "warning" }] } },
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
                { role: "Mariam Resch (lead)", status: { value: "Offer out", tags: [{ label: "Offer", tone: "warning" }] } },
                { role: "Karl Reiner", status: { value: "Attached", tags: [{ label: "Attached", tone: "success" }] } },
                { role: "Control", status: { value: "Attached", tags: [{ label: "Attached", tone: "success" }] } },
                { role: "The pianist", status: { value: "Local cast", tags: [{ label: "Local", tone: "info" }] } },
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
                { dept: "DP", name: "— (period lensing, tungsten)" },
                { dept: "Production design", name: "— (1961 Vienna/Berlin)" },
                { dept: "Costume", name: "— (build, not rental)" },
                { dept: "Composer", name: "— (zither + strings)" },
              ],
            },
          }),
        ],
      },
      {
        key: "prep",
        label: "Shots & clearances",
        items: [
          artifact("shotlist", {
            type: "table",
            title: "Shot list — Sc. 42, the reveal",
            data: {
              columns: [
                { key: "shot", label: "Shot" },
                { key: "lens", label: "Lens" },
                { key: "note", label: "Note" },
              ],
              rows: [
                { shot: { value: "42A — Mariam, saucer", tags: [{ label: "Hero", tone: "success" }] }, lens: "50mm", note: "Locked. Hold before he sits." },
                { shot: "42B — Karl sits, OTS", lens: "40mm", note: "He enters frame; no cut on the sit." },
                { shot: { value: "42C — the saucer turn", tags: [{ label: "Insert", tone: "info" }] }, lens: "100mm macro", note: "The whole scene is in this gesture." },
                { shot: "42D — 2-shot, pull", lens: "32mm", note: "Only if the pianist beat lands." },
              ],
            },
          }),
          artifact("clearances", {
            type: "todo",
            title: "Clearances & prep",
            data: {
              items: [
                { id: "c1", label: "Vienna filming permit — Herrengasse", checked: true, dueDate: "2026-02-20", priority: "high" },
                { id: "c2", label: "Period car wrangler contract", checked: true, dueDate: "2026-02-28", priority: "medium" },
                { id: "c3", label: "Glienicke Bridge permit (Berlin/Potsdam)", checked: false, dueDate: "2026-03-15", priority: "high" },
                { id: "c4", label: "Archival stills licence (Bundesarchiv)", checked: false, dueDate: "2026-03-20", priority: "medium" },
                { id: "c5", label: "Zither theme — composer clearance", checked: false, dueDate: "2026-03-25", priority: "low" },
              ],
            },
          }),
          highlight("hl-prepro", "The Glienicke Bridge day is the whole third act and the one permit we don't have. Fallback: a Havel bridge double + the real bridge as a 2nd-unit plate."),
        ],
      },
    ],
  },
  {
    key: "production",
    title: "PRODUCTION",
    subtitle: "What changes every shoot day · living trackers",
    columns: [
      {
        key: "tracker",
        label: "Shot tracker",
        items: [
          artifact("shot-tracker", {
            type: "table",
            title: "Scene tracker — as of D4",
            description: "Updated on the wall each wrap",
            data: {
              columns: [
                { key: "sc", label: "Scene" },
                { key: "day", label: "Day" },
                { key: "status", label: "Status" },
              ],
              rows: [
                { sc: "41 — arrival, Café ext.", day: "D1", status: { value: "Shot", tags: [{ label: "Shot", tone: "success" }] } },
                { sc: "42 — the reveal", day: "D2", status: { value: "Shot", tags: [{ label: "Shot", tone: "success" }] } },
                { sc: "48 — Prater tail", day: "D3", status: { value: "Partial — 42D pending", tags: [{ label: "Pickup", tone: "warning" }] } },
                { sc: "51 — the drop", day: "D4", status: { value: "Shooting", tags: [{ label: "Today", tone: "info" }] } },
                { sc: "92 — the bridge", day: "D9", status: { value: "Blocked — permit", tags: [{ label: "Blocked", tone: "danger" }] } },
              ],
            },
          }),
          highlight("hl-continuity", "Continuity: the saucer must sit at 4 o'clock in every angle of Sc. 42 — it's the plot. Locked photo in the script supervisor's kit."),
        ],
      },
      {
        key: "dailies",
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
                { day: "D1", circled: "41 / T4", note: "Rain natural; kept it." },
                { day: "D2", circled: "42 / T7", note: "The pause before 'I closed you' — that's the take." },
                { day: "D3", circled: "48 / T2", note: "Lost light; 42D moved to pickup." },
              ],
            },
          }),
          sticky("note-dp", "DP", "Tungsten only. The moment a daylight LED creeps in, it's 2027, not 1961. Gel everything.", "haiti"),
          askPrompt("ask-tracker", "build a one-line call sheet for D5, the company move to Berlin."),
        ],
      },
    ],
  },
  {
    key: "post",
    title: "POST",
    subtitle: "Cut, sound, deliverables · assembly",
    columns: [
      {
        key: "edit",
        label: "Edit & sound",
        items: [
          sticky("note-edit", "Editor", "The reveal plays longer in the cut than on the page. Let the bad pianist finish the phrase before Karl speaks — silence is the coverage.", "violet"),
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
                { cue: "Zither, solo", where: "Sc. 42 café", status: { value: "Recorded", tags: [{ label: "Done", tone: "success" }] } },
                { cue: "Strings, cold", where: "Sc. 92 bridge", status: { value: "Scoring", tags: [{ label: "WIP", tone: "warning" }] } },
                { cue: "Room tone — Café Central", where: "Sc. 41–42", status: { value: "Captured", tags: [{ label: "Done", tone: "success" }] } },
              ],
            },
          }),
          track("sound-bridge", "Sound design — the bridge, wind + boots", 30, 5),
        ],
      },
      {
        key: "deliver",
        label: "Deliverables",
        items: [
          artifact("deliverables", {
            type: "todo",
            title: "Festival deliverables",
            data: {
              items: [
                { id: "d1", label: "DCP — festival spec", checked: false, dueDate: "2027-01-10", priority: "high" },
                { id: "d2", label: "5.1 mix + M&E", checked: false, dueDate: "2026-12-20", priority: "high" },
                { id: "d3", label: "Subtitles — EN/DE/ES", checked: false, dueDate: "2027-01-05", priority: "medium" },
                { id: "d4", label: "Press kit + stills", checked: false, dueDate: "2027-01-15", priority: "medium" },
              ],
            },
          }),
          highlight("hl-post", "Picture lock is set 3 months before Berlinale on purpose — the mix and the DCP are where indie schedules die."),
        ],
      },
    ],
  },
  {
    key: "distribution",
    title: "DISTRIBUTION",
    subtitle: "Festivals, press, the run · getting seen",
    columns: [
      {
        key: "festivals",
        label: "Festival plan",
        items: [
          artifact("festivals", {
            type: "table",
            title: "Festival submissions",
            description: "Deadlines are the logistics that actually bite",
            data: {
              columns: [
                { key: "fest", label: "Festival" },
                { key: "deadline", label: "Deadline" },
                { key: "status", label: "Status" },
              ],
              rows: [
                { fest: "Berlinale (premiere target)", deadline: "2026-11-—", status: { value: "Invited to submit", tags: [{ label: "Priority", tone: "success" }] } },
                { fest: "Sundance", deadline: "2026-09-13", status: { value: "Submitted", tags: [{ label: "Submitted", tone: "info" }] } },
                { fest: "Venice", deadline: "2026-05-31", status: { value: "Missed — post not ready", tags: [{ label: "Passed", tone: "warning" }] } },
                { fest: "Rotterdam", deadline: "2026-10-01", status: { value: "Backup", tags: [{ label: "Backup", tone: "neutral" }] } },
              ],
            },
          }),
          highlight("hl-dist", "A period thriller lives or dies on its premiere. Berlinale is home turf for the subject; a European bow first, then the US festivals."),
        ],
      },
      {
        key: "assets",
        label: "Key art & press",
        items: [
          site("wiki-berlinale", `${WIKI}/Berlin_International_Film_Festival`, "Wikipedia", "Berlin International Film Festival - Wikipedia", IMG.berlinale, true),
          artifact("onesheet", {
            type: "custom",
            title: "One-sheet concept — festival poster",
            data: {
              html: `<div class="p"><div class="frame"><div class="t">THE VIENNA EXCHANGE</div><div class="s">Some people you bury twice.</div><div class="c">A FILM BY PETRA VOGEL · 1961</div></div></div>`,
              css: `.p{height:100%;background:#0a0f16;display:flex;align-items:center;justify-content:center;padding:16px;box-sizing:border-box}.frame{border:1px solid #2a3a49;width:100%;height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;background:linear-gradient(180deg,#0d1622,#05080c);color:#d9e2ec;font-family:Georgia,serif}.t{font-size:22px;letter-spacing:.06em;text-align:center;padding:0 12px}.s{font-style:italic;color:#9fb0c0;font-size:13px}.c{font-family:ui-monospace,monospace;font-size:9px;letter-spacing:.24em;color:#5f7386;margin-top:8px}`,
            },
          }),
          askPrompt("ask-dist", "draft a two-week press plan around a Berlinale premiere."),
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
                { who: "Sales agent", role: "World sales", status: { value: "In talks", tags: [{ label: "Talking", tone: "warning" }] } },
                { who: "Festival programmer", role: "Berlinale liaison", status: { value: "Warm", tags: [{ label: "Warm", tone: "success" }] } },
                { who: "Unit publicist", role: "Press kit / stills", status: { value: "Booked", tags: [{ label: "Booked", tone: "info" }] } },
              ],
            },
          }),
        ],
      },
    ],
  },
];
