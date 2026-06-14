import { isThreeDModelFile } from "@/lib/threeDArtifact";

export function getThreeDFilesFromDataTransfer(
  data: DataTransfer | null,
): File[] {
  if (!data) return [];
  const files: File[] = [];

  if (data.files?.length) {
    for (const file of Array.from(data.files)) {
      if (isThreeDModelFile(file)) files.push(file);
    }
  }

  if (!files.length && data.items?.length) {
    for (const item of Array.from(data.items)) {
      if (item.kind !== "file") continue;
      const file = item.getAsFile();
      if (file && isThreeDModelFile(file)) files.push(file);
    }
  }

  return files;
}
