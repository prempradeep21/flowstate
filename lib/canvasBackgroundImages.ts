import generatedImage from "@/assets/canvas-backgrounds/Generated_image.png";
import grok426a37e5 from "@/assets/canvas-backgrounds/grok-426a37e5-5cac-44b8-92b1-d85a1c30ab78.jpg";
import grok5f2e9dd9 from "@/assets/canvas-backgrounds/grok-5f2e9dd9-f4a1-4b77-ad3a-addb16c167d1.jpg";
import grok722e3365 from "@/assets/canvas-backgrounds/grok-722e3365-4ac9-4bfd-9951-228594f8233f.jpg";
import grok7e162978 from "@/assets/canvas-backgrounds/grok-7e162978-f2d4-4267-b994-a0629e7915d9.jpg";
import grokb94b4fa9 from "@/assets/canvas-backgrounds/grok-b94b4fa9-9565-4c59-8ba0-a456ad4cd4d0.jpg";
import grokdb6e0d39 from "@/assets/canvas-backgrounds/grok-db6e0d39-4cc6-49d6-8636-5f15cad1cd1e.jpg";
import grokec82cfab from "@/assets/canvas-backgrounds/grok-ec82cfab-5394-40ac-8593-eb3df585acf1.jpg";
import gulabImageDafdcf4d from "@/assets/canvas-backgrounds/gulab-image-dafdcf4d.png";
import imageJpg from "@/assets/canvas-backgrounds/image.jpg";
import type { StaticImageData } from "next/image";

export interface CanvasBackgroundImage {
  id: string;
  label: string;
  src: string;
}

function imageSrc(asset: StaticImageData): string {
  return asset.src;
}

export const CANVAS_STATIC_BACKGROUND_IMAGES: readonly CanvasBackgroundImage[] =
  [
    {
      id: "grok-5f2e9dd9",
      label: "Photo 1",
      src: imageSrc(grok5f2e9dd9),
    },
    {
      id: "grok-7e162978",
      label: "Photo 2",
      src: imageSrc(grok7e162978),
    },
    {
      id: "grok-b94b4fa9",
      label: "Photo 3",
      src: imageSrc(grokb94b4fa9),
    },
    {
      id: "grok-722e3365",
      label: "Photo 4",
      src: imageSrc(grok722e3365),
    },
    {
      id: "grok-db6e0d39",
      label: "Photo 5",
      src: imageSrc(grokdb6e0d39),
    },
    {
      id: "grok-426a37e5",
      label: "Photo 6",
      src: imageSrc(grok426a37e5),
    },
    {
      id: "grok-ec82cfab",
      label: "Photo 7",
      src: imageSrc(grokec82cfab),
    },
    {
      id: "generated-image",
      label: "Photo 8",
      src: imageSrc(generatedImage),
    },
    {
      id: "gulab-image-dafdcf4d",
      label: "Photo 9",
      src: imageSrc(gulabImageDafdcf4d),
    },
    {
      id: "image-jpg",
      label: "Photo 10",
      src: imageSrc(imageJpg),
    },
  ] as const;

export const DEFAULT_CANVAS_BACKGROUND_IMAGE_ID =
  CANVAS_STATIC_BACKGROUND_IMAGES[0]!.id;

export function getCanvasBackgroundImageById(
  id: string,
): CanvasBackgroundImage | undefined {
  return CANVAS_STATIC_BACKGROUND_IMAGES.find((image) => image.id === id);
}

export function getCanvasBackgroundImageIndex(id: string): number {
  const index = CANVAS_STATIC_BACKGROUND_IMAGES.findIndex(
    (image) => image.id === id,
  );
  return index >= 0 ? index : 0;
}

export function cycleCanvasBackgroundImageId(
  currentId: string,
  delta: -1 | 1,
): string {
  const currentIndex = getCanvasBackgroundImageIndex(currentId);
  const nextIndex =
    (currentIndex + delta + CANVAS_STATIC_BACKGROUND_IMAGES.length) %
    CANVAS_STATIC_BACKGROUND_IMAGES.length;
  return CANVAS_STATIC_BACKGROUND_IMAGES[nextIndex]!.id;
}

export function normalizeCanvasBackgroundImageId(
  raw: unknown,
  fallback: string = DEFAULT_CANVAS_BACKGROUND_IMAGE_ID,
): string {
  return typeof raw === "string" && getCanvasBackgroundImageById(raw)
    ? raw
    : fallback;
}
