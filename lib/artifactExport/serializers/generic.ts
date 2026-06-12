import type { CalendarArtifactData } from "@/lib/artifactTypes";
import type { TodoArtifactData } from "@/lib/artifactTypes";
import type { TimelineArtifactData } from "@/lib/artifactTypes";

export function payloadToJson(data: unknown): string {
  return JSON.stringify(data, null, 2);
}

export function todoToMarkdown(data: TodoArtifactData): string {
  return data.items
    .map((item) => `- [${item.checked ? "x" : " "}] ${item.label}`)
    .join("\n");
}

export function todoToHtml(data: TodoArtifactData): string {
  const items = data.items
    .map(
      (item) =>
        `<li><input type="checkbox"${item.checked ? " checked" : ""} disabled /> ${escapeHtml(item.label)}</li>`,
    )
    .join("\n");
  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8" /><title>Todo</title></head>
<body><ul style="font-family: system-ui; line-height: 1.8;">${items}</ul></body></html>`;
}

export function todoToReact(data: TodoArtifactData): string {
  const items = JSON.stringify(
    data.items.map((i) => ({ label: i.label, checked: i.checked })),
    null,
    2,
  );
  return `import React, { useState } from "react";

const initialItems = ${items};

export default function TodoList() {
  const [items, setItems] = useState(initialItems);
  return (
    <ul style={{ fontFamily: "system-ui", lineHeight: 1.8, listStyle: "none", padding: 0 }}>
      {items.map((item, i) => (
        <li key={i}>
          <label>
            <input
              type="checkbox"
              checked={item.checked}
              onChange={() =>
                setItems((prev) =>
                  prev.map((x, j) => (j === i ? { ...x, checked: !x.checked } : x)),
                )
              }
            />{" "}
            {item.label}
          </label>
        </li>
      ))}
    </ul>
  );
}`;
}

function formatIcsDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso.replace(/[-:]/g, "").slice(0, 8);
  return d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

export function calendarToIcs(data: CalendarArtifactData, title: string): string {
  const events = data.events
    .map(
      (ev) => `BEGIN:VEVENT
UID:${ev.id}@flowstate
DTSTART:${formatIcsDate(ev.startDate)}
DTEND:${formatIcsDate(ev.endDate)}
SUMMARY:${ev.title.replace(/[,;\\]/g, " ")}
END:VEVENT`,
    )
    .join("\n");
  return `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Flowstate//Calendar//EN
X-WR-CALNAME:${title.replace(/[,;\\]/g, " ")}
${events}
END:VCALENDAR`;
}

export function timelineToCsv(data: TimelineArtifactData): string {
  const lines = ["id,at,label,side,highlight"];
  for (const ev of data.events) {
    lines.push(
      [
        csvEscape(ev.id),
        csvEscape(ev.at),
        csvEscape(ev.label),
        csvEscape(ev.side ?? ""),
        ev.highlight ? "true" : "false",
      ].join(","),
    );
  }
  return lines.join("\n");
}

export function timelineToMarkdown(data: TimelineArtifactData): string {
  return data.events
    .map((ev) => `- **${ev.at.slice(0, 10)}** — ${ev.label}`)
    .join("\n");
}

function csvEscape(value: string): string {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
