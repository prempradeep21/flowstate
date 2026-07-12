"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { ArtifactContentStage } from "@/components/artifacts/ArtifactContentStage";
import { ARTIFACT_CANVAS_SURFACE_FILL } from "@/lib/artifactCanvasChrome";
import type { ArtifactPayload, CalendarEvent } from "@/lib/artifactTypes";
import {
  buildMonthWeeks,
  calendarEventChipStyle,
  compareIsoDates,
  createCalendarEvent,
  layoutWeekEventSegments,
  monthLabel,
  todayIso,
} from "@/lib/calendarArtifact";
import { useCanvasStore } from "@/lib/store";
import { formatRichTextForDisplay } from "@/lib/richTextDisplay";

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const LANE_HEIGHT = 18;
const MAX_VISIBLE_LANES = 3;

function truncateTitle(title: string, max = 14): string {
  const formatted = formatRichTextForDisplay(title);
  if (formatted.length <= max) return formatted;
  return `${formatted.slice(0, max - 1)}…`;
}

function orderedRange(start: string, end: string): { start: string; end: string } {
  return compareIsoDates(start, end) <= 0
    ? { start, end }
    : { start: end, end: start };
}

function isDateInRange(iso: string, start: string, end: string): boolean {
  const { start: s, end: e } = orderedRange(start, end);
  return iso >= s && iso <= e;
}

export function CalendarArtifactContent({
  payload,
  artifactId,
  canEdit = false,
  fill = false,
  sidebar = false,
  layout = "panel",
}: {
  payload: Extract<ArtifactPayload, { type: "calendar" }>;
  artifactId?: string;
  canEdit?: boolean;
  fill?: boolean;
  sidebar?: boolean;
  layout?: "canvas" | "panel" | "sidebar";
}) {
  const saveCalendarArtifactVersion = useCanvasStore(
    (s) => s.saveCalendarArtifactVersion,
  );
  const canvasReadOnly = useCanvasStore((s) => s.canvasReadOnly);
  const editable = canEdit && !canvasReadOnly && Boolean(artifactId);

  const [viewYear, setViewYear] = useState(payload.data.viewYear);
  const [viewMonth, setViewMonth] = useState(payload.data.viewMonth);
  const [selectionAnchor, setSelectionAnchor] = useState<string | null>(null);
  const [selectionEnd, setSelectionEnd] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setViewYear(payload.data.viewYear);
    setViewMonth(payload.data.viewMonth);
  }, [payload.data.viewYear, payload.data.viewMonth]);

  const highlightedSet = useMemo(
    () => new Set(payload.data.highlightedDates),
    [payload.data.highlightedDates],
  );
  const events = payload.data.events;
  const eventColorIndex = useMemo(
    () => new Map(events.map((event, index) => [event.id, index])),
    [events],
  );
  const today = todayIso();
  const weeks = useMemo(
    () => buildMonthWeeks(viewYear, viewMonth),
    [viewYear, viewMonth],
  );

  const selectionReady = selectionAnchor !== null && selectionEnd !== null;

  const persist = useCallback(
    (nextEvents: CalendarEvent[], nextView?: { year: number; month: number }) => {
      if (!artifactId) return;
      saveCalendarArtifactVersion(artifactId, {
        ...payload,
        data: {
          ...payload.data,
          viewYear: nextView?.year ?? viewYear,
          viewMonth: nextView?.month ?? viewMonth,
          events: nextEvents,
        },
      });
    },
    [artifactId, payload, saveCalendarArtifactVersion, viewMonth, viewYear],
  );

  const clearSelection = useCallback(() => {
    setSelectionAnchor(null);
    setSelectionEnd(null);
    setNewTitle("");
  }, []);

  useEffect(() => {
    if (!selectionReady) return;
    inputRef.current?.focus();
  }, [selectionReady]);

  useEffect(() => {
    if (!editable) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        clearSelection();
        setEditingEventId(null);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [clearSelection, editable]);

  useEffect(() => {
    if (!editable) return;
    const onPointerDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) {
        clearSelection();
        setEditingEventId(null);
      }
    };
    window.addEventListener("pointerdown", onPointerDown);
    return () => window.removeEventListener("pointerdown", onPointerDown);
  }, [clearSelection, editable]);

  const handleDayClick = useCallback(
    (iso: string) => {
      if (!editable) return;
      if (selectionAnchor === null) {
        setSelectionAnchor(iso);
        setSelectionEnd(iso);
        return;
      }
      setSelectionEnd(iso);
    },
    [editable, selectionAnchor],
  );

  const handleAddEvent = useCallback(() => {
    if (!selectionAnchor || !selectionEnd || !newTitle.trim()) return;
    const { start, end } = orderedRange(selectionAnchor, selectionEnd);
    const event = createCalendarEvent(newTitle.trim(), start, end);
    persist([...events, event]);
    clearSelection();
  }, [clearSelection, events, newTitle, persist, selectionAnchor, selectionEnd]);

  const handleDeleteEvent = useCallback(
    (id: string) => {
      persist(events.filter((e) => e.id !== id));
      setEditingEventId(null);
    },
    [events, persist],
  );

  const handleRenameEvent = useCallback(
    (id: string) => {
      const title = editTitle.trim();
      if (!title) return;
      persist(
        events.map((e) => (e.id === id ? { ...e, title } : e)),
      );
      setEditingEventId(null);
    },
    [editTitle, events, persist],
  );

  const goMonth = useCallback(
    (delta: number) => {
      let m = viewMonth + delta;
      let y = viewYear;
      if (m < 1) {
        m = 12;
        y -= 1;
      } else if (m > 12) {
        m = 1;
        y += 1;
      }
      setViewYear(y);
      setViewMonth(m);
      clearSelection();
      if (artifactId) {
        saveCalendarArtifactVersion(artifactId, {
          ...payload,
          data: { ...payload.data, viewYear: y, viewMonth: m },
        });
      }
    },
    [
      artifactId,
      clearSelection,
      payload,
      saveCalendarArtifactVersion,
      viewMonth,
      viewYear,
    ],
  );

  if (sidebar) {
    return (
      <div className="flex h-full min-h-[80px] flex-col justify-center p-3 text-center">
        <span className="font-display text-canvas-body-sm text-canvas-ink">
          {monthLabel(viewYear, viewMonth)}
        </span>
        <span className="mt-1 text-canvas-caption text-canvas-muted">
          {events.length} event{events.length === 1 ? "" : "s"}
        </span>
      </div>
    );
  }

  return (
    <ArtifactContentStage
      fill={fill}
      artifactId={artifactId}
      className={fill ? "flex min-h-0 flex-1 flex-col" : "min-h-[360px]"}
    >
      <div
        ref={rootRef}
        className={`flex flex-col ${fill ? `${ARTIFACT_CANVAS_SURFACE_FILL} min-h-0 flex-1` : "bg-canvas-card"}`}
        data-no-drag
      >
        <div className="flex shrink-0 items-center justify-between border-b border-canvas-border/60 px-4 py-5">
          <button
            type="button"
            data-no-drag
            onClick={() => goMonth(-1)}
            className="flex h-7 w-7 items-center justify-center rounded text-canvas-muted transition-colors hover:bg-canvas-border/30 hover:text-canvas-ink"
            aria-label="Previous month"
          >
            ‹
          </button>
          <h3 className="font-display text-[28px] leading-tight tracking-wide text-canvas-ink">
            {monthLabel(viewYear, viewMonth)}
          </h3>
          <button
            type="button"
            data-no-drag
            onClick={() => goMonth(1)}
            className="flex h-7 w-7 items-center justify-center rounded text-canvas-muted transition-colors hover:bg-canvas-border/30 hover:text-canvas-ink"
            aria-label="Next month"
          >
            ›
          </button>
        </div>

        <div className="grid shrink-0 grid-cols-7 border-b border-canvas-border/40">
          {WEEKDAYS.map((d) => (
            <div
              key={d}
              className="py-2 text-center text-canvas-caption font-medium uppercase tracking-widest text-canvas-muted"
            >
              {d}
            </div>
          ))}
        </div>

        <div
          className={`flex flex-col overflow-y-auto ${fill ? "min-h-0 flex-1" : ""}`}
          data-canvas-scroll
        >
          {weeks.map((week, weekIdx) => {
            const segments = layoutWeekEventSegments(week.days, events);
            const maxLane = segments.reduce(
              (max, s) => Math.max(max, s.lane),
              -1,
            );
            const laneCount = Math.min(maxLane + 1, MAX_VISIBLE_LANES);
            const eventAreaHeight =
              laneCount > 0 ? laneCount * LANE_HEIGHT + 4 : 0;

            return (
              <div
                key={weekIdx}
                className="border-b border-canvas-border/30 last:border-b-0"
              >
                <div className="grid grid-cols-7">
                  {week.days.map((cell, colIdx) => {
                    const iso = cell.iso;
                    const isHighlighted = iso ? highlightedSet.has(iso) : false;
                    const isToday = iso === today;
                    const inSelection =
                      iso &&
                      selectionAnchor &&
                      selectionEnd &&
                      isDateInRange(iso, selectionAnchor, selectionEnd);
                    const dayEvents = iso
                      ? events.filter(
                          (e) => iso >= e.startDate && iso <= e.endDate,
                        )
                      : [];

                    return (
                      <button
                        key={colIdx}
                        type="button"
                        data-no-drag
                        disabled={!iso || !editable}
                        onClick={() => iso && handleDayClick(iso)}
                        className={`artifact-cal-cell relative min-h-[52px] border-r border-canvas-border/20 p-1.5 text-left transition-colors last:border-r-0 ${
                          cell.inMonth ? "bg-canvas-card" : "bg-canvas-bg/40"
                        } ${inSelection ? "artifact-cal-cell--selected bg-canvas-ink/5" : ""} ${
                          editable && iso
                            ? "cursor-pointer hover:bg-canvas-border/20"
                            : "cursor-default"
                        }`}
                      >
                        {cell.day !== null && (
                          <span
                            className={`artifact-cal-day inline-flex h-6 min-w-[1.5rem] items-center justify-center rounded-full text-canvas-caption tabular-nums ${
                              isHighlighted
                                ? "artifact-cal-day--highlighted font-semibold text-canvas-ink ring-1 ring-canvas-ink"
                                : cell.inMonth
                                  ? "text-canvas-ink"
                                  : "text-canvas-muted/50"
                            } ${isToday ? "artifact-cal-day--today" : ""}`}
                          >
                            {isToday && (
                              <span
                                className="absolute left-2 top-2 h-1 w-1 rounded-full bg-canvas-ink"
                                aria-hidden
                              />
                            )}
                            {cell.day}
                          </span>
                        )}
                        {dayEvents.length > 0 && eventAreaHeight === 0 && (
                          <div className="mt-0.5 space-y-0.5">
                            {dayEvents.slice(0, 2).map((ev) => {
                              const chipStyle = calendarEventChipStyle(
                                eventColorIndex.get(ev.id) ?? 0,
                              );
                              return (
                                <div
                                  key={ev.id}
                                  title={ev.title}
                                  className="truncate rounded px-1 py-0.5 text-canvas-caption font-medium leading-tight"
                                  style={chipStyle}
                                >
                                  {truncateTitle(ev.title, 10)}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>

                {eventAreaHeight > 0 && (
                  <div
                    className="relative grid grid-cols-7 px-0"
                    style={{ height: eventAreaHeight, minHeight: eventAreaHeight }}
                  >
                    {segments
                      .filter((s) => s.lane < MAX_VISIBLE_LANES)
                      .map((seg) => {
                        const chipStyle = calendarEventChipStyle(
                          eventColorIndex.get(seg.event.id) ?? 0,
                        );
                        return (
                          <button
                            key={`${seg.event.id}-${weekIdx}-${seg.startCol}`}
                            type="button"
                            data-no-drag
                            title={seg.event.title}
                            disabled={!editable}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (!editable) return;
                              setEditingEventId(seg.event.id);
                              setEditTitle(seg.event.title);
                              clearSelection();
                            }}
                            className="absolute mx-0.5 truncate rounded-canvas-xs px-1.5 text-left text-canvas-caption font-medium leading-[18px] transition-opacity hover:opacity-80 disabled:cursor-default"
                            style={{
                              left: `calc(${(seg.startCol / 7) * 100}% + 2px)`,
                              width: `calc(${(seg.span / 7) * 100}% - 4px)`,
                              top: seg.lane * LANE_HEIGHT + 2,
                              height: LANE_HEIGHT - 2,
                              ...chipStyle,
                            }}
                          >
                            {truncateTitle(seg.event.title)}
                          </button>
                        );
                      })}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {editable && selectionReady && (
          <div
            className="flex shrink-0 items-center gap-2 border-t border-canvas-border/60 bg-canvas-card px-3 py-2"
            data-no-drag
          >
            <input
              ref={inputRef}
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleAddEvent();
              }}
              placeholder="Event title"
              className="min-w-0 flex-1 rounded border border-canvas-border bg-canvas-card px-2 py-1.5 text-canvas-body-sm text-canvas-ink outline-none placeholder:text-canvas-muted focus:border-canvas-ink/40"
            />
            <button
              type="button"
              onClick={handleAddEvent}
              disabled={!newTitle.trim()}
              className="shrink-0 rounded border border-canvas-ink bg-canvas-ink px-3 py-1.5 text-canvas-caption font-medium text-canvas-card transition-opacity disabled:opacity-40"
            >
              Add
            </button>
          </div>
        )}

        {editable && editingEventId && (
          <div
            className="flex shrink-0 items-center gap-2 border-t border-canvas-border/60 bg-canvas-card px-3 py-2"
            data-no-drag
          >
            <input
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleRenameEvent(editingEventId);
              }}
              className="min-w-0 flex-1 rounded border border-canvas-border bg-canvas-card px-2 py-1.5 text-canvas-body-sm text-canvas-ink outline-none focus:border-canvas-ink/40"
            />
            <button
              type="button"
              onClick={() => handleRenameEvent(editingEventId)}
              className="shrink-0 rounded border border-canvas-border px-2 py-1.5 text-canvas-caption text-canvas-ink hover:bg-canvas-border/20"
            >
              Save
            </button>
            <button
              type="button"
              onClick={() => handleDeleteEvent(editingEventId)}
              className="shrink-0 rounded border border-canvas-border px-2 py-1.5 text-canvas-caption text-canvas-muted hover:bg-canvas-border/20 hover:text-canvas-ink"
            >
              Delete
            </button>
          </div>
        )}
      </div>
    </ArtifactContentStage>
  );
}
