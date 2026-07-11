"use client";

import { ConnectorPathGroup } from "@/components/ConnectorPathGroup";
import {
  buildDesignSystemConnectorPaths,
  DESIGN_SYSTEM_CONNECTOR_NODES,
  DESIGN_SYSTEM_CONNECTOR_VIEWBOX,
} from "@/lib/designSystemConnectorDemo";

export function ConnectorsSection() {
  const paths = buildDesignSystemConnectorPaths(1);

  return (
    <div className="flex flex-col gap-10">
      <div className="overflow-auto rounded-canvas border border-canvas-border bg-canvas-bg/50 p-4">
        <svg
          viewBox={`0 0 ${DESIGN_SYSTEM_CONNECTOR_VIEWBOX.width} ${DESIGN_SYSTEM_CONNECTOR_VIEWBOX.height}`}
          className="h-auto w-full min-w-[720px]"
          role="img"
          aria-label="Connector path demonstrations"
        >
          {DESIGN_SYSTEM_CONNECTOR_NODES.map((node) => (
            <g key={node.id}>
              <rect
                x={node.position.x}
                y={node.position.y}
                width={node.size.w}
                height={node.size.h}
                rx={12}
                fill="rgb(var(--canvas-card))"
                stroke="rgb(var(--canvas-border))"
                strokeWidth={1}
              />
              <rect
                x={node.position.x}
                y={node.position.y}
                width={node.size.w}
                height={4}
                rx={12}
                fill={node.accentColour}
              />
              <text
                x={node.position.x + 16}
                y={node.position.y + 36}
                fill="rgb(var(--canvas-ink))"
                fontSize={14}
                fontFamily="var(--font-parkinsans), sans-serif"
              >
                {node.label}
              </text>
              <circle
                cx={node.position.x}
                cy={node.position.y + node.size.h / 2}
                r={5}
                fill="rgb(var(--canvas-card))"
                stroke={node.accentColour}
                strokeWidth={2}
              />
              <circle
                cx={node.position.x + node.size.w}
                cy={node.position.y + node.size.h / 2}
                r={5}
                fill="rgb(var(--canvas-card))"
                stroke={node.accentColour}
                strokeWidth={2}
              />
            </g>
          ))}

          {paths.map((path) => (
            <ConnectorPathGroup
              key={path.spec.id}
              d={path.d}
              stroke={path.spec.stroke}
              strokeWidth={path.strokeWidth}
              fromAnchor={path.fromAnchor}
              toAnchor={path.toAnchor}
              toSide={path.toSide}
              viewportScale={1}
            />
          ))}
        </svg>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {paths.map((path) => (
          <article
            key={path.spec.id}
            className="rounded-canvas border border-canvas-border bg-canvas-card p-4 shadow-card"
          >
            <h3 className="font-display text-canvas-heading text-canvas-ink">
              {path.spec.title}
            </h3>
            <p className="mt-2 text-canvas-body-sm leading-relaxed text-canvas-muted">
              {path.spec.description}
            </p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {path.spec.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-canvas-bg px-2 py-0.5 text-canvas-micro text-canvas-muted"
                >
                  {tag}
                </span>
              ))}
            </div>
            <p className="mt-3 text-canvas-caption text-canvas-muted">
              Style: <code className="text-canvas-ink">{path.spec.style}</code>
            </p>
          </article>
        ))}
      </div>
    </div>
  );
}
