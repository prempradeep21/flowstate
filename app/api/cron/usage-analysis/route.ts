import { NextResponse } from "next/server";
import { saveUsageAnalysisSnapshot } from "@/lib/admin/usageAnalysis.server";
import { isServiceRoleConfigured } from "@/lib/supabase/serviceRole";

export const maxDuration = 60;

function isAuthorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const auth = request.headers.get("authorization");
  return auth === `Bearer ${secret}`;
}

export async function GET(request: Request) {
  return runSnapshot(request);
}

export async function POST(request: Request) {
  return runSnapshot(request);
}

async function runSnapshot(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
      ok: true,
      id: row.id,
      computed_at: row.computed_at,
      stats: row.stats,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Snapshot failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
