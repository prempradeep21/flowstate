import { NextResponse } from "next/server";
import { getAdminUser } from "@/lib/adminAccess.server";
import { pickPatch } from "@/lib/outreach/podcasters";
import { createPodcaster, listPodcasters } from "@/lib/outreach/podcasters.server";
import { isServiceRoleConfigured } from "@/lib/supabase/serviceRole";

function guardConfig() {
  if (isServiceRoleConfigured()) return null;
  return NextResponse.json(
    { error: "SUPABASE_SERVICE_ROLE_KEY is not configured." },
    { status: 503 },
  );
}

export async function GET() {
  if (!(await getAdminUser())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const notConfigured = guardConfig();
  if (notConfigured) return notConfigured;

  try {
    return NextResponse.json({ podcasters: await listPodcasters() });
  } catch (error) {
    return NextResponse.json({ error: String((error as Error).message) }, { status: 500 });
  }
}

export async function POST(request: Request) {
  if (!(await getAdminUser())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const notConfigured = guardConfig();
  if (notConfigured) return notConfigured;

  const patch = pickPatch(await request.json().catch(() => null));
  const host_name = patch.host_name?.trim();
  const podcast_name = patch.podcast_name?.trim();
  if (!host_name || !podcast_name) {
    return NextResponse.json(
      { error: "Podcaster and podcast name are required." },
      { status: 400 },
    );
  }

  try {
    const podcaster = await createPodcaster({ ...patch, host_name, podcast_name });
    return NextResponse.json({ podcaster });
  } catch (error) {
    return NextResponse.json({ error: String((error as Error).message) }, { status: 500 });
  }
}
