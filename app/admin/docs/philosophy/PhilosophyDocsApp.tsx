"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import { SpecSectionViewer } from "@/app/admin/docs/SpecSectionViewer";

const TABS = [
  { id: "principles", label: "Governing principles" },
  { id: "design-language", label: "Design language" },
  { id: "motion-language", label: "Motion language" },
] as const;

type TabId = (typeof TABS)[number]["id"];

export function PhilosophyDocsApp({
  principlesHtml,
  designLanguageMarkdown,
  motionLanguageMarkdown,
}: {
  principlesHtml: string;
  designLanguageMarkdown: string;
  motionLanguageMarkdown: string;
}) {
  const [activeTab, setActiveTab] = useState<TabId>("principles");

  return (
    <div className="p-4 sm:p-6">
      <div className="mx-auto max-w-4xl">
        <header className="mb-6 border-b border-canvas-border pb-4">
          <h2 className="font-display text-2xl font-medium text-canvas-ink">
            Philosophy
          </h2>
          <p className="mt-1 text-canvas-body-sm text-canvas-muted">
            Core beliefs, design language, and motion principles.
          </p>
        </header>

        <div
          className="mb-6 flex flex-wrap gap-2"
          role="tablist"
          aria-label="Philosophy documents"
        >
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={activeTab === tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`rounded-full px-4 py-2 text-canvas-compact transition-colors ${
                activeTab === tab.id
                  ? "bg-canvas-ink text-canvas-card"
                  : "border border-canvas-border bg-canvas-card text-canvas-muted hover:text-canvas-ink"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === "principles" ? (
          <SpecSectionViewer
            title="Governing principles"
            description="From branch-ai.md §3"
            html={principlesHtml}
          />
        ) : null}

        {activeTab === "design-language" ? (
          <article className="admin-doc-content prose-canvas max-w-none">
            <ReactMarkdown>{designLanguageMarkdown}</ReactMarkdown>
          </article>
        ) : null}

        {activeTab === "motion-language" ? (
          <article className="admin-doc-content prose-canvas max-w-none">
            <ReactMarkdown>{motionLanguageMarkdown}</ReactMarkdown>
          </article>
        ) : null}
      </div>
    </div>
  );
}
