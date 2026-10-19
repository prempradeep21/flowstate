import { NextResponse } from "next/server";
import { getAdminUser } from "@/lib/adminAccess.server";
import { pickPatch } from "@/lib/outreach/podcasters";
import { deletePodcaster, updatePodcaster } from "@/lib/outreach/podcasters.server";
import { isServiceRoleConfigured } from "@/lib/supabase/serviceRole";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Ctx) {
  if (!(await getAdminUser())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (!isServiceRoleConfigured()) {
    return NextResponse.json(
      { error: "SUPABASE_SERVICE_ROLE_KEY is not configured." },
      { status: 503 },
    );
  }

  const { id } = await params;
  const patch = pickPatch(await request.json().catch(() => null));
  if (patch.host_name !== undefined && !patch.host_name.trim()) {
    return NextResponse.json({ error: "Podcaster can't be empty." }, { status: 400 });
  }
  if (patch.podcast_name !== undefined && !patch.podcast_name.trim()) {
    return NextResponse.json({ error: "Podcast name can't be empty." }, { status: 400 });
  }
  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: "Nothing to update." }, { status: 400 });
  }

  try {
    const podcaster = await updatePodcaster(id, patch);
    if (!podcaster) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ podcaster });
  } catch (error) {
    return NextResponse.json({ error: String((error as Error).message) }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: Ctx) {
  if (!(await getAdminUser())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (!isServiceRoleConfigured()) {
    return NextResponse.json(
      { error: "SUPABASE_SERVICE_ROLE_KEY is not configured." },
      { status: 503 },
    );
  }

  const { id } = await params;
  try {
    await deletePodcaster(id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: String((error as Error).message) }, { status: 500 });
  }
}
