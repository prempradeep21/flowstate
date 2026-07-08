import { CUSTOM_UI_SDK_ENABLED } from "@/lib/claudeClient";
import {
  isCustomUiWork,
  resolveInitialThinkingLabel,
} from "@/lib/artifactIntent";
import type { SdkBuildStage } from "@/lib/cursorSdk/buildProgressTypes";
import { initialSdkBuildStages } from "@/lib/cursorSdk/sdkStageLabels";
import { getLatestVersion } from "@/lib/sessionArtifacts";
import type { AttachedArtifactRef, SessionArtifact } from "@/lib/sessionArtifacts";

export function resolveFollowUpEditingPayload(
  inheritedArtifactId: string | undefined,
  attachedArtifacts: AttachedArtifactRef[] | undefined,
  sessionArtifacts: Record<string, SessionArtifact>,
): { type?: string } | null {
  const artifactId = attachedArtifacts?.[0]?.artifactId ?? inheritedArtifactId;
  if (!artifactId) return null;
  const art = sessionArtifacts[artifactId];
  if (!art) return null;
  const latest = getLatestVersion(art);
  if (
    !latest?.payload ||
    typeof latest.payload !== "object" ||
    !("type" in latest.payload)
  ) {
    return null;
  }
  return latest.payload as { type?: string };
}

/** Seed Cursor SDK progress UI for custom UI follow-ups before SSE arrives. */
export function seedCustomUiTurnState(
  question: string,
  inheritedArtifactId: string | undefined,
  attachedArtifacts: AttachedArtifactRef[] | undefined,
  sessionArtifacts: Record<string, SessionArtifact>,
): { sdkBuildStages: SdkBuildStage[]; thinkingLabel: string } | null {
  if (!CUSTOM_UI_SDK_ENABLED) return null;

  const editingPayload = resolveFollowUpEditingPayload(
    inheritedArtifactId,
    attachedArtifacts,
    sessionArtifacts,
  );
  if (!isCustomUiWork(question, editingPayload)) return null;

  const isEdit = editingPayload?.type === "custom";
  return {
    sdkBuildStages: initialSdkBuildStages(isEdit),
    thinkingLabel: resolveInitialThinkingLabel(question, editingPayload),
  };
}
