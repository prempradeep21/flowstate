import { StudioFontScope } from "./studioFonts";

export default function ArtifactStudioLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // The root body never scrolls (the canvas owns it) — this page does.
  return <StudioFontScope className="h-full overflow-y-auto">{children}</StudioFontScope>;
}
