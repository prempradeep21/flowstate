import { NextResponse } from "next/server";
import { getAdminUser } from "@/lib/adminAccess.server";
import { fetchRecentQaTurnFailures } from "@/lib/qaTurnEvents.server";

export async function GET() {
  const admin = await getAdminUser();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const failures = await fetchRecentQaTurnFailures(25);
    return NextResponse.json({ failures });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to load failures";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
