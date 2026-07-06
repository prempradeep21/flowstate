import { NextResponse } from "next/server";
import { getAdminUser } from "@/lib/adminAccess.server";
import { updatePublishedTheme } from "@/lib/design/theme/publishedTheme.server";
import type { ThemeOverrides } from "@/lib/design/theme/types";

interface PublishBody {
  presetId: string;
  overrides: ThemeOverrides;
}

/**
 * Sets the current live theme (preset + overrides) as the default for every
 * fresh session on this local dev server. Never touches presets.ts or
 * globals.css — purely writes lib/design/theme/publishedTheme.json.
 */
export async function POST(request: Request) {
  const admin = await getAdminUser();
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: PublishBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (typeof body.presetId !== "string") {
    return NextResponse.json({ error: "presetId is required" }, { status: 400 });
  }

  const result = updatePublishedTheme((current) => ({
    ...current,
    activeDefaultId: body.presetId,
    defaultOverrides: body.overrides ?? {},
  }));

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 501 });
  }

  return NextResponse.json(result.data);
}
