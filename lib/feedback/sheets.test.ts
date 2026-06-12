import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

const mockAppend = vi.fn();

vi.mock("googleapis", () => ({
  google: {
    auth: {
      JWT: vi.fn().mockImplementation(() => ({})),
    },
    sheets: vi.fn(() => ({
      spreadsheets: {
        values: {
          append: mockAppend,
        },
      },
    })),
  },
}));

describe("appendFeedbackToSheet", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
    mockAppend.mockReset();
    mockAppend.mockResolvedValue({});
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("returns false when sheet env is missing", async () => {
    delete process.env.GOOGLE_FEEDBACK_SHEET_ID;
    delete process.env.GOOGLE_SERVICE_ACCOUNT_JSON;

    const { appendFeedbackToSheet } = await import("@/lib/feedback/sheets");
    const ok = await appendFeedbackToSheet({
      userEmail: "test@example.com",
      userId: "user-1",
      pageUrl: "https://example.com",
      message: "Hello",
      imageUrls: [],
    });

    expect(ok).toBe(false);
    expect(mockAppend).not.toHaveBeenCalled();
  });

  it("appends a row when configured", async () => {
    process.env.GOOGLE_FEEDBACK_SHEET_ID =
      "1nlcriO0juWF3dkpcKmNQaXFGH9ZcANpDi_NHITx1ubs";
    process.env.GOOGLE_SERVICE_ACCOUNT_JSON = JSON.stringify({
      client_email: "feedback@example.iam.gserviceaccount.com",
      private_key: "-----BEGIN PRIVATE KEY-----\\nabc\\n-----END PRIVATE KEY-----\\n",
    });

    const { appendFeedbackToSheet } = await import("@/lib/feedback/sheets");
    const ok = await appendFeedbackToSheet({
      userEmail: "test@example.com",
      userId: "user-1",
      pageUrl: "https://example.com/page",
      message: "Try dark mode",
      imageUrls: ["https://cdn.example.com/a.png"],
    });

    expect(ok).toBe(true);
    expect(mockAppend).toHaveBeenCalledWith(
      expect.objectContaining({
        spreadsheetId: "1nlcriO0juWF3dkpcKmNQaXFGH9ZcANpDi_NHITx1ubs",
        range: "Sheet1!A:F",
        valueInputOption: "USER_ENTERED",
        requestBody: {
          values: [
            [
              expect.any(String),
              "test@example.com",
              "user-1",
              "https://example.com/page",
              "Try dark mode",
              "https://cdn.example.com/a.png",
            ],
          ],
        },
      }),
    );
  });
});

describe("isFeedbackSheetConfigured", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("is true when both env vars are set", async () => {
    process.env.GOOGLE_FEEDBACK_SHEET_ID = "sheet-id";
    process.env.GOOGLE_SERVICE_ACCOUNT_JSON = '{"client_email":"a@b.com","private_key":"x"}';

    const { isFeedbackSheetConfigured } = await import("@/lib/feedback/sheets");
    expect(isFeedbackSheetConfigured()).toBe(true);
  });
});
