import type { ArtifactPayload, StickyNoteColorId } from "@/lib/artifactTypes";
import { createWebsitePayload } from "@/lib/websiteArtifact";

/**
 * Researched Henry Ford content for the sample canvas. Produced with the
 * research-canvas skill (v0.2.0) — every YouTube ID verified via oEmbed,
 * every URL fetched and confirmed, every number sourced (July 2026).
 */

export interface SampleArtifactSpec {
  /** Stable id suffix, e.g. "chart-production" → hford-art-chart-production. */
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

const WIKIPEDIA_FAVICON = "https://en.wikipedia.org/static/apple-touch/wikipedia.png";

/**
 * Both `previewImageUrl` and `embeddable` are REQUIRED — nothing enriches a
 * builder-authored website artifact at render time (`/api/link-preview` only
 * runs when a *user* pastes a URL), so an omitted field ships a dead
 * "No preview image" card. `embeddable` replicates `isFrameableFromHeaders`
 * (lib/frameability.ts) against the page's real headers; true ⇒ a live
 * InteractiveWebFrame. See the research-canvas skill's artifact-recipes.md.
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
 * frame-ancestors (verified with a GET, July 2026) ⇒ every Wikipedia card here
 * renders as a live, scrollable page.
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

const MODEL_T_YEARS = [
  "1909", "1910", "1911", "1912", "1913", "1914", "1915", "1916", "1917",
  "1918", "1919", "1920", "1921", "1922", "1923", "1924", "1925", "1926",
  "1927",
];

// Wikipedia: Ford Model T — price and production table (fiscal/calendar years as reported).
const MODEL_T_PRODUCTION = [
  10666, 19050, 34858, 68733, 170211, 202667, 308162, 501462, 735020, 664076,
  498342, 941042, 971610, 1301067, 2011125, 1922048, 1911705, 1554465, 399725,
];

const MODEL_T_TOURING_PRICE = [
  850, 900, 680, 590, 525, 440, 390, 345, 500, 500, 500, 395, 325, 319, 364,
  265, 290, 360, 360,
];

export const HFORD_SUBTITLE =
  "Henry Ford, 1863–1947 — the farm boy who put the world on wheels";

export const HFORD_OVERVIEW_STICKIES: SampleArtifactSpec[] = [
  highlight(
    "sticky-overview-arc",
    "The whole story in two charts: the price fell 69% while output grew 180×.",
  ),
  askPrompt(
    "sticky-overview-ask",
    "Ask: compare Ford and General Motors through the 1930s.",
  ),
];

export const HFORD_OVERVIEW_ROWS: SampleArtifactSpec[][] = [
  [
    {
      key: "chart-production",
      payload: {
        type: "chart",
        title: "Model T Production by Year (1909–1927)",
        description: "From 10,666 cars to two million a year in 14 years.",
        data: {
          chartType: "bar",
          categories: MODEL_T_YEARS,
          series: [{ name: "Units built", data: MODEL_T_PRODUCTION }],
          unit: "units",
          source: "Wikipedia: Ford Model T — price and production table",
        },
      },
    },
    {
      key: "chart-price",
      payload: {
        type: "chart",
        title: "Model T Touring Car Price (1909–1927)",
        description:
          "Mass production drove the price from $850 to $265 — with a WWI bump.",
        data: {
          chartType: "line",
          categories: MODEL_T_YEARS,
          series: [{ name: "Touring car price", data: MODEL_T_TOURING_PRICE }],
          unit: "USD",
          smooth: true,
          source: "Wikipedia: Ford Model T — price and production table",
        },
      },
    },
    {
      key: "chart-market-1918",
      payload: {
        type: "chart",
        title: "Cars on American Roads, 1918",
        description: "One car model. Half the country's cars.",
        data: {
          chartType: "pie",
          slices: [
            { name: "Ford Model T", value: 50 },
            { name: "All other makes", value: 50 },
          ],
          unit: "%",
          source:
            "Wikipedia: Henry Ford — “By 1918, half of all cars in the United States were Model Ts”",
        },
      },
    },
  ],
  [
    {
      key: "table-vehicles",
      payload: {
        type: "table",
        title: "Ford Milestone Vehicles",
        description: "Every machine that moved the story forward.",
        data: {
          columns: [
            { key: "vehicle", label: "Vehicle" },
            { key: "year", label: "Year" },
            { key: "note", label: "Why it mattered" },
          ],
          rows: [
            {
              vehicle: {
                value: "Quadricycle",
                tags: [{ label: "Origin", tone: "info" }],
              },
              year: "1896",
              note: "Ford's first self-propelled vehicle, test-driven June 4, 1896",
            },
            {
              vehicle: "Ford 999 racer",
              year: "1902",
              note: "October race victory with Barney Oldfield made Ford's name",
            },
            {
              vehicle: {
                value: "Model T",
                tags: [{ label: "15M built", tone: "success" }],
              },
              year: "1908",
              note: "15,007,034 built over 19 years — put the world on wheels",
            },
            {
              vehicle: "Ford Trimotor",
              year: "1926",
              note: "Ford takes to the air — 199 built before 1933",
            },
            {
              vehicle: "Model A",
              year: "1927",
              note: "All-new successor to the T, built at River Rouge",
            },
            {
              vehicle: {
                value: "Flathead V8",
                tags: [{ label: "First", tone: "info" }],
              },
              year: "1932",
              note: "First low-price eight-cylinder engine",
            },
          ],
        },
      },
    },
    {
      key: "table-sites",
      payload: {
        type: "table",
        title: "The Ford Empire: Key Sites",
        description: "The places where the century got built.",
        data: {
          columns: [
            { key: "site", label: "Site" },
            { key: "era", label: "Era" },
            { key: "role", label: "Role" },
          ],
          rows: [
            {
              site: {
                value: "Highland Park Plant",
                tags: [{ label: "Assembly line", tone: "success" }],
              },
              era: "1910",
              role: "Birthplace of the moving assembly line (October 7, 1913)",
            },
            {
              site: {
                value: "River Rouge complex",
                tags: [{ label: "Largest", tone: "success" }],
              },
              era: "1917–1928",
              role: "93 buildings, ~100,000 workers at peak — raw ore in, cars out",
            },
            {
              site: "Willow Run",
              era: "1942",
              role: "3.5M sq ft — 6,972 complete B-24s, one every 63 minutes at peak",
            },
            {
              site: {
                value: "Fordlândia, Brazil",
                tags: [{ label: "Abandoned", tone: "danger" }],
              },
              era: "1928",
              role: "2.5M-acre rubber-plantation utopia, abandoned in 1934",
            },
            {
              site: "The Henry Ford, Dearborn",
              era: "Today",
              role: "Museum, Greenfield Village, and the Rouge factory tour",
            },
          ],
        },
      },
    },
  ],
];

export const HFORD_TIMELINE: SampleArtifactSpec = {
  key: "timeline-milestones",
  payload: {
    type: "timeline",
    title: "Henry Ford: Defining Milestones (1863–1947)",
    description: "Fourteen moments that trace the whole arc.",
    data: {
      scale: "year",
      rangeStart: "1861-01-01T00:00:00.000Z",
      rangeEnd: "1949-12-31T23:59:59.999Z",
      events: [
        {
          id: "evt_born",
          at: "1863-07-30T00:00:00.000Z",
          label: "Born in Greenfield Township, Michigan",
          highlight: true,
        },
        {
          id: "evt_quadricycle",
          at: "1896-06-04T00:00:00.000Z",
          label: "Test-drives the Quadricycle through Detroit",
        },
        {
          id: "evt_fmc",
          at: "1903-06-16T00:00:00.000Z",
          label: "Ford Motor Company incorporated with $28,000",
          highlight: true,
        },
        {
          id: "evt_model_t",
          at: "1908-10-01T00:00:00.000Z",
          label: "Model T introduced at $850",
          highlight: true,
        },
        {
          id: "evt_assembly_line",
          at: "1913-10-07T00:00:00.000Z",
          label: "World's first moving assembly line",
          highlight: true,
        },
        {
          id: "evt_five_dollar",
          at: "1914-01-05T00:00:00.000Z",
          label: "$5 day doubles workers' pay",
          highlight: true,
        },
        {
          id: "evt_half_of_cars",
          at: "1918-06-01T00:00:00.000Z",
          label: "Half of all US cars are Model Ts",
        },
        {
          id: "evt_t_ends",
          at: "1927-08-01T00:00:00.000Z",
          label: "Model T ends after 15 million built",
        },
        {
          id: "evt_model_a",
          at: "1927-12-01T00:00:00.000Z",
          label: "Model A launches from River Rouge",
        },
        {
          id: "evt_fordlandia",
          at: "1928-06-01T00:00:00.000Z",
          label: "Fordlândia founded in the Amazon",
        },
        {
          id: "evt_museum",
          at: "1929-10-21T00:00:00.000Z",
          label: "The Henry Ford museum dedicated",
        },
        {
          id: "evt_v8",
          at: "1932-03-01T00:00:00.000Z",
          label: "Flathead V8 brings power to the masses",
        },
        {
          id: "evt_willow_peak",
          at: "1944-04-01T00:00:00.000Z",
          label: "Willow Run peaks: 428 bombers monthly",
        },
        {
          id: "evt_death",
          at: "1947-04-07T00:00:00.000Z",
          label: "Dies at Fair Lane, aged 83",
          highlight: true,
        },
      ],
    },
  },
};

/* ------------------------------ Era clusters ------------------------------ */

export const HFORD_ERAS: SampleEra[] = [
  {
    key: "origins",
    title: "Origins",
    year: "1896",
    columns: [
      {
        label: "4 a.m., June 4, 1896 — the first drive",
        items: [
          youtubeVideo(
            "video-quadricycle-first-run",
            "GAq8Aa_vaXY",
            "June 4, 1896: The Quadricycle's First Run — Ford's First Car Comes Alive",
            "The pre-dawn first drive from the Bagley Avenue shed, retold.",
          ),
          youtubeVideo(
            "video-quadricycle-history",
            "UEtnJ7eU7xc",
            "History of Henry Ford's Quadricycle | The Henry Ford's Innovation Nation",
            "The Henry Ford's own curators on the original machine.",
          ),
          {
            key: "gallery-quadricycle",
            payload: {
              type: "images",
              title: "The Quadricycle",
              description:
                "Two cylinders, four horsepower, 20 mph, no reverse gear.",
              data: {
                items: [
                  {
                    kind: "image",
                    url: "https://upload.wikimedia.org/wikipedia/commons/a/a3/FordQuadricycle.jpg",
                    alt: "The 1896 Ford Quadricycle",
                  },
                ],
              },
            },
          },
        ],
      },
      {
        label: "Two failed companies before the one that stuck",
        items: [
          {
            key: "table-origins-bets",
            payload: {
              type: "table",
              title: "Bets Before the Big One",
              description: "Seven years of failures between first car and Ford Motor Company.",
              data: {
                columns: [
                  { key: "year", label: "Year" },
                  { key: "venture", label: "Venture" },
                  { key: "outcome", label: "Outcome" },
                ],
                rows: [
                  {
                    year: "1896",
                    venture: {
                      value: "Quadricycle",
                      tags: [{ label: "First sale", tone: "info" }],
                    },
                    outcome: "Sold for $200 to Charles Ainsley",
                  },
                  {
                    year: "1899",
                    venture: {
                      value: "Detroit Automobile Company",
                      tags: [{ label: "Failed", tone: "danger" }],
                    },
                    outcome: "Ford's first company — founded August 5, folded",
                  },
                  {
                    year: "1901",
                    venture: {
                      value: "Henry Ford Company",
                      tags: [{ label: "Left", tone: "warning" }],
                    },
                    outcome: "Established November 30; Ford soon walked away",
                  },
                  {
                    year: "1902",
                    venture: {
                      value: "Ford 999 racer",
                      tags: [{ label: "Breakthrough", tone: "success" }],
                    },
                    outcome: "October race win with Barney Oldfield made the name",
                  },
                  {
                    year: "1903",
                    venture: {
                      value: "Ford Motor Company",
                      tags: [{ label: "The one", tone: "success" }],
                    },
                    outcome: "Incorporated June 16 with $28,000 capital",
                  },
                ],
              },
            },
          },
          wikipedia(
            "site-quadricycle-wiki",
            "https://en.wikipedia.org/wiki/Ford_Quadricycle",
            "Ford Quadricycle - Wikipedia",
            "https://upload.wikimedia.org/wikipedia/commons/a/a3/FordQuadricycle.jpg",
          ),
        ],
      },
    ],
    stickies: [
      highlight(
        "sticky-origins-price",
        "Ford sold the Quadricycle for $200 — and later bought it back for $60.",
      ),
      askPrompt(
        "sticky-origins-ask",
        "Ask: what happened to Ford's first two companies?",
      ),
    ],
  },
  {
    key: "model-t",
    title: "Model T",
    year: "1908",
    columns: [
      {
        label: "Watch original footage from the road",
        items: [
          youtubeVideo(
            "video-t-driving",
            "dUQVfUr-SC8",
            "Ford Model T – Historic Driving Footage",
            "Period driving footage of the T in its natural habitat.",
          ),
          youtubeVideo(
            "video-t-1925",
            "I3fg8PgOovI",
            "Ford Model T Historic Footage (1925)",
            "1925 reels: shopping trips, hill climbs, and the ten-million celebration.",
          ),
          {
            key: "gallery-model-t",
            payload: {
              type: "images",
              title: "The Model T in pictures",
              description: "The 1925 touring car, and the man who priced it for everyone.",
              data: {
                items: [
                  {
                    kind: "image",
                    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/12/1925_Ford_Model_T_touring.jpg/960px-1925_Ford_Model_T_touring.jpg",
                    alt: "1925 Ford Model T touring car",
                  },
                  {
                    kind: "image",
                    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/27/Henry_Ford_portrait_1915_original_%283x4_cropped%29.png/960px-Henry_Ford_portrait_1915_original_%283x4_cropped%29.png",
                    alt: "Henry Ford, 1915 portrait",
                  },
                ],
              },
            },
          },
        ],
      },
      {
        label: "Start with the canon",
        items: [
          wikipedia(
            "site-model-t-wiki",
            "https://en.wikipedia.org/wiki/Ford_Model_T",
            "Ford Model T - Wikipedia",
            "https://upload.wikimedia.org/wikipedia/commons/thumb/1/12/1925_Ford_Model_T_touring.jpg/960px-1925_Ford_Model_T_touring.jpg",
          ),
          wikipedia(
            "site-henry-ford-wiki",
            "https://en.wikipedia.org/wiki/Henry_Ford",
            "Henry Ford - Wikipedia",
            "https://upload.wikimedia.org/wikipedia/commons/thumb/2/27/Henry_Ford_portrait_1915_original_%283x4_cropped%29.png/960px-Henry_Ford_portrait_1915_original_%283x4_cropped%29.png",
          ),
          youtubeVideo(
            "video-ford-archival",
            "aESfJJmdOsU",
            "1914-1921: The Technological Leap That Ended the Age of Distance. Henry Ford's Rare Archival Footage",
            "Rare archival footage of Ford and his world, 1914–1921.",
          ),
        ],
      },
    ],
    stickies: [
      askPrompt(
        "sticky-model-t-ask",
        "Ask: chart Model T revenue over time.",
      ),
      highlight(
        "sticky-model-t-half",
        "By 1918, half of all cars in America were Model Ts.",
      ),
    ],
  },
  {
    key: "assembly-line",
    title: "Assembly Line & $5 Day",
    year: "1913",
    columns: [
      {
        label: "728 minutes per chassis becomes 93",
        items: [
          youtubeVideo(
            "video-line-1919",
            "Pf8d4NE8XPw",
            "Ford Model T Assembly Line (1919)",
            "Ford's own 1919 documentation of the line at Highland Park.",
          ),
          youtubeVideo(
            "video-line-93min",
            "orIQrQCSybU",
            "12 Hours to 93 Minutes: Ford's Assembly Line Breakthrough | Today in History (1913)",
            "How twelve hours of chassis work collapsed into 93 minutes.",
          ),
          {
            key: "gallery-assembly-line",
            payload: {
              type: "images",
              title: "Highland Park, 1913",
              description: "The first moving assembly line, photographed the year it started.",
              data: {
                items: [
                  {
                    kind: "image",
                    url: "https://upload.wikimedia.org/wikipedia/commons/2/29/Ford_assembly_line_-_1913.jpg",
                    alt: "Ford assembly line at Highland Park, 1913",
                  },
                ],
              },
            },
          },
        ],
      },
      {
        label: "The plant on Woodward Avenue today",
        items: [
          {
            key: "chart-assembly-time",
            payload: {
              type: "chart",
              title: "Chassis Assembly Time at Highland Park",
              description: "The single most famous productivity jump in industrial history.",
              data: {
                chartType: "bar",
                categories: ["Before the line (1913)", "Moving line (1914)"],
                series: [{ name: "Minutes per chassis", data: [728, 93] }],
                unit: "minutes",
                source: "Wikipedia: Highland Park Ford Plant",
              },
            },
          },
          {
            key: "chart-turnover",
            payload: {
              type: "chart",
              title: "Worker Turnover After the $5 Day",
              description: "Double the pay, and people stop leaving.",
              data: {
                chartType: "bar",
                categories: ["1913", "1915"],
                series: [{ name: "Annual turnover", data: [31.9, 1.4] }],
                unit: "%",
                source: "Wikipedia: Highland Park Ford Plant",
              },
            },
          },
          wikipedia(
            "site-highland-park-wiki",
            "https://en.wikipedia.org/wiki/Highland_Park_Ford_Plant",
            "Highland Park Ford Plant - Wikipedia",
            "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2c/Farm_Mechanics_1922_Ford_Highland_Park_cropped.png/1280px-Farm_Mechanics_1922_Ford_Highland_Park_cropped.png",
          ),
          {
            key: "streetview-highland-park",
            payload: {
              type: "streetview",
              title: "Highland Park Plant today",
              description:
                "Street View at 91 Manchester Street and Woodward Avenue, Highland Park, Michigan",
              data: {
                place: {
                  name: "91 Manchester St, Highland Park, Michigan",
                  lat: 42.4105,
                  lng: -83.0996,
                },
                heading: 90,
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
        "sticky-line-turnover",
        "Turnover collapsed from 31.9% to 1.4% once Ford paid $5 a day.",
      ),
      askPrompt(
        "sticky-line-ask",
        "Ask: what could $5 a day buy in 1914?",
      ),
    ],
  },
  {
    key: "river-rouge",
    title: "River Rouge",
    year: "1927",
    columns: [
      {
        label: "Tour the plant in 1939",
        items: [
          youtubeVideo(
            "video-rouge-tour",
            "T0xH3c9Lvkg",
            "Ford Factory Tour Through The Rouge Plant (1939) - CharlieDeanArchives / Archival Footage",
            "A 1939 walk through the Rouge, from National Archives film.",
          ),
          youtubeVideo(
            "video-rouge-history",
            "uiZZUXedwGI",
            "FORD RIVER ROUGE PLANT — Official 1939 Plant History (Corporate Archives Documentary)",
            "Ford's official 1939 corporate history of the plant.",
          ),
          website(
            "site-rouge-archive",
            "https://archive.org/details/xd-31051-ford-motor-company-1920s-1930s-footage-mos-vwr",
            "Ford Motor Co. 1920s–1940s footage: the twenty-millionth car, Rouge assembly line",
            "Internet Archive",
            {
              faviconUrl: "https://archive.org/favicon.ico",
              previewImageUrl:
                "https://archive.org/download/xd-31051-ford-motor-company-1920s-1930s-footage-mos-vwr/xd-31051-ford-motor-company-1920s-1930s-footage-mos-vwr.thumbs/XD31051%20Ford%20Motor%20Company%201920s-1930s%20Footage_mos_vwr_000027.jpg",
              // archive.org sends no framing headers — the details page frames
              // its own player, so the footage is watchable in place.
              embeddable: true,
            },
          ),
          // thehenryford.org sets CSP frame-ancestors with no wildcard ('self',
          // doublethedonation, docebosaas) and publishes no og:image, so all
          // three of its cards need a curated thumbnail and cannot be framed.
          website(
            "site-henry-ford-museum",
            "https://www.thehenryford.org/",
            "The Henry Ford — Museum, Greenfield Village & Rouge Factory",
            "The Henry Ford",
            {
              previewImageUrl:
                "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c4/The_Henry_Ford_Museum_%2853623974456%29.jpg/1280px-The_Henry_Ford_Museum_%2853623974456%29.jpg",
              embeddable: false,
            },
          ),
        ],
      },
      {
        label: "Raw ore in, cars out",
        items: [
          {
            key: "map-rouge",
            payload: {
              type: "map",
              title: "Ford River Rouge complex",
              description:
                "1.5 miles wide by 1 mile long — the largest integrated factory of its era, Dearborn, Michigan",
              data: {
                place: {
                  name: "Ford River Rouge complex, Dearborn, Michigan",
                  lat: 42.305,
                  lng: -83.165,
                },
                zoom: 14,
              },
            },
          },
          wikipedia(
            "site-rouge-wiki",
            "https://en.wikipedia.org/wiki/Ford_River_Rouge_complex",
            "Ford River Rouge complex - Wikipedia",
            "https://upload.wikimedia.org/wikipedia/commons/thumb/7/75/Ford_Dearborn_Factory_Aerial_%2845574999515%29.jpg/1280px-Ford_Dearborn_Factory_Aerial_%2845574999515%29.jpg",
          ),
          website(
            "site-rouge-factory-tour",
            "https://www.thehenryford.org/visit/ford-rouge-factory-tour/",
            "Ford Rouge Factory Tour — The Henry Ford",
            "The Henry Ford",
            {
              previewImageUrl:
                "https://upload.wikimedia.org/wikipedia/commons/thumb/7/75/Ford_Dearborn_Factory_Aerial_%2845574999515%29.jpg/1280px-Ford_Dearborn_Factory_Aerial_%2845574999515%29.jpg",
              embeddable: false,
            },
          ),
          {
            key: "gallery-rouge",
            payload: {
              type: "images",
              title: "The Rouge from above",
              description: "Ninety-three buildings on 900 landmarked acres.",
              data: {
                items: [
                  {
                    kind: "image",
                    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/75/Ford_Dearborn_Factory_Aerial_%2845574999515%29.jpg/1280px-Ford_Dearborn_Factory_Aerial_%2845574999515%29.jpg",
                    alt: "Aerial view of the Ford River Rouge complex",
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
        "sticky-rouge-scale",
        "93 buildings, ~100,000 workers — the largest integrated factory on earth.",
      ),
      askPrompt(
        "sticky-rouge-ask",
        "Ask: map the Rouge's supply chain from ore to automobile.",
      ),
    ],
  },
  {
    key: "fordlandia",
    title: "Fordlândia",
    year: "1928",
    columns: [
      {
        label: "The dream the jungle took back",
        items: [
          youtubeVideo(
            "video-fordlandia-story",
            "MsrM-kBAhvA",
            "The Crazy Story of Fordlandia: Henry Ford's Failed Utopia in the Amazon Rainforest",
            "The full arc of Ford's Amazon utopia — and why it failed.",
          ),
          youtubeVideo(
            "video-fordlandia-inside",
            "b7nnmZWC8_E",
            "Inside Henry Ford's Failed Amazon City | Rise And Fall",
            "Inside the abandoned town as it stands today.",
          ),
        ],
      },
      {
        label: "2.5 million acres on the Tapajós",
        items: [
          {
            key: "map-fordlandia",
            payload: {
              type: "map",
              title: "Fordlândia, Pará, Brazil",
              description:
                "Ford's 2.5-million-acre rubber-plantation town on the Tapajós river — abandoned in 1934",
              data: {
                place: {
                  name: "Fordlândia, Aveiro, Pará, Brazil",
                  lat: -3.83139,
                  lng: -55.4975,
                },
                zoom: 13,
              },
            },
          },
          wikipedia(
            "site-fordlandia-wiki",
            "https://en.wikipedia.org/wiki/Fordl%C3%A2ndia",
            "Fordlândia - Wikipedia",
            "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d5/Fordlandia.JPG/1280px-Fordlandia.JPG",
          ),
          {
            key: "gallery-fordlandia",
            payload: {
              type: "images",
              title: "Fordlândia today",
              description: "The water tower still stands; the rubber never came.",
              data: {
                items: [
                  {
                    kind: "image",
                    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d5/Fordlandia.JPG/1280px-Fordlandia.JPG",
                    alt: "Water tower and warehouse ruins at Fordlândia",
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
        "sticky-fordlandia-loss",
        "Abandoned in 1934 — sold back to Brazil at a loss of over $20M.",
      ),
      askPrompt(
        "sticky-fordlandia-ask",
        "Ask: build a timeline of Fordlândia's rise and fall.",
      ),
    ],
  },
  {
    key: "willow-run",
    title: "Willow Run",
    year: "1941",
    columns: [
      {
        label: "The arsenal of democracy",
        items: [
          youtubeVideo(
            "video-willow-story",
            "p2zukteYbGQ",
            "BUILDING THE B-24 BOMBER DURING WWII — Story of Willow Run",
            "Ford's own WWII film on building the B-24, narrated by Harry Wismer.",
          ),
          youtubeVideo(
            "video-willow-innovation",
            "zWAWuTlUpO4",
            "Willow Run B-24 Bombers | The Henry Ford's Innovation Nation",
            "A short on how car-making logic built a bomber an hour.",
          ),
          {
            key: "gallery-willow-run",
            payload: {
              type: "images",
              title: "B-24s at Willow Run",
              description: "The mile-long line, photographed in wartime.",
              data: {
                items: [
                  {
                    kind: "image",
                    url: "https://upload.wikimedia.org/wikipedia/commons/9/91/B-24_bomber_at_Willow_Run.jpg",
                    alt: "B-24 Liberator bombers under construction at Willow Run",
                  },
                ],
              },
            },
          },
        ],
      },
      {
        label: "A bomber every 63 minutes",
        items: [
          {
            key: "chart-b24",
            payload: {
              type: "chart",
              title: "Who Built the 18,482 B-24 Liberators",
              description: "One Ford plant built more than a third of every B-24 ever made.",
              data: {
                chartType: "pie",
                slices: [
                  { name: "Ford Willow Run", value: 6972 },
                  { name: "All other plants", value: 11510 },
                ],
                unit: "aircraft",
                source: "Wikipedia: Willow Run",
              },
            },
          },
          wikipedia(
            "site-willow-wiki",
            "https://en.wikipedia.org/wiki/Willow_Run",
            "Willow Run - Wikipedia",
            "https://upload.wikimedia.org/wikipedia/commons/9/91/B-24_bomber_at_Willow_Run.jpg",
          ),
          {
            key: "map-willow-run",
            payload: {
              type: "map",
              title: "Willow Run, Ypsilanti Township",
              description:
                "3.5 million square feet; the Yankee Air Museum preserves a corner of it today",
              data: {
                place: {
                  name: "Willow Run, Ypsilanti Township, Michigan",
                  lat: 42.241,
                  lng: -83.551,
                },
                zoom: 13,
              },
            },
          },
        ],
      },
    ],
    stickies: [
      highlight(
        "sticky-willow-rate",
        "42,500 workers on a mile-long line — a B-24 every 63 minutes, 24 hours a day.",
      ),
      askPrompt(
        "sticky-willow-ask",
        "Ask: how did Rosie the Riveter change Willow Run?",
      ),
    ],
  },
  {
    key: "legacy",
    title: "The Legacy",
    year: "Today",
    columns: [
      {
        label: "Ride the past today",
        items: [
          youtubeVideo(
            "video-legacy-model-t-ride",
            "ZcTMPfweuN8",
            "Model T Ride in Greenfield Village",
            "Riding a restored Model T through Greenfield Village.",
          ),
          youtubeVideo(
            "video-legacy-museum-tour",
            "6Na80eKCJRU",
            "Tour The Henry Ford Museum of American Innovation & Greenfield Village - Dearborn, Michigan",
            "A full walkthrough of the museum and village as they are now.",
          ),
        ],
      },
      {
        label: "Plan the pilgrimage",
        items: [
          {
            key: "todo-see-it",
            payload: {
              type: "todo",
              title: "See it in person",
              description: "Everything on this canvas you can still stand next to.",
              data: {
                items: [
                  {
                    id: "todo_1",
                    label: "Ride a restored Model T at Greenfield Village",
                    checked: false,
                  },
                  {
                    id: "todo_2",
                    label: "Find the original 1896 Quadricycle in the museum",
                    checked: false,
                  },
                  {
                    id: "todo_3",
                    label: "Take the Ford Rouge Factory Tour bus",
                    checked: false,
                  },
                  {
                    id: "todo_4",
                    label: "See the Rosa Parks bus in American Innovation",
                    checked: false,
                  },
                ],
              },
            },
          },
          wikipedia(
            "site-thf-wiki",
            "https://en.wikipedia.org/wiki/The_Henry_Ford",
            "The Henry Ford - Wikipedia",
            "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c4/The_Henry_Ford_Museum_%2853623974456%29.jpg/1280px-The_Henry_Ford_Museum_%2853623974456%29.jpg",
          ),
          website(
            "site-greenfield-village",
            "https://www.thehenryford.org/visit/venues/greenfield-village",
            "Greenfield Village — The Henry Ford",
            "The Henry Ford",
            {
              previewImageUrl:
                "https://upload.wikimedia.org/wikipedia/commons/2/2d/Smiths_Creek_Railroad_Depot%2C_Greenfield_Village%2C_Oakwood_Boulevard%2C_Fairlane%2C_Dearborn%2C_MI.jpg",
              embeddable: false,
            },
          ),
          {
            key: "map-thf",
            payload: {
              type: "map",
              title: "The Henry Ford, Dearborn",
              description:
                "Museum, Greenfield Village, and the Rouge tour — about 1.7M visitors a year",
              data: {
                place: {
                  name: "The Henry Ford, Dearborn, Michigan",
                  lat: 42.30361,
                  lng: -83.23417,
                },
                zoom: 15,
              },
            },
          },
        ],
      },
    ],
    stickies: [
      highlight(
        "sticky-legacy-museum",
        "1.7M visitors a year at the largest indoor-outdoor museum complex in the US.",
      ),
      askPrompt(
        "sticky-legacy-ask",
        "Ask: plan a one-day visit to The Henry Ford.",
      ),
    ],
  },
];

/* ------------------------------ Seed cards ------------------------------ */

export const HFORD_SEED_CARD = {
  question:
    "Chart Ford's Model T production by year, and put the price of a touring car next to it. How did Henry Ford scale from a workshop to half the cars in America?",
  answer:
    "Production scaled from 10,666 cars in 1909 to over 2 million in 1923 while the touring car's price fell from $850 to $265 — the moving assembly line (1913) and the $5 day (1914) did the heavy lifting. By 1918 half of all cars in the US were Model Ts. The charts, tables, and timeline on this canvas trace that arc, and the seven clusters deep-dive the story from the 1896 Quadricycle to the museum that keeps it all today.",
};
