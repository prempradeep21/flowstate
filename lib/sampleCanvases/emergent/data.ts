import type { ArtifactPayload, StickyNoteColorId } from "@/lib/artifactTypes";
import type { SampleChapter, SampleDistrict } from "@/lib/sampleCanvases/companyLayout";
import type { SampleArtifactSpec } from "@/lib/sampleCanvases/specTypes";
import { createWebsitePayload } from "@/lib/websiteArtifact";

/**
 * Researched Emergent content for the sample canvas. Produced with the
 * company-canvas skill (v0.2.0), July 2026 — the **private-company** branch, and
 * the counterpart to the Airbnb canvas's public one.
 *
 * A private company has no filings, so nothing here is audited. Every number is
 * a **company-stated claim from a dated, published disclosure**, labelled as
 * such on the canvas and sourced to whoever said it. Nothing is estimated: where
 * a figure was never published, there is no chart.
 *
 * The near-miss worth remembering: press search reported "$70M Series B at
 * $300M (Jan 2026)" as current. Emergent announced a **$130M Series C at $1.5B
 * on 15 July 2026 — one day before this canvas was built**. Shipping from the
 * search summary would have been wrong by $1.2B. A "current" claim about a
 * one-year-old company decays in months.
 *
 * Deliberately absent, because they could not be verified rather than because
 * they were forgotten — each is explained in a Highlight on the canvas:
 *   - Trustpilot's rating (403 to every fetch ⇒ unverified ⇒ not shipped)
 *   - any employee-review district (Glassdoor's "Emergent Labs" is a different
 *     company in Lagos with one 2023 review)
 *   - maps / street view (no verified street address; "San Francisco" is not a pin)
 */

const EMERGENT_FAVICON = "https://emergent.sh/favicon.ico";
/**
 * emergent.sh frames live but its inner pages are client-rendered and ship no
 * og:image — the same "can frame ≠ has a thumbnail" split as paulgraham.com on
 * the Airbnb canvas. This is Emergent's own brand asset from Emergent's own CDN,
 * used only on Emergent's own pages, so it attributes correctly.
 */
const EMERGENT_BRAND_IMAGE =
  "https://cdn.prod.website-files.com/6a0edf12ef1a8562ed56d806/6a169f29b54acd56f5308b9b_emergent.webp";

const SRC_SERIES_C =
  "Emergent, \"Emergent Is Now a Unicorn\", emergent.sh, 15 July 2026 (company-stated)";
const SRC_TECHCRUNCH = "TechCrunch, 15 July 2026";
const SRC_DEPLOY_POST =
  "Emergent engineering blog, \"We Had an 85% Deployment Success Rate\", 2 July 2026";
const SRC_ARR_MIXED =
  "Company-stated ARR, unaudited: $15M (Infinite Curiosity interview, Oct 2025), $50M (emergent.sh Series C page, as of Jan 2026), $100M (Y Combinator, Jun 2026), $120M (TechCrunch, 15 Jul 2026)";

/**
 * Both `previewImageUrl` and `embeddable` are REQUIRED — nothing enriches a
 * builder-authored website artifact at render time. `embeddable` replicates
 * `isFrameableFromHeaders` (lib/frameability.ts) against the page's real
 * headers, verified 16 July 2026.
 */
function website(
  key: string,
  url: string,
  pageTitle: string,
  domainLabel: string,
  extras: { faviconUrl?: string; previewImageUrl: string; embeddable: boolean },
): SampleArtifactSpec {
  const payload = createWebsitePayload(url, domainLabel, extras);
  payload.title = pageTitle;
  payload.data.title = pageTitle;
  return { key, payload };
}

/** emergent.sh sends no X-Frame-Options and no CSP frame-ancestors ⇒ frames live. */
function emergentPage(
  key: string,
  url: string,
  pageTitle: string,
  previewImageUrl: string = EMERGENT_BRAND_IMAGE,
): SampleArtifactSpec {
  return website(key, url, pageTitle, "emergent.sh", {
    faviconUrl: EMERGENT_FAVICON,
    previewImageUrl,
    embeddable: true,
  });
}

/** `title` is the title oEmbed returned for the id — never a search snippet. */
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
): SampleArtifactSpec => ({ key, payload: { type: "chart", title, description, data } });

const table = (
  key: string,
  title: string,
  data: Extract<ArtifactPayload, { type: "table" }>["data"],
  description?: string,
): SampleArtifactSpec => ({ key, payload: { type: "table", title, description, data } });

/* ------------------------------------------------------------------ */
/* Seed card + subtitle                                                */
/* ------------------------------------------------------------------ */

export const EMERGENT_SEED_CARD = {
  question: "Research Emergent — a one-year-old company that just became a unicorn.",
  answer:
    "Emergent went from a Y Combinator batch to a $1.5B valuation in about two years, and from $300M to $1.5B in six months. There are no filings to check, so this canvas is built from what the company published, what its founder said on the record, and what its customers wrote — each dated, each attributed, and none of it audited.",
};

export const EMERGENT_SUBTITLE =
  "Emergent (2024–2026), a private company read through lenses. No filings exist, so every figure here is a dated, company-stated claim — attributed to whoever said it, and never estimated.";

/* ------------------------------------------------------------------ */
/* Scoreboard                                                          */
/* ------------------------------------------------------------------ */

const chartValuation = chart(
  "chart-valuation",
  "Valuation, Series B → Series C",
  {
    chartType: "bar",
    categories: ["Series B (Jan 2026)", "Series C (Jul 2026)"],
    series: [{ name: "Post-money valuation", data: [300, 1500] }],
    unit: "$M",
    source: SRC_SERIES_C,
  },
  "Five times, in roughly six months.",
);

const chartArr = chart(
  "chart-arr",
  "Company-stated ARR",
  {
    chartType: "area",
    categories: ["Oct 2025", "Jan 2026", "Jun 2026", "Jul 2026"],
    series: [{ name: "ARR", data: [15, 50, 100, 120] }],
    unit: "$M",
    source: SRC_ARR_MIXED,
    smooth: false,
  },
  "Unaudited. Each point is a claim the company or its CEO made on a dated, public record.",
);

const chartRoundMix = chart(
  "chart-round-mix",
  "Where the $230M came from",
  {
    chartType: "pie",
    slices: [
      { name: "Seed", value: 7 },
      { name: "Series A", value: 23 },
      { name: "Series B", value: 70 },
      { name: "Series C", value: 130 },
    ],
    unit: "$M",
    source: SRC_SERIES_C,
  },
  "Four rounds summing to the whole — more than half of everything ever raised arrived in July 2026.",
);

const tableKeyMetrics = table(
  "table-key-metrics",
  "The scoreboard, July 2026",
  {
    columns: [
      { key: "metric", label: "Metric" },
      { key: "value", label: "Stated" },
      { key: "who", label: "Who said it" },
    ],
    rows: [
      {
        metric: "Valuation",
        value: { value: "$1.5B", tags: [{ label: "Unicorn", tone: "success" }] },
        who: "Emergent, 15 Jul 2026",
      },
      { metric: "Total raised", value: "$230M", who: "Emergent, 15 Jul 2026" },
      {
        metric: "ARR",
        value: { value: "$120M", tags: [{ label: "Unaudited", tone: "warning" }] },
        who: "TechCrunch, 15 Jul 2026",
      },
      { metric: "Apps built", value: "12M+", who: "Emergent, 15 Jul 2026" },
      { metric: "Users", value: "10M+", who: "TechCrunch, 15 Jul 2026" },
      { metric: "Paying customers", value: "200,000+", who: "TechCrunch, 15 Jul 2026" },
      {
        metric: "Users with no coding experience",
        value: { value: "70%", tags: [{ label: "The whole thesis", tone: "info" }] },
        who: "Emergent, 15 Jul 2026",
      },
    ],
  },
  "Two columns, because for a private company who said a number is part of the number.",
);

export const EMERGENT_SCOREBOARD_ROWS: SampleArtifactSpec[][] = [
  [chartValuation, chartArr, chartRoundMix],
  [tableKeyMetrics],
];

export const EMERGENT_SCOREBOARD_STICKIES: SampleArtifactSpec[] = [
  highlight(
    "hl-no-filings",
    "There is no 10-K here, and that changes the rules. Every figure on this canvas is a claim, made on a date, by a named party — so the source column is not decoration, it is the evidence. Where a number was never published, this canvas has no chart rather than an estimate.",
  ),
  askPrompt(
    "ask-scoreboard",
    "Ask: which of Emergent's stated metrics could be independently checked by an outsider, and which can only ever be taken on trust?",
  ),
];

export const EMERGENT_TIMELINE: SampleArtifactSpec = {
  key: "timeline-emergent",
  payload: {
    type: "timeline",
    title: "Emergent, 2024–2026",
    description:
      "Batch and founding from the Y Combinator company page; rounds from Emergent's own announcements and same-day press.",
    data: {
      scale: "month",
      rangeStart: "2024-01-01",
      rangeEnd: "2026-12-31",
      events: [
        {
          id: "emg-tl-yc",
          at: "2024-06-01",
          label: "Y Combinator Summer 2024 batch; company founded",
          highlight: true,
        },
        {
          id: "emg-tl-launch",
          at: "2025-07-01",
          label: "Emergent launches publicly",
          highlight: true,
        },
        {
          id: "emg-tl-15m",
          at: "2025-10-01",
          label: "CEO states $15M ARR three months after launch",
        },
        {
          id: "emg-tl-seriesa",
          at: "2025-10-15",
          label: "Series A: $23 million",
        },
        {
          id: "emg-tl-seriesb",
          at: "2026-01-20",
          label: "Series B: $70 million at $300 million",
          highlight: true,
        },
        {
          id: "emg-tl-deploy",
          at: "2026-07-02",
          label: "Super Deployer lifts deployment success to 98.5%",
        },
        {
          id: "emg-tl-seriesc",
          at: "2026-07-15",
          label: "Series C: $130 million at $1.5 billion",
          highlight: true,
        },
      ],
    },
  },
};

/* ------------------------------------------------------------------ */
/* Districts                                                           */
/* ------------------------------------------------------------------ */

const tableRounds = table(
  "table-rounds",
  "Every round, and who led it",
  {
    columns: [
      { key: "round", label: "Round" },
      { key: "amount", label: "Amount" },
      { key: "valuation", label: "Valuation" },
      { key: "when", label: "When" },
      { key: "lead", label: "Lead" },
    ],
    rows: [
      { round: "Seed", amount: "$7M", valuation: "—", when: "—", lead: "—" },
      { round: "Series A", amount: "$23M", valuation: "—", when: "~Oct 2025", lead: "—" },
      {
        round: "Series B",
        amount: "$70M",
        valuation: "$300M",
        when: "Jan 2026",
        lead: { value: "Khosla Ventures, SoftBank Vision Fund 2", tags: [{ label: "3 months after A", tone: "info" }] },
      },
      {
        round: "Series C",
        amount: { value: "$130M", tags: [{ label: "Largest", tone: "success" }] },
        valuation: { value: "$1.5B", tags: [{ label: "5× in 6 months", tone: "success" }] },
        when: "15 Jul 2026",
        lead: "Creaegis; co-leads Claypond Capital, Sentinel Global",
      },
      {
        round: { value: "Total", tags: [{ label: "All rounds", tone: "info" }] },
        amount: "$230M",
        valuation: "—",
        when: "—",
        lead: "Khosla, SoftBank VF2, Lightspeed and YC across rounds",
      },
    ],
  },
  `Source: ${SRC_SERIES_C}, cross-checked against ${SRC_TECHCRUNCH}.`,
);

const webUnicorn = emergentPage(
  "web-unicorn",
  "https://emergent.sh/news/emergent-now-a-unicorn-at-1-5-billion-valuation",
  "Emergent Is Now a Unicorn: We Raised $130M in Our Series C at a $1.5B Valuation",
);

const districtMoneyIn: SampleDistrict = {
  key: "money-in",
  label: "THE MONEY IN",
  subtitle: "No revenue to audit — so the rounds are the only hard record there is",
  lens: "private",
  clusters: [
    {
      key: "ladder",
      title: "The ladder",
      columns: [
        { label: "The company's own announcement", items: [webUnicorn] },
        { label: "Four rounds in under two years", items: [tableRounds] },
      ],
      stickies: [
        highlight(
          "hl-stale",
          "This canvas was nearly wrong by $1.2B. Search still reports Emergent's Series B — $70M at $300M, January 2026 — as the current state. The Series C closed at $1.5B on 15 July 2026, the day before this was built. For a company this young, a six-month-old figure is not slightly stale; it is a different company.",
        ),
        highlight(
          "hl-speed",
          "Series A to Series B took about three months. Series B to Series C took six, and quintupled the valuation. More than half of the $230M ever raised arrived in a single round in July 2026.",
        ),
        askPrompt(
          "ask-ladder",
          "Ask: compare Emergent's round-to-round cadence against the median AI startup in 2025–26. Is three months between A and B unusual, or is that just what this market looks like now?",
        ),
      ],
    },
  ],
};

const gaugeDeploy = chart(
  "gauge-deploy",
  "Deployment success after Super Deployer",
  {
    chartType: "gauge",
    gaugeValue: 98.5,
    gaugeMax: 100,
    gaugeLabel: "Deploy success",
    unit: "%",
    source: SRC_DEPLOY_POST,
  },
  "For apps using dependencies beyond the standard set — where roughly 85% used to fail outright.",
);

const webDeployPost = emergentPage(
  "web-deploy-post",
  "https://emergent.sh/blog/super-deployer-ai-app-deployment-success",
  "We Had an 85% Deployment Success Rate. Here's the Assumption We Broke to Fix It.",
);

const webBlog = emergentPage(
  "web-blog",
  "https://emergent.sh/blog",
  "Blog | Emergent",
  EMERGENT_BRAND_IMAGE,
);

const districtRecord: SampleDistrict = {
  key: "record",
  label: "THE RECORD",
  subtitle: "The blog is the disclosure — for a startup, it is the closest thing to a filing",
  lens: "shared",
  clusters: [
    {
      key: "what-they-published",
      title: "What they published",
      columns: [
        { label: "The engineering blog, dated post by post", items: [webBlog] },
        { label: "The best post they have written", items: [webDeployPost] },
      ],
      stickies: [
        highlight(
          "hl-deploy",
          "The assumption Super Deployer broke: \"the person who wrote the code also knows what it needs to run.\" That has been true since software began — and it stops being true the moment an agent writes the code and nobody can answer what it needs. Their fix reads the app and its error logs and writes Kubernetes manifests from scratch, not from templates.",
        ),
        highlight(
          "hl-title-vs-body",
          "Read the post, not its headline. It is titled \"We Had an 85% Deployment Success Rate\" — but the body says roughly 85% of apps with non-standard dependencies simply FAILED to deploy. Different populations, opposite meanings. The gauge charts the body's figure.",
        ),
      ],
    },
    {
      key: "what-they-fixed",
      title: "What they fixed",
      columns: [{ label: "98.5–99%, up from a coin toss", items: [gaugeDeploy] }],
      stickies: [
        askPrompt(
          "ask-record",
          "Ask: read Emergent's engineering blog in date order and tell me what changed about the product's hardest problem between March and July 2026.",
        ),
      ],
    },
  ],
};

const webPhReviews = website(
  "web-ph-reviews",
  "https://www.producthunt.com/products/emergent-2/reviews",
  "Emergent Reviews (2026) | Product Hunt",
  "producthunt.com",
  {
    // XFO: SAMEORIGIN ⇒ cannot frame. og:image is the page's own (note the
    // HTML-decoded ampersands — the imgix query is required or it 404s).
    previewImageUrl:
      "https://ph-files.imgix.net/bedb5a92-25a6-43a8-ae7f-a3b4701bf6a9.jpeg?auto=format&fit=crop&frame=1&h=512&w=1024",
    embeddable: false,
  },
);

const tableVerdict = table(
  "table-verdict",
  "What reviewers actually say",
  {
    columns: [
      { key: "theme", label: "Theme" },
      { key: "side", label: "Side" },
      { key: "detail", label: "What they report" },
    ],
    rows: [
      {
        theme: "Speed",
        side: { value: "Praise", tags: [{ label: "Recurring", tone: "success" }] },
        detail: "Full-stack apps shipped fast; the workflow saves real time",
      },
      {
        theme: "Non-technical access",
        side: { value: "Praise", tags: [{ label: "Recurring", tone: "success" }] },
        detail: "Reviewers report shipping things they could not otherwise have built",
      },
      {
        theme: "Output quality",
        side: "Praise",
        detail: "Clean code and strong results on complex projects",
      },
      {
        theme: "Data loss",
        side: { value: "Criticism", tags: [{ label: "Severe", tone: "danger" }] },
        detail:
          "One detailed review reports losing all app code across two accounts, with minimal support response",
      },
      {
        theme: "Conversation forking",
        side: { value: "Criticism", tags: [{ label: "Recurring", tone: "warning" }] },
        detail: "Described as frustrating to manage",
      },
      {
        theme: "Refinement needed",
        side: "Criticism",
        detail: "Outputs still require iteration",
      },
    ],
  },
  "Themes summarised from Product Hunt reviews, fetched 16 July 2026. Themes are paraphrased; no review is quoted.",
);

const districtVerdict: SampleDistrict = {
  key: "verdict",
  label: "THE VERDICT",
  subtitle: "What customers say — the only outside evidence a private company gives you",
  lens: "shared",
  clusters: [
    {
      key: "the-rating",
      title: "The rating",
      columns: [
        { label: "4.6 out of 5, from 14 reviews", items: [webPhReviews] },
        { label: "Praise and complaint, side by side", items: [tableVerdict] },
      ],
      stickies: [
        highlight(
          "hl-sample",
          "4.6 out of 5 — from 14 reviews, on 16 July 2026. The count is not a footnote: fourteen reviews for a platform claiming 10 million users is close to no signal at all. Both numbers ship together or neither does.",
        ),
        highlight(
          "hl-unverified",
          "Two things are missing from this district on purpose. Trustpilot returns 403 to every fetch, so its widely-quoted score is unverified and is not shown — being blocked is not permission to publish the number you half-remember. And the affiliate \"review\" sites that dominate search results are SEO content, not reviews.",
        ),
        askPrompt(
          "ask-verdict",
          "Ask: the same product is praised for clean code and accused of losing all of it. What kind of user hits each outcome, and what does that say about who this tool is actually for?",
        ),
      ],
    },
  ],
};

const districtPhilosophy: SampleDistrict = {
  key: "philosophy",
  label: "THE PHILOSOPHY",
  subtitle: "What a founder would come here to steal — twin brothers, told in their own words",
  lens: "shared",
  clusters: [
    {
      key: "the-thesis",
      title: "The thesis",
      columns: [
        {
          label: "Told to their own investors",
          items: [
            youtubeVideo(
              "video-yc-100m",
              "yyXCQHX55N4",
              "Emergent: How Six Months of Tinkering Led To A $100M ARR Company",
              "Y Combinator's own account of the company it funded in Summer 2024.",
            ),
            youtubeVideo(
              "video-lightspeed-50m",
              "hg99Vd79-PM",
              "How Emergent Scaled to $50M ARR in Just 7 Months | ft. Mukund Jha",
              "Mukund Jha with Lightspeed, an investor in the company — read it as such.",
            ),
          ],
        },
        {
          label: "Told to everyone else",
          items: [
            youtubeVideo(
              "video-yc-builders",
              "8SVocWnDHwE",
              "AI Is Unlocking Millions Of New Builders",
              "The argument underneath the product: the bottleneck was never the idea.",
            ),
            youtubeVideo(
              "video-shamani",
              "mDLQGESS2X0",
              "₹1 Lakh To ₹1 Crore - AI Business, Solo Founder & Business Growth - Mukund Jha | FO460 Raj Shamani",
              "The long-form Indian podcast appearance, aimed at would-be founders rather than investors.",
            ),
          ],
        },
      ],
      stickies: [
        highlight(
          "hl-quote",
          "Mukund Jha, on the Series C: \"The real impact of the AI revolution will be a complete democratization of who gets to build what software, where they get to build it, and how much it costs.\" The number that backs it is on the scoreboard — 70% of users have no prior coding experience.",
        ),
        askPrompt(
          "ask-philosophy",
          "Ask: watch the investor-hosted interviews next to the independent ones and tell me which claims only ever appear in the friendly rooms.",
        ),
      ],
    },
  ],
};

const webTechCrunch = website(
  "web-techcrunch",
  "https://techcrunch.com/2026/07/15/indian-ai-coding-startup-emergent-becomes-a-unicorn-just-over-a-year-after-launch/",
  "Indian AI coding startup Emergent becomes a unicorn with $130M Series C | TechCrunch",
  "techcrunch.com",
  {
    // XFO: SAMEORIGIN ⇒ cannot frame. og:image is TechCrunch's own photograph of
    // both co-founders — correctly attributed, and the query string is required.
    previewImageUrl:
      "https://techcrunch.com/wp-content/uploads/2026/07/emergent-co-founders-madhav-jha-mukund-jha.jpg?resize=1200,800",
    embeddable: false,
  },
);

const districtCoverage: SampleDistrict = {
  key: "coverage",
  label: "THE COVERAGE",
  subtitle: "What everyone else said, on the day it happened",
  lens: "shared",
  clusters: [
    {
      key: "the-day",
      title: "The day",
      columns: [
        { label: "15 July 2026", items: [webTechCrunch] },
        {
          label: "The interviews the round produced",
          items: [
            youtubeVideo(
              "video-aim-15b",
              "INS2RgSSzsM",
              "EXCLUSIVE: Emergent CEO on AI Agents, Vibe Coding, and Hitting $1.5B in 12 Months",
              "The CEO on the valuation, immediately after the Series C.",
            ),
            youtubeVideo(
              "video-ndtv",
              "GwFSpey6Fvo",
              "Emergent Labs AI | NDTV Ind.AI Summit: Mukund Jha, CEO Of Emergent Labs, On His Platform",
              "The mainstream-television version of the pitch.",
            ),
          ],
        },
      ],
      stickies: [
        highlight(
          "hl-titles-lie",
          "Search results listed this interview as \"…$1.5B Valuation, and Why Dunzo Had to Fail\". That is not its title. YouTube's oEmbed returns the real one, shown here. Search summaries reconstruct titles; the API does not.",
        ),
        askPrompt(
          "ask-coverage",
          "Ask: Emergent is described as an Indian startup and as a San Francisco company in different outlets on the same day. Which is it, and why does the framing differ?",
        ),
      ],
    },
  ],
};

const webYc = website(
  "web-yc",
  "https://www.ycombinator.com/companies/emergent",
  "Emergent: AI app builder that turns your ideas into monetizable software | Y Combinator",
  "ycombinator.com",
  {
    // XFO: SAMEORIGIN ⇒ cannot frame; the page is client-rendered and ships no
    // og:image, so the thumbnail is YC's own logo from Commons — honest, since
    // the card is a YC page.
    previewImageUrl:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b2/Y_Combinator_logo.svg/1280px-Y_Combinator_logo.svg.png",
    embeddable: false,
  },
);

const districtCrisis: SampleDistrict = {
  key: "crisis",
  label: "THE CRISIS",
  subtitle: "A company this young has not had its reckoning yet — but you can see where it will come from",
  lens: "shared",
  clusters: [
    {
      key: "the-fault-line",
      title: "The fault line",
      columns: [
        {
          label: "The founder has already lost one company",
          items: [
            youtubeVideo(
              "video-entrackr",
              "Ywpa-_PA-Kc",
              "Not Just Business | Ep 04 ft. Mukund Jha, Founder & CEO – Emergent",
              "Mukund Jha on building again after Dunzo, the company he co-founded and left.",
            ),
          ],
        },
      ],
      stickies: [
        highlight(
          "hl-trust",
          "The risk is not growth, it is trust. A platform whose customers cannot read their own code has only its word that the code is safe — and the single most detailed public review is a user reporting they lost all of it, across two accounts, with little support. At 10 million users, that is the fault line: not whether Emergent can build apps, but whether it can be trusted to keep them.",
        ),
        askPrompt(
          "ask-crisis",
          "Ask: what would Emergent have to publish — an SLA, an export path, an incident report — for the data-loss complaints to stop being an existential risk?",
        ),
      ],
    },
  ],
};

export const EMERGENT_DISTRICTS: SampleDistrict[] = [
  districtMoneyIn,
  districtRecord,
  districtVerdict,
  districtPhilosophy,
  districtCoverage,
  districtCrisis,
];

/* ------------------------------------------------------------------ */
/* Chapters                                                            */
/* ------------------------------------------------------------------ */

const tableSeriesC = table(
  "table-series-c",
  "Series C, 15 July 2026",
  {
    columns: [
      { key: "item", label: "Item" },
      { key: "value", label: "Value" },
    ],
    rows: [
      { item: "Amount", value: "$130M" },
      {
        item: "Valuation",
        value: { value: "$1.5B post-money", tags: [{ label: "5× the Series B", tone: "success" }] },
      },
      { item: "Lead", value: "Creaegis" },
      { item: "Co-leads", value: "MNI Ventures – Claypond Capital, Sentinel Global" },
      {
        item: "Following on",
        value: "Khosla Ventures, SoftBank Vision Fund 2, Lightspeed, Y Combinator",
      },
      { item: "Total raised to date", value: "$230M" },
      { item: "Apps built since launch", value: "12M+" },
      {
        item: "Users with no prior coding experience",
        value: { value: "70%", tags: [{ label: "Company-stated", tone: "warning" }] },
      },
    ],
  },
  `Source: ${SRC_SERIES_C}.`,
);

export const EMERGENT_CHAPTERS: SampleChapter[] = [
  {
    key: "yc",
    year: "2024",
    title: "Summer 2024",
    columns: [{ label: "The batch that funded it", items: [webYc] }],
    stickies: [
      highlight(
        "hl-founders",
        "Two brothers, and not a first attempt. Mukund Jha had already co-founded Dunzo and run it as CTO; Madhav Jha has a PhD in theoretical computer science and was a founding member of the research team behind Amazon SageMaker. The pair went through Y Combinator's Summer 2024 batch.",
      ),
      askPrompt(
        "ask-yc",
        "Ask: what did Mukund Jha learn at Dunzo that shows up in how Emergent is built?",
      ),
    ],
  },
  {
    key: "launch",
    year: "2025",
    title: "The Launch",
    columns: [
      {
        label: "Three months in, at $15M",
        items: [
          youtubeVideo(
            "video-prateek-15m",
            "cRbg_d8roj8",
            "From 0 to $15M ARR in 3 months | Mukund Jha, CEO of Emergent",
            "October 2025. Worth watching as the before picture — the same claims, one twentieth the valuation.",
          ),
        ],
      },
    ],
    stickies: [
      highlight(
        "hl-launch",
        "Emergent launched publicly in 2025 and its CEO was describing $15M of ARR three months later. Every figure in that sentence is the company's own; none of it is audited, and there is no filing that will ever confirm it.",
      ),
    ],
  },
  {
    key: "unicorn",
    year: "Jul 2026",
    title: "The Unicorn",
    columns: [{ label: "The round, at a glance", items: [tableSeriesC] }],
    stickies: [
      highlight(
        "hl-unicorn",
        "15 July 2026: $130M at $1.5B, led by Creaegis, with Khosla, SoftBank Vision Fund 2, Lightspeed and Y Combinator all following on. Roughly a year after public launch, and about two years after the YC batch.",
      ),
      askPrompt(
        "ask-unicorn",
        "Ask: at $120M stated ARR and a $1.5B valuation, what multiple did Creaegis pay — and how does that compare to the other vibe-coding platforms?",
      ),
    ],
  },
];
