"use client";

import { useState } from "react";
import { ArtifactContentStage } from "@/components/artifacts/ArtifactContentStage";
import type { ArtifactPayload, LinkGroupLink } from "@/lib/artifactTypes";
import { faviconForUrl } from "@/lib/transcriptArtifacts";

/**
 * Favicons 404 quietly; fall back to the label's first letter rather than a gap.
 *
 * The icon is derived here rather than trusted from the payload: a payload
 * built as a literal (a catalog sample, a hand-authored fixture) never passes
 * through the normalizer that fills `iconUrl`, and a chip has to look right
 * however it was constructed.
 */
function LinkChip({ link }: { link: LinkGroupLink }) {
  const [broken, setBroken] = useState(false);
  const iconUrl = link.iconUrl ?? faviconForUrl(link.url);
  return (
    <a
      href={link.url}
      target="_blank"
      rel="noreferrer noopener"
      title={link.url}
      onClick={(event) => event.stopPropagation()}
      className="group/link flex w-[76px] shrink-0 flex-col items-center gap-1.5 rounded-canvas-sm px-1 py-1.5 transition-colors hover:bg-canvas-artifactStage focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-canvas-accent/50"
    >
      <span className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-full border border-canvas-border bg-canvas-card transition-colors group-hover/link:border-canvas-accent/40">
        {iconUrl && !broken ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={iconUrl}
            alt=""
            className="h-6 w-6 object-contain"
            onError={() => setBroken(true)}
          />
        ) : (
          <span className="text-canvas-body font-semibold text-canvas-muted">
            {link.label.slice(0, 1).toUpperCase()}
          </span>
        )}
      </span>
      <span className="line-clamp-2 text-center text-canvas-caption leading-tight text-canvas-muted group-hover/link:text-canvas-ink">
        {link.label}
      </span>
    </a>
  );
}

/** Grouped outbound links — the shape a video description takes. */
export function LinkGroupArtifactContent({
  payload,
  fill = false,
  artifactId,
}: {
  payload: Extract<ArtifactPayload, { type: "linkgroup" }>;
  fill?: boolean;
  sidebar?: boolean;
  artifactId?: string;
}) {
  const { sections } = payload.data;

  return (
    <ArtifactContentStage fill={fill} artifactId={artifactId}>
      <div className="flex h-full flex-col gap-1 overflow-y-auto px-5 py-4">
        {sections.map((section, index) => (
          <section
            key={`${section.label}-${index}`}
            className={
              index > 0 ? "mt-3 border-t border-canvas-ink/10 pt-3" : undefined
            }
          >
            {section.label ? (
              <h4 className="mb-2 text-canvas-caption font-medium uppercase tracking-wide text-canvas-muted">
                {section.label}
              </h4>
            ) : null}
            <div className="flex flex-wrap gap-1">
              {section.links.map((link) => (
                <LinkChip key={link.url} link={link} />
              ))}
            </div>
          </section>
        ))}
      </div>
    </ArtifactContentStage>
  );
}
