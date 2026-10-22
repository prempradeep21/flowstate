import type { ArtifactKind } from "@/lib/artifactTypes";

/**
 * What a generating artifact is called before the model has named it.
 *
 * A skeleton's `generatingPreview.title` is empty until the streamed
 * emit_artifact call carries a title (or the artifact being edited lends its
 * own). Nothing falls back to the card's question any more — a 48-character
 * slice of "what are the other top theatres of the city?" reads as the
 * artifact's name, which it is not. Instead the skeleton says what is in the
 * works, per kind, and the card's preview pill uses the plain noun.
 */

const KIND_NOUN: Record<ArtifactKind, string> = {
  table: "table",
  images: "image gallery",
  "3d": "3D model",
  custom: "custom view",
  code: "code",
  todo: "to-do list",
  calendar: "calendar",
  map: "map",
  streetview: "street view",
  website: "website",
  repo: "repository",
  embed: "embed",
  "google-doc": "Google Doc",
  timeline: "timeline",
  chart: "chart",
  audio: "audio clip",
  stickynote: "sticky note",
  quote: "quote",
  stat: "figure",
  definition: "definition",
  claim: "claim",
  mechanism: "mechanism",
  episode: "episode",
  linkgroup: "link group",
};

/** One short "in the works" phrase per kind — stable, so a skeleton never flickers. */
const WORKING_LABEL: Record<ArtifactKind, string> = {
  table: "Cooking up a table",
  images: "Gathering the images",
  "3d": "Shaping the 3D model",
  custom: "Building a custom view",
  code: "Writing the code",
  todo: "Lining up the to-dos",
  calendar: "Marking the calendar",
  map: "Plotting the map",
  streetview: "Finding the street view",
  website: "Pulling up the website",
  repo: "Opening the repository",
  embed: "Setting up the embed",
  "google-doc": "Drafting the doc",
  timeline: "Sketching a timeline",
  chart: "Charting it out",
  audio: "Cueing the audio",
  stickynote: "Jotting a note",
  quote: "Pulling the quote",
  stat: "Crunching the figure",
  definition: "Pinning down the definition",
  claim: "Weighing the claim",
  mechanism: "Tracing the mechanism",
  episode: "Queuing the episode",
  linkgroup: "Rounding up the links",
};

/** Lowercase noun for a kind: "table", "street view", "to-do list". */
export function artifactKindNoun(kind: ArtifactKind): string {
  return KIND_NOUN[kind] ?? "artifact";
}

/** Capitalised noun, for pills and notices that need a name: "Table". */
export function artifactKindTitle(kind: ArtifactKind): string {
  const noun = artifactKindNoun(kind);
  return noun.charAt(0).toUpperCase() + noun.slice(1);
}

/** The skeleton's headline while the artifact is unnamed: "Cooking up a table". */
export function generatingArtifactLabel(kind: ArtifactKind): string {
  return WORKING_LABEL[kind] ?? "Working on it";
}

/** A skeleton's headline: the model's title once known, the working label until then. */
export function generatingArtifactHeadline(preview: {
  kind: ArtifactKind;
  title?: string;
}): string {
  return preview.title?.trim() || generatingArtifactLabel(preview.kind);
}
