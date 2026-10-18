import { describe, expect, it } from "vitest";
import {
  createArtifactDraftStreamer,
  type ArtifactDraftEvent,
} from "@/lib/llm/artifactDraftStream";

function collect() {
  const events: ArtifactDraftEvent[] = [];
  const streamer = createArtifactDraftStreamer((data) => {
    const draft = (data as { artifactDraft?: ArtifactDraftEvent }).artifactDraft;
    if (draft) events.push(draft);
  });
  return { events, streamer };
}

describe("createArtifactDraftStreamer", () => {
  it("emits as soon as the type is known, then flushes the final state", () => {
    const { events, streamer } = collect();
    streamer.start("call_1", "emit_artifact");
    streamer.append("call_1", '{"ty');
    expect(events).toHaveLength(0);
    streamer.append("call_1", 'pe":"table","title":"Cit');
    expect(events).toEqual([{ id: "call_1", type: "table", title: "Cit" }]);
    // Throttled: the next chunk arrives too soon to send.
    streamer.append("call_1", 'ies","data":{"columns":[{"key":"a","label":"A"}],"rows":[');
    expect(events).toHaveLength(1);
    streamer.end("call_1");
    expect(events).toHaveLength(2);
    expect(events[1]).toEqual({
      id: "call_1",
      type: "table",
      title: "Cities",
      data: { columns: [{ key: "a", label: "A" }], rows: [] },
    });
  });

  it("ignores other tools and unknown types", () => {
    const { events, streamer } = collect();
    streamer.start("call_1", "search_images");
    streamer.append("call_1", '{"query":"paris"}');
    streamer.end("call_1");
    streamer.start("call_2", "emit_artifact");
    streamer.append("call_2", '{"type":"nonsense","title":"x"}');
    streamer.end("call_2");
    expect(events).toHaveLength(0);
  });

  it("streams kinds that need server work as a titled skeleton only", () => {
    const { events, streamer } = collect();
    streamer.start("call_1", "emit_artifact");
    streamer.append("call_1", '{"type":"map","title":"Paris","data":{"place":{"name":"Paris"}}}');
    streamer.end("call_1");
    expect(events).toEqual([{ id: "call_1", type: "map", title: "Paris" }]);
  });
});
