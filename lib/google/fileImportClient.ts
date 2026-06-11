export interface GoogleConnectionGate {
  signedIn: boolean;
  connected: boolean;
}

/** Lightweight check before calling /api/google/files (avoids noisy failed fetches). */
export async function fetchGoogleConnectionGate(): Promise<GoogleConnectionGate> {
  try {
    const res = await fetch("/api/google/status");
    const data = (await res.json()) as {
      signedIn?: boolean;
      connected?: boolean;
    };
    return {
      signedIn: Boolean(data.signedIn),
      connected: Boolean(data.connected),
    };
  } catch {
    return { signedIn: false, connected: false };
  }
}

export function googleFileImportBlockedMessage(
  gate: GoogleConnectionGate,
): string {
  if (!gate.signedIn) {
    return "Sign in to Flowstate, then connect Google Drive.";
  }
  return "Connect Google Drive to import this file.";
}
