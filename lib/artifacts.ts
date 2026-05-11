// Dummy artifact content for the floating document badge.
//
// Per the V1 spec all responses are placeholder, so the artifact content is
// likewise placeholder. Each variant shares the same skeleton (H1 title,
// intro paragraph, an H2 + bullet list, an H2 + paragraph, a closing
// blockquote) so the panel looks consistent regardless of which variant a
// card happens to draw — only the topic and wording vary.

export type ArtifactId = "primer" | "playbook" | "fieldNotes" | "rationale";

export const ARTIFACT_IDS: ArtifactId[] = [
  "primer",
  "playbook",
  "fieldNotes",
  "rationale",
];

const ARTIFACTS: Record<ArtifactId, string> = {
  primer: `# Primer

A short orientation document for thinking about the shape of this question before you commit to an angle. Use it as a warm-up, not as an answer.

## Where to start

- Frame the smallest version of the question that still feels interesting
- Name one assumption you suspect is doing most of the work
- Pick a single time horizon and hold it fixed for the first pass
- Resist the urge to pick a side until the terrain is clearer

## What this is for

This document is a scaffold, not a conclusion. It exists to slow the first few minutes of inquiry down enough that the obvious framing doesn't quietly win by default. Treat the bullets above as prompts, not steps.

> "The hard part is rarely the first step; it is keeping the constraints stable while you take the second."
`,

  playbook: `# Playbook

A repeatable sequence for unpacking a question without losing your place. Lean on it whenever a thread starts to feel tangled.

## The moves

- Restate the question in your own words before answering
- Separate the mechanism from the outcome it tends to produce
- Trace incentives one step further than feels necessary
- Vary the time horizon and watch which conclusions move
- Note any branch worth returning to and let it sit

## When to use it

These five moves are deliberately generic so they fit most threads. The point is not to follow them in order — it is to have a checklist you can run against your current line of inquiry to see which moves you have skipped.

> "Causation here flows in more directions than the prevailing framing suggests."
`,

  fieldNotes: `# Field Notes

Loose observations from working through adjacent versions of this question. Not load-bearing; included for texture.

## Patterns worth flagging

- The interesting friction usually lives at the boundary between two systems
- What reads as a single phenomenon is often a family with shared vocabulary
- Most "complete" explanations rest on one or two hidden assumptions
- A good sanity check is to imagine the smallest possible example

## What I'd revisit

Half of these notes were written in the middle of a thread and the other half on the way back. The first set is sharper; the second set is more honest. Neither is a substitute for working the question yourself, but together they sketch a usable map of where the easy traps are.

> "Notice that the answer changes meaningfully when you vary the time horizon."
`,

  rationale: `# Rationale

A condensed argument for why the current framing is worth keeping for one more pass before being thrown out.

## What the framing buys us

- It puts the mechanism in the foreground instead of the outcome
- It survives a change in time horizon without collapsing
- It exposes at least one hidden assumption per pass
- It leaves room for branches without forcing a merge

## What it costs

The framing is not free — it trades breadth for tractability, and treats some genuinely live questions as out of scope until the core thread settles. That trade is fine for a first pass, but the cost is real and worth naming so the next reviewer can decide whether the same trade still makes sense for them.

> "A useful starting point is to separate the mechanism from the outcome it tends to produce."
`,
};

export function pickArtifactId(): ArtifactId {
  return ARTIFACT_IDS[Math.floor(Math.random() * ARTIFACT_IDS.length)];
}

export function getArtifactMarkdown(id: string | undefined): string | null {
  if (!id) return null;
  if ((ARTIFACT_IDS as readonly string[]).includes(id)) {
    return ARTIFACTS[id as ArtifactId];
  }
  return null;
}
