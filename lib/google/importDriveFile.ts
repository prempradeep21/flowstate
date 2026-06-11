export interface GoogleDriveImportResult {

  ok: boolean;

  needsConnect?: boolean;

  needsAccess?: boolean;

  error?: string;

  title?: string;

  mimeType?: string;

  extractedText?: string;

  extractedTextLength?: number;

  truncated?: boolean;

}



export async function fetchGoogleDriveImport(

  fileId: string,

  url?: string,

): Promise<GoogleDriveImportResult> {

  const params = new URLSearchParams({ fileId });

  if (url) params.set("url", url);

  const res = await fetch(`/api/google/files?${params.toString()}`);

  const body = (await res.json()) as GoogleDriveImportResult & {

    needsConnect?: boolean;

    needsAccess?: boolean;

  };



  if (body.needsConnect) {
    return { ok: false, needsConnect: true, error: body.error };
  }

  if (body.needsAccess) {
    return { ok: false, needsAccess: true, error: body.error };
  }

  if (!res.ok) {

    return { ok: false, error: body.error ?? "Import failed" };

  }

  return {

    ok: true,

    title: body.title,

    mimeType: body.mimeType,

    extractedText: body.extractedText,

    extractedTextLength: body.extractedTextLength ?? body.extractedText?.length,

    truncated: body.truncated,

  };

}


