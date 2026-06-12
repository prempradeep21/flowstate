import { isSupabaseConfigured } from "@/lib/supabase/client";

export interface FeedbackRecord {
  message: string;
  pageUrl: string | null;
  imageUrls: string[];
}

export async function saveFeedbackToSupabase(
  input: FeedbackRecord,
): Promise<boolean> {
  if (!isSupabaseConfigured()) {
    return false;
  }

  try {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();
    const { error } = await supabase.rpc("submit_beta_suggestion", {
      p_message: input.message,
      p_page_url: input.pageUrl,
      p_image_urls: input.imageUrls,
    });

    if (error) {
      console.error("[feedback] Supabase save failed:", error.message);
      return false;
    }

    return true;
  } catch (err) {
    console.error("[feedback] Supabase save failed:", err);
    return false;
  }
}
