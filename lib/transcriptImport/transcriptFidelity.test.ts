import { describe, expect, it } from "vitest";
import type { SessionArtifact } from "@/lib/sessionArtifacts";
import { getLatestVersion } from "@/lib/sessionArtifacts";
import { buildDesignToolsCanvasSection } from "@/lib/transcriptImport/buildDesignToolsCanvasSection";
import { buildHubermanCanvasSection } from "@/lib/transcriptImport/buildHubermanCanvasSection";
import { buildJagadambaCanvasSection } from "@/lib/transcriptImport/buildJagadambaCanvasSection";
import { buildHubermanRajShamaniCanvasSection } from "@/lib/transcriptImport/buildHubermanRajShamaniCanvasSection";
import { buildLightconeEmergentCanvasSection } from "@/lib/transcriptImport/buildLightconeEmergentCanvasSection";
import { buildPrashantKishorCanvasSection } from "@/lib/transcriptImport/buildPrashantKishorCanvasSection";
import { buildRanaDaggubatiCanvasSection } from "@/lib/transcriptImport/buildRanaDaggubatiCanvasSection";
import { buildYcInterviewCanvasSection } from "@/lib/transcriptImport/buildYcInterviewCanvasSection";
import { DESIGN_TOOLS_HISTORY_TRANSCRIPT } from "@/lib/transcriptImport/designToolsHistory";
import { HUBERMAN_NEUROPLASTICITY_TRANSCRIPT } from "@/lib/transcriptImport/hubermanNeuroplasticity";
import { JAGADAMBA_THEATRE_TRANSCRIPT } from "@/lib/transcriptImport/jagadambaTheatre";
import { LIGHTCONE_EMERGENT_TRANSCRIPT } from "@/lib/transcriptImport/lightconeEmergent";
import { PRASHANT_KISHOR_INTERVIEW_TRANSCRIPT } from "@/lib/transcriptImport/prashantKishorInterview";
import { HUBERMAN_RAJ_SHAMANI_TRANSCRIPT_EXCERPTS } from "@/lib/transcriptImport/hubermanRajShamaniInterview";
import { RANA_DAGGUBATI_INTERVIEW_TRANSCRIPT } from "@/lib/transcriptImport/ranaDaggubatiInterview";
import { YC_INTERVIEW_TIPS_TRANSCRIPT } from "@/lib/transcriptImport/ycInterviewTips";

/*
 * The fabrication gate.
 *
 * Transcript canvases claim to be a faithful map of what was actually said, so a
 * quote containing words nobody spoke is worse than no quote. This test asserts
 * that claim for the fields the transcript-artifacts skill promises are strict
 * verbatim lifts:
 *
 *   quote.text · claim.proposition.text · claim.counter.text
 *   definition.gloss · definition.example
 *
 * Deliberately NOT covered, because the skill does not promise them verbatim:
 * titles and quote.context (authored), stat.label (composed), mechanism step
 * labels and todo item labels (condensed phrases). Those stay a review concern.
 */

/*
 * The gate is about WORDS, not typography. A lifted span routinely starts
 * mid-sentence, so sentence-casing it and giving it a full stop is presentation;
 * adding, dropping or altering a word is fabrication. So fold case, quote and
 * dash variants and whitespace, then compare — and strip only trailing sentence
 * punctuation from the needle, never anything internal.
 */
function fold(text: string): string {
  return text
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[–—]/g, "-")
    .replace(/\s+/g, " ")
    .toLowerCase()
    .trim();
}

function needle(text: string): string {
  return fold(text).replace(/[.,;:]+$/, "");
}

interface VerbatimField {
  artifactTitle: string;
  field: string;
  text: string;
}

function verbatimFields(
  artifacts: Record<string, SessionArtifact>,
): VerbatimField[] {
  const out: VerbatimField[] = [];
  for (const artifact of Object.values(artifacts)) {
    const payload = getLatestVersion(artifact)?.payload;
    if (!payload) continue;
    const at = payload.title;
    if (payload.type === "quote") {
      out.push({ artifactTitle: at, field: "text", text: payload.data.text });
    } else if (payload.type === "claim") {
      out.push({
        artifactTitle: at,
        field: "proposition.text",
        text: payload.data.proposition.text,
      });
      out.push({
        artifactTitle: at,
        field: "counter.text",
        text: payload.data.counter.text,
      });
    } else if (payload.type === "definition") {
      out.push({ artifactTitle: at, field: "gloss", text: payload.data.gloss });
      if (payload.data.example) {
        out.push({
          artifactTitle: at,
          field: "example",
          text: payload.data.example,
        });
      }
    }
  }
  return out;
}

const CASES = [
  {
    name: "Huberman — neuroplasticity",
    build: buildHubermanCanvasSection,
    transcript: HUBERMAN_NEUROPLASTICITY_TRANSCRIPT,
  },
  {
    name: "YC — interview tips",
    build: buildYcInterviewCanvasSection,
    transcript: YC_INTERVIEW_TIPS_TRANSCRIPT,
  },
  {
    name: "Rana Daggubati — InFocus",
    build: buildRanaDaggubatiCanvasSection,
    transcript: RANA_DAGGUBATI_INTERVIEW_TRANSCRIPT,
  },
  {
    name: "Jagadamba Theatre — Rooted Stories",
    build: buildJagadambaCanvasSection,
    transcript: JAGADAMBA_THEATRE_TRANSCRIPT,
  },
  {
    name: "Emergent — The Lightcone",
    build: buildLightconeEmergentCanvasSection,
    transcript: LIGHTCONE_EMERGENT_TRANSCRIPT,
  },
  {
    name: "Design tools history",
    build: buildDesignToolsCanvasSection,
    transcript: DESIGN_TOOLS_HISTORY_TRANSCRIPT,
  },
  {
    name: "Prashant Kishor — Unfiltered by Samdish",
    build: buildPrashantKishorCanvasSection,
    transcript: PRASHANT_KISHOR_INTERVIEW_TRANSCRIPT,
  },
  {
    name: "Andrew Huberman — Figuring Out",
    build: buildHubermanRajShamaniCanvasSection,
    transcript: HUBERMAN_RAJ_SHAMANI_TRANSCRIPT_EXCERPTS,
  },
];

describe("transcript artifact fidelity", () => {
  for (const testCase of CASES) {
    describe(testCase.name, () => {
      const section = testCase.build();
      const source = fold(testCase.transcript);
      const fields = verbatimFields(section.sessionArtifacts);

      it("extracts at least one verbatim-claiming field", () => {
        expect(fields.length).toBeGreaterThan(0);
      });

      for (const field of fields) {
        it(`"${field.artifactTitle}" · ${field.field} appears verbatim`, () => {
          expect(source).toContain(needle(field.text));
        });
      }
    });
  }
});
