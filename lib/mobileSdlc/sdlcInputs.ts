import type { CanvasAssetKind } from "@/lib/store";
import type { StickyNoteColorId } from "@/lib/artifactTypes";

export type SdlcInputKind =
  | "google-doc"
  | "embed-figma"
  | "repo"
  | "website"
  | "asset"
  | "audio"
  | "stickynote"
  | "skill";

export interface SdlcInputDefinition {
  id: string;
  phaseId: string;
  title: string;
  kind: SdlcInputKind;
  /** Primary URL for link-based inputs */
  url?: string;
  /** Bundled path under /mobile-sdlc-sandbox/samples/ */
  samplePath?: string;
  assetKind?: CanvasAssetKind;
  mimeType?: string;
  fileName?: string;
  stickyText?: string;
  stickyColor?: StickyNoteColorId;
  /** Pre-seeded extracted text for google-doc artifacts (sandbox offline preview) */
  extractedText?: string;
  audioDurationMs?: number;
  audioSeed?: number;
}

const SAMPLES = "/mobile-sdlc-sandbox/samples";

export const SDLC_INPUTS: SdlcInputDefinition[] = [
  // —— Charter ——
  {
    id: "prd-doc",
    phaseId: "charter",
    title: "Feature PRD (Google Doc)",
    kind: "google-doc",
    url: "https://docs.google.com/document/d/1Dqg-U-zdinUwG3DO94SBmUf0irtwqw5A_YxIW60-qhU/edit",
    extractedText:
      "Firefox Marketplace International Content Ratings PRD — mobile app requirements, user stories, open issues, and release criteria for marketplace content ratings feature.",
  },
  {
    id: "prd-pdf",
    phaseId: "charter",
    title: "Gullak PRD (PDF)",
    kind: "asset",
    samplePath: `${SAMPLES}/gullak-prd.pdf`,
    assetKind: "document",
    mimeType: "application/pdf",
    fileName: "gullak-prd.pdf",
  },
  {
    id: "competitive-sheet",
    phaseId: "charter",
    title: "Competitive analysis (Sheet)",
    kind: "google-doc",
    url: "https://docs.google.com/spreadsheets/d/1mDIUg3cI1nxU6MCbjGpAiIOR0LryHTD-iy6BxzCHXac/edit",
    extractedText:
      "Competitor overview matrix — domain authority, organic traffic, keyword gaps, content comparison tabs for feature benchmarking.",
  },
  {
    id: "business-template",
    phaseId: "charter",
    title: "Mobile PRD template guide",
    kind: "website",
    url: "https://www.ideaplan.io/templates/mobile-app-prd-template",
  },

  // —— Discovery ——
  {
    id: "user-interview",
    phaseId: "discovery",
    title: "User interview (audio)",
    kind: "audio",
    audioDurationMs: 95_000,
    audioSeed: 2,
  },
  {
    id: "persona-deck",
    phaseId: "discovery",
    title: "Persona pitch outline",
    kind: "asset",
    samplePath: `${SAMPLES}/persona-deck-outline.md`,
    assetKind: "document",
    mimeType: "text/markdown",
    fileName: "persona-deck-outline.md",
  },
  {
    id: "problem-framing",
    phaseId: "discovery",
    title: "Problem framing",
    kind: "stickynote",
    stickyText:
      "Jobs-to-be-done:\n• Track daily expenses offline\n• Save toward family goals\n• Understand spending in Marathi\n\nSuccess metrics: D7 retention, weekly active savers",
    stickyColor: "turbo",
  },

  // —— Design ——
  {
    id: "figma-banking",
    phaseId: "design",
    title: "Digital Banking UI kit (Figma)",
    kind: "embed-figma",
    url: "https://www.figma.com/design/1559843949918091398/Digital-Banking-Mobile-App",
  },
  {
    id: "figma-mobile-kit",
    phaseId: "design",
    title: "Dynamic Layer mobile kit (Figma)",
    kind: "embed-figma",
    url: "https://www.figma.com/design/1226993304994576514/Dynamic-Layer-Mobile-UI-Kit",
  },
  {
    id: "wireframe-a",
    phaseId: "design",
    title: "Wireframe — onboarding flow",
    kind: "asset",
    samplePath: "/catalog/potato-growth-stages.png",
    assetKind: "image",
    mimeType: "image/png",
    fileName: "wireframe-onboarding.png",
  },
  {
    id: "wireframe-b",
    phaseId: "design",
    title: "Wireframe — home dashboard",
    kind: "asset",
    samplePath: "/catalog/jathiratnalu-poster.png",
    assetKind: "image",
    mimeType: "image/png",
    fileName: "wireframe-home.png",
  },

  // —— Build ——
  {
    id: "mobile-repo",
    phaseId: "build",
    title: "smooth-app (Flutter iOS/Android)",
    kind: "repo",
    url: "https://github.com/openfoodfacts/smooth-app",
  },
  {
    id: "sprint-backlog",
    phaseId: "build",
    title: "Sprint backlog (CSV)",
    kind: "asset",
    samplePath: `${SAMPLES}/sprint-backlog.csv`,
    assetKind: "spreadsheet",
    mimeType: "text/csv",
    fileName: "sprint-backlog.csv",
  },
  {
    id: "openapi-spec",
    phaseId: "build",
    title: "Petstore OpenAPI 3.0",
    kind: "asset",
    samplePath: `${SAMPLES}/petstore-openapi.json`,
    assetKind: "code",
    mimeType: "application/json",
    fileName: "petstore-openapi.json",
  },
  {
    id: "architecture-rfc",
    phaseId: "build",
    title: "Architecture RFC",
    kind: "asset",
    samplePath: `${SAMPLES}/architecture-rfc.md`,
    assetKind: "document",
    mimeType: "text/markdown",
    fileName: "architecture-rfc.md",
  },

  // —— Quality ——
  {
    id: "qa-test-plan",
    phaseId: "quality",
    title: "QA test plan (PDF)",
    kind: "asset",
    samplePath: `${SAMPLES}/qa-test-plan.pdf`,
    assetKind: "document",
    mimeType: "application/pdf",
    fileName: "qa-test-plan.pdf",
  },
  {
    id: "beta-feedback",
    phaseId: "quality",
    title: "Beta feedback tracker (CSV)",
    kind: "asset",
    samplePath: `${SAMPLES}/beta-feedback.csv`,
    assetKind: "spreadsheet",
    mimeType: "text/csv",
    fileName: "beta-feedback.csv",
  },
  {
    id: "review-guidelines",
    phaseId: "quality",
    title: "App Store Review Guidelines",
    kind: "website",
    url: "https://developer.apple.com/app-store/review/guidelines/",
  },

  // —— Ship ——
  {
    id: "release-checklist",
    phaseId: "ship",
    title: "Release checklist",
    kind: "asset",
    samplePath: `${SAMPLES}/release-checklist.md`,
    assetKind: "document",
    mimeType: "text/markdown",
    fileName: "release-checklist.md",
  },
  {
    id: "kpi-sheet",
    phaseId: "ship",
    title: "KPI tracker (Sheet scaffold)",
    kind: "google-doc",
    url: "https://docs.google.com/spreadsheets/d/1mDIUg3cI1nxU6MCbjGpAiIOR0LryHTD-iy6BxzCHXac/edit",
    extractedText:
      "KPI tracker scaffold — D1/D7 retention, crash-free rate, store conversion, weekly active users. Relabel columns for your launch metrics.",
  },
  {
    id: "store-listing",
    phaseId: "ship",
    title: "Cashew — Google Play (shipped app)",
    kind: "website",
    url: "https://play.google.com/store/apps/details?id=com.budget.tracker_app",
  },
  {
    id: "sdlc-skill",
    phaseId: "ship",
    title: "Mobile SDLC skill",
    kind: "skill",
    samplePath: `${SAMPLES}/mobile-sdlc.md`,
    fileName: "mobile-sdlc.md",
  },
];

export function sdlcInputsForPhase(phaseId: string): SdlcInputDefinition[] {
  return SDLC_INPUTS.filter((input) => input.phaseId === phaseId);
}
