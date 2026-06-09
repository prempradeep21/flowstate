"use client";

import type { BuiltByData } from "@/lib/github/types";
import { StatPill, WidgetCard } from "@/components/repo-explorer/WidgetCard";

function formatCount(n: number): string {
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return String(n);
}

export function BuiltByWidget({ data }: { data?: BuiltByData }) {
  if (!data) return null;

  return (
    <WidgetCard title="Built by" subtitle={`@${data.login}`}>
      <div className="space-y-4">
        <div className="flex gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={data.avatarUrl}
            alt=""
            className="h-14 w-14 shrink-0 rounded-full border border-canvas-border"
          />
          <div className="min-w-0">
            <div className="text-canvas-body-lg font-medium text-canvas-ink">
              {data.name ?? data.login}
            </div>
            {data.company ? (
              <div className="text-canvas-compact text-canvas-muted">{data.company}</div>
            ) : null}
            {data.location ? (
              <div className="text-canvas-compact text-canvas-muted">{data.location}</div>
            ) : null}
          </div>
        </div>

        {data.bio ? (
          <p className="text-canvas-body-sm leading-relaxed text-canvas-ink">{data.bio}</p>
        ) : null}

        <div className="grid grid-cols-3 gap-2">
          <StatPill label="Followers" value={formatCount(data.followers)} />
          <StatPill label="Public repos" value={data.publicRepos} />
          <StatPill label="Years active" value={data.yearsActive} />
        </div>

        <div className="flex flex-wrap gap-2 text-canvas-compact">
          <a
            href={data.htmlUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-canvas-accent hover:underline"
          >
            GitHub
          </a>
          {data.website ? (
            <a
              href={data.website.startsWith("http") ? data.website : `https://${data.website}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-canvas-accent hover:underline"
            >
              Website
            </a>
          ) : null}
          {data.twitterUsername ? (
            <a
              href={`https://x.com/${data.twitterUsername}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-canvas-accent hover:underline"
            >
              @{data.twitterUsername}
            </a>
          ) : null}
        </div>

        {data.topRepos.length > 0 ? (
          <div>
            <div className="mb-2 text-canvas-caption uppercase tracking-wide text-canvas-muted">
              Top repositories
            </div>
            <ul className="space-y-2">
              {data.topRepos.map((r) => (
                <li key={r.name}>
                  <a
                    href={r.htmlUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group block rounded-canvas-sm px-2 py-1.5 hover:bg-canvas-artifactStage"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-canvas-body-sm font-medium text-canvas-accent group-hover:underline">
                        {r.name}
                      </span>
                      <span className="text-canvas-micro tabular-nums text-canvas-muted">
                        ★ {formatCount(r.stars)}
                      </span>
                    </div>
                    {r.description ? (
                      <p className="mt-0.5 line-clamp-2 text-canvas-compact text-canvas-muted">
                        {r.description}
                      </p>
                    ) : null}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </WidgetCard>
  );
}
