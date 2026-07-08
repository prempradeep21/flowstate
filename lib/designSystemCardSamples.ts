import type { ArtifactPayload } from "@/lib/artifactTypes";
import type { Card } from "@/lib/store";
import { CARD_WIDTH } from "@/lib/canvasNodeBounds";

export type DesignSystemCardKind =
  | "text"
  | "streaming"
  | "code"
  | "table"
  | "pending"
  | "retry"
  | "artifact-preview";

export interface DesignSystemCardSample {
  id: string;
  kind: DesignSystemCardKind;
  title: string;
  description: string;
  tags: string[];
  componentPath: string;
  card: Card;
  /** For artifact-preview specimens */
  previewKind?: "table" | "chart" | "custom";
  previewStatus?: "ready" | "generating" | "pending" | "failed";
}

function baseCard(id: string, overrides: Partial<Card> & Pick<Card, "question" | "answer">): Card {
  const { question, answer, status, ...rest } = overrides;
  return {
    id,
    threadId: "design-system",
    question,
    answer,
    status: status ?? "done",
    position: { x: 0, y: 0 },
    parentCardId: null,
    parentConversationId: null,
    responseType: rest.responseType ?? "text",
    ...rest,
  };
}

const tablePayload: ArtifactPayload = {
  type: "table",
  title: "Sprint velocity",
  description: "Points completed per sprint",
  data: {
    columns: [
      { key: "sprint", label: "Sprint" },
      { key: "points", label: "Points" },
    ],
    rows: [
      { sprint: "Sprint 12", points: "34" },
      { sprint: "Sprint 13", points: "41" },
    ],
  },
};

const codePayload: ArtifactPayload = {
  type: "code",
  title: "Auth middleware",
  description: "Next.js route guard",
  data: {
    files: [
      {
        path: "middleware.ts",
        language: "typescript",
        content:
          "export function middleware(req: Request) {\n  return authGuard(req);\n}\n",
      },
    ],
  },
};

export const DESIGN_SYSTEM_CARD_SAMPLES: DesignSystemCardSample[] = [
  {
    id: "text-answer",
    kind: "text",
    title: "Text answer",
    description: "Default inline Q&A body for prose responses on cards.",
    tags: ["Q&A", "markdown", "inline"],
    componentPath: "components/cards/TextCardBody.tsx",
    card: baseCard("ds-card-text", {
      question: "What are good day-trip options from Lisbon?",
      answer:
        "Sintra and Cascais are the easiest wins — both are under an hour by train and pair well with a long weekend in the city.",
    }),
  },
  {
    id: "streaming-text",
    kind: "streaming",
    title: "Streaming text",
    description: "Text body with caret while the model is still writing.",
    tags: ["streaming", "Q&A"],
    componentPath: "components/cards/TextCardBody.tsx",
    card: baseCard("ds-card-streaming", {
      question: "Summarize the product roadmap",
      answer: "Phase one focuses on canvas artifacts and ",
      status: "streaming",
    }),
  },
  {
    id: "code-inline",
    kind: "code",
    title: "Inline code artifact",
    description: "Code files embedded in the card answer chrome.",
    tags: ["code", "artifact", "inline"],
    componentPath: "components/cards/CodeCardBody.tsx",
    card: baseCard("ds-card-code", {
      question: "Add auth middleware for protected routes",
      answer: "Here's a minimal guard you can drop into middleware.ts:",
      responseType: "code",
      artifactPayload: codePayload,
    }),
  },
  {
    id: "table-inline",
    kind: "table",
    title: "Inline table artifact",
    description: "Tabular data rendered inside card answer chrome.",
    tags: ["table", "artifact", "inline"],
    componentPath: "components/cards/TableCardBody.tsx",
    card: baseCard("ds-card-table", {
      question: "Show sprint velocity for the last two sprints",
      answer: "Velocity picked up after the refactor landed:",
      responseType: "table",
      artifactPayload: tablePayload,
    }),
  },
  {
    id: "pending",
    kind: "pending",
    title: "Pending answer",
    description: "Thinking dots, elapsed time, and token usage while waiting.",
    tags: ["loading", "pending", "Q&A"],
    componentPath: "components/cards/PendingAnswerPlaceholder.tsx",
    card: baseCard("ds-card-pending", {
      question: "Analyze the quarterly metrics",
      answer: "",
      status: "thinking",
      thinkingLabel: "Analyzing metrics…",
      askStartedAt: Date.now() - 4200,
      turnUsage: { inputTokens: 1200, outputTokens: 0 },
    }),
  },
  {
    id: "retry",
    kind: "retry",
    title: "Retry placeholder",
    description: "Error state with optional try-again action.",
    tags: ["error", "retry", "Q&A"],
    componentPath: "components/cards/QaRetryPlaceholder.tsx",
    card: baseCard("ds-card-retry", {
      question: "Generate the chart",
      answer: "",
      status: "done",
    }),
  },
  {
    id: "artifact-preview-ready",
    kind: "artifact-preview",
    title: "Artifact preview pill — ready",
    description: "Compact link to a spawned canvas artifact from a card answer.",
    tags: ["preview", "artifact", "pill"],
    componentPath: "components/artifacts/ArtifactPreviewPill.tsx",
    previewKind: "table",
    previewStatus: "ready",
    card: baseCard("ds-card-preview-ready", {
      question: "Build a budget table",
      answer: "I've created a table on the canvas.",
      responseType: "table",
      outputArtifactId: "ds-artifact-1",
      artifactPayload: tablePayload,
    }),
  },
  {
    id: "artifact-preview-generating",
    kind: "artifact-preview",
    title: "Artifact preview pill — generating",
    description: "Preview pill while an artifact is still materializing.",
    tags: ["preview", "generating"],
    componentPath: "components/artifacts/ArtifactPreviewPill.tsx",
    previewKind: "chart",
    previewStatus: "generating",
    card: baseCard("ds-card-preview-gen", {
      question: "Chart monthly spend",
      answer: "",
      status: "streaming",
      responseType: "chart",
    }),
  },
];

export const DESIGN_SYSTEM_CARD_WIDTH = CARD_WIDTH;
