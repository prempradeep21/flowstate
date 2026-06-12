import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mockRpc = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    rpc: mockRpc,
  })),
}));

describe("saveFeedbackToSupabase", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
    mockRpc.mockReset();
    mockRpc.mockResolvedValue({ error: null });
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("returns false when Supabase is not configured", async () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    const { saveFeedbackToSupabase } = await import("@/lib/feedback/supabase");
    const ok = await saveFeedbackToSupabase({
      message: "Hello",
      pageUrl: null,
      imageUrls: [],
    });

    expect(ok).toBe(false);
    expect(mockRpc).not.toHaveBeenCalled();
  });

  it("calls submit_beta_suggestion when configured", async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon-key";

    const { saveFeedbackToSupabase } = await import("@/lib/feedback/supabase");
    const ok = await saveFeedbackToSupabase({
      message: "Add export",
      pageUrl: "https://app.example.com/canvas",
      imageUrls: ["https://cdn.example.com/a.png"],
    });

    expect(ok).toBe(true);
    expect(mockRpc).toHaveBeenCalledWith("submit_beta_suggestion", {
      p_message: "Add export",
      p_page_url: "https://app.example.com/canvas",
      p_image_urls: ["https://cdn.example.com/a.png"],
    });
  });
});
