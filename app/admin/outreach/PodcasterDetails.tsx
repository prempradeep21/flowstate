"use client";

import type { ReactNode } from "react";
import { compactCount, type OutreachPodcaster } from "@/lib/outreach/podcasters";

const linkClass =
  "text-canvas-accent underline-offset-2 hover:underline break-all";

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex min-w-0 flex-col gap-2">
      <h3 className="text-canvas-micro font-semibold uppercase tracking-wider text-canvas-muted">{title}</h3>
      <div className="flex flex-col gap-1.5 text-canvas-body-sm text-canvas-ink">{children}</div>
    </section>
  );
}

function Empty({ children = "Nothing recorded." }: { children?: ReactNode }) {
  return <p className="text-canvas-muted">{children}</p>;
}

function Ext({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noreferrer" className={linkClass}>
      {children}
    </a>
  );
}

function Prose({ text }: { text: string | null }) {
  return text ? <p className="whitespace-pre-wrap leading-relaxed">{text}</p> : <Empty />;
}

/**
 * Everything the prospecting routine found for one show, under its table row:
 * traction evidence, competitors, verified contacts and the message notes.
 */
export function PodcasterDetails({
  row,
  byId,
}: {
  row: OutreachPodcaster;
  byId: Map<string, OutreachPodcaster>;
}) {
  const team = [...row.team].sort((a, b) => (a.priority ?? 99) - (b.priority ?? 99));
  const example = row.example_canvas_from ? byId.get(row.example_canvas_from) : null;

  return (
    <div className="grid gap-6 bg-canvas-bg px-6 py-5 md:grid-cols-2 xl:grid-cols-3">
      <Section title="Traction">
        <p>
          {compactCount(row.subscribers)} subscribers · median {compactCount(row.median_views_last10)} views on
          the last 10 episodes{row.views_range_last10 ? ` (range ${row.views_range_last10})` : ""}
        </p>
        <p>
          Last episode {row.last_episode_date ?? "not read"}
          {row.cadence ? ` · ${row.cadence}` : ""}
        </p>
        <p className="text-canvas-muted">
          Measured {row.metrics_measured_on ?? "—"} via {row.metrics_source ?? "—"}
        </p>
      </Section>

      <Section title="Top videos">
        {row.top_videos.length ? (
          row.top_videos.map((v) => (
            <p key={v.url}>
              <Ext href={v.url}>{v.title}</Ext>
              <span className="text-canvas-muted">
                {" "}
                · {compactCount(v.views)} views · {v.comments ?? "?"} comments · {v.upload_date ?? "?"}
              </span>
            </p>
          ))
        ) : (
          <Empty />
        )}
      </Section>

      <Section title={`Competitors${row.rank_in_competitor_set ? ` · ranks ${row.rank_in_competitor_set}` : ""}`}>
        {row.competitors.length ? (
          row.competitors.map((c) => (
            <p key={c.name}>
              {c.url ? <Ext href={c.url}>{c.name}</Ext> : c.name}
              <span className="text-canvas-muted">
                {" "}
                · {compactCount(c.subscribers)} subs · median {compactCount(c.median_views_last10)}
                {c.size_note ? ` · ${c.size_note}` : ""}
              </span>
            </p>
          ))
        ) : (
          <Empty />
        )}
      </Section>

      <Section title="Verified emails">
        {row.emails.length ? (
          row.emails.map((e) => (
            <p key={e.address}>
              <span className="font-medium">{e.address}</span>
              <span className="text-canvas-muted">
                {" "}
                · {e.confidence}
                {e.role_or_owner ? ` · ${e.role_or_owner}` : ""} ·{" "}
              </span>
              <Ext href={e.source_url}>source</Ext>
            </p>
          ))
        ) : (
          <Empty>None verified.</Empty>
        )}
      </Section>

      <Section title="Team">
        {team.length ? (
          team.map((t) => (
            <p key={t.name}>
              <span className="font-medium">
                {t.priority ? `${t.priority}. ` : ""}
                {t.name}
              </span>
              {t.title ? <span className="text-canvas-muted">, {t.title}</span> : null}
              {t.former_staff_flag ? <span className="text-canvas-danger"> · former staff</span> : null}
              {t.linkedin_url ? (
                <>
                  {" "}
                  · <Ext href={t.linkedin_url}>LinkedIn</Ext>
                </>
              ) : null}
              {t.x_url ? (
                <>
                  {" "}
                  · <Ext href={t.x_url}>X</Ext>
                </>
              ) : null}
              {t.fit_for_pitch ? <span className="block text-canvas-muted">{t.fit_for_pitch}</span> : null}
            </p>
          ))
        ) : (
          <Empty />
        )}
      </Section>

      <Section title="Channels">
        {row.channels.length ? (
          row.channels.map((c) => (
            <p key={c.url}>
              <span className="text-canvas-muted">{c.platform}: </span>
              <Ext href={c.url}>{c.url.replace(/^https?:\/\/(www\.)?/, "")}</Ext>
            </p>
          ))
        ) : (
          <Empty />
        )}
      </Section>

      <Section title="Checked and not found">
        {row.not_found.length ? (
          row.not_found.map((n) => (
            <p key={n.what}>
              <span className="font-medium">{n.what}</span>
              <span className="text-canvas-muted"> — tried {n.sources_tried}</span>
            </p>
          ))
        ) : (
          <Empty />
        )}
      </Section>

      <Section title="Why it fits">
        <Prose text={row.content_fit_note} />
      </Section>

      <Section title="Video brief">
        <Prose text={row.video_brief} />
      </Section>

      <Section title="Message">
        <p>
          <span className="text-canvas-muted">To: </span>
          {row.primary_email ?? "—"}
        </p>
        <p>
          <span className="text-canvas-muted">Subject: </span>
          {row.email_subject ?? "—"}
        </p>
        <p>
          <span className="text-canvas-muted">Episode cited: </span>
          {row.episode_referenced ?? "—"}
        </p>
        {row.assumes_listened ? (
          <p className="text-canvas-muted">Assumes you watched: {row.assumes_listened}</p>
        ) : null}
        {example ? (
          <p>
            <span className="text-canvas-muted">Example canvas: </span>
            {example.podcast_name}
          </p>
        ) : null}
      </Section>

      <Section title="Files">
        {row.drive_folder_url ? <Ext href={row.drive_folder_url}>Drive folder</Ext> : <Empty>No Drive folder yet.</Empty>}
        {row.gmail_draft_id ? <p className="text-canvas-muted">Gmail draft ready</p> : null}
      </Section>

      <Section title="Notes">
        <Prose text={row.notes} />
        <p className="text-canvas-muted">
          {row.source === "prospecting" ? `Prospected ${row.added_on ?? ""} · run ${row.run_id ?? "—"}` : "Added by hand"}
        </p>
      </Section>
    </div>
  );
}
