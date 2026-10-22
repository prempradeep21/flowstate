"use client";

import { Fragment, useMemo, useState } from "react";
import { Check, ChevronDown, ChevronRight, Copy, ExternalLink, Pencil, Play, Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { IconButton } from "@/components/ui/IconButton";
import { copyTextToClipboard } from "@/lib/artifactExport/clipboard";
import {
  COPY_KINDS,
  DECISIONS,
  DECISION_LABELS,
  STAGES,
  STAGE_LABELS,
  compactCount,
  videoPublicUrl,
  type CopyKey,
  type Decision,
  type OutreachPodcaster,
  type Stage,
} from "@/lib/outreach/podcasters";
import { CopyModal } from "@/app/admin/outreach/CopyModal";
import { PodcasterDetails } from "@/app/admin/outreach/PodcasterDetails";
import { PodcasterFormModal } from "@/app/admin/outreach/PodcasterFormModal";
import { VideoModal } from "@/app/admin/outreach/VideoModal";
import { patchPodcaster, submitDecisions } from "@/app/admin/outreach/outreachApi";

function useCopiedFlash() {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  async function copy(id: string, text: string) {
    if (await copyTextToClipboard(text)) {
      setCopiedId(id);
      window.setTimeout(() => setCopiedId((cur) => (cur === id ? null : cur)), 1600);
    }
  }
  return { copiedId, copy };
}

const TABS: { key: string; label: string; stages: readonly Stage[] }[] = [
  { key: "review", label: "To review", stages: ["new"] },
  { key: "queued", label: "Queued", stages: ["queued"] },
  { key: "drafted", label: "Drafted", stages: ["drafted"] },
  { key: "contacted", label: "Contacted", stages: ["sent", "replied"] },
  { key: "closed", label: "Skipped / passed", stages: ["skipped", "passed"] },
  { key: "all", label: "All", stages: STAGES },
];

type Draft = { decision: Decision; example_canvas_from: string | null };

const linkClass =
  "text-canvas-ink underline decoration-canvas-border underline-offset-4 hover:decoration-canvas-ink";
const actionClass =
  "text-canvas-body-sm font-medium text-canvas-accent hover:underline underline-offset-2 disabled:text-canvas-muted";
const thClass = "px-4 py-3 font-semibold";
const pillClass = "rounded-full border border-canvas-border px-2 py-0.5 text-canvas-micro text-canvas-muted";
const selectClass =
  "h-8 rounded-canvas-md border border-canvas-border bg-canvas-bg px-2 text-canvas-body-sm text-canvas-ink outline-none focus:border-canvas-accent";

function TractionCell({ row }: { row: OutreachPodcaster }) {
  if (row.subscribers === null && row.median_views_last10 === null && !row.traction_tier) {
    return <span className="text-canvas-muted">—</span>;
  }
  return (
    <div className="flex flex-col gap-0.5">
      <span className="font-medium text-canvas-ink">
        {row.traction_tier ?? "—"}
        {row.lane ? <span className="ml-2 font-normal text-canvas-muted">{row.lane}</span> : null}
      </span>
      <span className="text-canvas-muted">
        {compactCount(row.subscribers)} subs · {compactCount(row.median_views_last10)} median
      </span>
      {row.last_episode_date ? <span className="text-canvas-muted">last ep {row.last_episode_date}</span> : null}
    </div>
  );
}

function ContactCell({ row }: { row: OutreachPodcaster }) {
  const lead = [...row.team].sort((a, b) => (a.priority ?? 99) - (b.priority ?? 99))[0];
  return (
    <div className="flex flex-col gap-0.5">
      {row.primary_email ? (
        <span className="text-canvas-ink">{row.primary_email}</span>
      ) : (
        <span className="text-canvas-muted">No verified email</span>
      )}
      {lead ? (
        <span className="text-canvas-muted">
          {lead.name}
          {lead.title ? `, ${lead.title}` : ""}
        </span>
      ) : null}
      {row.channels.length ? (
        <span className="text-canvas-muted">{row.channels.map((c) => c.platform).join(" · ")}</span>
      ) : null}
    </div>
  );
}

function DecisionCell({
  draft,
  examples,
  onChange,
}: {
  draft: Draft | undefined;
  examples: OutreachPodcaster[];
  onChange: (next: Draft) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="inline-flex w-fit overflow-hidden rounded-canvas-md border border-canvas-border">
        {DECISIONS.map((d) => (
          <button
            key={d}
            type="button"
            onClick={() => onChange({ decision: d, example_canvas_from: draft?.example_canvas_from ?? null })}
            className={`px-2.5 py-1 text-canvas-body-sm border-l border-canvas-border first:border-l-0 ${
              draft?.decision === d
                ? "bg-canvas-accent text-white"
                : "bg-canvas-card text-canvas-ink hover:bg-canvas-bg"
            }`}
          >
            {DECISION_LABELS[d]}
          </button>
        ))}
      </div>
      {draft?.decision === "example_canvas" ? (
        <select
          className={selectClass}
          value={draft.example_canvas_from ?? ""}
          onChange={(e) => onChange({ decision: "example_canvas", example_canvas_from: e.target.value || null })}
        >
          <option value="">Closest match (routine picks)</option>
          {examples.map((r) => (
            <option key={r.id} value={r.id}>
              {r.podcast_name}
            </option>
          ))}
        </select>
      ) : null}
    </div>
  );
}

export function PodcasterTable({
  initialRows,
  loadError,
}: {
  initialRows: OutreachPodcaster[];
  loadError: string | null;
}) {
  const [rows, setRows] = useState(initialRows);
  const [tab, setTab] = useState(() => (initialRows.some((r) => r.stage === "new") ? "review" : "all"));
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [drafts, setDrafts] = useState<Record<string, Draft>>({});
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<{ tone: "ok" | "error"; text: string } | null>(null);
  const [video, setVideo] = useState<OutreachPodcaster | null>(null);
  const [copyTarget, setCopyTarget] = useState<{ id: string; key: CopyKey } | null>(null);
  // undefined = form closed, null = adding, row = editing.
  const [editing, setEditing] = useState<OutreachPodcaster | null | undefined>(undefined);
  const { copiedId, copy } = useCopiedFlash();

  const byId = useMemo(() => new Map(rows.map((r) => [r.id, r])), [rows]);
  const examples = useMemo(() => rows.filter((r) => r.canvas_url), [rows]);
  const active = TABS.find((t) => t.key === tab) ?? TABS[TABS.length - 1];
  const visible = rows.filter((r) => active.stages.includes(r.stage));
  const reviewing = tab === "review";
  const draftCount = Object.keys(drafts).filter((id) => byId.get(id)?.stage === "new").length;

  const upsert = (row: OutreachPodcaster) =>
    setRows((cur) =>
      cur.some((r) => r.id === row.id) ? cur.map((r) => (r.id === row.id ? row : r)) : [...cur, row],
    );
  const upsertMany = (next: OutreachPodcaster[]) => next.forEach(upsert);

  const toggle = (set: Set<string>, id: string) => {
    const next = new Set(set);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    return next;
  };

  function setDraft(id: string, draft: Draft) {
    setDrafts((cur) => ({ ...cur, [id]: draft }));
  }

  function applyToSelected(decision: Decision) {
    setDrafts((cur) => {
      const next = { ...cur };
      for (const id of selected) next[id] = { decision, example_canvas_from: cur[id]?.example_canvas_from ?? null };
      return next;
    });
  }

  async function submit() {
    const decisions = Object.entries(drafts)
      .filter(([id]) => byId.get(id)?.stage === "new")
      .map(([id, d]) => ({ id, ...d }));
    if (!decisions.length) return;
    setBusy(true);
    setNotice(null);
    try {
      const { podcasters } = await submitDecisions(decisions);
      upsertMany(podcasters);
      setDrafts({});
      setSelected(new Set());
      const queued = podcasters.filter((p) => p.stage === "queued").length;
      setNotice({
        tone: "ok",
        text: `${queued} queued for the assets routine, ${podcasters.length - queued} skipped. The tracking sheet picks these up on the routine's next run.`,
      });
    } catch (e) {
      setNotice({ tone: "error", text: (e as Error).message });
    } finally {
      setBusy(false);
    }
  }

  async function setStage(row: OutreachPodcaster, stage: Stage) {
    try {
      upsert(await patchPodcaster(row.id, { stage }));
    } catch (e) {
      setNotice({ tone: "error", text: (e as Error).message });
    }
  }

  const copyRow = copyTarget ? (byId.get(copyTarget.id) ?? null) : null;
  const columnCount = reviewing ? 7 : 12;

  return (
    <div className="mx-auto flex max-w-[1800px] flex-col gap-4 px-4 py-6 pb-28 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap gap-1">
          {TABS.map((t) => {
            const count = rows.filter((r) => t.stages.includes(r.stage)).length;
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => {
                  setTab(t.key);
                  setSelected(new Set());
                }}
                className={`rounded-canvas-md px-3 py-1.5 text-canvas-body-sm ${
                  tab === t.key ? "bg-canvas-card font-medium text-canvas-ink shadow-sm" : "text-canvas-muted hover:text-canvas-ink"
                }`}
              >
                {t.label} <span className="text-canvas-muted">{count}</span>
              </button>
            );
          })}
        </div>
        <Button variant="primary" icon={Plus} onClick={() => setEditing(null)}>
          Add podcaster
        </Button>
      </div>

      {loadError ? (
        <p className="rounded-canvas-md border border-canvas-dangerBorder p-3 text-canvas-body-sm text-canvas-danger">
          {loadError}
        </p>
      ) : null}
      {notice ? (
        <p
          className={`rounded-canvas-md border p-3 text-canvas-body-sm ${
            notice.tone === "error" ? "border-canvas-dangerBorder text-canvas-danger" : "border-canvas-border text-canvas-ink"
          }`}
        >
          {notice.text}
        </p>
      ) : null}

      {reviewing && selected.size ? (
        <div className="flex flex-wrap items-center gap-2 text-canvas-body-sm">
          <span className="text-canvas-muted">{selected.size} selected — set to</span>
          {DECISIONS.map((d) => (
            <Button key={d} variant="secondary" onClick={() => applyToSelected(d)}>
              {DECISION_LABELS[d]}
            </Button>
          ))}
        </div>
      ) : null}

      <div className="overflow-x-auto rounded-canvas border border-canvas-border bg-canvas-card">
        <table className="w-full min-w-[72rem] border-collapse text-canvas-body-sm">
          <thead>
            <tr className="border-b border-canvas-border text-left text-canvas-micro uppercase tracking-wider text-canvas-muted">
              {reviewing ? (
                <th className="w-10 px-4 py-3">
                  <input
                    type="checkbox"
                    aria-label="Select all"
                    checked={visible.length > 0 && visible.every((r) => selected.has(r.id))}
                    onChange={(e) => setSelected(e.target.checked ? new Set(visible.map((r) => r.id)) : new Set())}
                  />
                </th>
              ) : null}
              <th className={thClass}>Podcast</th>
              <th className={thClass}>Niche</th>
              <th className={thClass}>Traction</th>
              <th className={thClass}>Contact</th>
              <th className={thClass}>{reviewing ? "Decision" : "Stage"}</th>
              {reviewing ? null : (
                <>
                  <th className={thClass}>Canvas</th>
                  <th className={thClass}>Showcase</th>
                  {COPY_KINDS.map((k) => (
                    <th key={k.key} className={thClass}>
                      {k.short}
                    </th>
                  ))}
                </>
              )}
              <th className="px-4 py-3" aria-label="Details" />
            </tr>
          </thead>
          <tbody>
            {visible.length === 0 ? (
              <tr>
                <td colSpan={columnCount} className="px-4 py-10 text-center text-canvas-muted">
                  {reviewing ? "Nothing to review. The prospecting routine adds new shows each morning." : "No podcasters here."}
                </td>
              </tr>
            ) : null}
            {visible.map((row) => {
              const open = expanded.has(row.id);
              return (
                <Fragment key={row.id}>
                  <tr className="border-b border-canvas-border/50 align-top last:border-0">
                    {reviewing ? (
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          aria-label={`Select ${row.podcast_name}`}
                          checked={selected.has(row.id)}
                          onChange={() => setSelected((s) => toggle(s, row.id))}
                        />
                      </td>
                    ) : null}
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-0.5">
                        {row.podcast_url ? (
                          <a href={row.podcast_url} target="_blank" rel="noreferrer" className={linkClass}>
                            {row.podcast_name}
                          </a>
                        ) : (
                          <span className="text-canvas-ink">{row.podcast_name}</span>
                        )}
                        <span className="text-canvas-muted">{row.host_name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-1">
                        <span className="text-canvas-ink">{row.niche ?? "—"}</span>
                        <span className="text-canvas-muted">
                          {[row.domain, row.country, row.language].filter(Boolean).join(" · ") || ""}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <TractionCell row={row} />
                    </td>
                    <td className="px-4 py-3">
                      <ContactCell row={row} />
                    </td>
                    <td className="px-4 py-3">
                      {reviewing ? (
                        <DecisionCell
                          draft={drafts[row.id]}
                          examples={examples.filter((r) => r.id !== row.id)}
                          onChange={(d) => setDraft(row.id, d)}
                        />
                      ) : (
                        <div className="flex flex-col gap-1">
                          <select
                            className={selectClass}
                            value={row.stage}
                            onChange={(e) => setStage(row, e.target.value as Stage)}
                          >
                            {STAGES.map((s) => (
                              <option key={s} value={s}>
                                {STAGE_LABELS[s]}
                              </option>
                            ))}
                          </select>
                          {row.decision ? <span className={`${pillClass} w-fit`}>{DECISION_LABELS[row.decision]}</span> : null}
                        </div>
                      )}
                    </td>
                    {reviewing ? null : (
                      <>
                        <td className="px-4 py-3">
                          {row.canvas_url ? (
                            <div className="flex items-center gap-1">
                              <a
                                href={row.canvas_url}
                                target="_blank"
                                rel="noreferrer"
                                className={`${actionClass} inline-flex items-center gap-1`}
                              >
                                Open <ExternalLink className="h-3.5 w-3.5" />
                              </a>
                              <IconButton
                                icon={copiedId === `${row.id}:canvas` ? Check : Copy}
                                label="Copy canvas link"
                                size="sm"
                                onClick={() => copy(`${row.id}:canvas`, row.canvas_url!)}
                              />
                            </div>
                          ) : (
                            <span className="text-canvas-muted">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {row.video_path ? (
                            <IconButton icon={Play} label="Play showcase video" onClick={() => setVideo(row)} />
                          ) : (
                            <button type="button" className={actionClass} onClick={() => setEditing(row)}>
                              Upload
                            </button>
                          )}
                        </td>
                        {COPY_KINDS.map((k) => {
                          const text = row[k.key];
                          const id = `${row.id}:${k.key}`;
                          return (
                            <td key={k.key} className="px-4 py-3">
                              <div className="flex items-center gap-3">
                                <button
                                  type="button"
                                  className={actionClass}
                                  onClick={() => setCopyTarget({ id: row.id, key: k.key })}
                                >
                                  {text ? "View" : "Add"}
                                </button>
                                {text ? (
                                  <button type="button" className={actionClass} onClick={() => copy(id, text)}>
                                    {copiedId === id ? "Copied" : "Copy"}
                                  </button>
                                ) : null}
                              </div>
                            </td>
                          );
                        })}
                      </>
                    )}
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <IconButton
                          icon={open ? ChevronDown : ChevronRight}
                          label={open ? "Hide details" : "Show details"}
                          size="sm"
                          onClick={() => setExpanded((s) => toggle(s, row.id))}
                        />
                        <IconButton icon={Pencil} label={`Edit ${row.host_name}`} size="sm" onClick={() => setEditing(row)} />
                      </div>
                    </td>
                  </tr>
                  {open ? (
                    <tr className="border-b border-canvas-border/50">
                      <td colSpan={columnCount} className="p-0">
                        <PodcasterDetails row={row} byId={byId} />
                      </td>
                    </tr>
                  ) : null}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      {reviewing && draftCount ? (
        <div className="fixed inset-x-0 bottom-0 z-20 border-t border-canvas-border bg-canvas-card/95 backdrop-blur">
          <div className="mx-auto flex max-w-[1800px] items-center justify-between gap-4 px-6 py-3">
            <p className="text-canvas-body-sm text-canvas-ink">
              {draftCount} {draftCount === 1 ? "decision" : "decisions"} ready ·{" "}
              {Object.values(drafts).filter((d) => d.decision === "own_canvas").length} own canvas ·{" "}
              {Object.values(drafts).filter((d) => d.decision === "example_canvas").length} example ·{" "}
              {Object.values(drafts).filter((d) => d.decision === "skip").length} skip
            </p>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={() => setDrafts({})} disabled={busy}>
                Clear
              </Button>
              <Button variant="primary" onClick={submit} loading={busy} disabled={busy}>
                Submit
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      <VideoModal
        src={video?.video_path ? videoPublicUrl(video.video_path) : null}
        title={video ? `Showcase — ${video.podcast_name}` : ""}
        onClose={() => setVideo(null)}
      />
      <CopyModal
        podcaster={copyRow}
        copyKey={copyTarget?.key ?? null}
        onSaved={upsert}
        onClose={() => setCopyTarget(null)}
      />
      <PodcasterFormModal
        editing={editing}
        onSaved={(row) => {
          upsert(row);
          setEditing(undefined);
        }}
        onDeleted={(id) => {
          setRows((cur) => cur.filter((r) => r.id !== id));
          setEditing(undefined);
        }}
        onClose={() => setEditing(undefined)}
      />
    </div>
  );
}
