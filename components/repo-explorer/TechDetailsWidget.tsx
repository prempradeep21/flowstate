"use client";

import type { TechAi, TechData } from "@/lib/github/types";
import { TagChip, WidgetCard } from "@/components/repo-explorer/WidgetCard";

function StackRow({ label, value }: { label: string; value?: string }) {
  if (!value) return null;
  return (
    <div className="flex items-baseline justify-between gap-2 border-b border-canvas-border/60 py-2 last:border-0">
      <span className="text-canvas-compact text-canvas-muted">{label}</span>
      <span className="text-canvas-body-sm font-medium text-canvas-ink">{value}</span>
    </div>
  );
}

export function TechDetailsWidget({
  data,
  ai,
}: {
  data?: TechData;
  ai?: TechAi;
}) {
  if (!data) return null;

  return (
    <WidgetCard title="Tech details" subtitle="Detected from manifests & README">
      <div className="space-y-4">
        {ai?.architectureSummary ? (
          <div className="rounded-canvas-sm bg-canvas-artifactStage px-3 py-2 font-mono text-canvas-compact text-canvas-ink">
            {ai.architectureSummary}
          </div>
        ) : null}

        <div>
          <StackRow label="Runtime" value="Bun" />
          <StackRow label="Backend" value={data.backendFramework ?? "Express (optional)"} />
          <StackRow label="Database" value={data.database ?? "PostgreSQL + pgvector"} />
          <StackRow
            label="AI providers"
            value={data.aiProviders.length ? data.aiProviders.join(", ") : "Multi-provider gateway"}
          />
          <StackRow label="Docker" value={data.dockerSupport ? "Yes" : "Optional (docker-compose)"} />
          {ai?.estimatedSetupTime ? (
            <StackRow label="Setup time" value={ai.estimatedSetupTime} />
          ) : null}
        </div>

        {data.programmingLanguages.length > 0 ? (
          <div>
            <div className="mb-2 text-canvas-caption uppercase tracking-wide text-canvas-muted">
              Languages
            </div>
            <div className="flex flex-wrap gap-1.5">
              {data.programmingLanguages.slice(0, 5).map((lang) => (
                <TagChip key={lang.name} label={`${lang.name} ${lang.percent}%`} />
              ))}
            </div>
          </div>
        ) : null}

        {data.dependencies.length > 0 ? (
          <div>
            <div className="mb-2 text-canvas-caption uppercase tracking-wide text-canvas-muted">
              Integrations
            </div>
            <div className="flex flex-wrap gap-1.5">
              {data.dependencies.map((d) => (
                <TagChip key={d} label={d} />
              ))}
            </div>
          </div>
        ) : null}

        {data.installationCommands.length > 0 ? (
          <div>
            <div className="mb-2 text-canvas-caption uppercase tracking-wide text-canvas-muted">
              Install
            </div>
            <pre className="overflow-x-auto rounded-canvas-sm bg-canvas-codeBg p-3 font-mono text-canvas-compact text-canvas-ink">
              {data.installationCommands.join("\n")}
            </pre>
          </div>
        ) : null}

        {data.envVarsRequired.length > 0 ? (
          <div>
            <div className="mb-2 text-canvas-caption uppercase tracking-wide text-canvas-muted">
              Environment
            </div>
            <div className="flex flex-wrap gap-1">
              {data.envVarsRequired.map((v) => (
                <code
                  key={v}
                  className="rounded-canvas-xs bg-canvas-artifactStage px-1.5 py-0.5 font-mono text-canvas-micro text-canvas-muted"
                >
                  {v}
                </code>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </WidgetCard>
  );
}
