/**
 * Turns a build_custom_ui handoff into the follow-up card that runs the build.
 *
 * Kept free of React and the store so the question wording — which has to
 * satisfy the custom-UI intent check and read sensibly to the user — can be
 * tested directly.
 */
import type { CustomUiSourceData } from "@/lib/customUiSource";

export interface CustomUiHandoff {
  title: string;
  source: CustomUiSourceData;
}

export interface CustomUiHandoffFollowUp {
  question: string;
  options: { customUiSource: CustomUiSourceData };
}

export function buildCustomUiHandoffFollowUp(
  handoff: CustomUiHandoff,
): CustomUiHandoffFollowUp {
  const { title, source } = handoff;
  return {
    // Names the originating server so the user can see where the data came
    // from, and says "interactive" so the intent check agrees this is
    // custom-UI work. Carries no payload: the question is user-visible and
    // feeds buildAncestorHistory on later turns.
    question: `Build an interactive ${title} from the ${source.serverName} results`,
    options: { customUiSource: source },
  };
}
