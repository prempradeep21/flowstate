export const LANDING_SECTIONS = [
  { id: "hero", label: "Start" },
  { id: "problem", label: "Why" },
  { id: "vision", label: "Vision" },
  { id: "how-it-works", label: "Canvas" },
  { id: "artifacts", label: "Artifacts" },
  { id: "inputs", label: "Inputs" },
  { id: "start", label: "Begin" },
] as const;

export type LandingSectionId = (typeof LANDING_SECTIONS)[number]["id"];

export const LANDING_COPY = {
  hero: {
    eyebrow: "Flowstate",
    title: "Your thoughts deserve a map, not a scroll",
    body: "When you research, plan, or figure something out, your mind branches. Flowstate gives you a canvas where every question stays where you put it — and nothing gets buried above the fold.",
  },
  problem: {
    eyebrow: "Why this exists",
    title: "Linear chat was never built for how you think",
    body: "You jump between threads, lose the earlier branch, and scroll back hunting for context. On a canvas, your parallel lines stay visible — and you always know where you are.",
  },
  vision: {
    eyebrow: "What changes for you",
    title: "Hold more in your head, with less effort",
    body: "You can explore a side question without abandoning the main one. Dead ends stay on the map. When two threads connect, you see it — because the shape of your session is right in front of you.",
  },
  howItWorks: {
    eyebrow: "The canvas",
    title: "Same cards, same curves — the real product",
    body: "Pan, zoom, and branch exactly like you would in Flowstate. Press Q to drop a question. Pull a side plug to split a thread. Every card keeps the full context of what came before.",
  },
  artifacts: {
    eyebrow: "What you can make",
    title: "Tables, maps, charts — whatever your question needs",
    body: "These are the same artifact components from the canvas. When we improve them in the product, you see it here too.",
  },
  inputs: {
    eyebrow: "What you can bring",
    title: "Paste a link, drop a file, attach a skill",
    body: "Bring your references into a question — images, PDFs, YouTube links, GitHub repos, Google Docs, and more. The composer uses the same attachment UI as the app.",
  },
  start: {
    eyebrow: "Begin",
    title: "Open a blank canvas and start where you are",
    body: "No setup ritual. Drop your first question, branch when you need to, and come back tomorrow — your session keeps its shape.",
  },
} as const;
