/** Scopes for Google Workspace import and Sheets export. */
export const GOOGLE_WORKSPACE_SCOPES = [
  "https://www.googleapis.com/auth/drive.readonly",
  "https://www.googleapis.com/auth/drive.file",
  "https://www.googleapis.com/auth/spreadsheets",
  "https://www.googleapis.com/auth/userinfo.email",
] as const;

export const GOOGLE_OAUTH_STATE_COOKIE = "google_oauth_state";

/** Max extracted text stored on canvas artifacts and sent to the model. */
export const GOOGLE_EXTRACT_MAX_CHARS = 60_000;
