export type SdkBuildStageStatus = "pending" | "active" | "done" | "error";

export interface SdkBuildStage {
  id: string;
  label: string;
  status: SdkBuildStageStatus;
  detail?: string;
}
