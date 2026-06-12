import { NextResponse } from "next/server";
import { google } from "googleapis";
import { getValidGoogleAccessToken } from "@/lib/google/tokens";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const MAX_ROWS = 10_000;
const MAX_COLS = 100;

function sanitizeSheetTitle(title: string): string {
  const trimmed = title.trim().slice(0, 80) || "Flowstate table";
  return trimmed.replace(/[\[\]:*?/\\]/g, " ").trim() || "Flowstate table";
}

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ needsConnect: true, error: "Sign in required" });
  }

  const accessToken = await getValidGoogleAccessToken(supabase, user.id);
  if (!accessToken) {
    return NextResponse.json({ needsConnect: true, error: "Connect Google Drive" });
  }

  let body: { title?: string; rows?: string[][] };
  try {
    body = (await req.json()) as { title?: string; rows?: string[][] };
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const rows = Array.isArray(body.rows) ? body.rows : [];
  if (rows.length === 0) {
    return NextResponse.json({ error: "No table data to export" }, { status: 400 });
  }
  if (rows.length > MAX_ROWS) {
    return NextResponse.json(
      { error: `Table exceeds ${MAX_ROWS} rows` },
      { status: 400 },
    );
  }

  const colCount = rows.reduce((max, row) => Math.max(max, row.length), 0);
  if (colCount > MAX_COLS) {
    return NextResponse.json(
      { error: `Table exceeds ${MAX_COLS} columns` },
      { status: 400 },
    );
  }

  const title = sanitizeSheetTitle(body.title ?? "Flowstate table");
  const oauth2 = new google.auth.OAuth2();
  oauth2.setCredentials({ access_token: accessToken });
  const sheets = google.sheets({ version: "v4", auth: oauth2 });

  try {
    const created = await sheets.spreadsheets.create({
      requestBody: {
        properties: { title },
        sheets: [{ properties: { title: "Sheet1" } }],
      },
    });

    const spreadsheetId = created.data.spreadsheetId;
    if (!spreadsheetId) {
      return NextResponse.json({ error: "Could not create spreadsheet" }, { status: 500 });
    }

    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: "Sheet1!A1",
      valueInputOption: "USER_ENTERED",
      requestBody: { values: rows },
    });

    const url = created.data.spreadsheetUrl ?? `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;
    return NextResponse.json({ spreadsheetId, url });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Sheets export failed";
    if (/insufficient|scope|403|401/i.test(message)) {
      return NextResponse.json({ needsConnect: true, error: "Reconnect Google Drive to export to Sheets" });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
