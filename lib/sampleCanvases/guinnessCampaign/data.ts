import type { ArtifactPayload } from "@/lib/artifactTypes";
import { createCatalogAudioPayload } from "@/lib/audioArtifact";
import { createWebsitePayload } from "@/lib/websiteArtifact";
import type { CanvasAssetKind } from "@/lib/store";

/**
 * Authored content for the Guinness campaign canvas.
 *
 * WHAT IS REAL vs INVENTED — this distinction is load-bearing.
 *
 * REAL (verified live before authoring; see the research notes):
 *   - every YouTube id (oEmbed + playableInEmbed + not age-gated + thumb 200)
 *   - every Wikimedia Commons image (HTTP 200, licence checked)
 *   - every website URL and its real page title
 *   - every lat/lng (Wikipedia geo, else Nominatim)
 *   - all market figures, sourced to Diageo plc Form 20-F 2025
 *
 * INVENTED (a fictional spec pitch by a fictional agency, "The Liberties"):
 *   - the campaign, its territories, the endline, the script, the schedule,
 *     the budget, the deliverables, the feedback, the flight plan.
 *
 * Nothing here is real Guinness work or real agency output, and the canvas says
 * so on the seed card and on a disclaimer sticky in the BRIEF band.
 *
 * PRODUCTION NOTE discovered while building this: every upload on Guinness's own
 * YouTube channel is age-restricted ("Sign in to confirm your age") and therefore
 * cannot be embedded. Only third-party ad-archive and agency uploads work. That is
 * why the reference films below are archive uploads — it is not an oversight.
 */

export interface ArtifactSpec {
  kind: "artifact";
  key: string;
  payload: ArtifactPayload;
  /** Sticky notes are attributed to the manual placement source card. */
  manualSticky?: boolean;
}

export interface AssetSpec {
  kind: "asset";
  key: string;
  name: string;
  fileName: string;
  mimeType: string;
  publicUrl: string;
  assetKind: CanvasAssetKind;
}

export interface SkillSpec {
  kind: "skill";
  key: string;
  title: string;
  fileName: string;
  publicUrl: string;
}

export type NodeSpec = ArtifactSpec | AssetSpec | SkillSpec;

export interface CanvasBand {
  key: string;
  label: string;
  items: NodeSpec[];
}

export interface CanvasColumn {
  key: string;
  label?: string;
  items: NodeSpec[];
}

export interface Territory {
  key: string;
  line: string;
  items: NodeSpec[];
}

// --- authoring helpers -------------------------------------------------------

/** One verified YouTube film as a video artifact (all-youtube items ⇒ video tile). */
function film(key: string, id: string, title: string): ArtifactSpec {
  return {
    kind: "artifact",
    key,
    payload: {
      type: "images",
      title,
      data: {
        items: [
          {
            kind: "youtube",
            url: `https://www.youtube.com/watch?v=${id}`,
            thumb: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
            title,
          },
        ],
      },
    },
  };
}

/**
 * A website card. Every field here is researched at authoring time, on purpose:
 *
 * - `createWebsitePayload` defaults the title to the domain label, which the UI
 *   reads as "title pending" — so the real page title overwrites both fields.
 * - `previewImageUrl` and `embeddable` are REQUIRED. Nothing enriches a
 *   builder-authored website artifact at render time (/api/link-preview only runs
 *   when a user pastes a URL), so an unresolved card ships as a dead "No preview
 *   image" placeholder that never becomes interactive.
 *
 * `embeddable` was determined by reading each site's real X-Frame-Options and
 * CSP frame-ancestors headers — not guessed. Most brand sites send SAMEORIGIN
 * and therefore render as a static preview card rather than a live iframe.
 */
function site(
  key: string,
  url: string,
  domainLabel: string,
  realTitle: string,
  previewImageUrl: string,
  embeddable: boolean,
): ArtifactSpec {
  const payload = createWebsitePayload(url, domainLabel, {
    previewImageUrl,
    embeddable,
  });
  payload.title = realTitle;
  payload.data.title = realTitle;
  return { kind: "artifact", key, payload };
}

function sticky(
  key: string,
  title: string,
  text: string,
  colorId: "turbo" | "violet" | "haiti" | "chalk",
): ArtifactSpec {
  return {
    kind: "artifact",
    key,
    manualSticky: true,
    payload: { type: "stickynote", title, data: { text, colorId } },
  };
}

function track(key: string, title: string, seconds: number, seed: number): ArtifactSpec {
  return {
    kind: "artifact",
    key,
    payload: createCatalogAudioPayload(title, seconds * 1000, seed),
  };
}

const COMMONS = "https://upload.wikimedia.org/wikipedia/commons";

// --- the campaign ------------------------------------------------------------

export const AGENCY = "The Liberties";
export const CAMPAIGN_LINE = "THE SAME PATIENCE";

export const GUINNESS_SEED_CARD = {
  question: "Show me where the Guinness 0.0 campaign has got to.",
  answer:
    `**Fictional spec pitch — not real Guinness or agency work.** Built as a Flowstate demo by "${AGENCY}", an agency that does not exist.\n\n` +
    "Reference material is real and verified: the films, the competitor sites, the Dublin locations and the market figures (Diageo Form 20-F 2025). " +
    "The campaign itself — territories, endline, script, schedule, budget, deliverables — is invented.\n\n" +
    "**Read it left to right.** The canvas is an hourglass, and the x-axis is time. " +
    "It opens wide on everything we looked at, narrows to three territories, pinches to one line, " +
    "then fans back out into the cutdowns. Air date is 15 August 2026 — the deliverables are in flight now.",
};

export const GUINNESS_ZONES = [
  {
    key: "input" as const,
    title: "THE INPUT",
    subtitle:
      "Everything we looked at · brief, market, audience, reference · 12 Jan – 3 Feb 2026",
  },
  {
    key: "territories" as const,
    title: "TERRITORIES",
    subtitle: "Three ways in · tissue session, 3 Feb 2026",
  },
  {
    key: "idea" as const,
    title: "THE IDEA",
    subtitle: "Client approved, 4 March 2026 · the waist of the hourglass",
  },
  {
    key: "making" as const,
    title: "THE MAKING",
    subtitle: "Script, recce, schedule · shoot 11–14 May 2026, Dublin",
  },
  {
    key: "cut" as const,
    title: "THE CUT",
    subtitle: "Post and approval · final cut signed off 26 June 2026",
  },
  {
    key: "output" as const,
    title: "THE OUTPUT",
    subtitle: "One film becomes sixty · air date 15 August 2026",
  },
];

// --- zone 0: THE INPUT — four category bands ---------------------------------

const BAND_BRIEF: CanvasBand = {
  key: "brief",
  label: "BRIEF",
  items: [
    {
      kind: "asset",
      key: "client-brief",
      name: "Guinness 0.0 — client brief.pdf",
      fileName: "guinness-00-brief.pdf",
      mimeType: "application/pdf",
      publicUrl: "/guinness-campaign/samples/guinness-00-brief.pdf",
      assetKind: "document",
    },
    {
      kind: "skill",
      key: "tone-of-voice",
      title: "Guinness — tone of voice",
      fileName: "guinness-tone-of-voice.md",
      publicUrl: "/guinness-campaign/samples/guinness-tone-of-voice.md",
    },
    site(
      "guinness-com",
      "https://www.guinness.com/en-gb",
      "guinness.com",
      "The World of Guinness: Beers, Experiences & More",
      // guinness.com publishes no og:image or twitter:image at all, so the card
      // would ship blank. Falls back to a licensed photograph of the subject.
      `${COMMONS}/thumb/9/9c/St._James%27s_Gate_Brewery%2C_Dublin%2C_Ireland.jpg/1280px-St._James%27s_Gate_Brewery%2C_Dublin%2C_Ireland.jpg`,
      false, // x-frame-options: SAMEORIGIN + frame-ancestors 'none'
    ),
    sticky(
      "proposition",
      "The proposition",
      "SINGLE-MINDED PROPOSITION\n\nGuinness 0.0 is not a compromise. It is the same 119.5 seconds.",
      "chalk",
    ),
    sticky(
      "disclaimer",
      "Read this first",
      "This is a FICTIONAL SPEC PITCH built as a Flowstate demo. The agency does not exist. The reference material is real; the campaign work is invented.",
      "turbo",
    ),
  ],
};

const BAND_MARKET: CanvasBand = {
  key: "market",
  label: "MARKET",
  items: [
    {
      kind: "artifact",
      key: "chart-europe",
      payload: {
        type: "chart",
        title: "Great Britain is the only European market growing",
        description: "Diageo FY25 organic net sales growth, by European market",
        data: {
          chartType: "bar",
          categories: [
            "Great Britain",
            "Rest of Europe",
            "Southern Europe",
            "Northern Europe",
          ],
          series: [{ name: "Organic net sales growth", data: [3.5, -0.4, -6.0, -13.9] }],
          unit: "%",
          source: "Diageo plc, Form 20-F 2025 (year ended 30 June 2025)",
        },
      },
    },
    {
      kind: "artifact",
      key: "chart-growth",
      payload: {
        type: "chart",
        title: "Where the growth actually is",
        description: "Diageo FY25 — the non-alcoholic portfolio against the company total",
        data: {
          chartType: "bar",
          categories: [
            "Total organic net sales",
            "Marketing investment",
            "Non-alcoholic portfolio",
          ],
          series: [{ name: "FY25 growth", data: [1.7, 1.9, 40] }],
          unit: "%",
          source: "Diageo plc, Form 20-F 2025 (year ended 30 June 2025)",
        },
      },
    },
    film("film-murphys", "fWdY_o2B_0E", "Murphy's Irish Stout - Last Orders (1997, Ireland)"),
    film("film-beamish", "dmEEkjW6pFA", "Beamish Stout TV Ad"),
    film("film-heineken00", "J84J3A4kbwk", "Heineken 0.0 | Now You Can | Presentation"),
    site(
      "site-murphys",
      "https://www.murphys.com/",
      "murphys.com",
      "Murphy's",
      "https://static1.squarespace.com/static/68945bc2103b287916729c15/t/68946445697faf70bc5415c5/1754555461618/murphys-signature-white.png?format=1500w",
      false, // SAMEORIGIN
    ),
    site(
      "site-beamish",
      "https://www.beamish.ie/",
      "beamish.ie",
      "Beamish Stout",
      "https://static1.squarespace.com/static/6881dfda9fb0816aa13e0b2b/t/68f7463d5cba365faac3b889/1761035837400/Beamish-logo-new.png?format=1500w",
      false, // SAMEORIGIN
    ),
  ],
};

const BAND_AUDIENCE: CanvasBand = {
  key: "audience",
  label: "AUDIENCE",
  items: [
    {
      kind: "artifact",
      key: "personas",
      payload: {
        type: "table",
        title: "Who we are actually talking to",
        description: "Invented audience work — the moderation occasion, not the abstainer",
        data: {
          columns: [
            { key: "who", label: "Who" },
            { key: "occasion", label: "Occasion" },
            { key: "tension", label: "The tension" },
          ],
          rows: [
            {
              who: { value: "The designated driver", tags: [{ label: "Primary", tone: "success" }] },
              occasion: "Round three, still driving home",
              tension: "Wants the ritual, not the alcohol. Hates holding a soft drink.",
            },
            {
              who: { value: "The mid-week moderator", tags: [{ label: "Primary", tone: "success" }] },
              occasion: "Tuesday, one pint, work tomorrow",
              tension: "Not quitting. Pacing. Wants the pint to still count.",
            },
            {
              who: { value: "The pregnant friend", tags: [{ label: "Secondary", tone: "info" }] },
              occasion: "In the round, all night",
              tension: "Does not want to explain herself, or be handed a lemonade.",
            },
            {
              who: { value: "The full-stop abstainer", tags: [{ label: "Not the target", tone: "warning" }] },
              occasion: "Already sober, already sorted",
              tension: "Category is solved for them. Not where the growth is.",
            },
          ],
        },
      },
    },
    sticky(
      "insight-summer",
      "Insight",
      "\"In Ireland, Guinness is now more popular in the summer than at Christmas.\"\n\n— Diageo, Form 20-F 2025",
      "chalk",
    ),
    sticky(
      "insight-drinkers",
      "Insight",
      "\"Guinness has continued its remarkable growth journey, with over 3.8 million new LPA+ drinkers since 2019.\"\n\n— Diageo, Form 20-F 2025",
      "chalk",
    ),
    sticky(
      "ask-territory",
      "Try asking",
      "Ask: which territory holds up best for the mid-week moderator?",
      "violet",
    ),
    site(
      "site-wikipedia-guinness",
      "https://en.wikipedia.org/wiki/Guinness",
      "Wikipedia",
      "Guinness - Wikipedia",
      "https://upload.wikimedia.org/wikipedia/en/thumb/f/f8/Guinness_logo_dark_text.svg/1280px-Guinness_logo_dark_text.svg.png",
      true, // no XFO, no frame-ancestors — renders as a live iframe
    ),
  ],
};

const BAND_REFERENCE_FILM: CanvasBand = {
  key: "reference-film",
  label: "REFERENCE · FILM",
  items: [
    film("film-surfer", "U3JEORDUEqc", "Guinness 'Surfer'"),
    film("film-noitulove", "qINiB3ndGmU", "Guinness - noitulovE (2005, UK)"),
    film("film-tipping", "mAQiuutkxdU", "Guinness Dominos Commercial - Tipping Point"),
    film("film-sapeurs", "66HuFrMZWMo", 'Guinness - "Sapeurs" (AMV BBDO)'),
    film("film-compton", "ZRr-hE9TMdo", "Guinness | Compton Cowboys"),
    film("film-welcome", "52aMUFE13HE", "Guinness 'Welcome Back' Ad"),
    sticky(
      "note-agegate",
      "Production note",
      "Every film on Guinness's own YouTube channel is age-restricted and will not embed. These are archive uploads. Any reference reel we build has to come from the ad archives.",
      "haiti",
    ),
  ],
};

const BAND_REFERENCE_MOOD: CanvasBand = {
  key: "reference-mood",
  label: "REFERENCE · MOOD & SOUND",
  items: [
    {
      kind: "artifact",
      key: "moodboard",
      payload: {
        type: "images",
        title: "Mood board — black, cream, and the ruby nobody sees",
        data: {
          items: [
            {
              kind: "image",
              url: `${COMMONS}/thumb/9/9c/St._James%27s_Gate_Brewery%2C_Dublin%2C_Ireland.jpg/1280px-St._James%27s_Gate_Brewery%2C_Dublin%2C_Ireland.jpg`,
              alt: "St James's Gate Brewery, Dublin",
            },
            {
              kind: "image",
              url: `${COMMONS}/thumb/4/44/Glass_Guinness_surgered.jpg/1280px-Glass_Guinness_surgered.jpg`,
              alt: "A settled pint of Guinness against black",
            },
            {
              kind: "image",
              url: `${COMMONS}/thumb/2/2c/Guinness_in_bar.jpg/1280px-Guinness_in_bar.jpg`,
              alt: "A pint on the bar, mid-settle",
            },
            {
              kind: "image",
              url: `${COMMONS}/e/ed/%22Guinness_for_Strength%22_sign%2C_Derrygonnelly_-_geograph.org.uk_-_5766239.jpg`,
              alt: "A weathered 'Guinness for Strength' sign",
            },
            {
              kind: "image",
              url: `${COMMONS}/thumb/2/2e/BleedingHorseInterior.jpg/1280px-BleedingHorseInterior.jpg`,
              alt: "The Bleeding Horse, Dublin — interior",
            },
            {
              kind: "image",
              url: `${COMMONS}/thumb/f/f0/Inside_T.P._Smith%27s_Pub%2C_Dublin%2C_Ireland.jpg/1280px-Inside_T.P._Smith%27s_Pub%2C_Dublin%2C_Ireland.jpg`,
              alt: "Inside T.P. Smith's, Dublin",
            },
            {
              kind: "image",
              url: `${COMMONS}/thumb/7/75/The_Brazen_Head_pub_exterior.jpg/1280px-The_Brazen_Head_pub_exterior.jpg`,
              alt: "The Brazen Head — Dublin's oldest pub",
            },
            {
              kind: "image",
              url: `${COMMONS}/thumb/7/7a/Guinness_Pub_Sign.jpg/1280px-Guinness_Pub_Sign.jpg`,
              alt: "Guinness pub signage",
            },
            {
              kind: "image",
              url: `${COMMONS}/thumb/9/9a/Rooftops_of_The_Guinness_St_James%27s_Gate_Brewery_-_geograph.org.uk_-_5948374.jpg/1280px-Rooftops_of_The_Guinness_St_James%27s_Gate_Brewery_-_geograph.org.uk_-_5948374.jpg`,
              alt: "Rooftops of the St James's Gate brewery",
            },
            {
              kind: "image",
              url: `${COMMONS}/thumb/f/f4/Dublin_GuinnessBrewery_SaintJamesGate_220_IMG_20250804_2043.jpg/1280px-Dublin_GuinnessBrewery_SaintJamesGate_220_IMG_20250804_2043.jpg`,
              alt: "The brewery gate at dusk",
            },
            {
              kind: "image",
              url: `${COMMONS}/thumb/a/af/Dublin_-_Guinness_Storehouse_-_20160507154420.jpg/1280px-Dublin_-_Guinness_Storehouse_-_20160507154420.jpg`,
              alt: "Guinness Storehouse, Dublin",
            },
            {
              kind: "image",
              url: `${COMMONS}/thumb/3/35/Guinness_Glass_2010.jpg/1280px-Guinness_Glass_2010.jpg`,
              alt: "The glass, the harp, the cream",
            },
          ],
        },
      },
    },
    track("track-a", "Tone track A — 'Slow Air' (uilleann, sparse)", 38, 1),
    track("track-b", "Tone track B — 'Rope' (percussive, building)", 32, 4),
    track("track-c", "Tone track C — 'Choral' (voices, no instruments)", 44, 7),
    {
      kind: "artifact",
      key: "palette",
      payload: {
        type: "custom",
        title: "Palette — and the ruby nobody sees",
        description: "It is not black. Hold it to the light and it is ruby.",
        data: {
          html: `<div class="p"><div class="sw" style="--c:#050505"><b>Stout</b><i>#050505</i></div><div class="sw" style="--c:#3B0A0A"><b>Ruby</b><i>#3B0A0A</i></div><div class="sw" style="--c:#C8A24B"><b>Harp gold</b><i>#C8A24B</i></div><div class="sw" style="--c:#E8DCC0"><b>Head cream</b><i>#E8DCC0</i></div><div class="note">Hold a pint to the light and it is not black — it is ruby. The campaign lives in that reveal.</div></div>`,
          css: `.p{font-family:system-ui,sans-serif;display:flex;flex-direction:column;gap:0;height:100%;background:#0b0b0b}.sw{flex:1;background:var(--c);display:flex;align-items:center;justify-content:space-between;padding:0 16px;color:#E8DCC0;border-bottom:1px solid rgba(232,220,192,.14)}.sw b{font-weight:500;font-size:14px;letter-spacing:.08em;text-transform:uppercase}.sw i{font-style:normal;font-size:12px;opacity:.65;font-family:ui-monospace,monospace}.note{padding:12px 16px;color:#9c948a;font-size:12px;line-height:1.5;background:#050505}`,
        },
      },
    },
    site(
      "site-wiki-surfer",
      "https://en.wikipedia.org/wiki/Surfer_(advertisement)",
      "Wikipedia",
      "Surfer (advertisement) - Wikipedia",
      "https://upload.wikimedia.org/wikipedia/en/5/59/Guinness_Surfer_advert_still.jpg",
      true,
    ),
    site(
      "site-wiki-noitulove",
      "https://en.wikipedia.org/wiki/NoitulovE",
      "Wikipedia",
      "noitulovE - Wikipedia",
      "https://upload.wikimedia.org/wikipedia/en/4/48/NoitulovE.jpg",
      true,
    ),
    site(
      "site-amvbbdo",
      "https://www.amvbbdo.com/",
      "amvbbdo.com",
      "AMV BBDO",
      "https://static1.squarespace.com/static/5fa5bc571ca1a27130ea939b/t/67a9f1997f17585b0fe29201/1739190681497/AMV+LOGO+2025.png?format=1500w",
      true, // no framing headers
    ),
  ],
};

// --- zone 1: TERRITORIES — three columns -------------------------------------

export const GUINNESS_TERRITORIES: Territory[] = [
  {
    key: "terr-a",
    line: "NOTHING\nTO PROVE",
    items: [
      sticky(
        "terr-a-note",
        "Territory A",
        "Zero as confidence, not compromise. The man who orders 0.0 and does not explain himself. Risk: reads as a lecture.",
        "chalk",
      ),
      film("terr-a-ref", "66HuFrMZWMo", 'Guinness - "Sapeurs" (AMV BBDO)'),
      track("terr-a-track", "Territory A tone track", 34, 2),
    ],
  },
  {
    key: "terr-b",
    line: "THE SAME\nPATIENCE",
    items: [
      sticky(
        "terr-b-note",
        "Territory B",
        "The 119.5-second pour does not care what is in the glass. Heritage does the work. Closest to 'good things come to those who wait'.",
        "chalk",
      ),
      film("terr-b-ref", "U3JEORDUEqc", "Guinness 'Surfer'"),
      track("terr-b-track", "Territory B tone track", 38, 1),
    ],
  },
  {
    key: "terr-c",
    line: "MADE\nOF LESS",
    items: [
      sticky(
        "terr-c-note",
        "Territory C",
        "Inverts 'Made of More'. Wittiest of the three and the most fragile — one bad read and it is an insult to the product.",
        "chalk",
      ),
      film("terr-c-ref", "qINiB3ndGmU", "Guinness - noitulovE (2005, UK)"),
      track("terr-c-track", "Territory C tone track", 32, 4),
    ],
  },
];

// --- zone 2: THE IDEA — the waist --------------------------------------------

export const GUINNESS_IDEA: NodeSpec[] = [
  sticky(
    "idea-approved",
    "Approved",
    "CLIENT APPROVED — 4 March 2026\n\nTerritory B. \"The same patience.\"\n\nOne note: prove it works without a voiceover.",
    "turbo",
  ),
  {
    kind: "artifact",
    key: "idea-keyvisual",
    payload: {
      type: "images",
      title: "Key visual — the pour, held to the light",
      data: {
        items: [
          {
            kind: "image",
            url: `${COMMONS}/thumb/4/44/Glass_Guinness_surgered.jpg/1280px-Glass_Guinness_surgered.jpg`,
            alt: "The settled pint — key visual",
          },
          {
            kind: "image",
            url: `${COMMONS}/thumb/2/2c/Guinness_in_bar.jpg/1280px-Guinness_in_bar.jpg`,
            alt: "Mid-settle on the bar",
          },
        ],
      },
    },
  },
  sticky(
    "idea-why",
    "Why this one",
    "It is the only territory that is true of the product before it is true of the drinker. The wait is real. We did not invent it.",
    "chalk",
  ),
];

// --- zone 3: THE MAKING ------------------------------------------------------

export const GUINNESS_MAKING: CanvasColumn[] = [
  {
    key: "script",
    label: "Script & board",
    items: [
      {
        kind: "artifact",
        key: "script",
        payload: {
          type: "code",
          title: "THE SAME PATIENCE — script, all cutdowns",
          description: "60 / 30 / 15 / 6 — the multi-file viewer is the version viewer",
          data: {
            files: [
              {
                path: "60.txt",
                language: "text",
                content: `THE SAME PATIENCE — 60"
The Liberties / Guinness 0.0 / v4 — 28 Apr 2026

OPEN ON: a tap. Nothing else. Black frame.

The pour begins. We do not cut.

V/O: (none)

SUPER:            119.5 SECONDS
                  (holds, 4s)

The surge. Hold on the cascade. The camera does not
move. It has nowhere to be.

At 0:41 a hand reaches in. We pull back — the hand
belongs to a woman who has been waiting exactly as
long as everyone else at the bar.

She lifts it to the light.

For one frame, it is not black. It is ruby.

SUPER:            THE SAME PATIENCE
                  GUINNESS 0.0

END.

NOTE: no VO. Client asked whether it works without
one. It does — that is the whole point.`,
              },
              {
                path: "30.txt",
                language: "text",
                content: `THE SAME PATIENCE — 30"
Cutdown of the 60. Lose the pull-back.

OPEN ON: the tap. The pour begins.

Hold. Hold. Hold.

SUPER:            119.5 SECONDS

The surge settles. A hand lifts it to the light.
Ruby, one frame.

SUPER:            THE SAME PATIENCE
                  GUINNESS 0.0

END.`,
              },
              {
                path: "15.txt",
                language: "text",
                content: `THE SAME PATIENCE — 15"
The pour and the reveal. Nothing else survives.

Tap. Pour. Settle. Light. Ruby.

SUPER:            THE SAME PATIENCE
                  GUINNESS 0.0

END.`,
              },
              {
                path: "06.txt",
                language: "text",
                content: `THE SAME PATIENCE — 6" (bumper)
Sound-off build. Must read with no audio.

Frame 1:  the settled pint, black.
Frame 2:  tilted to the light — ruby.
Frame 3:  THE SAME PATIENCE / GUINNESS 0.0

END.`,
              },
            ],
          },
        },
      },
      {
        kind: "artifact",
        key: "storyboard",
        payload: {
          type: "images",
          title: "Storyboard — the pour, the light, the ruby",
          data: {
            items: [
              {
                kind: "image",
                url: `${COMMONS}/thumb/2/2c/Guinness_in_bar.jpg/1280px-Guinness_in_bar.jpg`,
                alt: "Panel 1 — the pour begins",
              },
              {
                kind: "image",
                url: `${COMMONS}/thumb/4/44/Glass_Guinness_surgered.jpg/1280px-Glass_Guinness_surgered.jpg`,
                alt: "Panel 2 — the surge, held",
              },
              {
                kind: "image",
                url: `${COMMONS}/thumb/3/35/Guinness_Glass_2010.jpg/1280px-Guinness_Glass_2010.jpg`,
                alt: "Panel 3 — lifted to the light",
              },
              {
                kind: "image",
                url: `${COMMONS}/thumb/f/f0/Inside_T.P._Smith%27s_Pub%2C_Dublin%2C_Ireland.jpg/1280px-Inside_T.P._Smith%27s_Pub%2C_Dublin%2C_Ireland.jpg`,
                alt: "Panel 4 — pull back to the bar",
              },
            ],
          },
        },
      },
      sticky(
        "note-novo",
        "Creative director",
        "No VO. If it needs a voice to explain the wait, we have not shot the wait properly.",
        "violet",
      ),
    ],
  },
  {
    key: "recce",
    label: "Locations & recce",
    items: [
      {
        kind: "artifact",
        key: "map-dublin",
        payload: {
          type: "map",
          title: "Dublin — shoot locations, pub sites, OOH",
          description: "Pins grouped by why they are on the map",
          data: {
            place: {
              name: "St James's Gate, Dublin, Ireland",
              lat: 53.34444444,
              lng: -6.28888889,
            },
            zoom: 13,
            savedPlaces: [
              {
                id: "sp-gate",
                label: "St James's Gate — brewery",
                lat: 53.34444444,
                lng: -6.28888889,
                type: "Shoot",
                group: "Shoot locations",
              },
              {
                id: "sp-storehouse",
                label: "Guinness Storehouse",
                lat: 53.341874,
                lng: -6.28670931,
                type: "Shoot",
                group: "Shoot locations",
              },
              {
                id: "sp-brazen",
                label: "The Brazen Head — hero bar",
                lat: 53.34494,
                lng: -6.27631,
                type: "Pub",
                group: "Pub sites",
              },
              {
                id: "sp-longhall",
                label: "The Long Hall",
                lat: 53.3418677,
                lng: -6.2653305,
                type: "Pub",
                group: "Pub sites",
              },
              {
                id: "sp-kehoes",
                label: "Kehoe's",
                lat: 53.3412166,
                lng: -6.2594487,
                type: "Pub",
                group: "Pub sites",
              },
              {
                id: "sp-oconnell",
                label: "O'Connell Bridge — 48 sheet",
                lat: 53.3472655,
                lng: -6.2591043,
                type: "OOH",
                group: "OOH sites",
              },
              {
                id: "sp-hapenny",
                label: "Ha'penny Bridge — digital",
                lat: 53.3463273,
                lng: -6.2630949,
                type: "OOH",
                group: "OOH sites",
              },
              {
                id: "sp-grafton",
                label: "Grafton Street — retail",
                lat: 53.3414091,
                lng: -6.2603394,
                type: "OOH",
                group: "OOH sites",
              },
              {
                id: "sp-croke",
                label: "Croke Park — matchday",
                lat: 53.3608,
                lng: -6.2511,
                type: "OOH",
                group: "OOH sites",
              },
            ],
          },
        },
      },
      {
        kind: "artifact",
        key: "streetview-gate",
        payload: {
          type: "streetview",
          title: "Recce — St James's Gate, before anyone flies",
          description: "Street View of the brewery gate, Dublin 8",
          data: {
            place: {
              name: "St James's Gate, Dublin, Ireland",
              lat: 53.34444444,
              lng: -6.28888889,
            },
            heading: 200,
            pitch: 2,
            fov: 80,
          },
        },
      },
      {
        kind: "artifact",
        key: "streetview-brazen",
        payload: {
          type: "streetview",
          title: "Recce — The Brazen Head, hero bar",
          description: "Street View of Bridge Street Lower, Dublin 8",
          data: {
            place: {
              name: "The Brazen Head, Bridge Street Lower, Dublin, Ireland",
              lat: 53.34494,
              lng: -6.27631,
            },
            heading: 150,
            pitch: 0,
            fov: 75,
            viewMode: "circle",
          },
        },
      },
      sticky(
        "note-recce",
        "Producer",
        "Gate is a working brewery, not a set. One hour on a Sunday or nothing. Brazen Head interior is the fallback and honestly the better bar.",
        "haiti",
      ),
    ],
  },
  {
    key: "logistics",
    label: "Schedule, shot list, clearances",
    items: [
      {
        kind: "artifact",
        key: "shoot-calendar",
        payload: {
          type: "calendar",
          title: "Shoot week — May 2026",
          data: {
            viewYear: 2026,
            viewMonth: 5,
            highlightedDates: ["2026-05-11", "2026-05-12", "2026-05-13", "2026-05-14"],
            events: [
              { id: "cal-1", title: "Pre-pro meeting", startDate: "2026-05-05", endDate: "2026-05-05" },
              { id: "cal-2", title: "Build — bar set", startDate: "2026-05-08", endDate: "2026-05-09" },
              { id: "cal-3", title: "Shoot D1 — the pour (studio)", startDate: "2026-05-11", endDate: "2026-05-11" },
              { id: "cal-4", title: "Shoot D2 — the pour (studio)", startDate: "2026-05-12", endDate: "2026-05-12" },
              { id: "cal-5", title: "Shoot D3 — Brazen Head", startDate: "2026-05-13", endDate: "2026-05-13" },
              { id: "cal-6", title: "Shoot D4 — St James's Gate (1hr window)", startDate: "2026-05-14", endDate: "2026-05-14" },
              { id: "cal-7", title: "Wrap / strike", startDate: "2026-05-15", endDate: "2026-05-15" },
            ],
          },
        },
      },
      {
        kind: "artifact",
        key: "shotlist",
        payload: {
          type: "table",
          title: "Shot list — D1/D2, the pour",
          data: {
            columns: [
              { key: "shot", label: "Shot" },
              { key: "lens", label: "Lens" },
              { key: "note", label: "Note" },
            ],
            rows: [
              {
                shot: { value: "1A — tap, black frame", tags: [{ label: "Hero", tone: "success" }] },
                lens: "100mm macro",
                note: "Locked off. No move. This is the whole ad.",
              },
              {
                shot: "1B — the surge",
                lens: "100mm macro",
                note: "Practical, not CG. Client will ask. The answer is practical.",
              },
              {
                shot: { value: "2A — the light, ruby", tags: [{ label: "Hero", tone: "success" }] },
                lens: "80mm",
                note: "Backlight through the glass. One frame is all we need.",
              },
              {
                shot: "3A — pull back to bar",
                lens: "32mm",
                note: "Only in the 60. Cut in the 30.",
              },
              {
                shot: { value: "3B — hand reaches in", tags: [{ label: "Casting", tone: "warning" }] },
                lens: "80mm",
                note: "Hand double booked. Real hands, no gloves.",
              },
            ],
          },
        },
      },
      {
        kind: "artifact",
        key: "clearances",
        payload: {
          type: "todo",
          title: "Clearances — the things that actually kill campaigns",
          data: {
            items: [
              { id: "cl-1", label: "Music licence — tone track B, all media, 2yr", checked: true, dueDate: "2026-04-20", priority: "high" },
              { id: "cl-2", label: "Talent release — hand double", checked: true, dueDate: "2026-05-01", priority: "high" },
              { id: "cl-3", label: "Location agreement — Brazen Head", checked: true, dueDate: "2026-05-01", priority: "medium" },
              { id: "cl-4", label: "Location agreement — St James's Gate (1hr)", checked: true, dueDate: "2026-05-06", priority: "high" },
              { id: "cl-5", label: "Legal — '119.5 seconds' substantiation", checked: false, dueDate: "2026-07-20", priority: "high" },
              { id: "cl-6", label: "Portman Group code review — 0.0 claim", checked: false, dueDate: "2026-07-22", priority: "high" },
              { id: "cl-7", label: "Clearcast — 60/30/15/6", checked: false, dueDate: "2026-07-24", priority: "high" },
            ],
          },
        },
      },
      sticky(
        "note-legal",
        "Legal",
        "Do not run '119.5 seconds' as a factual claim until substantiation lands. If it slips, the super becomes 'the same wait'.",
        "haiti",
      ),
    ],
  },
];

// --- zone 4: THE CUT ---------------------------------------------------------

export const GUINNESS_CUT: CanvasColumn[] = [
  {
    key: "post",
    label: "Post & sound",
    items: [
      track("vo-take-1", "VO take 1 — 'the same patience' (cut)", 12, 3),
      track("vo-take-2", "VO take 2 — 'the same patience' (cut)", 14, 6),
      track("sound-design", "Sound design — the surge, no music", 30, 9),
      sticky(
        "note-vo",
        "Creative director",
        "Both VO takes are good. Both are wrong. Cut them. The client asked whether it plays silent — it plays better silent.",
        "violet",
      ),
    ],
  },
  {
    key: "approval",
    label: "Feedback & approval",
    items: [
      sticky(
        "fb-client",
        "Client — 8 June",
        "Round 2: love the hold. Nervous about 41 seconds with no cut. Can we see a version that cuts at 20?",
        "turbo",
      ),
      sticky(
        "fb-planner",
        "Planner — 9 June",
        "Round 2: the 20-second cut tests worse. The wait IS the ad. Holding the line on this one.",
        "chalk",
      ),
      sticky(
        "fb-legal",
        "Legal — 11 June",
        "Round 2: '119.5 seconds' needs substantiation before air. Everything else clears.",
        "haiti",
      ),
      sticky(
        "fb-cd",
        "Creative director — 12 June",
        "Round 2: agreed with planning. If we cut at 20 we have made an ad about a drink instead of an ad about waiting.",
        "violet",
      ),
      {
        kind: "artifact",
        key: "approval-gate",
        payload: {
          type: "todo",
          title: "Approval gate — final cut",
          data: {
            items: [
              { id: "ap-1", label: "Rough cut v1 — internal", checked: true, dueDate: "2026-06-02", priority: "medium" },
              { id: "ap-2", label: "Client round 1", checked: true, dueDate: "2026-06-05", priority: "medium" },
              { id: "ap-3", label: "Client round 2 — the 41-second hold", checked: true, dueDate: "2026-06-12", priority: "high" },
              { id: "ap-4", label: "Final cut approved", checked: true, dueDate: "2026-06-26", priority: "high" },
              { id: "ap-5", label: "Grade + online lock", checked: true, dueDate: "2026-07-03", priority: "medium" },
            ],
          },
        },
      },
      sticky(
        "note-gap",
        "Honest gap",
        "The cuts themselves are not on this canvas. Flowstate has no uploaded-video artifact — video means YouTube, and an agency's rough cut is never on YouTube. This is the one thing the wall cannot hold.",
        "haiti",
      ),
    ],
  },
];

// --- zone 5: THE OUTPUT — fans back out --------------------------------------

export const GUINNESS_OUTPUT: CanvasColumn[] = [
  {
    key: "deliverables",
    label: "Deliverables",
    items: [
      {
        kind: "artifact",
        key: "deliverables-matrix",
        payload: {
          type: "table",
          title: "One film becomes sixty",
          description: "Cutdowns × ratio × platform — status as of 16 July 2026",
          data: {
            columns: [
              { key: "cut", label: "Cut" },
              { key: "ratio", label: "Ratio" },
              { key: "where", label: "Where" },
              { key: "status", label: "Status" },
            ],
            rows: [
              {
                cut: "60\"",
                ratio: "16:9",
                where: "Cinema, VOD",
                status: { value: "Delivered", tags: [{ label: "Done", tone: "success" }] },
              },
              {
                cut: "30\"",
                ratio: "16:9",
                where: "TV, BVOD",
                status: { value: "Delivered", tags: [{ label: "Done", tone: "success" }] },
              },
              {
                cut: "15\"",
                ratio: "9:16",
                where: "TikTok, Reels, Shorts",
                status: { value: "Delivered", tags: [{ label: "Done", tone: "success" }] },
              },
              {
                cut: "15\"",
                ratio: "1:1",
                where: "Feed",
                status: { value: "In grade", tags: [{ label: "Due 24 Jul", tone: "warning" }] },
              },
              {
                cut: "6\"",
                ratio: "9:16",
                where: "Bumper, sound-off",
                status: { value: "In grade", tags: [{ label: "Due 24 Jul", tone: "warning" }] },
              },
              {
                cut: "6\"",
                ratio: "16:9",
                where: "Pre-roll",
                status: { value: "Blocked", tags: [{ label: "Clearcast", tone: "danger" }] },
              },
              {
                cut: "Stills",
                ratio: "48 sheet",
                where: "OOH — Dublin, 4 sites",
                status: { value: "At printer", tags: [{ label: "Due 31 Jul", tone: "warning" }] },
              },
              {
                cut: "Audio",
                ratio: "30\"",
                where: "DAB, Spotify",
                status: { value: "Not started", tags: [{ label: "Blocked on VO", tone: "danger" }] },
              },
            ],
          },
        },
      },
      sticky(
        "note-radio",
        "Producer",
        "Radio is blocked because we cut the VO. An ad about silence does not port to audio. Someone has to tell the client.",
        "haiti",
      ),
    ],
  },
  {
    key: "flight",
    label: "Flight plan",
    items: [
      {
        kind: "artifact",
        key: "flight-plan",
        payload: {
          type: "calendar",
          title: "Flight plan — August 2026",
          data: {
            viewYear: 2026,
            viewMonth: 8,
            highlightedDates: ["2026-08-15", "2026-08-16"],
            events: [
              { id: "fl-1", title: "Assets to media", startDate: "2026-08-03", endDate: "2026-08-03" },
              { id: "fl-2", title: "OOH posting — Dublin", startDate: "2026-08-10", endDate: "2026-08-14" },
              { id: "fl-3", title: "AIR — PL opening weekend", startDate: "2026-08-15", endDate: "2026-08-16" },
              { id: "fl-4", title: "TV burst 1", startDate: "2026-08-15", endDate: "2026-08-29" },
              { id: "fl-5", title: "Social always-on", startDate: "2026-08-15", endDate: "2026-09-30" },
              { id: "fl-6", title: "Cinema", startDate: "2026-08-21", endDate: "2026-09-18" },
            ],
          },
        },
      },
      {
        kind: "artifact",
        key: "budget-burn",
        payload: {
          type: "chart",
          title: "Budget burn vs approved",
          description: "Invented campaign figure — spec pitch, not real",
          data: {
            chartType: "gauge",
            gaugeValue: 78,
            gaugeMax: 100,
            gaugeLabel: "% of approved spend committed",
            unit: "%",
            source: "The Liberties — invented spec pitch figure",
          },
        },
      },
      {
        kind: "artifact",
        key: "channel-split",
        payload: {
          type: "chart",
          title: "Channel split",
          description: "Invented campaign figure — spec pitch, not real",
          data: {
            chartType: "pie",
            slices: [
              { name: "TV / BVOD", value: 38 },
              { name: "Social", value: 24 },
              { name: "Cinema", value: 14 },
              { name: "OOH", value: 16 },
              { name: "Audio", value: 8 },
            ],
            unit: "% of spend",
            source: "The Liberties — invented spec pitch figure",
          },
        },
      },
    ],
  },
  {
    key: "market",
    label: "In market",
    items: [
      site(
        "site-storehouse",
        "https://www.guinness-storehouse.com/en",
        "guinness-storehouse.com",
        "Welcome to the Home of Guinness | Guinness Storehouse",
        "https://images.ctfassets.net/cc2i3408pa0k/3ApNiEYhOIOjzKR7K1RtHw/ff8de09a6faee5129a576f8ee674dd9b/storehouse-experience-image-052x_lr__1_.jpg",
        false, // frame-ancestors 'self' + contentful/anyroad only
      ),
      site(
        "site-diageo",
        "https://www.diageo.com/en",
        "diageo.com",
        "Diageo",
        "https://www.diageo.com/~/media/Images/D/Diageo-V2/Universal/logo/diageo-og-logo.jpg",
        false, // SAMEORIGIN
      ),
      site(
        "site-canneslions",
        "https://www.canneslions.com/",
        "canneslions.com",
        "Cannes Lions International Festival of Creativity 2026",
        "https://images.ctfassets.net/vjs6vfoxg7y6/4opCcrk7JYjMCKvmvacrmm/260c0f614f4f5c17ebba85ea5eab3fe6/Open_Graph_Image_home.png",
        false, // SAMEORIGIN + frame-ancestors contentful only
      ),
      // D&AD dropped: publishes no og:image or twitter:image, so the card would
      // ship as a dead placeholder. Nothing enriches it at render time.
      sticky(
        "ask-performance",
        "Try asking",
        "Ask: build a performance dashboard for the first two weeks of the flight.",
        "violet",
      ),
    ],
  },
];

// --- master timeline ---------------------------------------------------------

const GUINNESS_TIMELINE: ArtifactSpec = {
  kind: "artifact",
  key: "timeline",
  payload: {
    type: "timeline",
    title: "The Same Patience — brief to air",
    data: {
      scale: "month",
      rangeStart: "2026-01-01T00:00:00.000Z",
      rangeEnd: "2026-09-30T23:59:59.999Z",
      events: [
        { id: "tl-1", at: "2026-01-12T00:00:00.000Z", label: "Brief received" },
        { id: "tl-2", at: "2026-02-03T00:00:00.000Z", label: "Tissue session — three territories" },
        { id: "tl-3", at: "2026-03-04T00:00:00.000Z", label: "Territory B approved", highlight: true },
        { id: "tl-4", at: "2026-04-28T00:00:00.000Z", label: "Script v4 locked" },
        { id: "tl-5", at: "2026-05-11T00:00:00.000Z", label: "Shoot, Dublin", highlight: true },
        { id: "tl-6", at: "2026-06-02T00:00:00.000Z", label: "Rough cut v1" },
        { id: "tl-7", at: "2026-06-26T00:00:00.000Z", label: "Final cut approved", highlight: true },
        { id: "tl-8", at: "2026-07-24T00:00:00.000Z", label: "Deliverables due" },
        { id: "tl-9", at: "2026-08-15T00:00:00.000Z", label: "Air — Premier League opening", highlight: true },
      ],
    },
  },
};

/**
 * The whole job's shape, sat at the far left where the canvas opens. You land,
 * you see brief-to-air in one object, then you walk right through it.
 */
const BAND_SCHEDULE: CanvasBand = {
  key: "schedule",
  label: "SCHEDULE · BRIEF TO AIR",
  items: [GUINNESS_TIMELINE],
};

/** Declared last so every band const above is initialised. */
export const GUINNESS_INPUT_BANDS: CanvasBand[] = [
  BAND_BRIEF,
  BAND_MARKET,
  BAND_AUDIENCE,
  BAND_REFERENCE_FILM,
  BAND_REFERENCE_MOOD,
  BAND_SCHEDULE,
];
