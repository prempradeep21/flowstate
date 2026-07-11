export type TokenCost = "low" | "medium" | "high";

export type SecurityFlag = {
  level: "clean" | "flagged";
  note: string;
} | null;

export type Maturity = {
  version: string | null;
  license: string | null;
};

export type Skill = {
  slug: string;
  name: string;
  /** GitHub user/org, or product site name. */
  authorName: string;
  authorHandle: string;
  authorAvatarUrl: string;
  sourceUrl: string;
  /** 1-2 sentence plain-English summary. */
  whatItDoes: string;
  tokenCost: TokenCost;
  security: SecurityFlag;
  restrictions: string[];
  maturity: Maturity;
  /** Free-text compatibility labels, resolved to brand icons where possible. */
  compatibility: string[];
  topics: string[];
};
