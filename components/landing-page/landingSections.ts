export const LANDING_SECTIONS = [
  { id: "canvas-hero", label: "The canvas" },
  { id: "artifacts", label: "Artifacts" },
  { id: "inputs", label: "Inputs" },
  { id: "use-cases", label: "Use cases" },
] as const;

export type LandingSectionId = (typeof LANDING_SECTIONS)[number]["id"];

export const LANDING_COPY = {
  canvasHero: {
    tagline: "Open canvas for AI work",
    title: "An open canvas for your AI work.",
    body: "Flowstate turns linear AI chat into a spatial canvas — so your best prompts, docs, research, and builds live somewhere you can actually find, reuse, and share.",
  },
  artifacts: {
    eyebrow: "What you can make",
    title: "Tables, maps, charts — whatever your question needs",
    body: "These are the same artifact components from the canvas. When we improve them in the product, you see it here too.",
  },
  inputs: {
    eyebrow: "What you can bring",
    title: "Paste a link, drop a file, attach a skill",
    body: "Bring your references into a question — images, PDFs, YouTube links, Google Docs, and more. The composer uses the same attachment UI as the app.",
  },
  useCases: {
    title: "Bring anything you're working on.",
    body: "From a side project to a job hunt to next week's dinners — if you're working it out with AI, it belongs on a canvas.",
    cards: [
      {
        id: "interview",
        icon: "interview" as const,
        title: "Prepare for an interview",
        description:
          "Research, questions, and notes side by side — ready when you are.",
      },
      {
        id: "tool",
        icon: "tool" as const,
        title: "Build a tool",
        description:
          "Keep prompts, code, and iterations in one place as the build takes shape.",
      },
      {
        id: "trip",
        icon: "trip" as const,
        title: "Plan a trip",
        description:
          "Itineraries, maps, and options laid out instead of scrolled past.",
      },
      {
        id: "meals",
        icon: "meals" as const,
        title: "Plan meals & workouts",
        description:
          "A living plan you can adjust, not a thread you have to dig through.",
      },
      {
        id: "finance",
        icon: "finance" as const,
        title: "Sort personal finances",
        description:
          "Numbers, scenarios, and decisions captured where you can compare them.",
      },
      {
        id: "learn",
        icon: "learn" as const,
        title: "Learn something new",
        description:
          "Turn a sprawling chat into a canvas you can actually study from.",
      },
    ],
  },
} as const;
