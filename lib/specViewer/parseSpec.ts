export const SECTION_META: Record<string, { num: number; desc: string }> = {
  "1. Chronology of Updates": {
    num: 1,
    desc: "Main-branch pushes grouped into working sessions",
  },
  "2. Product Vision": { num: 2, desc: "What Flowstate is and who it's for" },
  "3. Philosophy & Governing Principles": {
    num: 3,
    desc: "Core beliefs and decision filters",
  },
  "4. User Stories": {
    num: 4,
    desc: "V1 requirements as actor–action–outcome stories",
  },
  "5. Out of Scope": { num: 5, desc: "Explicitly deferred features" },
  "6. Decisions & Design Rationale": {
    num: 6,
    desc: "Every decision with rationale and provenance",
  },
  "7. User Interface Specification": {
    num: 7,
    desc: "Visual and layout specifications",
  },
  "8. Interaction Model": {
    num: 8,
    desc: "How users start threads, branch, and inherit context",
  },
  "9. Version Roadmap": {
    num: 9,
    desc: "V1, V2, V3 and unscheduled ideas",
  },
  "10. Technical Implementation": {
    num: 10,
    desc: "Stack, canvas, state, and persistence",
  },
  "11. API Handling": {
    num: 11,
    desc: "Browser-direct LLM calls and context construction",
  },
  "12. Onboarding": {
    num: 12,
    desc: "Developer landing flow and key validation",
  },
  "13. Open Questions": {
    num: 13,
    desc: "Unresolved decisions logged for later",
  },
  "14. Acceptance Checklist": {
    num: 14,
    desc: "Ship criteria for V1 completion",
  },
};

export interface SpecSection {
  title: string;
  id: string;
  body: string;
  subsections: string[];
  meta: { num: number; desc: string };
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-");
}

export function sectionId(title: string): string {
  return "section-" + slugify(title.replace(/^\d+\.\s*/, ""));
}

export function parseSpecSections(markdown: string): SpecSection[] {
  const lines = markdown.split("\n");
  let i = 0;

  while (i < lines.length && !lines[i].startsWith("## 1.")) {
    i++;
  }

  const sections: SpecSection[] = [];

  while (i < lines.length) {
    const line = lines[i];
    if (!line.startsWith("## ")) {
      i++;
      continue;
    }

    const title = line.slice(3).trim();
    if (title === "Table of Contents") {
      i++;
      continue;
    }

    const bodyLines: string[] = [];
    i++;
    while (i < lines.length && !lines[i].startsWith("## ")) {
      bodyLines.push(lines[i]);
      i++;
    }

    let body = bodyLines.join("\n").trim();
    body = body.replace(/^---\s*$/gm, "").trim();

    const subsections: string[] = [];
    const subRegex = /^### (.+)$/gm;
    let match: RegExpExecArray | null;
    while ((match = subRegex.exec(body)) !== null) {
      subsections.push(match[1]);
    }

    sections.push({
      title,
      id: sectionId(title),
      body,
      subsections,
      meta: SECTION_META[title] ?? { num: sections.length + 1, desc: "" },
    });
  }

  return sections;
}

export function findSpecSection(
  sections: SpecSection[],
  titleIncludes: string,
): SpecSection | undefined {
  return sections.find((section) => section.title.includes(titleIncludes));
}
