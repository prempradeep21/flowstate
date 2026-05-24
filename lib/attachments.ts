import type { UploadedAttachment } from "@/lib/store";

export type UploadCategory = "images" | "documents";

export const UPLOAD_CATEGORY_LABELS: Record<UploadCategory, string> = {
  images: "Images",
  documents: "Documents",
};

const IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
]);

export function uploadCategoryForMime(mime: string): UploadCategory | null {
  if (IMAGE_TYPES.has(mime)) return "images";
  if (mime === "application/pdf") return "documents";
  return null;
}

export function isAcceptedUploadMime(mime: string): boolean {
  return uploadCategoryForMime(mime) !== null;
}

export interface UploadCategoryGroup {
  category: UploadCategory;
  label: string;
  items: UploadedAttachment[];
}

export function groupUploadedAttachments(
  attachments: UploadedAttachment[],
): UploadCategoryGroup[] {
  const buckets: Record<UploadCategory, UploadedAttachment[]> = {
    images: [],
    documents: [],
  };

  for (const att of attachments) {
    const cat = uploadCategoryForMime(att.type);
    if (cat) buckets[cat].push(att);
  }

  return (["images", "documents"] as const).map((category) => ({
    category,
    label: UPLOAD_CATEGORY_LABELS[category],
    items: buckets[category],
  }));
}

export async function fileToUploadedAttachment(
  file: File,
): Promise<UploadedAttachment | null> {
  const type = file.type || "application/octet-stream";
  if (!isAcceptedUploadMime(type)) return null;

  const base64 = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.includes(",") ? result.split(",")[1]! : result);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  return {
    id: `upload_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`,
    name: file.name,
    type,
    data: base64,
    addedAt: Date.now(),
  };
}
