/**
 * Podcaster outreach CLI — how the outreach routines read and write the
 * portal's copy of the leads (Supabase outreach_podcasters).
 *
 *   npx tsx --env-file=.env.local scripts/outreach/cli.ts <command> [args]
 *
 *   ledger                      every show already in the portal, as JSON (for dedupe)
 *   insert <file.json>          add prospected shows (array); existing podcast_keys are left untouched
 *   queued                      rows waiting for the assets routine, with their example canvas resolved
 *   get <id>                    one row
 *   update <id> <file.json>     set fields on one row (routines may only move queued → drafted)
 *   showcase <id> <video.mp4>   make a rendered video the row's showcase (outreach-media bucket)
 *   sheet-import <file.json>    apply hand edits read from the sheet's Leads tab (2-D values array)
 *   sheet-export <out.json>     write the Leads tab values (header row first) to a file
 *
 * The Google side is not touched here. The routine reads and writes the
 * tracking sheet with Claude's Google Sheets connector, using sheet-import /
 * sheet-export as the bridge; Excluded and Runs tabs are appended directly.
 * JSON arguments are file paths (write them to the scratchpad), not inline JSON.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { extname } from "node:path";
import { randomUUID } from "node:crypto";
import { OUTREACH_MEDIA_BUCKET } from "@/lib/outreach/podcasters";
import {
  getPodcaster,
  insertProspects,
  listPodcasters,
  updatePodcaster,
  type PodcasterFields,
} from "@/lib/outreach/podcasters.server";
import { editsFromSheet, leadSheetValues } from "@/lib/outreach/sheet";
import { createServiceRoleClient } from "@/lib/supabase/serviceRole";

const VIDEO_MIME: Record<string, string> = {
  ".mp4": "video/mp4",
  ".mov": "video/quicktime",
  ".webm": "video/webm",
};

const readJson = <T>(path: string): T => JSON.parse(readFileSync(path, "utf8")) as T;
const print = (v: unknown) => console.log(JSON.stringify(v, null, 2));

async function main() {
  const [cmd, a, b] = process.argv.slice(2);
  switch (cmd) {
    case "ledger": {
      const rows = await listPodcasters();
      print(
        rows.map((r) => ({
          id: r.id,
          podcast_key: r.podcast_key,
          name: r.podcast_name,
          host: r.host_name,
          url: r.podcast_url,
          niche: r.niche,
          country: r.country,
          lane: r.lane,
          stage: r.stage,
          added_on: r.added_on ?? r.created_at.slice(0, 10),
        })),
      );
      return;
    }
    case "insert": {
      const result = await insertProspects(readJson(a));
      print({ inserted: result.inserted.map((r) => ({ id: r.id, podcast_key: r.podcast_key })), skipped_existing: result.skipped });
      return;
    }
    case "queued": {
      const rows = await listPodcasters();
      const byId = new Map(rows.map((r) => [r.id, r]));
      print({
        queued: rows
          .filter((r) => r.stage === "queued")
          .map((r) => {
            const ex = r.example_canvas_from ? byId.get(r.example_canvas_from) : null;
            return {
              ...r,
              example: ex ? { id: ex.id, podcast_name: ex.podcast_name, niche: ex.niche, canvas_url: ex.canvas_url, video_path: ex.video_path } : null,
            };
          }),
        // Candidates for rows whose example canvas is left to the routine.
        example_canvases: rows
          .filter((r) => r.canvas_url && r.video_path)
          .map((r) => ({ id: r.id, podcast_name: r.podcast_name, niche: r.niche, domain: r.domain, canvas_url: r.canvas_url })),
      });
      return;
    }
    case "get":
      print(await getPodcaster(a));
      return;
    case "update": {
      const patch = readJson<PodcasterFields>(b);
      const current = await getPodcaster(a);
      if (!current) throw new Error(`No row ${a}`);
      // Routines move rows forward only; sent/replied/passed are a person's call.
      if (patch.stage && patch.stage !== current.stage && !(current.stage === "queued" && patch.stage === "drafted")) {
        throw new Error(`Routines may only move queued → drafted (row is ${current.stage}).`);
      }
      print(await updatePodcaster(a, patch));
      return;
    }
    case "showcase": {
      const mime = VIDEO_MIME[extname(b).toLowerCase()];
      if (!mime) throw new Error("Showcase must be .mp4, .mov or .webm");
      const path = `videos/${randomUUID()}${extname(b).toLowerCase()}`;
      const { error } = await createServiceRoleClient()
        .storage.from(OUTREACH_MEDIA_BUCKET)
        .upload(path, readFileSync(b), { contentType: mime });
      if (error) throw new Error(error.message);
      const row = await updatePodcaster(a, { video_path: path });
      print({ video_path: path, podcast: row?.podcast_name });
      return;
    }
    case "sheet-import": {
      const values = readJson<string[][]>(a);
      // Accept the tab with or without its header row.
      const rows = values[0]?.[0] === "id" ? values.slice(1) : values;
      const edits = editsFromSheet(rows.map((r) => r.map((c) => String(c ?? ""))));
      for (const [id, patch] of edits) await updatePodcaster(id, patch);
      print({ applied: [...edits].map(([id, patch]) => ({ id, ...patch })) });
      return;
    }
    case "sheet-export": {
      const values = leadSheetValues(await listPodcasters());
      writeFileSync(a, JSON.stringify(values));
      print({ file: a, rows: values.length - 1, columns: values[0].length });
      return;
    }
    default:
      console.error("Commands: ledger | insert | queued | get | update | showcase | sheet-import | sheet-export");
      process.exit(1);
  }
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
