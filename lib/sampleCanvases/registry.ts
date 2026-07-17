import { buildAirbnbCanvas } from "@/lib/sampleCanvases/airbnb/buildAirbnbCanvas";
import { buildEmergentCanvas } from "@/lib/sampleCanvases/emergent/buildEmergentCanvas";
import { buildGuinnessCampaignCanvas } from "@/lib/sampleCanvases/guinnessCampaign/buildGuinnessCampaignCanvas";
import { buildHenryFordCanvas } from "@/lib/sampleCanvases/henryFord/buildHenryFordCanvas";
import { buildPhilKnightCanvas } from "@/lib/sampleCanvases/philKnight/buildPhilKnightCanvas";
import { buildTheLongNoonCanvas } from "@/lib/sampleCanvases/theLongNoon/buildTheLongNoonCanvas";
import { buildViennaExchangeCanvas } from "@/lib/sampleCanvases/viennaExchange/buildViennaExchangeCanvas";
import type { SampleCanvasDefinition } from "@/lib/sampleCanvases/types";

/**
 * All code-defined sample canvases, in display order.
 *
 * Entries with `kind: "research"` are skill-produced and deep-research a real
 * subject. Two skills make them and `createdWithSkillVersion` says which:
 * `research-canvas` for people (an overview band plus era clusters) and
 * `company-canvas` for companies (a scoreboard band, stacked lens districts,
 * then a chapter row). See .claude/skills/<skill>/SKILL.md for the methodology
 * and the checklist for registering one.
 *
 * Entries with `kind: "project"` model work moving through states rather than
 * facts about a subject, and they bring their own geometry — do not apply the
 * research layout conventions to them. Most are hand-built and come from no skill
 * (e.g. `guinness-campaign`), so they carry no `createdWithSkillVersion`. The
 * exception is the `filmmaker-canvas` skill, which ships `kind: "project"` film
 * production canvases (e.g. `the-vienna-exchange`, `the-long-noon`) and does tag
 * them with a `createdWithSkillVersion` — it is the one skill that makes projects.
 *
 * Must stay client-importable: the admin page builds snapshots in the browser,
 * so nothing in lib/sampleCanvases may import server-only modules. This is why
 * builders ship real coordinates — the geocoder is server-side.
 */
export const SAMPLE_CANVAS_REGISTRY: SampleCanvasDefinition[] = [
  {
    slug: "henry-ford",
    kind: "research",
    title: "Henry Ford",
    subject: "Henry Ford",
    subjectKind: "person",
    tagline: "The man who put the world on wheels",
    description:
      "Deep research into Henry Ford (1863–1947): Model T production and price arcs, the assembly line and $5 day, River Rouge, Fordlândia, Willow Run's bomber-an-hour line, and the museum that keeps it all. Overview metrics up top, seven annotated era deep-dives below with sticky-note highlights and question prompts.",
    eraRange: "1863–1947",
    accent: "rgb(var(--artifact-cat-data-fg))",
    createdWithSkillVersion: "research-canvas@0.4.0",
    stats: {
      charts: 6,
      tables: 3,
      timelines: 1,
      videos: 15,
      websites: 12,
      maps: 5,
      other: 23,
    },
    buildSnapshot: buildHenryFordCanvas,
  },
  {
    slug: "phil-knight",
    kind: "research",
    title: "Phil Knight",
    subject: "Phil Knight",
    subjectKind: "person",
    tagline: "The founder of Nike, from a Plymouth Valiant to $46B",
    description:
      "Deep research into Phil Knight (born 1938): the 1962 Stanford paper that became Blue Ribbon Sports, the handshake with Bill Bowerman, Carolyn Davidson's $35 Swoosh, Bowerman's waffle iron, Michael Jordan, Just Do It, the sweatshop reckoning, and the memoir and cancer money. Overview metrics up top, seven annotated era deep-dives below with sticky-note highlights and question prompts.",
    eraRange: "1938–2025",
    accent: "rgb(var(--artifact-cat-media-fg))",
    createdWithSkillVersion: "research-canvas@0.4.0",
    stats: {
      charts: 6,
      tables: 5,
      timelines: 1,
      videos: 11,
      websites: 15,
      maps: 4,
      other: 28,
    },
    buildSnapshot: buildPhilKnightCanvas,
  },
  {
    slug: "airbnb",
    kind: "research",
    title: "Airbnb",
    subject: "Airbnb",
    subjectKind: "company",
    tagline: "Three airbeds to a public listing",
    description:
      "Deep research into Airbnb (2007–2025), read through lenses rather than eras: the scoreboard up top, then what the filings say (revenue by region, FY2025), the ladder from a cent a share to the $68.00 IPO, where the nights actually are, what Chesky wrote and said, the two San Francisco addresses, and the year travel stopped. Every figure is pulled from the 10-K that reports it (SEC EDGAR, CIK 1559720) — including the two numbers that would mislead without their annotation: 2023's net income contains a $2.9B tax valuation allowance release, and 2020's loss contains $2.8B of IPO stock compensation. Four chapter clusters below carry the founding story.",
    eraRange: "2007–2025",
    accent: "rgb(var(--artifact-cat-geo-fg))",
    createdWithSkillVersion: "company-canvas@0.2.0",
    stats: {
      charts: 8,
      tables: 5,
      timelines: 1,
      videos: 7,
      websites: 8,
      maps: 3,
      other: 25,
    },
    buildSnapshot: buildAirbnbCanvas,
  },
  {
    slug: "emergent",
    kind: "research",
    title: "Emergent",
    subject: "Emergent",
    subjectKind: "company",
    tagline: "A YC batch to a $1.5B unicorn in two years",
    description:
      "Deep research into Emergent (2024–2026), the private-company counterpart to the Airbnb canvas. There are no filings, so nothing here is audited: every figure is a dated, company-stated claim attributed to whoever said it — the $230M round ladder from the company's own Series C page, the unaudited ARR trajectory, the 98.5% deployment-success gauge from its engineering blog, and a Product Hunt rating shipped with its sample size. What could not be verified is named and left out: Trustpilot returns 403, and Glassdoor's \"Emergent Labs\" is a different company in Lagos. Six lens districts and three chapters, from the Summer 2024 batch to the $130M Series C announced on 15 July 2026.",
    eraRange: "2024–2026",
    accent: "rgb(var(--artifact-cat-viz-fg))",
    createdWithSkillVersion: "company-canvas@0.2.0",
    stats: {
      charts: 4,
      tables: 4,
      timelines: 1,
      videos: 8,
      websites: 6,
      maps: 0,
      other: 22,
    },
    buildSnapshot: buildEmergentCanvas,
  },
  {
    slug: "guinness-campaign",
    kind: "project",
    title: "Guinness 0.0 — The Same Patience",
    subject: "Guinness",
    subjectKind: "company",
    tagline: "An ad agency campaign, brief to air",
    description:
      "A fictional spec pitch for Guinness 0.0 by an agency that does not exist, built as an hourglass: everything we looked at on the left (brief, market, audience, mood board, reference films, tone tracks), narrowing through three territories to one endline, then fanning back out into the cutdowns, the flight plan and the deliverables matrix. Reference material is real and verified — the films, the competitor sites, the Dublin locations, and market figures sourced to Diageo's Form 20-F 2025. The campaign work itself is invented.",
    eraRange: "12 Jan – 15 Aug 2026",
    accent: "rgb(var(--artifact-cat-media-fg))",
    stats: {
      charts: 4,
      tables: 3,
      timelines: 1,
      videos: 12,
      websites: 10,
      maps: 3,
      other: 40,
    },
    buildSnapshot: buildGuinnessCampaignCanvas,
  },
  {
    slug: "the-vienna-exchange",
    kind: "project",
    title: "The Vienna Exchange",
    subject: "Petra Vogel",
    subjectKind: "person",
    tagline: "A fictional 1961 spy thriller, pitch to festival",
    description:
      "A filmmaker's production canvas for an invented 1961 Cold War thriller, laid out as a left-to-right pipeline: the pitch, the story, the world we researched, then pre-production, the shoot, the cut and the festival run. The film — its director \"Petra Vogel\", characters, script, schedule and budget — is invented; the reference material is real and verified: the tone films (The Third Man, Bridge of Spies, Tinker Tailor), the archival images, the Vienna/Berlin/Havana/London locations, and the historical figures the story brushes against (George Blake, Operation Gold, the June 1961 Vienna Summit). Leans on maps, street view, dossier tables and archival galleries.",
    eraRange: "Sep 2025 – Feb 2027",
    accent: "rgb(var(--artifact-cat-geo-fg))",
    createdWithSkillVersion: "filmmaker-canvas@0.1.0",
    stats: {
      charts: 1,
      tables: 13,
      timelines: 1,
      videos: 3,
      websites: 5,
      maps: 3,
      other: 28,
    },
    buildSnapshot: buildViennaExchangeCanvas,
  },
  {
    slug: "the-long-noon",
    kind: "project",
    title: "The Long Noon",
    subject: "Sölas Vey",
    subjectKind: "person",
    tagline: "A fictional sci-fi on a tidally-locked world, pitch to festival",
    description:
      "The invented-world counterpart to the Vienna Exchange canvas: a filmmaker's production pipeline for an original sci-fi feature set on a tidally-locked exoplanet, where the sun never moves and humans survive only in the twilight ring. With no real place to scout, the world is built from invented cartography (custom tiles), concept models (3D), an on-screen prop UI (code), worldbuilding charts and a heavy VFX shot tracker — the opposite half of the artifact menu from Vienna's maps and street views. The film — director \"Sölas Vey\", the colony Meridian, its factions and language — is invented; the reference science (tidal locking, red-dwarf habitability, Proxima Centauri b), the astronomy/landscape images, and the tone films (Dune, Blade Runner 2049, Interstellar) are real and verified.",
    eraRange: "Jun 2025 – Sep 2027",
    accent: "rgb(var(--artifact-cat-viz-fg))",
    createdWithSkillVersion: "filmmaker-canvas@0.1.0",
    stats: {
      charts: 2,
      tables: 14,
      timelines: 1,
      videos: 3,
      websites: 3,
      maps: 0,
      other: 31,
    },
    buildSnapshot: buildTheLongNoonCanvas,
  },
];

export function getSampleCanvas(
  slug: string,
): SampleCanvasDefinition | undefined {
  return SAMPLE_CANVAS_REGISTRY.find((entry) => entry.slug === slug);
}
