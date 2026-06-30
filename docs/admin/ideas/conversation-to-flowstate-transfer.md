# Conversation to Flowstate Transfer

**Status:** Exploring · **Playground:** available

## Thesis

Paste a transcript and get a spatial map: conversation sections as branching cards, every mentioned link and resource as a canvas artifact beside the moment it was introduced.

## Why Flowstate

Flowstate already materializes URLs, embeds, video, repos, and generated tables/timelines on canvas. This idea inverts the existing export path (canvas → transcript) into **transcript → canvas**.

## The Conversation Card (temporary)

Admin playground only — not in the design system or artifact catalog yet.

- **Not** a Q&A card: summary of what was said in one section
- Main thread flows **left → right**; tangents branch like existing Flowstate threads
- **Transcript only** in v0 — no audio upload, STT, or play snippets

## Worked example: Design tools history

Main spine: Photoshop niche → Canva → Figma disruption → web-native bet → Figma wins.

Branches: Adobe craft · Pre-Figma (Sketch, Zeplin) · Dylan Field / WebGL roots.

Artifacts: website previews (Adobe, Canva, Figma, Sketch, Zeplin), YouTube WebGL water demo, timeline, democratization table, sticky note on invented interactions.

## Add transcript flow (planned)

1. User pastes transcript
2. Server LLM segments sections + branches + entities
3. Conversation cards appear on canvas
4. URL artifacts hydrate in parallel via existing link-preview routes

## Open questions

- Mixed canvas: conversation cards + live Q&A on same surface?
- Human-in-the-loop layout review before spawn?
- When to promote Conversation Card to the main design system?
