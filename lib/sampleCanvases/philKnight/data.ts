import type { ArtifactPayload, StickyNoteColorId } from "@/lib/artifactTypes";
import { createWebsitePayload } from "@/lib/websiteArtifact";

/**
 * Researched Phil Knight content for the sample canvas. Produced with the
 * research-canvas skill (v0.2.0) — every YouTube ID verified via oEmbed, every
 * URL fetched and confirmed, every Wikimedia file confirmed through the Commons
 * API, every number sourced (July 2026).
 *
 * Where sources disagree the canvas says so rather than picking silently:
 *   - Waffle Trainer year: Wikipedia says 1974, Nike's own archive says 1975.
 *     The era is anchored on the patent grant (Feb 26, 1974), which is exact.
 *   - Air Jordan first-year sales: the widely repeated $126M figure carries a
 *     dispute tag on Wikipedia, so only Nike's own $3M/three-year projection
 *     and the "far past it" outcome are stated as fact.
 *   - Blue Ribbon Sports' earliest revenue: secondary sources conflict
 *     ($3,240 vs $8,000 for the first year), so only Wikipedia's figures
 *     (1,300 pairs / $8,000 in 1964; $20,000 in 1965) are used.
 */

export interface SampleArtifactSpec {
  /** Stable id suffix, e.g. "chart-revenue" → pknight-art-chart-revenue. */
  key: string;
  payload: ArtifactPayload;
}

export interface SampleClusterColumn {
  /** Optional small annotation label rendered above the column. */
  label?: string;
  items: SampleArtifactSpec[];
}

export interface SampleEra {
  key: string;
  title: string;
  year: string;
  columns: SampleClusterColumn[];
  /** Annotation column: sticky-note highlights and "Ask:" prompts. */
  stickies: SampleArtifactSpec[];
}

const WIKIPEDIA_FAVICON =
  "https://en.wikipedia.org/static/apple-touch/wikipedia.png";

/**
 * Both fields are REQUIRED, deliberately.
 *
 * Nothing enriches a builder-authored website artifact at render time: the
 * live check (`/api/link-preview` → `fetchLinkPreview`) only runs in
 * `lib/createUrlArtifact.ts`, i.e. when a *user* pastes a URL. A builder that
 * leaves these undefined ships a card reading "No preview image" that never
 * becomes interactive. So both are researched at authoring time:
 *
 *   - `embeddable`  — replicates `isFrameableFromHeaders` (lib/frameability.ts)
 *     against the page's real response headers. true ⇒ WebsiteArtifactContent
 *     renders a live InteractiveWebFrame ("Click to interact" on canvas).
 *   - `previewImageUrl` — the page's own og:image where it publishes one, else
 *     a curated, correctly-attributed image. Still needed when `embeddable` is
 *     true: the sidebar layout never frames, and the 8s frame watchdog falls
 *     back to this card.
 */
function website(
  key: string,
  url: string,
  pageTitle: string,
  domainLabel: string,
  extras: {
    faviconUrl?: string;
    previewImageUrl: string;
    embeddable: boolean;
  },
): SampleArtifactSpec {
  const payload = createWebsitePayload(url, domainLabel, extras);
  payload.title = pageTitle;
  payload.data.title = pageTitle;
  return { key, payload };
}

/**
 * en.wikipedia.org article pages send no X-Frame-Options and no CSP
 * frame-ancestors (re-verified with a GET, July 2026), so every Wikipedia card
 * on this canvas is a live, scrollable page rather than a static thumbnail.
 */
function wikipedia(
  key: string,
  url: string,
  pageTitle: string,
  previewImageUrl: string,
): SampleArtifactSpec {
  return website(key, url, pageTitle, "Wikipedia", {
    faviconUrl: WIKIPEDIA_FAVICON,
    previewImageUrl,
    embeddable: true,
  });
}

/* Preview images. Wikipedia's own og:image where the article publishes one;
 * otherwise a curated Commons file (all CC BY-SA, description checked). */
const OG_NIKE_CAMPUS =
  "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d3/Nike_Campus%2C_Beaverton_-_DPLA_-_ffa63f1bbaf5cd21aeada3d3978db2b0.jpg/1280px-Nike_Campus%2C_Beaverton_-_DPLA_-_ffa63f1bbaf5cd21aeada3d3978db2b0.jpg";

function youtubeVideo(
  key: string,
  videoId: string,
  title: string,
  description: string,
): SampleArtifactSpec {
  return {
    key,
    payload: {
      type: "images",
      title,
      description,
      data: {
        items: [
          {
            kind: "youtube",
            url: `https://www.youtube.com/watch?v=${videoId}`,
            thumb: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
            title,
          },
        ],
      },
    },
  };
}

function sticky(
  key: string,
  title: string,
  text: string,
  colorId: StickyNoteColorId,
): SampleArtifactSpec {
  return {
    key,
    payload: { type: "stickynote", title, data: { text, colorId } },
  };
}

/** A sourced fact worth calling out. */
const highlight = (key: string, text: string) =>
  sticky(key, "Highlight", text, "chalk");

/** A question the reader can pose to the canvas AI to keep digging. */
const askPrompt = (key: string, text: string) =>
  sticky(key, "Try asking", text, "turbo");

/* ------------------------------ Overview band ------------------------------ */

export const PKNIGHT_SUBTITLE =
  "Phil Knight, born 1938 — the miler who sold Japanese shoes from a Plymouth Valiant and built Nike";

export const PKNIGHT_OVERVIEW_STICKIES: SampleArtifactSpec[] = [
  highlight(
    "sticky-overview-arc",
    "Year one: 1,300 pairs, $8,000. Fiscal 2025: $46.3 billion. Same company.",
  ),
  askPrompt(
    "sticky-overview-ask",
    "Ask: compare Nike and Adidas revenue since 1990.",
  ),
];

// Nike, Inc. fiscal years end May 31. 1980 from Nike's IPO-year revenue as
// reported by Nasdaq/Motley Fool; 1990–2000 from Nike's own annual reports;
// 2005 onward from the revenue table in Wikipedia: Nike, Inc.
const NIKE_REVENUE_YEARS = [
  "1980",
  "1990",
  "1995",
  "2000",
  "2005",
  "2010",
  "2015",
  "2020",
  "2025",
];
const NIKE_REVENUE_BILLIONS = [0.27, 2.24, 4.76, 9.0, 13.7, 19.0, 30.6, 37.4, 46.3];

const NIKE_RECENT_YEARS = ["2005", "2010", "2015", "2020", "2023", "2025"];
const NIKE_NET_INCOME_BILLIONS = [1.2, 1.9, 3.2, 2.5, 5.0, 3.2];
const NIKE_EMPLOYEES = [26000, 34400, 62600, 75400, 83700, 77800];

export const PKNIGHT_OVERVIEW_ROWS: SampleArtifactSpec[][] = [
  [
    {
      key: "chart-revenue",
      payload: {
        type: "chart",
        title: "Nike Revenue by Selected Fiscal Year (1980–2025)",
        description:
          "From $269.8M in the year Knight took Nike public to $46.3B in fiscal 2025.",
        data: {
          chartType: "bar",
          categories: NIKE_REVENUE_YEARS,
          series: [{ name: "Revenue", data: NIKE_REVENUE_BILLIONS }],
          unit: "$B",
          source:
            "Nike, Inc. annual reports; Wikipedia: Nike, Inc. (FY1980 revenue $269.8M per Nasdaq/Motley Fool)",
        },
      },
    },
    {
      key: "chart-net-income",
      payload: {
        type: "chart",
        title: "Nike Net Income (FY2005–FY2025)",
        description:
          "The line does not only go up — fiscal 2025 gave back most of the 2023 peak.",
        data: {
          chartType: "bar",
          categories: NIKE_RECENT_YEARS,
          series: [{ name: "Net income", data: NIKE_NET_INCOME_BILLIONS }],
          unit: "$B",
          source: "Wikipedia: Nike, Inc. — financial data table",
        },
      },
    },
    {
      key: "chart-employees",
      payload: {
        type: "chart",
        title: "Nike Employees (FY2005–FY2025)",
        description: "26,000 to a peak of 83,700, then the first real retreat.",
        data: {
          chartType: "line",
          categories: NIKE_RECENT_YEARS,
          series: [{ name: "Employees", data: NIKE_EMPLOYEES }],
          unit: "people",
          smooth: true,
          source: "Wikipedia: Nike, Inc. — financial data table",
        },
      },
    },
  ],
  [
    {
      key: "chart-giving",
      payload: {
        type: "chart",
        title: "Where Phil Knight's Billions Went",
        description:
          "Three institutions account for roughly $4.3B of announced gifts.",
        data: {
          chartType: "pie",
          slices: [
            { name: "OHSU (incl. 2025 pledge)", value: 2.7 },
            { name: "University of Oregon", value: 1.0 },
            { name: "Stanford", value: 0.58 },
          ],
          unit: "$B",
          source:
            "Wikipedia: Phil Knight — OHSU $2.7B total; Oregon 'over $1 billion' as of 2023; Stanford $105M + $400M + $75M",
        },
      },
    },
    {
      key: "table-cast",
      payload: {
        type: "table",
        title: "The Cast of Shoe Dog",
        description: "Knight's story is mostly other people's names.",
        data: {
          columns: [
            { key: "person", label: "Person" },
            { key: "role", label: "Role" },
            { key: "note", label: "What they did" },
          ],
          rows: [
            {
              person: {
                value: "Bill Bowerman",
                tags: [{ label: "Co-founder", tone: "success" }],
              },
              role: "Oregon track coach, 1948–1973",
              note: "Coached Knight, then co-founded BRS on a handshake and invented the waffle sole",
            },
            {
              person: "Kihachiro Onitsuka",
              role: "Founder, Onitsuka Co. (Kobe)",
              note: "Sold Knight the Tigers that became Blue Ribbon Sports' entire business",
            },
            {
              person: {
                value: "Jeff Johnson",
                tags: [{ label: "Employee #1", tone: "info" }],
              },
              role: "First full-time employee",
              note: "Credited with coining the name 'Nike' — the Greek goddess of victory",
            },
            {
              person: {
                value: "Carolyn Davidson",
                tags: [{ label: "$35", tone: "warning" }],
              },
              role: "Portland State design student",
              note: "Drew the Swoosh in 1971, billed $2/hour, and was paid $35",
            },
            {
              person: "Steve Prefontaine",
              role: "Oregon runner",
              note: "Bowerman's most famous athlete and Nike's first great endorser",
            },
            {
              person: {
                value: "Michael Jordan",
                tags: [{ label: "1984", tone: "success" }],
              },
              role: "Rookie shooting guard",
              note: "Signed October 26, 1984 — the deal that redefined athlete endorsement",
            },
            {
              person: "Dan Wieden",
              role: "Founder, Wieden+Kennedy",
              note: "Wrote 'Just Do It' in 1988 after a Portland agency meeting",
            },
            {
              person: "Penny Knight",
              role: "Wife, married 1968",
              note: "Met Knight as his Portland State accounting student; co-signs the giving",
            },
          ],
        },
      },
    },
    {
      key: "table-gifts",
      payload: {
        type: "table",
        title: "Knight's Landmark Gifts",
        description: "One of the largest individual giving records in America.",
        data: {
          columns: [
            { key: "year", label: "Year" },
            { key: "recipient", label: "Recipient" },
            { key: "amount", label: "Amount" },
            { key: "note", label: "What it funded" },
          ],
          rows: [
            {
              year: "2006",
              recipient: "Stanford GSB",
              amount: "$105M",
              note: "The Knight Management Center campus",
            },
            {
              year: "2008",
              recipient: {
                value: "OHSU",
                tags: [{ label: "Named", tone: "info" }],
              },
              amount: "$100M",
              note: "Established the OHSU Knight Cancer Institute",
            },
            {
              year: "2013",
              recipient: {
                value: "OHSU",
                tags: [{ label: "Challenge", tone: "warning" }],
              },
              amount: "$500M",
              note: "Only if OHSU matched it within two years — it did, by June 25, 2015",
            },
            {
              year: "2016",
              recipient: "Stanford",
              amount: "$400M",
              note: "Knight-Hennessy Scholars, a global graduate fellowship",
            },
            {
              year: "2016",
              recipient: "University of Oregon",
              amount: "$500M",
              note: "The Phil and Penny Knight Campus for Accelerating Scientific Impact",
            },
            {
              year: "2025",
              recipient: {
                value: "OHSU",
                tags: [{ label: "Record", tone: "success" }],
              },
              amount: "$2B",
              note: "Announced August 14, 2025 — brings OHSU giving to about $2.7B",
            },
          ],
        },
      },
    },
  ],
];

export const PKNIGHT_TIMELINE: SampleArtifactSpec = {
  key: "timeline-milestones",
  payload: {
    type: "timeline",
    title: "Phil Knight: Defining Milestones (1938–2025)",
    description: "Fourteen moments that trace the whole arc.",
    data: {
      scale: "year",
      rangeStart: "1936-01-01T00:00:00.000Z",
      rangeEnd: "2027-12-31T23:59:59.999Z",
      events: [
        {
          id: "evt_born",
          at: "1938-02-24T00:00:00.000Z",
          label: "Born in Portland, Oregon",
          highlight: true,
        },
        {
          id: "evt_stanford",
          at: "1962-06-01T00:00:00.000Z",
          label: "Stanford paper proposes importing Japanese running shoes",
          highlight: true,
        },
        {
          id: "evt_kobe",
          at: "1962-11-01T00:00:00.000Z",
          label: "Meets Onitsuka in Kobe; invents Blue Ribbon Sports",
          highlight: true,
        },
        {
          id: "evt_handshake",
          at: "1964-01-25T00:00:00.000Z",
          label: "Handshake with Bill Bowerman founds the company",
          highlight: true,
        },
        {
          id: "evt_store",
          at: "1966-01-01T00:00:00.000Z",
          label: "First retail store opens on Pico Boulevard",
        },
        {
          id: "evt_nike",
          at: "1971-05-30T00:00:00.000Z",
          label: "Blue Ribbon Sports becomes Nike, Inc.",
          highlight: true,
        },
        {
          id: "evt_swoosh",
          at: "1971-06-18T00:00:00.000Z",
          label: "Carolyn Davidson's Swoosh is used for the first time",
        },
        {
          id: "evt_waffle",
          at: "1974-02-26T00:00:00.000Z",
          label: "Waffle sole patent granted",
          highlight: true,
        },
        {
          id: "evt_ipo",
          at: "1980-12-02T00:00:00.000Z",
          label: "Nike goes public on $269.8 million of revenue",
          highlight: true,
        },
        {
          id: "evt_jordan",
          at: "1984-10-26T00:00:00.000Z",
          label: "Michael Jordan signs with Nike",
          highlight: true,
        },
        {
          id: "evt_jdi",
          at: "1988-09-18T00:00:00.000Z",
          label: "The Just Do It campaign debuts",
          highlight: true,
        },
        {
          id: "evt_press_club",
          at: "1998-05-12T00:00:00.000Z",
          label: "Knight pledges factory reform at the National Press Club",
          highlight: true,
        },
        {
          id: "evt_ceo",
          at: "2004-11-18T00:00:00.000Z",
          label: "Steps down as Nike CEO",
        },
        {
          id: "evt_shoe_dog",
          at: "2016-04-26T00:00:00.000Z",
          label: "Shoe Dog memoir published",
          highlight: true,
        },
        {
          id: "evt_ohsu",
          at: "2025-08-14T00:00:00.000Z",
          label: "Knights pledge $2 billion to OHSU",
          highlight: true,
        },
      ],
    },
  },
};

/* -------------------------------- Era clusters -------------------------------- */

export const PKNIGHT_ERAS: SampleEra[] = [
  {
    key: "crazy-idea",
    title: "The Crazy Idea",
    year: "1964",
    columns: [
      {
        label: "Knight tells the founding story himself",
        items: [
          youtubeVideo(
            "video-knight-gsb",
            "OHTosaWWKvg",
            "Phil Knight, MBA ’62, Co-founder and Chairman Emeritus, Nike",
            "Knight returns to the business school where the whole idea started as a class paper.",
          ),
          wikipedia(
            "site-blue-ribbon",
            "https://en.wikipedia.org/wiki/Blue_Ribbon_Sports",
            "Blue Ribbon Sports - Wikipedia",
            OG_NIKE_CAMPUS,
          ),
          {
            key: "gallery-knight-bowerman",
            payload: {
              type: "images",
              title: "Knight and Bowerman",
              description:
                "The runner and his coach — the two halves of a handshake company.",
              data: {
                items: [
                  {
                    kind: "image",
                    url: "https://upload.wikimedia.org/wikipedia/commons/6/6e/Knight_and_Bowerman.jpg",
                    alt: "Phil Knight and Bill Bowerman",
                  },
                  {
                    kind: "image",
                    url: "https://upload.wikimedia.org/wikipedia/commons/b/b2/Phil_Knight-1957.jpg",
                    alt: "Phil Knight running for Oregon in 1957",
                  },
                ],
              },
            },
          },
        ],
      },
      {
        label: "Kobe, November 1962 — the meeting that invented a company",
        items: [
          {
            key: "map-kobe",
            payload: {
              type: "map",
              title: "Kobe, Japan",
              description:
                "Where Kihachiro Onitsuka founded Onitsuka Co. in 1949 — and where Knight talked his way into a distributorship",
              data: {
                place: { name: "Kobe, Hyōgo Prefecture, Japan", lat: 34.69, lng: 135.19556 },
                zoom: 12,
              },
            },
          },
          wikipedia(
            "site-asics",
            "https://en.wikipedia.org/wiki/Asics",
            "Asics - Wikipedia",
            "https://upload.wikimedia.org/wikipedia/commons/thumb/8/83/Headquarters_of_ASICS_Corporation.JPG/1280px-Headquarters_of_ASICS_Corporation.JPG",
          ),
          {
            key: "gallery-corsair",
            payload: {
              type: "images",
              title: "The Onitsuka Corsair",
              description:
                "The Tiger that Nike would later re-release as the Cortez — and sue over.",
              data: {
                items: [
                  {
                    kind: "image",
                    url: "https://upload.wikimedia.org/wikipedia/commons/6/60/Onitsuka_Corsair.jpg",
                    alt: "An Onitsuka Tiger Corsair running shoe",
                  },
                ],
              },
            },
          },
        ],
      },
    ],
    stickies: [
      highlight(
        "sticky-crazy-50",
        "Knight borrowed $50 from his father for the trip to Japan. Year one: 1,300 pairs, $8,000.",
      ),
      highlight(
        "sticky-crazy-name",
        "Asked who he represented, Knight had no company — so he said “Blue Ribbon Sports,” inventing it on the spot.",
      ),
      askPrompt(
        "sticky-crazy-ask",
        "Ask: what was in Knight's 1962 Stanford paper about Japanese shoes?",
      ),
    ],
  },
  {
    key: "swoosh",
    title: "Nike & the Swoosh",
    year: "1971",
    columns: [
      {
        label: "A $35 logo and a name nobody loved",
        items: [
          youtubeVideo(
            "video-swoosh-history",
            "yJpEBdxLVZg",
            "Nike Logo History - Where Did The Swoosh Come From? [Brand Stories]",
            "How five sketches from a design student became the most recognised mark on earth.",
          ),
          // The article publishes no og:image — curated: the mark she drew.
          wikipedia(
            "site-davidson",
            "https://en.wikipedia.org/wiki/Carolyn_Davidson_(graphic_designer)",
            "Carolyn Davidson (graphic designer) - Wikipedia",
            "https://upload.wikimedia.org/wikipedia/commons/f/fe/NIKE-Swoosh.jpg",
          ),
        ],
      },
      {
        label: "The split from Onitsuka forced the brand into existence",
        items: [
          wikipedia(
            "site-nike-inc",
            "https://en.wikipedia.org/wiki/Nike,_Inc.",
            "Nike, Inc. - Wikipedia",
            OG_NIKE_CAMPUS,
          ),
          {
            key: "table-1971",
            payload: {
              type: "table",
              title: "1971: Four Dates That Made a Brand",
              description: "The year Blue Ribbon Sports stopped being a middleman.",
              data: {
                columns: [
                  { key: "date", label: "Date" },
                  { key: "event", label: "Event" },
                ],
                rows: [
                  {
                    date: "Early 1971",
                    event: {
                      value: "Onitsuka moves to buy 51% of Blue Ribbon Sports",
                      tags: [{ label: "Trigger", tone: "danger" }],
                    },
                  },
                  {
                    date: "May 30, 1971",
                    event: {
                      value: "The company is renamed Nike, Inc.",
                      tags: [{ label: "Jeff Johnson", tone: "info" }],
                    },
                  },
                  {
                    date: "June 18, 1971",
                    event: "The Swoosh is used on a product for the first time",
                  },
                  {
                    date: "Jan 22, 1974",
                    event: {
                      value: "The Swoosh is registered as a trademark",
                      tags: [{ label: "Locked in", tone: "success" }],
                    },
                  },
                ],
              },
            },
          },
        ],
      },
    ],
    stickies: [
      highlight(
        "sticky-swoosh-35",
        "Davidson billed $2 an hour and was paid $35. Knight's verdict: “I don't love it, but it will grow on me.”",
      ),
      highlight(
        "sticky-swoosh-stock",
        "In September 1983 Knight gave her a gold diamond Swoosh ring and 500 shares. After splits: ~32,000 shares, worth about $3M by 2023.",
      ),
      askPrompt(
        "sticky-swoosh-ask",
        "Ask: why did the Onitsuka partnership collapse in 1972?",
      ),
    ],
  },
  {
    key: "waffle",
    title: "The Waffle Sole",
    year: "1974",
    columns: [
      {
        label: "Breakfast, ruined — traction, invented",
        items: [
          youtubeVideo(
            "video-waffle-shoezeum",
            "YgxAKhF9N_o",
            "ShoeZeum Vintage Nike Waffle Trainers That Got Bill Bowerman In The Hall Of Fame",
            "A collector walks through the actual surviving Waffle Trainers, pair by pair.",
          ),
          // Nike's CDN signs its og:image; the bare path 400s, so the query
          // string is part of the URL, not decoration.
          website(
            "site-moon-shoe",
            "https://about.nike.com/en/magazine/nike-moon-shoe-waffle-iron-true-history",
            "From Waffle Iron to World Stage: The True Story of the Nike Moon Shoe",
            "Nike",
            {
              previewImageUrl:
                "https://nmp.about.nike.com/about/prod/d8869967-c53f-4093-b84f-015c29fa25c6/nike-moonshoe-original-dna-group-3.jpg?m=eyJlZGl0cyI6eyJqcGVnIjp7InF1YWxpdHkiOjEwMH0sIndlYnAiOnsicXVhbGl0eSI6MTAwfSwiZXh0cmFjdCI6eyJsZWZ0IjowLCJ0b3AiOjYzLCJ3aWR0aCI6MzAwMCwiaGVpZ2h0IjoxNjg4fSwicmVzaXplIjp7IndpZHRoIjo5MDB9fX0%3D&s=8ef0636e2d1bd7216d241ec801759a80d063bc95af6a2b5147760626ab605516",
              embeddable: true,
            },
          ),
          // history.com sets CSP frame-ancestors with no wildcard ('self',
          // contentful, google) ⇒ our origin is refused. Thumbnail only.
          website(
            "site-waffle-patent",
            "https://www.history.com/this-day-in-history/february-26/nike-patent-waffle-sole-trainers-invented-in-waffle-iron",
            "Nike receives patent for waffle-soled trainers—invented in a waffle iron | February 26, 1974 | HISTORY",
            "HISTORY",
            {
              previewImageUrl:
                "https://res.cloudinary.com/aenetworks/image/upload/c_fill,w_1200,h_630,g_auto/dpr_auto/f_auto/q_auto:eco/v1/GettyImages-2148021118",
              embeddable: false,
            },
          ),
          {
            key: "gallery-waffle",
            payload: {
              type: "images",
              title: "The waffle sole",
              description:
                "The grid that gave a shoe grip on urethane — poured in a kitchen appliance.",
              data: {
                items: [
                  {
                    kind: "image",
                    url: "https://upload.wikimedia.org/wikipedia/commons/2/26/Nike_waffle_soles.png",
                    alt: "Close-up of Nike waffle soles",
                  },
                  {
                    kind: "image",
                    url: "https://upload.wikimedia.org/wikipedia/commons/9/94/Nike_Cortez.jpg",
                    alt: "A Nike Cortez, Bowerman's earlier design",
                  },
                ],
              },
            },
          },
        ],
      },
      {
        label: "Eugene, Oregon — where the shoes were tested",
        items: [
          youtubeVideo(
            "video-prefontaine",
            "RlpbZ6FMzNc",
            "Steve Prefontaine - Glory without a Medal: 1972 Munich Olympic 5000m Final",
            "Bowerman's most famous athlete running the race that made him a legend.",
          ),
          wikipedia(
            "site-bowerman",
            "https://en.wikipedia.org/wiki/Bill_Bowerman",
            "Bill Bowerman - Wikipedia",
            "https://upload.wikimedia.org/wikipedia/commons/0/06/Bill_Bowerman.jpg",
          ),
          wikipedia(
            "site-hayward",
            "https://en.wikipedia.org/wiki/Hayward_Field",
            "Hayward Field - Wikipedia",
            "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6b/The_New_Hayward_Field.jpg/1280px-The_New_Hayward_Field.jpg",
          ),
          {
            key: "streetview-hayward",
            payload: {
              type: "streetview",
              title: "Hayward Field today",
              description:
                "Street View at Hayward Field, Eugene — Bowerman coached here for 24 years",
              data: {
                place: {
                  name: "Hayward Field, 1580 E 15th Ave, Eugene, Oregon",
                  lat: 44.042,
                  lng: -123.071,
                },
                heading: 180,
                pitch: 5,
                fov: 80,
              },
            },
          },
        ],
      },
    ],
    stickies: [
      highlight(
        "sticky-waffle-iron",
        "Bowerman poured urethane into Barbara's waffle iron — a Bersted Model 251, a 1936 wedding gift — and glued it shut forever.",
      ),
      highlight(
        "sticky-waffle-dates",
        "Sources disagree: Wikipedia dates the Waffle Trainer to 1974, Nike's own archive to 1975. The patent grant — Feb 26, 1974 — is the fixed point.",
      ),
      askPrompt(
        "sticky-waffle-ask",
        "Ask: how did Bowerman's shoes change what runners wore?",
      ),
    ],
  },
  {
    key: "air-jordan",
    title: "Air Jordan",
    year: "1984",
    columns: [
      {
        label: "The ad that turned a fine into a franchise",
        items: [
          youtubeVideo(
            "video-banned-ad",
            "ksxsdeRIk0w",
            "Nike's BANNED Air Jordan 1 Commercial (1985)",
            "The original spot: “On October 18th, the NBA threw them out of the game.”",
          ),
          wikipedia(
            "site-air-jordan",
            "https://en.wikipedia.org/wiki/Air_Jordan",
            "Air Jordan - Wikipedia",
            "https://upload.wikimedia.org/wikipedia/en/thumb/3/37/Jumpman_logo.svg/1280px-Jumpman_logo.svg.png",
          ),
          {
            key: "gallery-aj1",
            payload: {
              type: "images",
              title: "Game-worn Air Jordan 1s",
              description: "The black-and-red silhouette that started the argument.",
              data: {
                items: [
                  {
                    kind: "image",
                    url: "https://upload.wikimedia.org/wikipedia/commons/c/c0/Game_Worn_Air_Jordan_1s.jpg",
                    alt: "Game-worn Air Jordan 1 sneakers",
                  },
                ],
              },
            },
          },
        ],
      },
      {
        label: "A rookie, a royalty, and a rounding error that wasn't",
        items: [
          {
            key: "chart-jordan-royalty",
            payload: {
              type: "chart",
              title: "The Royalty Clause, Forty Years On (2022)",
              description:
                "Knight agreed to give Jordan a cut of every sale. In 2022 that cut was up to $256M.",
              data: {
                chartType: "pie",
                slices: [
                  { name: "Jordan Brand revenue", value: 4.84 },
                  { name: "Michael Jordan's royalties", value: 0.26 },
                ],
                unit: "$B",
                source:
                  "Wikipedia: Air Jordan — $5.1B Jordan Brand revenue in 2022, of which $150–256M to Jordan in royalties (upper bound shown)",
              },
            },
          },
          {
            key: "table-jordan-deal",
            payload: {
              type: "table",
              title: "The Deal, October 26, 1984",
              description: "Knight bet the basketball division on one rookie.",
              data: {
                columns: [
                  { key: "term", label: "Term" },
                  { key: "detail", label: "Detail" },
                ],
                rows: [
                  {
                    term: {
                      value: "Contract",
                      tags: [{ label: "$2.5M", tone: "success" }],
                    },
                    detail: "Roughly three times any other endorsement deal in the NBA",
                  },
                  {
                    term: {
                      value: "Royalties",
                      tags: [{ label: "Unheard of", tone: "info" }],
                    },
                    detail: "A cut of every product sold under his name — the industry-disrupting clause",
                  },
                  {
                    term: "Designer",
                    detail: "Peter Moore, with Tinker Hatfield and Bruce Kilgore contributing",
                  },
                  {
                    term: "Public release",
                    detail: "Air Jordan I, April 1, 1985",
                  },
                  {
                    term: {
                      value: "The fine",
                      tags: [{ label: "$5,000", tone: "warning" }],
                    },
                    detail: "Nike paid it every time, then built the campaign around it",
                  },
                ],
              },
            },
          },
        ],
      },
    ],
    stickies: [
      highlight(
        "sticky-jordan-myth",
        "The famous ban is partly myth: sneaker historians say the shoe the NBA actually barred was the black-and-red Air Ship, not the Air Jordan 1.",
      ),
      highlight(
        "sticky-jordan-disputed",
        "The often-quoted “$126M in year one” carries a dispute tag on Wikipedia. What is not disputed: Nike hoped for $3M over three years.",
      ),
      askPrompt(
        "sticky-jordan-ask",
        "Ask: how do athlete royalty deals work now versus 1984?",
      ),
    ],
  },
  {
    key: "just-do-it",
    title: "Just Do It",
    year: "1988",
    columns: [
      {
        label: "Three ads from the year the brand became a verb",
        items: [
          youtubeVideo(
            "video-jdi-first",
            "0yO7xLAGugQ",
            "Nike - Just Do It (1988) - Very first commercial",
            "The first spot ever to carry the line, September 1988.",
          ),
          youtubeVideo(
            "video-walt-stack",
            "glbgPIXEvC0",
            "1988 Nike Air 80-Year-Old Runner Walt Stack Commercial | Just Do It",
            "Walt Stack, 80, running the Golden Gate Bridge — the unlikeliest launch face.",
          ),
          youtubeVideo(
            "video-revolution",
            "cQo-_fGHu1Q",
            "1988 BEATLES “Revolution” ad for NIKE",
            "The first Beatles master licensed for a commercial — and the lawsuit that followed.",
          ),
        ],
      },
      {
        label: "What a three-word slogan was worth",
        items: [
          {
            key: "chart-market-share",
            payload: {
              type: "chart",
              title: "North American Sport-Shoe Market Share",
              description: "The decade the slogan ran, 1988 to 1998.",
              data: {
                chartType: "bar",
                categories: ["1988", "1998"],
                series: [{ name: "Nike share", data: [18, 43] }],
                unit: "%",
                source: "Wikipedia: Just Do It",
              },
            },
          },
          // No og:image on the article — curated: a Nike billboard in the wild.
          wikipedia(
            "site-just-do-it",
            "https://en.wikipedia.org/wiki/Just_Do_It",
            "Just Do It - Wikipedia",
            "https://upload.wikimedia.org/wikipedia/commons/2/20/Nike_Transparent_Billboard_-_Flickr_-_Arturo_de_Albornoz.jpg",
          ),
        ],
      },
    ],
    stickies: [
      highlight(
        "sticky-jdi-gilmore",
        "Dan Wieden built the line from Gary Gilmore's last words before his execution: “Let's do it.”",
      ),
      highlight(
        "sticky-jdi-growth",
        "Across the campaign's first decade Nike's worldwide sales went from $877 million to $9.2 billion.",
      ),
      askPrompt(
        "sticky-jdi-ask",
        "Ask: chart Nike versus Reebok market share through the 1990s.",
      ),
    ],
  },
  {
    key: "reckoning",
    title: "The Reckoning",
    year: "1998",
    columns: [
      {
        label: "Michael Moore takes the question to Knight directly",
        items: [
          youtubeVideo(
            "video-big-one-tickets",
            "28B_sZZ6km4",
            "The Big One (9/10) Movie CLIP - Tickets to Indonesia for Phil Knight (1997) HD",
            "Moore offers Knight two plane tickets to see the Indonesian factories himself.",
          ),
          youtubeVideo(
            "video-big-one-message",
            "ymjvQZ6nSd8",
            "The Big One (10/10) Movie CLIP - Video Message to Nike (1997) HD",
            "The closing exchange — Knight on camera, a year before the Press Club speech.",
          ),
          // No og:image on the article. Curated deliberately: a genuine Nike
          // contract plant (Taekwang Industrial, Vietnam), not a stock photo of
          // some unrelated factory — a generic garment-worker image here would
          // misattribute another company's floor to Nike.
          wikipedia(
            "site-sweatshops",
            "https://en.wikipedia.org/wiki/Nike_sweatshops",
            "Nike sweatshops - Wikipedia",
            "https://upload.wikimedia.org/wikipedia/commons/e/ed/PEB_-_Nike_Shoe_Factory.png",
          ),
        ],
      },
      {
        label: "May 12, 1998 — what he actually promised",
        items: [
          {
            key: "table-pledges",
            payload: {
              type: "table",
              title: "The National Press Club Pledges",
              description:
                "Knight's own list, delivered in Washington on May 12, 1998.",
              data: {
                columns: [
                  { key: "pledge", label: "Pledge" },
                  { key: "detail", label: "Detail" },
                ],
                rows: [
                  {
                    pledge: {
                      value: "Minimum age 18",
                      tags: [{ label: "Footwear", tone: "success" }],
                    },
                    detail: "Raised to 18 in shoe factories, 16 in apparel factories",
                  },
                  {
                    pledge: {
                      value: "US OSHA air quality",
                      tags: [{ label: "All plants", tone: "info" }],
                    },
                    detail: "Every Nike shoe factory to meet US indoor air quality standards",
                  },
                  {
                    pledge: "Independent monitoring",
                    detail: "Expanded external monitoring of supplier factories",
                  },
                  {
                    pledge: {
                      value: "Critics unconvinced",
                      tags: [{ label: "Contested", tone: "danger" }],
                    },
                    detail:
                      "Labour groups called it a weaker agenda than the wage and monitoring demands it displaced",
                  },
                ],
              },
            },
          },
          {
            key: "todo-reckoning-read",
            payload: {
              type: "todo",
              title: "Read the other side",
              description: "The reporting that forced the speech.",
              data: {
                items: [
                  {
                    id: "todo_1",
                    label: "Jeff Ballinger's 1991 report on Indonesian wages",
                    checked: false,
                  },
                  {
                    id: "todo_2",
                    label: "The 1996 Life photo of a boy stitching a Nike football",
                    checked: false,
                  },
                  {
                    id: "todo_3",
                    label: "Tim Connor, 'Still Waiting for Nike To Do It' (2001)",
                    checked: false,
                  },
                  {
                    id: "todo_4",
                    label: "Nike's 2005 decision to publish its supplier factory list",
                    checked: false,
                  },
                ],
              },
            },
          },
        ],
      },
    ],
    stickies: [
      highlight(
        "sticky-reckoning-quote",
        "Knight said it out loud: “The Nike product has become synonymous with slave wages, forced overtime, and arbitrary abuse.”",
      ),
      highlight(
        "sticky-reckoning-nyt",
        "A New York Times editorial said the reforms “set a standard that other companies should match.” Labour groups disagreed.",
      ),
      askPrompt(
        "sticky-reckoning-ask",
        "Ask: what changed in Nike's supply chain after 1998, and what didn't?",
      ),
    ],
  },
  {
    key: "shoe-dog",
    title: "Shoe Dog & the Giving",
    year: "2016",
    columns: [
      {
        label: "The memoir he waited fifty years to write",
        items: [
          youtubeVideo(
            "video-shoe-dog-gma",
            "cSe-qR4f1Ng",
            "Phil Knight Discusses His New Book 'Shoe Dog'",
            "Knight on Good Morning America the month the memoir came out.",
          ),
          wikipedia(
            "site-shoe-dog",
            "https://en.wikipedia.org/wiki/Shoe_Dog",
            "Shoe Dog - Wikipedia",
            "https://upload.wikimedia.org/wikipedia/commons/thumb/d/df/Shoe_dog_book_cover.jpg/960px-Shoe_dog_book_cover.jpg",
          ),
          // archive.org sends no framing headers, so this one is the best card
          // on the canvas: the details page frames its own BookReader, i.e. the
          // memoir is readable in place.
          website(
            "site-shoe-dog-archive",
            "https://archive.org/details/shoedogmemoirbyc0000knig_w1z8",
            "Shoe dog : a memoir by the creator of Nike : Knight, Philip H., 1938- author : Free Download, Borrow, and Streaming : Internet Archive",
            "Internet Archive",
            {
              previewImageUrl:
                "https://archive.org/services/img/shoedogmemoirbyc0000knig_w1z8",
              embeddable: true,
            },
          ),
        ],
      },
      {
        label: "The unfinished dream: end cancer",
        items: [
          // ohsu.edu sends X-Frame-Options: SAMEORIGIN and publishes no
          // og:image — the one card here that can be neither framed nor
          // auto-thumbnailed, so it gets a curated Commons shot of the campus.
          website(
            "site-ohsu-knight",
            "https://www.ohsu.edu/knight-cancer-institute",
            "Cancer Hospital and Treatment Center | Knight Cancer Institute | OHSU",
            "OHSU",
            {
              previewImageUrl:
                "https://upload.wikimedia.org/wikipedia/commons/8/88/OregonHealthSciUniv.jpg",
              embeddable: false,
            },
          ),
          {
            key: "map-ohsu",
            payload: {
              type: "map",
              title: "OHSU, Marquam Hill, Portland",
              description:
                "The hill Knight has given roughly $2.7 billion to — the largest single target of his giving",
              data: {
                place: {
                  name: "Oregon Health & Science University, Portland, Oregon",
                  lat: 45.498917,
                  lng: -122.68875,
                },
                zoom: 14,
              },
            },
          },
          {
            key: "map-nike-hq",
            payload: {
              type: "map",
              title: "Nike World Headquarters, Beaverton",
              description:
                "286 acres and 75+ buildings — the address is One Bowerman Drive",
              data: {
                place: {
                  name: "Nike World Headquarters, Beaverton, Oregon",
                  lat: 45.51056,
                  lng: -122.83194,
                },
                zoom: 14,
              },
            },
          },
          wikipedia(
            "site-phil-knight",
            "https://en.wikipedia.org/wiki/Phil_Knight",
            "Phil Knight - Wikipedia",
            "https://upload.wikimedia.org/wikipedia/commons/0/0a/Phil_Knight_with_Tom_Matthyssens_in_Universal_Studios_Orlando_1999_%28cropped%29.jpg",
          ),
        ],
      },
    ],
    stickies: [
      highlight(
        "sticky-legacy-buffett",
        "Warren Buffett called Shoe Dog “the best book I read last year.” It was ghostwritten with J.R. Moehringer.",
      ),
      highlight(
        "sticky-legacy-challenge",
        "Knight's $500M gift to OHSU in 2013 was a dare: match it in two years or lose it. OHSU matched it on June 25, 2015.",
      ),
      askPrompt(
        "sticky-legacy-ask",
        "Ask: build a timeline of Knight's giving against Nike's share price.",
      ),
    ],
  },
];

/* ------------------------------ Seed cards ------------------------------ */

export const PKNIGHT_SEED_CARD = {
  question:
    "Research Phil Knight, the founder of Nike. Chart the company's revenue over time, and show me the moments that actually made it — with the sources.",
  answer:
    "Knight's arc runs from a 1962 Stanford paper asking whether Japanese shoes could do to Germany what Japanese cameras had, to $46.3 billion of revenue in fiscal 2025. Year one, working out of a Plymouth Valiant, Blue Ribbon Sports sold 1,300 pairs for $8,000. The charts and tables above trace revenue, income, headcount and his giving; the timeline pins fifteen dates. The seven clusters below deep-dive the story: the handshake with Bill Bowerman (1964), the $35 Swoosh (1971), the waffle sole (1974), Michael Jordan (1984), Just Do It (1988), the sweatshop reckoning (1998), and the memoir and the cancer money (2016 onward). Where sources disagree — the Waffle Trainer's year, Air Jordan's first-year sales — the canvas says so rather than picking quietly.",
};
