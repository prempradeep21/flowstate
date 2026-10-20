"use client";

import type { ArtifactElement } from "./artifactElements";
import type { SpecCheck } from "./textSpec";

function Switch({ on }: { on: boolean }) {
  return (
    <span
      aria-hidden
      className={`relative inline-flex h-[18px] w-[30px] shrink-0 items-center rounded-full transition-colors ${on ? "bg-canvas-ink" : "bg-canvas-border"}`}
    >
      <span
        className="absolute h-[14px] w-[14px] rounded-full bg-canvas-card shadow-[0_1px_2px_rgb(0_0_0/0.25)] transition-transform"
        style={{ transform: `translateX(${on ? 14 : 2}px)` }}
      />
    </span>
  );
}

const KIND_GLYPH: Record<ArtifactElement["kind"], string> = { text: "T", icon: "◇" };

/** Whether this family carries exactly the artifact's text parts (textSpec.ts). */
function SpecStatus({ check, exempt }: { check: SpecCheck | null; exempt: boolean }) {
  if (exempt) return <p className="mb-2 text-canvas-micro text-canvas-muted">Live product — the reference, not held to the text spec.</p>;
  if (!check) return null;
  const problems = [
    check.missing.length ? `Missing ${check.missing.join(", ")}` : null,
    check.extra.length ? `Not in spec: ${check.extra.join(", ")}` : null,
    check.untagged.length ? `Untagged: ${check.untagged.join("; ")}` : null,
  ].filter(Boolean);
  return problems.length ? (
    <p className="mb-2 text-canvas-micro text-[#C8322B]">{problems.join(" · ")}</p>
  ) : (
    <p className="mb-2 text-canvas-micro text-canvas-muted">Matches the text spec for this kind.</p>
  );
}

function Row({ e, on, onToggle, onHighlight }: { e: ArtifactElement; on: boolean; onToggle: (key: string) => void; onHighlight: (key: string | null) => void }) {
  return (
    <li>
      <button
        type="button"
        role="switch"
        aria-checked={on}
        onClick={() => onToggle(e.key)}
        onMouseEnter={() => onHighlight(on ? e.key : null)}
        onFocus={() => onHighlight(on ? e.key : null)}
        className="flex w-full items-center gap-3 rounded-[10px] px-2 py-1.5 text-left transition-colors hover:bg-canvas-bg"
      >
        <Switch on={on} />
        <span className="w-3 shrink-0 text-center text-[11px] text-canvas-muted" aria-hidden>
          {KIND_GLYPH[e.kind]}
        </span>
        <span className={`min-w-0 flex-1 ${on ? "" : "opacity-45"}`}>
          <span className="flex items-baseline gap-1.5">
            <span className="truncate text-canvas-body-sm font-medium text-canvas-ink">{e.name}</span>
            {e.count > 1 ? <span className="shrink-0 text-canvas-micro tabular-nums text-canvas-muted">×{e.count}</span> : null}
          </span>
          {e.snippet ? <span className="block truncate text-canvas-micro text-canvas-muted">{e.snippet}</span> : null}
        </span>
      </button>
    </li>
  );
}

/**
 * Every text and icon element of the artifact in focus, each with an on/off
 * switch — style-only layers aren't listed. The count is the text parts,
 * which every style holds to the same spec; icons are listed after them.
 * Hovering a row outlines that element on the stage.
 */
export function ElementsPanel({
  elements,
  hidden,
  onToggle,
  onShowAll,
  onHideAll,
  onHighlight,
  specCheck = null,
  specExempt = false,
}: {
  elements: ArtifactElement[];
  hidden: Set<string>;
  onToggle: (key: string) => void;
  onShowAll: () => void;
  onHideAll: () => void;
  onHighlight: (key: string | null) => void;
  specCheck?: SpecCheck | null;
  specExempt?: boolean;
}) {
  const offCount = elements.filter((e) => hidden.has(e.key)).length;
  const text = elements.filter((e) => e.kind === "text");
  const icons = elements.filter((e) => e.kind === "icon");
  return (
    <section>
      <div className="mb-2 flex items-baseline justify-between gap-3">
        <p className="text-canvas-micro font-semibold uppercase tracking-wider text-canvas-muted">
          Elements <span className="font-normal tabular-nums">· {text.length}</span>
        </p>
        <div className="flex gap-3 text-canvas-micro font-medium">
          <button type="button" onClick={onShowAll} disabled={offCount === 0} className="text-canvas-ink hover:text-canvas-accent disabled:opacity-35">
            Show all
          </button>
          <button type="button" onClick={onHideAll} disabled={offCount === elements.length} className="text-canvas-ink hover:text-canvas-accent disabled:opacity-35">
            Hide all
          </button>
        </div>
      </div>
      {elements.length === 0 ? (
        <p className="py-2 text-canvas-micro text-canvas-muted">Reading the artifact…</p>
      ) : (
        <div onMouseLeave={() => onHighlight(null)}>
          <SpecStatus check={specCheck} exempt={specExempt} />
          <ul className="-mx-2 flex flex-col">
            {text.map((e) => (
              <Row key={e.key} e={e} on={!hidden.has(e.key)} onToggle={onToggle} onHighlight={onHighlight} />
            ))}
          </ul>
          {icons.length ? (
            <>
              <p className="mb-1 mt-4 text-canvas-micro font-semibold uppercase tracking-wider text-canvas-muted">
                Icons <span className="font-normal tabular-nums">· {icons.length}</span>
              </p>
              <ul className="-mx-2 flex flex-col">
                {icons.map((e) => (
                  <Row key={e.key} e={e} on={!hidden.has(e.key)} onToggle={onToggle} onHighlight={onHighlight} />
                ))}
              </ul>
            </>
          ) : null}
        </div>
      )}
    </section>
  );
}
