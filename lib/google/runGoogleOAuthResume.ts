import { fetchGoogleDriveImport } from "@/lib/google/importDriveFile";
import {
  friendlyGoogleOAuthError,
  type GoogleOAuthCompleteMessage,
} from "@/lib/google/oauthMessages";
import type { GoogleOAuthIntent } from "@/lib/google/oauthReturn";
import {
  clearOAuthResumeCheckpoint,
  readOAuthResumeCheckpoint,
} from "@/lib/google/oauthResume";
import { useCanvasStore } from "@/lib/store";

export interface GoogleOAuthResumeInput {
  connected: boolean;
  error?: string;
  intent?: GoogleOAuthIntent;
  artifactId?: string;
  restoreCheckpoint?: boolean;
}

export interface GoogleOAuthResumeDeps {
  refresh: () => Promise<void>;
  openPicker: (
    onPick: (doc: {
      id: string;
      name: string;
      mimeType: string;
      url?: string;
    }) => void,
  ) => Promise<void>;
}

export async function runGoogleOAuthResume(
  input: GoogleOAuthResumeInput,
  deps: GoogleOAuthResumeDeps,
): Promise<string | null> {
  if (input.error) {
    clearOAuthResumeCheckpoint();
    return friendlyGoogleOAuthError(input.error);
  }

  if (!input.connected) return null;

  const checkpoint =
    input.restoreCheckpoint !== false ? readOAuthResumeCheckpoint() : null;
  if (checkpoint?.checkpoint) {
    useCanvasStore.getState().hydrateFromSnapshot(checkpoint.checkpoint, {
      applyViewport: true,
      canvasReveal: false,
    });
  }

  await deps.refresh();

  const intent = input.intent === "picker" ? "picker" : checkpoint?.intent;
  const artifactId = input.artifactId ?? checkpoint?.artifactId;

  if (intent === "picker") {
    if (artifactId) {
      const state = useCanvasStore.getState();
      const artifact = state.sessionArtifacts[artifactId];
      const version = artifact?.versions[artifact.versions.length - 1];
      if (artifact && version) {
        state.openSessionArtifact(artifactId, version.id);
        state.patchGoogleWorkspaceArtifact(artifactId, {
          status: "loading",
          errorMessage: undefined,
        });
      }

      await deps.openPicker((doc) => {
        const docUrl =
          doc.url ?? `https://drive.google.com/file/d/${doc.id}/view`;
        void fetchGoogleDriveImport(doc.id, docUrl).then((body) => {
          if (!artifactId) return;
          const patch = useCanvasStore.getState().patchGoogleWorkspaceArtifact;
          if (body.needsConnect) {
            patch(artifactId, {
              status: "needs_connect",
              errorMessage: "Connect Google Drive to import this file.",
            });
            return;
          }
          if (body.needsAccess) {
            patch(artifactId, {
              status: "needs_access",
              errorMessage:
                "Choose this file in Google Drive to grant access, then try again.",
            });
            return;
          }
          if (!body.ok) {
            patch(artifactId, {
              status: "failed",
              errorMessage: body.error ?? "Import failed",
            });
            return;
          }
          patch(artifactId, {
            title: body.title,
            mimeType: body.mimeType,
            status: "ready",
            extractedText: body.extractedText,
            extractedTextLength:
              body.extractedTextLength ?? body.extractedText?.length,
            truncated: body.truncated,
            errorMessage: undefined,
          });
        });
      });
    } else {
      window.dispatchEvent(new CustomEvent("flowstate:google-picker-resume"));
    }
  }

  clearOAuthResumeCheckpoint();
  return null;
}

export function messageToResumeInput(
  message: GoogleOAuthCompleteMessage,
): GoogleOAuthResumeInput {
  return {
    connected: message.connected,
    error: message.error,
    intent: message.intent,
    artifactId: message.artifactId,
    restoreCheckpoint: false,
  };
}
