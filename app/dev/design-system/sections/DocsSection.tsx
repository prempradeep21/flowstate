"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import { DESIGN_SYSTEM_DOCS } from "@/lib/designSystemRegistry";

export type DesignSystemDocContent = Record<string, string>;

export function DocsSection({ docs }: { docs: DesignSystemDocContent }) {
  const [activeId, setActiveId] = useState(DESIGN_SYSTEM_DOCS[0]?.id ?? "readme");
  const activeDoc = DESIGN_SYSTEM_DOCS.find((doc) => doc.id === activeId);
  const content = activeDoc ? docs[activeDoc.id] : "";

  return (
    <div className="flex min-h-0 flex-col gap-6 lg:flex-row">
      <nav className="flex shrink-0 flex-row gap-2 overflow-x-auto lg:w-56 lg:flex-col lg:overflow-visible">
        {DESIGN_SYSTEM_DOCS.map((doc) => (
          <button
            key={doc.id}
            type="button"
            onClick={() => setActiveId(doc.id)}
            className={`rounded-canvas px-3 py-2 text-left text-canvas-body-sm transition-colors ${
              activeId === doc.id
                ? "bg-canvas-ink font-medium text-canvas-card"
                : "border border-canvas-border bg-canvas-card text-canvas-muted hover:text-canvas-ink"
            }`}
          >
            {doc.title}
          </button>
        ))}
      </nav>

      <article className="min-w-0 flex-1 rounded-canvas border border-canvas-border bg-canvas-card p-6 shadow-card">
        {activeDoc ? (
          <>
            <header className="mb-6 border-b border-canvas-border pb-4">
              <h2 className="font-display text-2xl text-canvas-ink">{activeDoc.title}</h2>
              <p className="mt-2 text-canvas-body-sm text-canvas-muted">
                {activeDoc.description}
              </p>
              <p className="mt-2 font-mono text-canvas-micro text-canvas-muted">
                {activeDoc.path}
              </p>
            </header>
            <div className="design-system-doc prose-canvas max-w-none text-canvas-body leading-relaxed text-canvas-ink [&_a]:text-canvas-accent [&_code]:rounded [&_code]:bg-canvas-bg [&_code]:px-1 [&_h1]:font-display [&_h1]:text-2xl [&_h2]:mt-8 [&_h2]:font-display [&_h2]:text-xl [&_h3]:mt-6 [&_h3]:font-medium [&_li]:text-canvas-muted [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:text-canvas-muted [&_table]:w-full [&_td]:border [&_td]:border-canvas-border [&_td]:p-2 [&_th]:border [&_th]:border-canvas-border [&_th]:bg-canvas-bg [&_th]:p-2 [&_ul]:list-disc [&_ul]:pl-5">
              <ReactMarkdown>{content}</ReactMarkdown>
            </div>
          </>
        ) : null}
      </article>
    </div>
  );
}
