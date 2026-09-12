export interface LoaderLine {
  text: string;
  /** Real usage tips get a "Tip" eyebrow; quips render without one. */
  kind: "tip" | "quip";
}

/**
 * Rotating copy for the canvas-loading overlay: real Flowstate tips
 * interleaved with a few of the original cheeky status lines (~1 quip
 * per 3 tips, spread through the rotation).
 */
export const LOADER_LINES: LoaderLine[] = [
  { text: "Hold Z anywhere for a radial menu of quick actions at your cursor.", kind: "tip" },
  { text: "Press Q to drop a question anywhere on the canvas.", kind: "tip" },
  { text: "Press T for a text label, S for a sticky note.", kind: "tip" },
  { text: "Untangling thought threads…", kind: "quip" },
  { text: "Paste a URL or image with Ctrl+V — it becomes a live artifact.", kind: "tip" },
  { text: "Drag PDFs or spreadsheets onto the canvas and ask them questions.", kind: "tip" },
  { text: "Answers from documents come with page and cell citations.", kind: "tip" },
  { text: "Bribing the layout engine with coffee…", kind: "quip" },
  { text: "Pull a branch from any answer to explore a tangent without losing the thread.", kind: "tip" },
  { text: "Artifacts update in place — ask for a change and the table redraws itself.", kind: "tip" },
  { text: "Share the whole canvas with one link. Collaborators show up as live cursors.", kind: "tip" },
  { text: "Herding chat nodes into formation…", kind: "quip" },
  { text: "Right-click a card and choose Set as thumbnail to pick the canvas cover.", kind: "tip" },
  { text: "Paste a GitHub repo link and Flowstate will explain it on the canvas.", kind: "tip" },
  { text: "Press Ctrl+Z to undo — it works for canvas moves too.", kind: "tip" },
  { text: "Polishing the infinite grid…", kind: "quip" },
];
