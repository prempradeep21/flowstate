import { NextResponse } from "next/server";
import { getAdminUser } from "@/lib/adminAccess.server";
import {
  createServiceRoleClient,
  isServiceRoleConfigured,
} from "@/lib/supabase/serviceRole";

export async function GET() {
  const user = await getAdminUser();
  if (!user) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (!isServiceRoleConfigured()) {
    return NextResponse.json(
      {
        error:
          "SUPABASE_SERVICE_ROLE_KEY is not configured. Add it to .env.local to load suggestions.",
        suggestions: [],
      },
      { status: 503 },
    );
  }

  try {
    const supabase = createServiceRoleClient();
    const { data, error } = await supabase
      .from("beta_suggestions")
      .select(
        "id, user_id, user_email, page_url, message, image_urls, created_at",
      )
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ suggestions: data ?? [] });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Request failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
