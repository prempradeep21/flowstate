"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ANGLES,
  ASSETS,
  COPY_LENGTHS,
  DEFAULT_VARIABLES,
  DEMO_BEATS,
  PLAYBOOK,
  TARGETS,
  VALUE_LAYERS,
  fill,
  renderPlain,
  type Angle,
  type CopyLength,
  type Region,
  type Variables,
} from "@/lib/outreach/podcastOutreach";

type Tab = "copy" | "layers" | "targets" | "playbook" | "assets";

const TABS: { id: Tab; label: string }[] = [
  { id: "copy", label: "Copy studio" },
  { id: "layers", label: "The three layers" },
  { id: "targets", label: "Targets" },
  { id: "playbook", label: "Playbook" },
  { id: "assets", label: "Assets" },
];

const STORAGE_KEY = "flowstate.outreach.deck.v1";

type Persisted = {
  vars: Variables;
  shortlist: string[];
  angleId: string;
  length: CopyLength;
};

function loadPersisted(): Partial<Persisted> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Partial<Persisted>) : {};
  } catch {
    return {};
  }
}

export function OutreachDeck() {
  const [tab, setTab] = useState<Tab>("copy");
  const [vars, setVars] = useState<Variables>(DEFAULT_VARIABLES);
  const [angleId, setAngleId] = useState<string>(ANGLES[0].id);
  const [length, setLength] = useState<CopyLength>("paragraphs");
  const [shortlist, setShortlist] = useState<string[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const saved = loadPersisted();
    if (saved.vars) setVars({ ...DEFAULT_VARIABLES, ...saved.vars });
    if (saved.shortlist) setShortlist(saved.shortlist);
    if (saved.angleId && ANGLES.some((a) => a.id === saved.angleId)) setAngleId(saved.angleId);
    if (saved.length) setLength(saved.length);
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ vars, shortlist, angleId, length } satisfies Persisted),
      );
    } catch {
      /* private mode — the deck still works, it just forgets */
    }
  }, [hydrated, vars, shortlist, angleId, length]);

  const angle = useMemo(
    () => ANGLES.find((a) => a.id === angleId) ?? ANGLES[0],
    [angleId],
  );

  const toggleShort = useCallback((key: string) => {
    setShortlist((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
    );
  }, []);

  return (
    <div className="h-full min-h-0 overflow-y-auto bg-canvas-bg text-canvas-ink">
      <div className="mx-auto w-full max-w-[1180px] px-6 pb-24 pt-10 sm:px-10">
        <Header tab={tab} setTab={setTab} shortlistCount={shortlist.length} />

        {tab === "copy" ? (
          <CopyStudio
            angle={angle}
            angleId={angleId}
            setAngleId={setAngleId}
            length={length}
            setLength={setLength}
            vars={vars}
            setVars={setVars}
            shortlist={shortlist}
            toggleShort={toggleShort}
          />
        ) : null}
        {tab === "layers" ? <Layers /> : null}
        {tab === "targets" ? (
          <Targets vars={vars} shortlist={shortlist} toggleShort={toggleShort} setTab={setTab} setAngleId={setAngleId} />
        ) : null}
        {tab === "playbook" ? <Playbook vars={vars} /> : null}
        {tab === "assets" ? <Assets /> : null}
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- header */

function Header({
  tab,
  setTab,
  shortlistCount,
}: {
  tab: Tab;
  setTab: (t: Tab) => void;
  shortlistCount: number;
}) {
  return (
    <header className="mb-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-canvas-caption uppercase tracking-[0.18em] text-canvas-muted">
            Flowstate · pilot outreach
          </p>
          <h1 className="mt-1 font-display text-[38px] leading-[1.05] text-canvas-ink sm:text-[46px]">
            What we say to podcasters
          </h1>
          <p className="mt-3 max-w-[62ch] text-canvas-body text-canvas-muted">
            Seven framings of the same offer, at three lengths — each one walking the same three
            layers of value. Set the variables once and read every variant as it would actually
            land. Star the ones worth sending.
          </p>
        </div>
        {shortlistCount > 0 ? (
          <span className="rounded-canvas-sm border border-canvas-border bg-canvas-card px-3 py-1.5 text-canvas-caption text-canvas-muted">
            {shortlistCount} starred
          </span>
        ) : null}
      </div>

      <nav className="mt-7 flex flex-wrap gap-1 border-b border-canvas-border">
        {TABS.map((t) => {
          const active = t.id === tab;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={[
                "-mb-px border-b-2 px-3 py-2.5 text-canvas-body-sm transition-colors duration-motion-fast",
                active
                  ? "border-canvas-accent text-canvas-ink"
                  : "border-transparent text-canvas-muted hover:text-canvas-ink",
              ].join(" ")}
            >
              {t.label}
            </button>
          );
        })}
      </nav>
    </header>
  );
}

/* ----------------------------------------------------------- copy studio */

function CopyStudio({
  angle,
  angleId,
  setAngleId,
  length,
  setLength,
  vars,
  setVars,
  shortlist,
  toggleShort,
}: {
  angle: Angle;
  angleId: string;
  setAngleId: (id: string) => void;
  length: CopyLength;
  setLength: (l: CopyLength) => void;
  vars: Variables;
  setVars: (v: Variables) => void;
  shortlist: string[];
  toggleShort: (key: string) => void;
}) {
  const shortKey = `${angle.id}:${length}`;
  const starred = shortlist.includes(shortKey);
  const plain = renderPlain(angle, length, vars);

  return (
    <div className="space-y-6">
      <VariablesBar vars={vars} setVars={setVars} />

      <div className="grid gap-6 lg:grid-cols-[300px_minmax(0,1fr)]">
        <aside className="space-y-2">
          {ANGLES.map((a) => {
            const active = a.id === angleId;
            const stars = shortlist.filter((k) => k.startsWith(`${a.id}:`)).length;
            return (
              <button
                key={a.id}
                type="button"
                onClick={() => setAngleId(a.id)}
                className={[
                  "w-full rounded-canvas-md border px-4 py-3.5 text-left transition-all duration-motion-fast",
                  active
                    ? "border-canvas-accent bg-canvas-card shadow-artifact"
                    : "border-canvas-border bg-canvas-card/60 hover:border-canvas-connector",
                ].join(" ")}
              >
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-canvas-body font-medium text-canvas-ink">{a.name}</span>
                  {stars > 0 ? (
                    <span className="text-canvas-micro text-canvas-accent">★{stars}</span>
                  ) : null}
                </div>
                <p className="mt-1 text-canvas-caption leading-snug text-canvas-muted">
                  {a.tagline}
                </p>
              </button>
            );
          })}
        </aside>

        <section className="min-w-0 space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex rounded-canvas-sm border border-canvas-border bg-canvas-card p-0.5">
              {COPY_LENGTHS.map((l) => {
                const active = l.id === length;
                return (
                  <button
                    key={l.id}
                    type="button"
                    onClick={() => setLength(l.id)}
                    title={l.hint}
                    className={[
                      "rounded-canvas-xs px-3 py-1.5 text-canvas-body-sm transition-colors duration-motion-fast",
                      active
                        ? "bg-canvas-ink text-canvas-bg"
                        : "text-canvas-muted hover:text-canvas-ink",
                    ].join(" ")}
                  >
                    {l.label}
                  </button>
                );
              })}
            </div>
            <span className="text-canvas-caption text-canvas-muted">
              {COPY_LENGTHS.find((l) => l.id === length)?.hint}
            </span>
            <div className="ml-auto flex items-center gap-2">
              <button
                type="button"
                onClick={() => toggleShort(shortKey)}
                className={[
                  "rounded-canvas-sm border px-3 py-1.5 text-canvas-body-sm transition-colors duration-motion-fast",
                  starred
                    ? "border-canvas-accent bg-canvas-accent-soft text-canvas-accent"
                    : "border-canvas-border bg-canvas-card text-canvas-muted hover:text-canvas-ink",
                ].join(" ")}
              >
                {starred ? "★ Starred" : "☆ Star this"}
              </button>
              <CopyButton text={plain} />
            </div>
          </div>

          <article className="rounded-canvas-lg border border-canvas-border bg-canvas-card p-7 shadow-artifact">
            <p className="text-canvas-caption uppercase tracking-[0.16em] text-canvas-muted">
              Subject
            </p>
            <p className="mt-1 text-canvas-body text-canvas-ink">{fill(angle.subject, vars)}</p>

            <div className="my-5 h-px bg-canvas-border" />

            {length === "sentence" ? (
              <p className="font-display text-[26px] leading-[1.35] text-canvas-ink">
                {fill(angle.sentence, vars)}
              </p>
            ) : null}

            {length === "bullets" ? (
              <ul className="space-y-3.5">
                {angle.bullets.map((b, i) => (
                  <li key={i} className="flex gap-3 text-canvas-body-lg leading-[1.6] text-canvas-ink">
                    <span className="mt-[9px] h-1.5 w-1.5 shrink-0 rounded-full bg-canvas-accent" />
                    <span>{fill(b, vars)}</span>
                  </li>
                ))}
              </ul>
            ) : null}

            {length === "paragraphs" ? (
              <div className="space-y-4">
                {angle.paragraphs.map((p, i) => (
                  <p key={i} className="text-canvas-body-lg leading-[1.65] text-canvas-ink">
                    {fill(p, vars)}
                  </p>
                ))}
              </div>
            ) : null}
          </article>

          <div className="grid gap-3 sm:grid-cols-2">
            <MetaCard label="Use it when" body={angle.when} />
            <MetaCard label="Channel" body={angle.channel} />
            <MetaCard label="What goes with it" body={angle.attach} />
            <MetaCard label="How it backfires" body={angle.risk} tone="warn" />
          </div>
        </section>
      </div>
    </div>
  );
}

function MetaCard({
  label,
  body,
  tone = "plain",
}: {
  label: string;
  body: string;
  tone?: "plain" | "warn";
}) {
  return (
    <div
      className={[
        "rounded-canvas-md border p-4",
        tone === "warn"
          ? "border-canvas-warning-ring bg-canvas-warning-soft"
          : "border-canvas-border bg-canvas-card",
      ].join(" ")}
    >
      <p
        className={[
          "text-canvas-caption uppercase tracking-[0.16em]",
          tone === "warn" ? "text-canvas-warning-text" : "text-canvas-muted",
        ].join(" ")}
      >
        {label}
      </p>
      <p
        className={[
          "mt-1.5 text-canvas-body-sm leading-relaxed",
          tone === "warn" ? "text-canvas-warning-text" : "text-canvas-ink",
        ].join(" ")}
      >
        {body}
      </p>
    </div>
  );
}

function VariablesBar({
  vars,
  setVars,
}: {
  vars: Variables;
  setVars: (v: Variables) => void;
}) {
  const [open, setOpen] = useState(true);
  const fields: { key: keyof Variables; label: string; wide?: boolean }[] = [
    { key: "host", label: "Host" },
    { key: "show", label: "Show" },
    { key: "episode", label: "Episode" },
    { key: "topic", label: "Their subject" },
    { key: "ravi", label: "The Ravi clause", wide: true },
  ];

  return (
    <div className="rounded-canvas-md border border-canvas-border bg-canvas-card">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between px-4 py-3 text-left"
      >
        <span className="text-canvas-caption uppercase tracking-[0.16em] text-canvas-muted">
          Variables — {vars.show}
        </span>
        <span className="text-canvas-caption text-canvas-muted">{open ? "Hide" : "Edit"}</span>
      </button>
      {open ? (
        <div className="grid gap-3 border-t border-canvas-border p-4 sm:grid-cols-2 lg:grid-cols-4">
          {fields.map((f) => (
            <label key={f.key} className={f.wide ? "sm:col-span-2 lg:col-span-4" : undefined}>
              <span className="text-canvas-micro uppercase tracking-[0.14em] text-canvas-muted">
                {f.label}
              </span>
              <input
                value={vars[f.key]}
                onChange={(e) => setVars({ ...vars, [f.key]: e.target.value })}
                className="mt-1 w-full rounded-canvas-sm border border-canvas-border bg-canvas-bg px-3 py-2 text-canvas-body-sm text-canvas-ink outline-none focus:border-canvas-accent"
              />
            </label>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function CopyButton({ text }: { text: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setDone(true);
          window.setTimeout(() => setDone(false), 1600);
        } catch {
          setDone(false);
        }
      }}
      className="rounded-canvas-sm bg-canvas-ink px-3.5 py-1.5 text-canvas-body-sm text-canvas-bg transition-opacity duration-motion-fast hover:opacity-90"
    >
      {done ? "Copied" : "Copy"}
    </button>
  );
}

/* ---------------------------------------------------------------- layers */

function Layers() {
  return (
    <div className="space-y-8">
      <p className="max-w-[70ch] text-canvas-body text-canvas-muted">
        Three layers of value to the person watching the episode, in the order they have to be
        shown. Each one is worth more than the one before it and is harder to believe, which is why
        the order matters: layer 1 buys attention, layer 2 earns the screenshot, layer 3 is the
        thing nobody else has. A message that stops at layer 1 is indistinguishable from every
        summary tool in their inbox.
      </p>

      <div className="grid gap-4 lg:grid-cols-3">
        {VALUE_LAYERS.map((l) => (
          <section
            key={l.n}
            className="flex flex-col rounded-canvas-md border border-canvas-border bg-canvas-card p-6"
          >
            <div className="flex items-baseline gap-3">
              <span className="font-display text-[34px] leading-none text-canvas-accent">
                {l.n}
              </span>
              <h2 className="font-display text-[24px] leading-tight text-canvas-ink">{l.name}</h2>
            </div>
            <p className="mt-3 text-canvas-body leading-relaxed text-canvas-ink">{l.oneLine}</p>
            <div className="mt-5 space-y-4 border-t border-canvas-border pt-5">
              <Field label="What the viewer gets" body={l.viewer} />
              <Field label="Why the host cares" body={l.host} />
              <Field label="How to show it" body={l.proof} />
            </div>
            <div className="mt-5 rounded-canvas-sm border border-canvas-warning-ring bg-canvas-warning-soft p-3.5">
              <p className="text-canvas-micro uppercase tracking-[0.14em] text-canvas-warning-text">
                The trap
              </p>
              <p className="mt-1 text-canvas-body-sm leading-relaxed text-canvas-warning-text">
                {l.trap}
              </p>
            </div>
          </section>
        ))}
      </div>

      <section className="rounded-canvas-md border border-canvas-border bg-canvas-card p-6">
        <h2 className="font-display text-[24px] leading-tight text-canvas-ink">
          The 60-second video, beat by beat
        </h2>
        <p className="mt-2 max-w-[70ch] text-canvas-body-sm leading-relaxed text-canvas-muted">
          The ladder is the script. This is the asset every tier-one message depends on, and none of
          the targets have seen one yet.
        </p>
        <ol className="mt-5 space-y-4">
          {DEMO_BEATS.map((b) => (
            <li key={b.time} className="grid gap-x-5 gap-y-1 sm:grid-cols-[110px_minmax(0,1fr)]">
              <span className="text-canvas-caption tabular-nums text-canvas-muted">{b.time}</span>
              <div>
                <p className="text-canvas-body font-medium text-canvas-ink">{b.beat}</p>
                <p className="mt-0.5 text-canvas-body-sm leading-relaxed text-canvas-muted">
                  {b.note}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}

/* --------------------------------------------------------------- targets */

function Targets({
  vars,
  shortlist,
  toggleShort,
  setTab,
  setAngleId,
}: {
  vars: Variables;
  shortlist: string[];
  toggleShort: (key: string) => void;
  setTab: (t: Tab) => void;
  setAngleId: (id: string) => void;
}) {
  const [region, setRegion] = useState<"All" | Region>("All");
  const [tierFilter, setTierFilter] = useState<"All" | 1 | 2 | 3>("All");
  const [assetOnly, setAssetOnly] = useState(false);

  const rows = TARGETS.filter(
    (t) =>
      (region === "All" || t.region === region) &&
      (tierFilter === "All" || t.tier === tierFilter) &&
      (!assetOnly || t.assetReady),
  ).sort((a, b) => a.tier - b.tier);

  return (
    <div className="space-y-5">
      <p className="max-w-[68ch] text-canvas-body text-canvas-muted">
        Ranked on four things: whether an episode is dense enough that a canvas beats a summary,
        whether the audience is the note-taking kind, whether you can actually reach a human, and
        whether they are small enough to say yes to a pilot. Tier 1 is where the first five come
        from — not the biggest names.
      </p>

      <div className="flex flex-wrap items-center gap-2">
        <FilterGroup
          options={["All", "India", "Global"]}
          value={region}
          onChange={(v) => setRegion(v as "All" | Region)}
        />
        <FilterGroup
          options={["All", "1", "2", "3"]}
          value={tierFilter === "All" ? "All" : String(tierFilter)}
          onChange={(v) => setTierFilter(v === "All" ? "All" : (Number(v) as 1 | 2 | 3))}
          prefix="Tier"
        />
        <button
          type="button"
          onClick={() => setAssetOnly((a) => !a)}
          className={[
            "rounded-canvas-sm border px-3 py-1.5 text-canvas-body-sm transition-colors duration-motion-fast",
            assetOnly
              ? "border-canvas-accent bg-canvas-accent-soft text-canvas-accent"
              : "border-canvas-border bg-canvas-card text-canvas-muted hover:text-canvas-ink",
          ].join(" ")}
        >
          Canvas already built
        </button>
        <span className="text-canvas-caption text-canvas-muted">{rows.length} shows</span>
      </div>

      <div className="space-y-3">
        {rows.map((t) => {
          const key = `target:${t.id}`;
          const starred = shortlist.includes(key);
          const angle = ANGLES.find((a) => a.id === t.angle);
          return (
            <article
              key={t.id}
              className="rounded-canvas-md border border-canvas-border bg-canvas-card p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-display text-[21px] leading-tight text-canvas-ink">
                      {t.show}
                    </h3>
                    <Pill>{`Tier ${t.tier}`}</Pill>
                    <Pill>{t.region}</Pill>
                    {t.assetReady ? <Pill tone="accent">Canvas built</Pill> : null}
                  </div>
                  <p className="mt-1 text-canvas-caption text-canvas-muted">
                    {t.host} · {t.category}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => toggleShort(key)}
                  className={[
                    "rounded-canvas-sm border px-2.5 py-1 text-canvas-caption transition-colors duration-motion-fast",
                    starred
                      ? "border-canvas-accent bg-canvas-accent-soft text-canvas-accent"
                      : "border-canvas-border text-canvas-muted hover:text-canvas-ink",
                  ].join(" ")}
                >
                  {starred ? "★" : "☆"}
                </button>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <Field label="Why it fits" body={t.fit} />
                <Field label="Opening move" body={fill(t.hook, vars)} />
                <Field label="How you reach them" body={fill(t.reach, vars)} />
                <Field label="Why they say no" body={t.objection} />
              </div>

              {angle ? (
                <button
                  type="button"
                  onClick={() => {
                    setAngleId(angle.id);
                    setTab("copy");
                  }}
                  className="mt-4 text-canvas-body-sm text-canvas-accent hover:underline"
                >
                  Open the “{angle.name}” copy →
                </button>
              ) : null}
            </article>
          );
        })}
      </div>
    </div>
  );
}

function Field({ label, body }: { label: string; body: string }) {
  return (
    <div>
      <p className="text-canvas-micro uppercase tracking-[0.14em] text-canvas-muted">{label}</p>
      <p className="mt-1 text-canvas-body-sm leading-relaxed text-canvas-ink">{body}</p>
    </div>
  );
}

function Pill({
  children,
  tone = "plain",
}: {
  children: React.ReactNode;
  tone?: "plain" | "accent";
}) {
  return (
    <span
      className={[
        "rounded-canvas-xs px-2 py-0.5 text-canvas-micro",
        tone === "accent"
          ? "bg-canvas-accent-soft text-canvas-accent"
          : "bg-canvas-artifact-stage text-canvas-muted",
      ].join(" ")}
    >
      {children}
    </span>
  );
}

function FilterGroup({
  options,
  value,
  onChange,
  prefix,
}: {
  options: string[];
  value: string;
  onChange: (v: string) => void;
  prefix?: string;
}) {
  return (
    <div className="flex rounded-canvas-sm border border-canvas-border bg-canvas-card p-0.5">
      {options.map((o) => {
        const active = o === value;
        return (
          <button
            key={o}
            type="button"
            onClick={() => onChange(o)}
            className={[
              "rounded-canvas-xs px-2.5 py-1.5 text-canvas-body-sm transition-colors duration-motion-fast",
              active ? "bg-canvas-ink text-canvas-bg" : "text-canvas-muted hover:text-canvas-ink",
            ].join(" ")}
          >
            {prefix && o !== "All" ? `${prefix} ${o}` : o}
          </button>
        );
      })}
    </div>
  );
}

/* -------------------------------------------------------------- playbook */

function Playbook({ vars }: { vars: Variables }) {
  return (
    <div className="grid gap-5 lg:grid-cols-2">
      {PLAYBOOK.map((section) => (
        <section
          key={section.id}
          className="rounded-canvas-md border border-canvas-border bg-canvas-card p-6"
        >
          <h2 className="font-display text-[24px] leading-tight text-canvas-ink">
            {section.title}
          </h2>
          <p className="mt-2 text-canvas-body-sm leading-relaxed text-canvas-muted">
            {fill(section.lede, vars)}
          </p>
          <ul className="mt-5 space-y-4">
            {section.items.map((item) => (
              <li key={item.head} className="border-l-2 border-canvas-border pl-4">
                <p className="text-canvas-body font-medium text-canvas-ink">{item.head}</p>
                <p className="mt-1 text-canvas-body-sm leading-relaxed text-canvas-muted">
                  {fill(item.body, vars)}
                </p>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

/* ---------------------------------------------------------------- assets */

function Assets() {
  return (
    <div className="space-y-5">
      <p className="max-w-[68ch] text-canvas-body text-canvas-muted">
        What you can send today, and what has to exist before the tier-one messages go out. The
        60-second personalised video is the gap — everything else is already in the repo.
      </p>
      <div className="space-y-3">
        {ASSETS.map((a) => (
          <div
            key={a.title}
            className="flex flex-wrap items-start justify-between gap-4 rounded-canvas-md border border-canvas-border bg-canvas-card p-5"
          >
            <div className="min-w-0 max-w-[70ch]">
              <div className="flex items-center gap-2">
                <h3 className="text-canvas-body font-medium text-canvas-ink">{a.title}</h3>
                <Pill tone={a.status === "Built" ? "accent" : "plain"}>{a.status}</Pill>
              </div>
              <p className="mt-1 text-canvas-body-sm leading-relaxed text-canvas-muted">
                {a.detail}
              </p>
            </div>
            <code className="rounded-canvas-xs bg-canvas-code-bg px-2 py-1 text-canvas-micro text-canvas-muted">
              {a.path}
            </code>
          </div>
        ))}
      </div>
    </div>
  );
}
