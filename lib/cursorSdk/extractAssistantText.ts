import type { SDKMessage } from "@cursor/sdk";

function textFromAssistantEvent(event: SDKMessage): string {
  if (event.type !== "assistant") return "";
  return event.message.content
    .filter(
      (block): block is { type: "text"; text: string } => block.type === "text",
    )
    .map((block) => block.text)
    .join("");
}

/**
 * Reconstruct the final assistant reply from streamed SDK events.
 * The agent emits many assistant snapshots/deltas — joining with `\n\n`
 * turns each fragment into its own markdown paragraph and breaks layout.
 */
export function extractAssistantText(events: SDKMessage[]): string {
  const segments = events
    .map(textFromAssistantEvent)
    .filter((text) => text.length > 0);

  if (segments.length === 0) return "";
  if (segments.length === 1) return segments[0]!.trim();

  const first = segments[0]!;
  const last = segments[segments.length - 1]!;

  // Cumulative snapshots: later events extend earlier text.
  const probe = first.slice(0, Math.min(first.length, 48));
  if (probe && last.length >= first.length && last.includes(probe)) {
    return last.trim();
  }

  // Incremental deltas: concatenate in order without paragraph breaks.
  return segments.join("").trim();
}
