import { describe, expect, it } from "vitest";
import { fetchCanvasList } from "@/lib/canvasPersistence";

/**
 * A canvas stamped by a copy path (sample canvases, the transcript playground's
 * "Publish to canvas") is inserted with state but no content_edited_at. The
 * server orders that column NULLS LAST, so such a row came back below every
 * canvas the user had ever edited — a just-created copy looked like it had
 * never been created, which is how "the duplicate is not present" reads.
 */

type Row = {
  id: string;
  title: string;
  is_default: boolean;
  updated_at: string;
  content_edited_at: string | null;
  thumbnail_url: string | null;
};

/** Mimics PostgREST's `content_edited_at desc nullsFirst:false`. */
function serverOrder(rows: Row[]): Row[] {
  const dated = rows.filter((r) => r.content_edited_at !== null);
  const nulls = rows.filter((r) => r.content_edited_at === null);
  dated.sort(
    (a, b) =>
      new Date(b.content_edited_at!).getTime() -
      new Date(a.content_edited_at!).getTime(),
  );
  return [...dated, ...nulls];
}

function stubSupabase(rows: Row[]) {
  return {
    from: () => ({
      select: () => ({
        eq: () => ({
          order: () => ({ data: serverOrder(rows), error: null }),
        }),
      }),
    }),
  } as unknown as Parameters<typeof fetchCanvasList>[0];
}

describe("fetchCanvasList ordering", () => {
  it("puts a freshly copied canvas first, not last", async () => {
    const rows: Row[] = [
      {
        id: "old",
        title: "Edited last week",
        is_default: false,
        updated_at: "2026-09-14T00:00:00.000Z",
        content_edited_at: "2026-09-14T00:00:00.000Z",
        thumbnail_url: null,
      },
      {
        id: "fresh",
        title: "Prashant Kishor (2)",
        is_default: false,
        // Just inserted by a copy path: real updated_at, no content edit yet.
        updated_at: "2026-09-21T12:00:00.000Z",
        content_edited_at: null,
        thumbnail_url: null,
      },
    ];

    // The server hands back the fresh row LAST because its column is null.
    expect(serverOrder(rows).map((r) => r.id)).toEqual(["old", "fresh"]);

    const list = await fetchCanvasList(stubSupabase(rows), "user-1");

    expect(list.map((c) => c.id)).toEqual(["fresh", "old"]);
    expect(list[0]!.contentEditedAt).toBe("2026-09-21T12:00:00.000Z");
  });
});
