import { writeFile } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
import { normalizeSoundMapping } from "@/lib/sounds/config";
import { formatSoundMapAsTypeScript } from "@/lib/sounds/export";

export async function POST(request: Request) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not available in production" }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const map =
    body && typeof body === "object" && "map" in body
      ? (body as { map: unknown }).map
      : null;

  const normalized = normalizeSoundMapping(map);
  if (!normalized) {
    return NextResponse.json({ error: "Invalid sound mapping" }, { status: 400 });
  }

  const registryPath = path.join(process.cwd(), "lib", "sounds", "registry.ts");
  const content = formatSoundMapAsTypeScript(normalized);

  try {
    await writeFile(registryPath, content, "utf8");
  } catch (e) {
    const message = e instanceof Error ? e.message : "Write failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
