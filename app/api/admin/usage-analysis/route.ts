import { NextResponse } from "next/server";
import { getAdminUser } from "@/lib/adminAccess.server";
import {
  fetchLatestUsageAnalysisSnapshot,
  formatUsageAnalysisTimestamp,
  saveUsageAnalysisSnapshot,
} from "@/lib/admin/usageAnalysis.server";
import {
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
          "SUPABASE_SERVICE_ROLE_KEY is not configured. Add it to .env.local to load usage data.",
        snapshot: null,
      },
      { status: 503 },
    );
  }

  try {
    const row = await fetchLatestUsageAnalysisSnapshot();
    if (!row) {
      return NextResponse.json({
        snapshot: null,
        computedAtLabel: null,
        message: "No snapshot yet. Use Refresh snapshot to generate the first report.",
      });
    }

    return NextResponse.json({
      snapshot: row.payload,
      computedAt: row.computed_at,
      computedAtLabel: formatUsageAnalysisTimestamp(row.computed_at),
      stats: row.stats,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Request failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST() {
  const user = await getAdminUser();
  if (!user) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (!isServiceRoleConfigured()) {
    return NextResponse.json(
      { error: "SUPABASE_SERVICE_ROLE_KEY is not configured" },
      { status: 503 },
    );
  }

  try {
    const row = await saveUsageAnalysisSnapshot();
    return NextResponse.json({
      snapshot: row.payload,
      computedAt: row.computed_at,
      computedAtLabel: formatUsageAnalysisTimestamp(row.computed_at),
      stats: row.stats,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Snapshot failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
