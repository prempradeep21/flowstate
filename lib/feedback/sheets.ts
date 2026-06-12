import { google } from "googleapis";

export interface FeedbackSheetRow {
  userEmail: string;
  userId: string | null;
  pageUrl: string | null;
  message: string;
  imageUrls: string[];
}

interface ServiceAccountCredentials {
  client_email: string;
  private_key: string;
}

const SHEETS_SCOPE = "https://www.googleapis.com/auth/spreadsheets";

function parseServiceAccountJson(raw: string): ServiceAccountCredentials | null {
  try {
    const parsed = JSON.parse(raw) as Partial<ServiceAccountCredentials>;
    if (
      typeof parsed.client_email !== "string" ||
      typeof parsed.private_key !== "string"
    ) {
      return null;
    }
    return {
      client_email: parsed.client_email,
      private_key: parsed.private_key.replace(/\\n/g, "\n"),
    };
  } catch {
    return null;
  }
}

export function isFeedbackSheetConfigured(): boolean {
  return Boolean(
    process.env.GOOGLE_FEEDBACK_SHEET_ID?.trim() &&
      process.env.GOOGLE_SERVICE_ACCOUNT_JSON?.trim(),
  );
}

export async function appendFeedbackToSheet(
  row: FeedbackSheetRow,
): Promise<boolean> {
  const spreadsheetId = process.env.GOOGLE_FEEDBACK_SHEET_ID?.trim();
  const credentialsRaw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON?.trim();
  const range =
    process.env.GOOGLE_FEEDBACK_SHEET_RANGE?.trim() || "Sheet1!A:F";

  if (!spreadsheetId || !credentialsRaw) {
    return false;
  }

  const credentials = parseServiceAccountJson(credentialsRaw);
  if (!credentials) {
    console.error("[feedback] Invalid GOOGLE_SERVICE_ACCOUNT_JSON");
    return false;
  }

  const auth = new google.auth.JWT({
    email: credentials.client_email,
    key: credentials.private_key,
    scopes: [SHEETS_SCOPE],
  });

  const sheets = google.sheets({ version: "v4", auth });
  const submittedAt = new Date().toISOString();

  try {
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range,
      valueInputOption: "USER_ENTERED",
      insertDataOption: "INSERT_ROWS",
      requestBody: {
        values: [
          [
            submittedAt,
            row.userEmail,
            row.userId ?? "",
            row.pageUrl ?? "",
            row.message,
            row.imageUrls.join("\n"),
          ],
        ],
      },
    });
    return true;
  } catch (err) {
    console.error("[feedback] Google Sheets append failed:", err);
    return false;
  }
}
