"use client";

import { BadgeCheck, Coins, ShieldAlert, ShieldCheck } from "lucide-react";
import { Icon } from "@/components/ui/Icon";
import { resolveBrandIcon } from "@/components/skill-viewer/brand-icons";
import type { Maturity, SecurityFlag, TokenCost } from "@/lib/skill-viewer/types";

const TOKEN_COST_LABEL: Record<TokenCost, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
};

const TOKEN_COST_SEGMENTS: Record<TokenCost, number> = {
  low: 1,
  medium: 2,
  high: 3,
};

function TokenCostGauge({ cost }: { cost: TokenCost }) {
  const filled = TOKEN_COST_SEGMENTS[cost];
  return (
    <div
      className="flex items-center gap-1.5 rounded-full border border-canvas-border bg-canvas-card px-2.5 py-1"
      title={`Token cost: ${TOKEN_COST_LABEL[cost]}`}
    >
      <Icon icon={Coins} size="inline" className="text-canvas-tertiary" />
      <span className="flex items-center gap-0.5">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className={`h-1.5 w-3 rounded-full ${
              i < filled
                ? i === 2
                  ? "bg-canvas-tertiary"
                  : "bg-canvas-accent"
                : "bg-canvas-border"
            }`}
          />
        ))}
      </span>
      <span className="text-canvas-caption font-medium text-canvas-muted">
        {TOKEN_COST_LABEL[cost]}
      </span>
    </div>
  );
}

function SecurityBadge({ security }: { security: SecurityFlag }) {
  if (!security) return null;
  const isClean = security.level === "clean";
  return (
    <div
      className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 ${
        isClean
          ? "bg-canvas-successSoft text-canvas-successText"
          : "bg-canvas-warningSoft text-canvas-warningText"
      }`}
      title={security.note}
    >
      <Icon icon={isClean ? ShieldCheck : ShieldAlert} size="inline" />
      <span className="text-canvas-caption font-medium">
        {isClean ? "Clean" : "Flagged"}
      </span>
    </div>
  );
}

function MaturityBadge({ maturity }: { maturity: Maturity }) {
  const hasSignal = Boolean(maturity.version || maturity.license);
  return (
    <div
      className={`flex items-center gap-1.5 rounded-full border border-canvas-border px-2.5 py-1 ${
        hasSignal ? "bg-canvas-card" : "opacity-50"
      }`}
      title={hasSignal ? "Maturity signal" : "No version or license declared"}
    >
      <Icon
        icon={BadgeCheck}
        size="inline"
        className={hasSignal ? "text-canvas-accent" : "text-canvas-muted"}
      />
      <span className="text-canvas-caption font-medium text-canvas-muted">
        {maturity.version ? `v${maturity.version}` : "No version"}
        {maturity.license ? ` · ${maturity.license}` : ""}
      </span>
    </div>
  );
}

function CompatibilityChip({ label }: { label: string }) {
  const icon = resolveBrandIcon(label);
  return (
    <div
      className="flex items-center gap-1.5 rounded-full border border-canvas-border bg-canvas-card px-2.5 py-1"
      title={icon.title}
    >
      <svg viewBox="0 0 24 24" width={14} height={14} fill={icon.hex} aria-hidden>
        <path d={icon.path} />
      </svg>
      <span className="text-canvas-caption font-medium text-canvas-muted">{label}</span>
    </div>
  );
}

export function SkillMetaRow({
  tokenCost,
  security,
  maturity,
  compatibility,
}: {
  tokenCost: TokenCost;
  security: SecurityFlag;
  maturity: Maturity;
  compatibility: string[];
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <TokenCostGauge cost={tokenCost} />
      <SecurityBadge security={security} />
      <MaturityBadge maturity={maturity} />
      {compatibility.map((label) => (
        <CompatibilityChip key={label} label={label} />
      ))}
    </div>
  );
}
