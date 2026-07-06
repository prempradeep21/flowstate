import { NextResponse } from "next/server";
import { getAdminUser } from "@/lib/adminAccess.server";
import { createCustomThemeId } from "@/lib/design/theme/presets";
import { updatePublishedTheme } from "@/lib/design/theme/publishedTheme.server";
import type { ThemePreset } from "@/lib/design/theme/types";

interface SaveCustomThemeBody {
  name: string;
  preset: Omit<ThemePreset, "id" | "name">;
}

/** Saves the currently live resolved theme as a new named custom theme. */
export async function POST(request: Request) {
  const admin = await getAdminUser();
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: SaveCustomThemeBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const name = body.name?.trim();
  if (!name) {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }
  if (!body.preset) {
    return NextResponse.json({ error: "preset is required" }, { status: 400 });
  }

  const newTheme: ThemePreset = {
    ...body.preset,
    id: createCustomThemeId(name),
    name,
    description: body.preset.description || "Custom saved theme.",
  };

  const result = updatePublishedTheme((current) => ({
    ...current,
    customThemes: [...current.customThemes, newTheme],
  }));

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 501 });
  }

  return NextResponse.json({ theme: newTheme, published: result.data });
}

/** Deletes a saved custom theme; unpublishes it first if it was the active default. */
export async function DELETE(request: Request) {
  const admin = await getAdminUser();
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const id = new URL(request.url).searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "id query param is required" }, { status: 400 });
  }

  const result = updatePublishedTheme((current) => ({
    ...current,
    activeDefaultId:
      current.activeDefaultId === id ? null : current.activeDefaultId,
    defaultOverrides:
      current.activeDefaultId === id ? null : current.defaultOverrides,
    customThemes: current.customThemes.filter((theme) => theme.id !== id),
  }));

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 501 });
  }

  return NextResponse.json(result.data);
}
