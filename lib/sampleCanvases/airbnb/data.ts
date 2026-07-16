import type { ArtifactPayload, StickyNoteColorId } from "@/lib/artifactTypes";
import type { SampleChapter, SampleDistrict } from "@/lib/sampleCanvases/companyLayout";
import type { SampleArtifactSpec } from "@/lib/sampleCanvases/specTypes";
import { createWebsitePayload } from "@/lib/websiteArtifact";

/**
 * Researched Airbnb content for the sample canvas. Produced with the
 * company-canvas skill (v0.1.0), July 2026.
 *
 * **Every figure below comes from the filing itself** — SEC EDGAR CIK 1559720,
 * pulled via the XBRL company-concept API and the 10-K text, never from an
 * aggregator and never from memory. Every YouTube id verified via oEmbed (the
 * titles here are the ones oEmbed returned), every URL fetched for its real
 * framing headers, every og:image confirmed to load, every coordinate geocoded.
 *
 * Two numbers on this canvas would lie without their annotation, and both carry
 * a Highlight saying so:
 *   - 2023 net income ($4.792B) includes a $2.9B deferred-tax valuation
 *     allowance release (total tax benefit $2.690B, effective rate −128%).
 *   - 2020 net loss (−$4.585B) includes $2.8B of stock-based compensation from
 *     RSUs vesting at the IPO — the crater is not purely COVID.
 */

const WIKIPEDIA_FAVICON =
  "https://en.wikipedia.org/static/apple-touch/wikipedia.png";

/** Sourced to the filing that reports the figure, per the skill's `source` rule. */
const SRC_10K_MULTI =
  "Airbnb 10-K filings FY2021–FY2025 (SEC EDGAR, CIK 1559720)";
const SRC_10K_2025 = "Airbnb 10-K FY2025 (SEC accession 0001559720-26-000004)";
const SRC_10K_2023 = "Airbnb 10-K FY2023 (SEC accession 0001559720-24-000006)";
const SRC_10K_2021 = "Airbnb 10-K FY2021 (SEC accession 0001559720-22-000006)";
const SRC_10K_2020 = "Airbnb 10-K FY2020 (SEC accession 0001559720-21-000010)";

/**
 * Both `previewImageUrl` and `embeddable` are REQUIRED — nothing enriches a
 * builder-authored website artifact at render time (`/api/link-preview` only
 * runs when a *user* pastes a URL), so an omitted field ships a dead
 * "No preview image" card. `embeddable` replicates `isFrameableFromHeaders`
 * (lib/frameability.ts) against the page's real headers.
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
 * en.wikipedia.org articles send no X-Frame-Options and no CSP frame-ancestors
 * (verified with a GET, July 2026) ⇒ every Wikipedia card here renders as a
 * live, scrollable page. Each `previewImageUrl` is the article's own og:image
 * (Wikimedia Commons), confirmed to return 200.
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

/** `title` is the title oEmbed returned for the id — not a guess. */
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
  return { key, payload: { type: "stickynote", title, data: { text, colorId } } };
}

/** A sourced fact worth calling out. */
const highlight = (key: string, text: string): SampleArtifactSpec =>
  sticky(key, "Highlight", text, "chalk");

/** A question the reader can pose to the canvas AI to keep digging. */
const askPrompt = (key: string, text: string): SampleArtifactSpec =>
  sticky(key, "Try asking", text, "turbo");

const chart = (
  key: string,
  title: string,
  data: Extract<ArtifactPayload, { type: "chart" }>["data"],
  description?: string,
): SampleArtifactSpec => ({
  key,
  payload: { type: "chart", title, description, data },
});

const table = (
  key: string,
  title: string,
  data: Extract<ArtifactPayload, { type: "table" }>["data"],
  description?: string,
): SampleArtifactSpec => ({
  key,
  payload: { type: "table", title, description, data },
});

const FISCAL_YEARS = ["2019", "2020", "2021", "2022", "2023", "2024", "2025"];

/* ------------------------------------------------------------------ */
/* Seed card + subtitle                                                */
/* ------------------------------------------------------------------ */

export const ABNB_SEED_CARD = {
  question: "Research Airbnb — the money, the growth, and what Chesky learned.",
  answer:
    "Airbnb turned three air mattresses in a San Francisco apartment into a public company worth billions. This canvas reads it three ways: what the SEC filings actually say, how it got big, and what its founder wrote down along the way. Every number here comes from a 10-K.",
};

export const ABNB_SUBTITLE =
  "Airbnb (2007–2025) read through three lenses: the filings, the growth, and the founder's own words. Every figure sourced to SEC EDGAR, CIK 1559720.";

/* ------------------------------------------------------------------ */
/* Scoreboard                                                          */
/* ------------------------------------------------------------------ */

const chartRevenue = chart(
  "chart-revenue",
  "Revenue, 2019–2025",
  {
    chartType: "bar",
    categories: FISCAL_YEARS,
    series: [
      { name: "Revenue", data: [4.805, 3.378, 5.992, 8.399, 9.917, 11.102, 12.241] },
    ],
    unit: "$B",
    source: SRC_10K_MULTI,
  },
  "Revenue collapsed 30% in 2020 and has grown every year since, reaching $12.2B in 2025.",
);

const chartNetIncome = chart(
  "chart-net-income",
  "Net income / (loss), 2019–2025",
  {
    chartType: "bar",
    categories: FISCAL_YEARS,
    series: [
      { name: "Net income", data: [-0.674, -4.585, -0.352, 1.893, 4.792, 2.648, 2.511] },
    ],
    unit: "$B",
    source: SRC_10K_MULTI,
  },
  "Read this one with the two Highlights: 2020 and 2023 both contain large one-time items.",
);

const chartNights = chart(
  "chart-nights",
  "Nights booked, 2019–2025",
  {
    chartType: "area",
    categories: FISCAL_YEARS,
    series: [
      { name: "Nights booked", data: [326.9, 193.2, 300.6, 393.7, 448.2, 492, 533] },
    ],
    unit: "M",
    source: SRC_10K_MULTI,
    smooth: false,
  },
  "Called 'Nights and Experiences Booked' through 2023 and 'Nights and Seats Booked' from 2024.",
);

const chartGbv = chart(
  "chart-gbv",
  "Gross Booking Value, 2019–2025",
  {
    chartType: "area",
    categories: FISCAL_YEARS,
    series: [
      { name: "GBV", data: [37.963, 23.897, 46.877, 63.212, 73.252, 81.784, 91.273] },
    ],
    unit: "$B",
    source: SRC_10K_MULTI,
    smooth: false,
  },
  "The dollar value booked on the platform — a leading indicator of revenue, which is recognised at check-in.",
);

const tableKeyMetrics = table(
  "table-key-metrics",
  "The scoreboard, FY2025",
  {
    columns: [
      { key: "metric", label: "Metric" },
      { key: "y2024", label: "2024" },
      { key: "y2025", label: "2025" },
      { key: "change", label: "Change" },
    ],
    rows: [
      {
        metric: "Revenue",
        y2024: "$11,102M",
        y2025: "$12,241M",
        change: { value: "+10%", tags: [{ label: "Growth", tone: "success" }] },
      },
      {
        metric: "Net income",
        y2024: "$2,648M",
        y2025: "$2,511M",
        change: { value: "−5%", tags: [{ label: "Comp + marketing", tone: "warning" }] },
      },
      { metric: "Nights and Seats Booked", y2024: "492M", y2025: "533M", change: "+8%" },
      { metric: "Gross Booking Value", y2024: "$81,784M", y2025: "$91,273M", change: "+12%" },
      {
        metric: "Free Cash Flow",
        y2024: "$4,484M",
        y2025: "$4,613M",
        change: { value: "+3%", tags: [{ label: "38% margin", tone: "info" }] },
      },
      { metric: "Cash from operations", y2024: "$4,518M", y2025: "$4,646M", change: "+3%" },
    ],
  },
  `Source: ${SRC_10K_2025}.`,
);

export const ABNB_SCOREBOARD_ROWS: SampleArtifactSpec[][] = [
  [chartRevenue, chartNetIncome, chartNights],
  [tableKeyMetrics, chartGbv],
];

export const ABNB_SCOREBOARD_STICKIES: SampleArtifactSpec[] = [
  highlight(
    "hl-tax-2023",
    "2023 net income of $4.79B is not 2.5× the business of 2024. It includes the release of $2.9B of deferred-tax valuation allowance — the FY2023 10-K reports a tax BENEFIT of $2,690M and an effective rate of −128%. Strip it out and 2023 is ~$2.1B, so 2024's $2.65B was growth, not a halving.",
  ),
  askPrompt(
    "ask-scoreboard",
    "Ask: rebuild the net income chart with the 2023 tax release and the 2020 IPO stock comp removed, so the underlying business is visible.",
  ),
];

export const ABNB_TIMELINE: SampleArtifactSpec = {
  key: "timeline-airbnb",
  payload: {
    type: "timeline",
    title: "Airbnb, 2007–2025",
    description:
      "Founding dates from Wikipedia; every financial and offering date from the 10-K that reports it.",
    data: {
      scale: "year",
      rangeStart: "2007-01-01",
      rangeEnd: "2025-12-31",
      events: [
        {
          id: "abnb-tl-airbeds",
          at: "2007-10-01",
          label: "Two roommates rent three air mattresses during a conference",
          highlight: true,
        },
        {
          id: "abnb-tl-nate",
          at: "2008-02-01",
          label: "Nathan Blecharczyk joins as third co-founder and CTO",
        },
        {
          id: "abnb-tl-launch",
          at: "2008-08-11",
          label: "Airbedandbreakfast.com launches",
          highlight: true,
        },
        {
          id: "abnb-tl-cereal",
          at: "2008-08-25",
          label: "Obama O's cereal raises $30,000 for the company",
        },
        {
          id: "abnb-tl-yc",
          at: "2009-01-01",
          label: "Y Combinator winter batch: $20,000 for 6%",
          highlight: true,
        },
        {
          id: "abnb-tl-rename",
          at: "2009-03-01",
          label: "Name shortened to Airbnb.com",
        },
        {
          id: "abnb-tl-sequoia",
          at: "2009-04-01",
          label: "Sequoia Capital invests $600,000 in seed money",
          highlight: true,
        },
        {
          id: "abnb-tl-covid",
          at: "2020-05-05",
          label: "Chesky's letter cuts nearly 1,900 jobs, about 25%",
          highlight: true,
        },
        {
          id: "abnb-tl-trading",
          at: "2020-12-10",
          label: "Class A common stock begins trading on Nasdaq",
          highlight: true,
        },
        {
          id: "abnb-tl-ipo",
          at: "2020-12-14",
          label: "IPO completes: 55 million shares at $68.00",
        },
        {
          id: "abnb-tl-tax",
          at: "2023-12-31",
          label: "Airbnb releases $2.9B deferred tax valuation allowance",
        },
        {
          id: "abnb-tl-2025",
          at: "2025-12-31",
          label: "Revenue $12.2B on 533 million nights and seats",
        },
      ],
    },
  },
};

/* ------------------------------------------------------------------ */
/* Districts                                                           */
/* ------------------------------------------------------------------ */

/**
 * A pie, not a table: "where does the revenue come from" is a composition
 * question, and four parts summing to a whole is exactly what a pie is for. The
 * 2024 comparison and the per-region growth rates the table used to carry live
 * in the `hl-money-regional` Highlight beside it — the shape belongs in the
 * chart, the trend belongs in the annotation.
 */
const chartRevenueRegion = chart(
  "chart-revenue-region",
  "Where the revenue comes from, FY2025",
  {
    chartType: "pie",
    slices: [
      { name: "North America", value: 5196 },
      { name: "EMEA", value: 4729 },
      { name: "Latin America", value: 1160 },
      { name: "Asia Pacific", value: 1156 },
    ],
    unit: "$M",
    source: SRC_10K_2025,
  },
  "Revenue is attributed to the location of the host's listing. Totals $12,241M.",
);

const wikiAirbnb = wikipedia(
  "wiki-airbnb",
  "https://en.wikipedia.org/wiki/Airbnb",
  "Airbnb - Wikipedia",
  "https://upload.wikimedia.org/wikipedia/commons/thumb/2/25/888_Brannan%2C_San_Francisco%2C_2016.jpg/1280px-888_Brannan%2C_San_Francisco%2C_2016.jpg",
);

const districtMoney: SampleDistrict = {
  key: "money",
  label: "THE MONEY",
  subtitle: "What the filings actually say — read the way an investor reads them",
  lens: "public",
  clusters: [
    {
      key: "filings",
      title: "The filings",
      columns: [
        { label: "Start at the primary source", items: [wikiAirbnb] },
        { label: "Four regions, one whole", items: [chartRevenueRegion] },
      ],
      stickies: [
        highlight(
          "hl-money-regional",
          "The pie shows the shape; the movement is the story. North America is still the biggest slice (42%, $5,196M) but the slowest-growing at +4%. EMEA grew +14% to $4,729M, Latin America +20% and Asia Pacific +17%. The growth is leaving the home market — redraw this pie for 2019 and it looks like a different company.",
        ),
        askPrompt(
          "ask-money",
          "Ask: at these regional growth rates, what year does EMEA overtake North America as Airbnb's largest revenue region?",
        ),
      ],
    },
  ],
};

const chartRoundPrices = chart(
  "chart-round-prices",
  "Price per share, Series B → IPO",
  {
    chartType: "bar",
    categories: ["Series B", "Series C", "Series D", "Series E", "Series F", "IPO"],
    series: [{ name: "Issuance price", data: [3.31, 5.9, 20.36, 46.55, 52.5, 68.0] }],
    unit: "$/share",
    source: SRC_10K_2020,
  },
  "Series Seed ($0.01) and Series A ($0.21) are deliberately off this chart — see the Highlight.",
);

const tableFundingLadder = table(
  "table-funding-ladder",
  "Every preferred round, from the 10-K",
  {
    columns: [
      { key: "series", label: "Series" },
      { key: "price", label: "Price / share" },
      { key: "shares", label: "Shares o/s" },
      { key: "pref", label: "Liquidation pref." },
    ],
    rows: [
      {
        series: { value: "Seed", tags: [{ label: "Sequoia, 2009", tone: "info" }] },
        price: "$0.01",
        shares: "63.7M",
        pref: "$0.6M",
      },
      { series: "A", price: "$0.21", shares: "34.4M", pref: "$7.2M" },
      { series: "B", price: "$3.31", shares: "34.0M", pref: "$112.6M" },
      {
        series: { value: "B-1", tags: [{ label: "Priced below B", tone: "warning" }] },
        price: "$1.11",
        shares: "1.4M",
        pref: "$1.6M",
      },
      { series: "C", price: "$5.90", shares: "33.9M", pref: "$200.0M" },
      { series: "D", price: "$20.36", shares: "20.9M", pref: "$425.5M" },
      {
        series: "E",
        price: "$46.55",
        shares: "32.2M",
        pref: { value: "$1,499.9M", tags: [{ label: "Largest", tone: "success" }] },
      },
      { series: "F", price: "$52.50", shares: "19.1M", pref: "$1,003.3M" },
      {
        series: { value: "Total", tags: [{ label: "All preferred", tone: "info" }] },
        price: "—",
        shares: "239.6M",
        pref: "$3,250.7M",
      },
    ],
  },
  `As of 31 Dec 2019, post the Oct 2020 two-for-one split. Source: ${SRC_10K_2020}.`,
);

const districtMoneyIn: SampleDistrict = {
  key: "money-in",
  label: "THE MONEY IN",
  subtitle: "The ladder from a cent a share to $68.00 — every rung disclosed in the 10-K",
  lens: "private",
  clusters: [
    {
      key: "ladder",
      title: "The ladder",
      columns: [
        { label: "The priced rounds that fit one scale", items: [chartRoundPrices] },
        { label: "All eight series, plus the total", items: [tableFundingLadder] },
      ],
      stickies: [
        highlight(
          "hl-ladder-6800x",
          "Series Seed priced at $0.01 a share; the IPO priced at $68.00. That is 6,800× in eleven years. The seed is off the chart because a $0.01 bar next to a $68.00 bar is invisible — the table carries it instead.",
        ),
        highlight(
          "hl-b1",
          "Series B-1 priced at $1.11 — below the $3.31 of Series B. The ladder is not monotonic, and the 10-K reports it that way. Left as-is rather than smoothed.",
        ),
        askPrompt(
          "ask-ladder",
          "Ask: the 10-K lists Series Seed at $615K aggregate liquidation preference. Reconcile that against Sequoia's reported $600,000 seed cheque in April 2009.",
        ),
      ],
    },
  ],
};

const chartNightsRegion = chart(
  "chart-nights-region",
  "Nights and Seats Booked by region",
  {
    chartType: "bar",
    categories: ["North America", "EMEA", "Latin America", "Asia Pacific"],
    series: [
      { name: "2024", data: [154, 201, 76, 61] },
      { name: "2025", data: [158, 215, 90, 70] },
    ],
    unit: "M nights",
    source: SRC_10K_2025,
  },
  "EMEA books more nights than North America — and has for years.",
);

const tableNightsRegion = table(
  "table-nights-region",
  "Nights and GBV by region, FY2025",
  {
    columns: [
      { key: "region", label: "Region" },
      { key: "nights", label: "Nights 2025" },
      { key: "nshare", label: "% nights" },
      { key: "gbv", label: "GBV 2025" },
      { key: "gbvgrowth", label: "GBV growth" },
    ],
    rows: [
      {
        region: "North America",
        nights: "158M",
        nshare: "30%",
        gbv: "$40,295M",
        gbvgrowth: { value: "+7%", tags: [{ label: "44% of GBV", tone: "info" }] },
      },
      {
        region: "EMEA",
        nights: "215M",
        nshare: "40%",
        gbv: "$34,162M",
        gbvgrowth: { value: "+15%", tags: [{ label: "Most nights", tone: "success" }] },
      },
      {
        region: "Latin America",
        nights: "90M",
        nshare: "17%",
        gbv: "$8,542M",
        gbvgrowth: { value: "+20%", tags: [{ label: "Fastest", tone: "success" }] },
      },
      { region: "Asia Pacific", nights: "70M", nshare: "13%", gbv: "$8,274M", gbvgrowth: "+16%" },
      {
        region: "Total",
        nights: "533M",
        nshare: "100%",
        gbv: "$91,273M",
        gbvgrowth: { value: "+12%", tags: [{ label: "Company", tone: "info" }] },
      },
    ],
  },
  `Source: ${SRC_10K_2025}.`,
);

const videoBlitzscaling = youtubeVideo(
  "video-blitzscaling",
  "W608u6sBFpo",
  "Blitzscaling 18: Brian Chesky on Launching Airbnb and the Challenges of Scale",
  "Chesky at Stanford on what broke as Airbnb grew, and what he did about it.",
);

const districtGrowth: SampleDistrict = {
  key: "growth",
  label: "THE GROWTH STORY",
  subtitle: "Where the nights actually are — and it is not where the revenue is",
  lens: "shared",
  clusters: [
    {
      key: "where-the-nights-are",
      title: "Where the nights are",
      columns: [
        { label: "Two years, four regions", items: [chartNightsRegion] },
        { label: "Nights against the dollars they book", items: [tableNightsRegion] },
      ],
      stickies: [
        highlight(
          "hl-emea",
          "EMEA books 40% of all nights but only 37% of GBV; North America books 30% of nights and 44% of GBV. A night in North America is simply worth more — the two maps of this business do not overlap.",
        ),
        askPrompt(
          "ask-growth",
          "Ask: compute GBV per night for each region across 2024 and 2025, and tell me which region's average night is getting more expensive fastest.",
        ),
      ],
    },
    {
      key: "how-it-scaled",
      title: "How it scaled",
      columns: [{ label: "The operator's account", items: [videoBlitzscaling] }],
      stickies: [
        highlight(
          "hl-metric-rename",
          "The headline metric changed name in the FY2025 10-K: 'Nights and Experiences Booked' (2019–2023) became 'Nights and Seats Booked', and the definition now adds services. The FY2025 filing restates 2024 as 492M under the new name, so the series is comparable — but the label is not the same word.",
        ),
      ],
    },
  ],
};

const webPgDs = website(
  "web-pg-ds",
  "https://paulgraham.com/ds.html",
  "Do Things that Don't Scale",
  "paulgraham.com",
  {
    // Verified with a GET, July 2026: no X-Frame-Options, no CSP frame-ancestors
    // ⇒ frames live. The page ships no og:image at all, so the preview falls back
    // to the author's own Commons portrait — "can frame" and "has a thumbnail"
    // are independent, and the helper requires both.
    previewImageUrl:
      "https://upload.wikimedia.org/wikipedia/commons/e/e3/Paulgraham_240x320.jpg",
    embeddable: true,
  },
);

const wikiPg = wikipedia(
  "wiki-pg",
  "https://en.wikipedia.org/wiki/Paul_Graham_(programmer)",
  "Paul Graham (programmer) - Wikipedia",
  "https://upload.wikimedia.org/wikipedia/commons/e/e3/Paulgraham_240x320.jpg",
);

const districtPhilosophy: SampleDistrict = {
  key: "philosophy",
  label: "THE PHILOSOPHY",
  subtitle: "What a founder would come here to steal — in the founders' own words",
  lens: "shared",
  clusters: [
    {
      key: "what-he-read",
      title: "What he read",
      columns: [
        { label: "The essay written about Airbnb", items: [webPgDs] },
        { label: "Who wrote it", items: [wikiPg] },
      ],
      stickies: [
        highlight(
          "hl-pg",
          "Paul Graham's 'Do Things that Don't Scale' uses Airbnb as its central example — the founders going door to door in New York to photograph listings themselves. The essay is not commentary on Airbnb; Airbnb is the evidence.",
        ),
        askPrompt(
          "ask-philosophy",
          "Ask: pull the passages about Airbnb out of Paul Graham's essay and line them up against what Chesky says in the talks on this canvas.",
        ),
      ],
    },
    {
      key: "what-he-said",
      title: "What he said",
      columns: [
        {
          label: "The idea he is best known for",
          items: [
            youtubeVideo(
              "video-10-star",
              "V6h_EDcj12k",
              "Brian Chesky, Co-Founder and CEO of Airbnb: Designing a 10-star Experience",
              "Chesky at Stanford GSB on designing backwards from an impossible experience.",
            ),
            youtubeVideo(
              "video-do-things",
              "_XA74fS8tGM",
              "Airbnb's Brian Chesky: Do things that don't scale",
              "The Masters of Scale telling of the rule Paul Graham wrote the essay about.",
            ),
          ],
        },
        {
          label: "How he runs the company",
          items: [
            youtubeVideo(
              "video-founder-mode",
              "ViqxJY_AG_w",
              "Founder Mode: Brian Chesky, Founder & CEO, Airbnb",
              "The talk that put the phrase 'founder mode' into circulation.",
            ),
            youtubeVideo(
              "video-yc-culture",
              "px5rgcNjOTc",
              "Culture with Brian Chesky and Alfred Lin (How to Start a Startup 2014: Lecture 10)",
              "Chesky and Sequoia's Alfred Lin on culture, at Y Combinator's Stanford course.",
            ),
          ],
        },
      ],
      stickies: [
        highlight(
          "hl-10star",
          "The 10-star framing is a design exercise, not a service target: describe a check-in so absurd it cannot be built, then walk back until it can. Chesky uses it to argue that a 5-star experience is merely what people expected.",
        ),
      ],
    },
  ],
};

const districtPlaces: SampleDistrict = {
  key: "places",
  label: "THE PLACES",
  subtitle: "Where it physically happened — a rented living room and the building it bought",
  lens: "shared",
  clusters: [
    {
      key: "where-it-started",
      title: "Where it started",
      columns: [
        {
          label: "Rausch Street, SoMa",
          items: [
            {
              key: "map-rausch",
              payload: {
                type: "map",
                title: "Rausch Street, San Francisco",
                description:
                  "The short SoMa street where Chesky and Gebbia rented out three air mattresses in October 2007.",
                data: {
                  place: {
                    name: "Rausch Street, South of Market, San Francisco",
                    lat: 37.776484,
                    lng: -122.4097363,
                  },
                  zoom: 17,
                },
              },
            },
          ],
        },
      ],
      stickies: [
        highlight(
          "hl-rausch",
          "This map is the street, not the door. The founding apartment is always given as 19 Rausch Street, but that house number is not in OpenStreetMap — reverse geocoding puts #46 at the centroid and #52 further southwest, so #19 sits at the northeast end. That is inference, not verification, so this canvas pins the street and says so rather than pointing a street view at a building it cannot confirm.",
        ),
      ],
    },
    {
      key: "brannan",
      title: "888 Brannan",
      columns: [
        {
          label: "The headquarters it grew into",
          items: [
            {
              key: "map-brannan",
              payload: {
                type: "map",
                title: "888 Brannan Street — Airbnb HQ",
                description:
                  "Airbnb's San Francisco headquarters, about a kilometre from the Rausch Street apartment.",
                data: {
                  place: {
                    name: "Airbnb HQ, 888 Brannan Street, San Francisco",
                    lat: 37.7719568,
                    lng: -122.4054484,
                  },
                  zoom: 17,
                },
              },
            },
          ],
        },
        {
          label: "From the street",
          items: [
            {
              key: "sv-brannan",
              payload: {
                type: "streetview",
                title: "888 Brannan Street from the street",
                description: "The HQ building on Brannan between 7th and 8th.",
                data: {
                  place: {
                    name: "888 Brannan Street, San Francisco",
                    lat: 37.7719568,
                    lng: -122.4054484,
                  },
                  heading: 340,
                  pitch: 10,
                  fov: 80,
                },
              },
            },
          ],
        },
      ],
      stickies: [
        askPrompt(
          "ask-places",
          "Ask: how far is 888 Brannan from the Rausch Street apartment, and what else in that walk is part of Airbnb's story?",
        ),
      ],
    },
  ],
};

const chartAdjEbitda = chart(
  "chart-adj-ebitda",
  "Adjusted EBITDA, 2018–2020",
  {
    chartType: "bar",
    categories: ["2018", "2019", "2020"],
    series: [{ name: "Adjusted EBITDA", data: [170.6, -253.3, -250.7] }],
    unit: "$M",
    source: SRC_10K_2020,
  },
  "Airbnb was already losing money on this measure before COVID arrived.",
);

const table2020 = table(
  "table-2020",
  "2020, in the filing's own numbers",
  {
    columns: [
      { key: "metric", label: "Metric" },
      { key: "value", label: "2020" },
      { key: "note", label: "What the 10-K says" },
    ],
    rows: [
      {
        metric: "Revenue",
        value: "$3,378M",
        note: { value: "down 30% year over year", tags: [{ label: "COVID", tone: "danger" }] },
      },
      {
        metric: "Gross Booking Value",
        value: "$23,897M",
        note: { value: "down 37% year over year", tags: [{ label: "COVID", tone: "danger" }] },
      },
      { metric: "Nights booked", value: "193.2M", note: "from 326.9M in 2019" },
      {
        metric: "Net loss",
        value: "$(4,585)M",
        note: {
          value: "includes $2.8B of IPO stock comp",
          tags: [{ label: "Not all COVID", tone: "warning" }],
        },
      },
      { metric: "Adjusted EBITDA", value: "$(250.7)M", note: "roughly flat on 2019's $(253.3)M" },
      {
        metric: "Workforce",
        value: "−1,900",
        note: { value: "about 25% of 7,500 employees", tags: [{ label: "5 May 2020", tone: "danger" }] },
      },
    ],
  },
  `Financials: ${SRC_10K_2020}. Workforce: Brian Chesky's letter, 5 May 2020.`,
);

const webLayoffLetter = website(
  "web-layoff-letter",
  "https://news.airbnb.com/a-message-from-co-founder-and-ceo-brian-chesky/",
  "A Message from Co-Founder and CEO Brian Chesky",
  "news.airbnb.com",
  {
    // Verified with a GET, July 2026: X-Frame-Options: SAMEORIGIN ⇒ cannot frame.
    // previewImageUrl is the page's own og:image (confirmed 200).
    previewImageUrl:
      "https://news.airbnb.com/wp-content/uploads/sites/4/2020/03/BeloRauschNewsroomFeatured_200316.png",
    embeddable: false,
  },
);

const districtCrisis: SampleDistrict = {
  key: "crisis",
  label: "THE CRISIS",
  subtitle: "The year travel stopped — and what the crater was actually made of",
  lens: "shared",
  clusters: [
    {
      key: "the-crater",
      title: "The crater",
      columns: [
        { label: "It was not profitable going in", items: [chartAdjEbitda] },
        { label: "Every 2020 number, sourced", items: [table2020] },
      ],
      stickies: [
        highlight(
          "hl-2020-sbc",
          "The −$4.585B loss in 2020 is not all COVID. The FY2020 10-K books $2.8B of stock-based compensation for RSUs that vested when the IPO registration took effect — a one-time, non-cash charge. Revenue fell 30% and GBV 37%; the loss fell by far more, and most of the extra was the IPO itself.",
        ),
        askPrompt(
          "ask-crisis",
          "Ask: separate Airbnb's 2020 loss into the COVID revenue collapse and the one-time IPO stock compensation, and show me the two side by side.",
        ),
      ],
    },
    {
      key: "the-letter",
      title: "The letter",
      columns: [{ label: "5 May 2020", items: [webLayoffLetter] }],
      stickies: [
        highlight(
          "hl-layoff-1900",
          "\"Out of our 7,500 Airbnb employees, nearly 1,900 teammates will have to leave Airbnb, comprising around 25% of our company.\" Published 5 May 2020. Seven months later the company went public at $68 a share.",
        ),
      ],
    },
  ],
};

export const ABNB_DISTRICTS: SampleDistrict[] = [
  districtMoney,
  districtMoneyIn,
  districtGrowth,
  districtPhilosophy,
  districtPlaces,
  districtCrisis,
];

/* ------------------------------------------------------------------ */
/* Chapters                                                            */
/* ------------------------------------------------------------------ */

const tableIpo = table(
  "table-ipo",
  "The offering, from the 10-K",
  {
    columns: [
      { key: "item", label: "Item" },
      { key: "value", label: "Value" },
    ],
    rows: [
      { item: "Registration statement effective", value: "9 December 2020" },
      {
        item: "Class A begins trading",
        value: { value: "10 December 2020, Nasdaq", tags: [{ label: "ABNB", tone: "info" }] },
      },
      { item: "IPO completed", value: "14 December 2020" },
      { item: "Shares sold", value: "55,000,000 (incl. underwriters' option)" },
      {
        item: "Offering price",
        value: { value: "$68.00 per share", tags: [{ label: "6,800× the seed", tone: "success" }] },
      },
      { item: "Net proceeds", value: "approximately $3.7B" },
      { item: "Preferred converted into", value: "240,910,588 Class B shares" },
      { item: "Stock split", value: "two-for-one, 26 October 2020" },
    ],
  },
  `Source: ${SRC_10K_2020}. The opening trade is a market fact, not a filing fact, and is deliberately absent.`,
);

export const ABNB_CHAPTERS: SampleChapter[] = [
  {
    key: "airbeds",
    year: "2007",
    title: "Three Airbeds",
    columns: [
      {
        label: "The two roommates who could not make rent",
        items: [
          wikipedia(
            "wiki-chesky",
            "https://en.wikipedia.org/wiki/Brian_Chesky",
            "Brian Chesky - Wikipedia",
            "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9a/Brian_Chesky_2025.jpg/960px-Brian_Chesky_2025.jpg",
          ),
          wikipedia(
            "wiki-gebbia",
            "https://en.wikipedia.org/wiki/Joe_Gebbia",
            "Joe Gebbia - Wikipedia",
            "https://upload.wikimedia.org/wikipedia/commons/c/cd/Joe-gebbia-2024.png",
          ),
        ],
      },
    ],
    stickies: [
      highlight(
        "hl-2007",
        "October 2007: a design conference filled San Francisco's hotels, so two roommates put an air mattress in their living room. Wikipedia dates the company's founding to August 2008, when the site launched — Airbnb itself tends to tell the story from the airbeds. Both dates are defensible; this canvas shows the airbeds as the origin and the launch as the founding.",
      ),
      askPrompt(
        "ask-2007",
        "Ask: what did the original airbedandbreakfast.com actually offer guests in 2008, and how is that different from what Airbnb sells now?",
      ),
    ],
  },
  {
    key: "airbed-and-breakfast",
    year: "2008",
    title: "Airbed & Breakfast",
    columns: [
      {
        label: "The third co-founder arrives",
        items: [
          wikipedia(
            "wiki-blecharczyk",
            "https://en.wikipedia.org/wiki/Nathan_Blecharczyk",
            "Nathan Blecharczyk - Wikipedia",
            "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e5/2022_-_Centre_Stage_SM7_8493_%2852474319677%29_%28cropped%29.jpg/1280px-2022_-_Centre_Stage_SM7_8493_%2852474319677%29_%28cropped%29.jpg",
          ),
        ],
      },
    ],
    stickies: [
      highlight(
        "hl-launch",
        "Airbedandbreakfast.com launched on 11 August 2008. Nathan Blecharczyk had joined as CTO and third co-founder that February — the company had an engineer before it had a product.",
      ),
      highlight(
        "hl-cereal",
        "Before any investor said yes, the founders raised $30,000 selling cereal — Obama O's and Cap'n McCain's — mostly at the 2008 Democratic National Convention. That is roughly fifty times the $615K Series Seed preference, in breakfast.",
      ),
    ],
  },
  {
    key: "y-combinator",
    year: "2009",
    title: "Y Combinator",
    columns: [
      {
        label: "$20,000 for 6%",
        items: [
          wikipedia(
            "wiki-yc",
            "https://en.wikipedia.org/wiki/Y_Combinator",
            "Y Combinator - Wikipedia",
            "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b2/Y_Combinator_logo.svg/1280px-Y_Combinator_logo.svg.png",
          ),
        ],
      },
      {
        label: "Chesky tells it himself",
        items: [
          youtubeVideo(
            "video-startup-school",
            "KOytubycHOg",
            "Brian Chesky - Founder of Airbnb @ Startup School 2010 (1 of 2)",
            "Chesky at Startup School in 2010, a year out of the YC batch and before anyone was sure it would work.",
          ),
          youtubeVideo(
            "video-social-radars",
            "SYXrS7gmNtc",
            "The Social Radars S2 Ep.1: Brian Chesky, Co-Founder & CEO, Airbnb w YC Co-Founder Jessica Livingston",
            "Chesky with Jessica Livingston, who was in the room when YC accepted them.",
          ),
        ],
      },
    ],
    stickies: [
      highlight(
        "hl-yc-sequoia",
        "January 2009: Y Combinator's winter batch, $20,000 for 6%. March: the name shortened to Airbnb.com. April: Sequoia put in $600,000. The 10-K's Series Seed carries a $615K aggregate liquidation preference at $0.01 a share — the filing and the story reconcile.",
      ),
    ],
  },
  {
    key: "the-listing",
    year: "2020",
    title: "The Listing",
    columns: [{ label: "Seven months after the letter", items: [tableIpo] }],
    stickies: [
      highlight(
        "hl-ipo",
        "Airbnb went public on 10 December 2020 — in the worst year the travel industry had ever had, seven months after cutting a quarter of its staff. The offering priced at $68.00 and raised about $3.7B net.",
      ),
      askPrompt(
        "ask-ipo",
        "Ask: walk me through Airbnb's 2020 quarter by quarter — the collapse, the letter, the recovery, and the listing.",
      ),
    ],
  },
];
