import { generateOverviewAi, type OverviewAiInput } from "@/lib/github/generateOverviewAi";
import {
  polishWhatItIsCopy,
  WHAT_IT_IS_LIMITS,
  whatItIsLooksLikeRawReadme,
} from "@/lib/github/overviewCopyLimits";
import {
  heuristicWhatItIs,
  heuristicWhoItsFor,
} from "@/lib/github/readmeSummary";
import { inferCategory } from "@/lib/github/stackDetect";
import type { OverviewAi } from "@/lib/github/types";

/** Collapse stray newlines; split into two short paragraphs via enforceWhatItIsLimits. */
export function normalizeWhatItIs(text: string): string {
  const flat = text
    .replace(/\r\n/g, "\n")
    .replace(/\n+/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim();

  const sentences = flat
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 20 && s.length < 420);

  if (sentences.length === 0) return polishWhatItIsCopy(flat);

  const perPara = WHAT_IT_IS_LIMITS.sentencesPerParagraph;
  const para1 = sentences.slice(0, perPara).join(" ");
  const para2 = sentences.slice(perPara, perPara * 2).join(" ");

  const draft = [para1, para2].filter((p) => p.length > 40).join("\n\n");
  return polishWhatItIsCopy(draft || flat);
}

/** Guarantee two compact paragraphs for the overview. */
export function ensureRichOverview(ai: OverviewAi, input: OverviewAiInput): OverviewAi {
  let whatItIs = normalizeWhatItIs(ai.whatItIs);
  const paragraphCount = whatItIs.split(/\n\n+/).filter((p) => p.trim().length > 40).length;

  if (
    whatItIs.length < WHAT_IT_IS_LIMITS.minChars ||
    paragraphCount < 2 ||
    whatItIsLooksLikeRawReadme(whatItIs)
  ) {
    const expanded = normalizeWhatItIs(
      heuristicWhatItIs(input.name, input.description, input.readme),
    );
    if (
      expanded.length > whatItIs.length ||
      whatItIsLooksLikeRawReadme(whatItIs)
    ) {
      whatItIs = expanded;
    }
  }

  whatItIs = polishWhatItIsCopy(whatItIs);

  const category = ai.category || inferCategory(input.description, input.deps);
  const whoItsFor =
    ai.whoItsFor?.intendedFor?.length > 60
      ? ai.whoItsFor
      : heuristicWhoItsFor(input.readme, category);

  return { ...ai, whatItIs, whoItsFor };
}

export async function buildRepoOverviewAi(input: OverviewAiInput): Promise<OverviewAi> {
  const ai = await generateOverviewAi(input);
  return ensureRichOverview(ai, input);
}
