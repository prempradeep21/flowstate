import type { ArtifactPayload } from "@/lib/artifactTypes";
import { CATALOG_CUBBON_PARK } from "@/lib/artifactCatalogSamples";
import { MANUAL_CALENDAR_SOURCE_CARD_ID } from "@/lib/calendarArtifact";
import { MANUAL_MAP_SOURCE_CARD_ID } from "@/lib/mapArtifact";
import { MANUAL_TIMELINE_SOURCE_CARD_ID } from "@/lib/timelineArtifact";
import {
  defaultStickyNoteColorId,
  MANUAL_STICKY_NOTE_SOURCE_CARD_ID,
} from "@/lib/stickyNoteArtifact";
import { MANUAL_TODO_SOURCE_CARD_ID, normalizeTodoItem } from "@/lib/todoArtifact";

/** Source card ids for user-initiated manual artifact drops (no chat turn). */
export const MANUAL_TABLE_SOURCE_CARD_ID = "__manual_table__";
export const MANUAL_CHART_SOURCE_CARD_ID = "__manual_chart__";
export const MANUAL_IMAGES_SOURCE_CARD_ID = "__manual_images__";

export type ManualArtifactType =
  | "stickynote"
  | "todo"
  | "calendar"
  | "timeline"
  | "table"
  | "chart"
  | "map"
  | "streetview"
  | "images";

function todayIsoDate(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function todayIsoDateTime(): string {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  return d.toISOString();
}

export function manualArtifactSourceCardId(type: ManualArtifactType): string {
  switch (type) {
    case "stickynote":
      return MANUAL_STICKY_NOTE_SOURCE_CARD_ID;
    case "todo":
      return MANUAL_TODO_SOURCE_CARD_ID;
    case "calendar":
      return MANUAL_CALENDAR_SOURCE_CARD_ID;
    case "timeline":
      return MANUAL_TIMELINE_SOURCE_CARD_ID;
    case "table":
      return MANUAL_TABLE_SOURCE_CARD_ID;
    case "chart":
      return MANUAL_CHART_SOURCE_CARD_ID;
    case "map":
      return MANUAL_MAP_SOURCE_CARD_ID;
    case "streetview":
      return MANUAL_MAP_SOURCE_CARD_ID;
    case "images":
      return MANUAL_IMAGES_SOURCE_CARD_ID;
  }
}

export function createManualArtifactPayload(
  type: ManualArtifactType,
): ArtifactPayload {
  switch (type) {
    case "stickynote":
      return {
        type: "stickynote",
        title: "Sticky note",
        data: {
          text: "",
          colorId: defaultStickyNoteColorId(),
        },
      };
    case "todo":
      return {
        type: "todo",
        title: "Untitled list",
        data: {
          items: ["Task 1", "Task 2", "Task 3"].map((label) =>
            normalizeTodoItem({ label, checked: false }),
          ),
        },
      };
    case "calendar": {
      const now = new Date();
      const iso = todayIsoDate();
      return {
        type: "calendar",
        title: "Untitled calendar",
        data: {
          viewYear: now.getFullYear(),
          viewMonth: now.getMonth() + 1,
          highlightedDates: [iso],
          events: [
            {
              id: "sample_evt",
              title: "Sample event",
              startDate: iso,
              endDate: iso,
            },
          ],
        },
      };
    }
    case "timeline":
      return {
        type: "timeline",
        title: "Untitled timeline",
        data: {
          scale: "month",
          events: [
            {
              id: "sample_evt",
              label: "Sample milestone",
              at: todayIsoDateTime(),
            },
          ],
        },
      };
    case "table":
      return {
        type: "table",
        title: "Untitled table",
        data: {
          columns: [
            { key: "col_a", label: "Column A" },
            { key: "col_b", label: "Column B" },
            { key: "col_c", label: "Column C" },
          ],
          rows: [{ col_a: "", col_b: "", col_c: "" }, { col_a: "", col_b: "", col_c: "" }, { col_a: "", col_b: "", col_c: "" }],
        },
      };
    case "chart":
      return {
        type: "chart",
        title: "Untitled chart",
        data: {
          chartType: "bar",
          categories: ["A", "B", "C"],
          series: [{ name: "Series 1", data: [0, 0, 0] }],
        },
      };
    case "map":
      return {
        type: "map",
        title: "Untitled map",
        data: {
          place: {
            name: CATALOG_CUBBON_PARK.name,
            lat: CATALOG_CUBBON_PARK.lat,
            lng: CATALOG_CUBBON_PARK.lng,
          },
          zoom: 14,
          savedPlaces: [],
        },
      };
    case "streetview":
      return {
        type: "streetview",
        title: "Untitled street view",
        data: {
          place: {
            name: CATALOG_CUBBON_PARK.name,
            lat: CATALOG_CUBBON_PARK.lat,
            lng: CATALOG_CUBBON_PARK.lng,
          },
          heading: 0,
          pitch: 0,
          fov: 90,
        },
      };
    case "images":
      return {
        type: "images",
        title: "Untitled gallery",
        data: { items: [] },
      };
  }
}
