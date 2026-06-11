import { NextResponse } from "next/server";
import {
  extractGoogleDriveFile,
  GoogleDriveApiError,
} from "@/lib/google/driveClient";
import { parseGoogleDriveUrl } from "@/lib/google/parseDriveUrl";
import { getValidGoogleAccessToken } from "@/lib/google/tokens";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return NextResponse.json({
      needsConnect: true,
      error: "Sign in required",
    });
  }

  const params = new URL(req.url).searchParams;
  const rawUrl = params.get("url")?.trim() ?? "";
  const rawFileId = params.get("fileId")?.trim() ?? "";
  const parsed = rawUrl ? parseGoogleDriveUrl(rawUrl) : null;
  const fileId = rawFileId || parsed?.fileId;

  if (!fileId) {
    return NextResponse.json({ error: "Missing fileId or url" }, { status: 400 });
  }

  const accessToken = await getValidGoogleAccessToken(supabase, user.id);
  if (!accessToken) {
    return NextResponse.json({
      needsConnect: true,
      fileId,
      url: parsed?.url ?? rawUrl,
    });
  }

  try {
    const result = await extractGoogleDriveFile(accessToken, {
      fileId,
      url: parsed?.url ?? (rawUrl || undefined),
    });
    return NextResponse.json({
      ...result,
      status: "ready",
    });
  } catch (err) {
    if (err instanceof GoogleDriveApiError) {
      if (err.status === 401 || err.status === 403 || err.status === 404) {
        return NextResponse.json({
          needsAccess: true,
          fileId,
          url: parsed?.url ?? rawUrl,
          error: err.message,
        });
      }
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    const message = err instanceof Error ? err.message : "Import failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
