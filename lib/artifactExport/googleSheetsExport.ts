import type { ExportResult } from "@/lib/artifactExport/executeExport";

export async function exportTableToGoogleSheets(
  title: string,
  rows: string[][],
): Promise<ExportResult> {
  try {
    const res = await fetch("/api/google/sheets/export", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, rows }),
    });
    const data = (await res.json()) as {
      needsConnect?: boolean;
      error?: string;
      url?: string;
      spreadsheetId?: string;
    };

    if (data.needsConnect) {
      return { ok: false, error: "Connect Google Drive to export.", needsConnect: true };
    }
    if (!res.ok || !data.url) {
      return { ok: false, error: data.error ?? "Export to Google Sheets failed." };
    }
    window.open(data.url, "_blank", "noopener,noreferrer");
    return { ok: true, message: "Opened new Google Sheet", url: data.url };
  } catch {
    return { ok: false, error: "Export to Google Sheets failed." };
  }
}
