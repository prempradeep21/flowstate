import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { getAdminUser } from "@/lib/adminAccess.server";
import { OUTREACH_MEDIA_BUCKET } from "@/lib/outreach/podcasters";
import {
  createServiceRoleClient,
  isServiceRoleConfigured,
} from "@/lib/supabase/serviceRole";

const EXTENSIONS: Record<string, string> = {
  "video/mp4": "mp4",
  "video/webm": "webm",
  "video/quicktime": "mov",
};

/**
 * Hands the browser a one-shot signed upload URL so a showcase video (tens of
 * MB) goes straight to Storage — a route handler body tops out at 4.5 MB on
 * Vercel, so proxying the file through here would fail in production.
 */
export async function POST(request: Request) {
  if (!(await getAdminUser())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (!isServiceRoleConfigured()) {
    return NextResponse.json(
      { error: "SUPABASE_SERVICE_ROLE_KEY is not configured." },
      { status: 503 },
    );
  }

  const body = (await request.json().catch(() => null)) as { contentType?: unknown } | null;
  const ext = typeof body?.contentType === "string" ? EXTENSIONS[body.contentType] : undefined;
  if (!ext) {
    return NextResponse.json({ error: "Upload an mp4, webm or mov file." }, { status: 400 });
  }

  const path = `videos/${randomUUID()}.${ext}`;
  const { data, error } = await createServiceRoleClient()
    .storage.from(OUTREACH_MEDIA_BUCKET)
    .createSignedUploadUrl(path);
  if (error || !data) {
    return NextResponse.json({ error: error?.message ?? "Could not sign upload" }, { status: 500 });
  }

  return NextResponse.json({ path: data.path, token: data.token });
}
