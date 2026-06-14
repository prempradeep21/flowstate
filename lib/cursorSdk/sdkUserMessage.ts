import type { SDKImage, SDKUserMessage } from "@cursor/sdk";
import type { AskAttachmentFile } from "@/lib/askAttachments";

export function askFilesToSdkImages(files: AskAttachmentFile[]): SDKImage[] {
  return files
    .filter((file) => file.mimeType.startsWith("image/"))
    .map((file) => ({
      data: file.base64,
      mimeType: file.mimeType,
    }));
}

export function buildSdkUserMessage(
  prompt: string,
  files: AskAttachmentFile[],
): string | SDKUserMessage {
  const images = askFilesToSdkImages(files);
  const nonImageFiles = files.filter(
    (file) => !file.mimeType.startsWith("image/"),
  );

  const attachmentNotes: string[] = [];
  if (images.length > 0) {
    const labels = files
      .filter((file) => file.mimeType.startsWith("image/"))
      .map(
        (file) =>
          `- ${file.name}${file.turnLabel ? ` (${file.turnLabel})` : ""}`,
      );
    attachmentNotes.push(
      `Image attachments are included with this message:\n${labels.join("\n")}`,
    );
  }
  if (nonImageFiles.length > 0) {
    attachmentNotes.push(
      "Non-image binary attachments referenced in this thread:\n" +
        nonImageFiles
          .map(
            (file) =>
              `- ${file.name} (${file.mimeType})${file.turnLabel ? ` — ${file.turnLabel}` : ""}`,
          )
          .join("\n"),
    );
  }

  const text =
    attachmentNotes.length > 0
      ? `${prompt}\n\n${attachmentNotes.join("\n\n")}`
      : prompt;

  if (images.length === 0) {
    return text;
  }

  return { text, images };
}
