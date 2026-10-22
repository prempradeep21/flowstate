import { NextResponse } from "next/server";
import { getAdminUser } from "@/lib/adminAccess.server";
import { DECISIONS, type Decision } from "@/lib/outreach/podcasters";
import { applyDecisions } from "@/lib/outreach/podcasters.server";
import { isServiceRoleConfigured } from "@/lib/supabase/serviceRole";

type DecisionInput = { id: string; decision: Decision; example_canvas_from: string | null };

function parse(body: unknown): DecisionInput[] | null {
  const list = (body as { decisions?: unknown } | null)?.decisions;
  if (!Array.isArray(list) || list.length === 0) return null;
  const out: DecisionInput[] = [];
  for (const item of list) {
    const { id, decision, example_canvas_from } = (item ?? {}) as Record<string, unknown>;
    if (typeof id !== "string" || !(DECISIONS as readonly unknown[]).includes(decision)) return null;
    out.push({
      id,
      decision: decision as Decision,
      example_canvas_from: typeof example_canvas_from === "string" ? example_canvas_from : null,
    });
  }
  return out;
}

/**
 * The morning review's Submit: queue the chosen rows for the assets routine.
 * The tracking sheet picks the decisions up when that routine next runs.
 */
export async function POST(request: Request) {
  if (!(await getAdminUser())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (!isServiceRoleConfigured()) {
    return NextResponse.json({ error: "SUPABASE_SERVICE_ROLE_KEY is not configured." }, { status: 503 });
  }
  const decisions = parse(await request.json().catch(() => null));
  if (!decisions) {
    return NextResponse.json({ error: "Expected { decisions: [{ id, decision }] }." }, { status: 400 });
  }

  try {
    return NextResponse.json({ podcasters: await applyDecisions(decisions) });
  } catch (error) {
    return NextResponse.json({ error: String((error as Error).message) }, { status: 500 });
  }
}
