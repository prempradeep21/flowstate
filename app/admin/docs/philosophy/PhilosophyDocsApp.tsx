"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import { SpecSectionViewer } from "@/app/admin/docs/SpecSectionViewer";
import { AdminActionIcon, type AdminIconName } from "@/app/admin/icons/AdminIcons";

const TABS: { id: TabId; label: string; icon: AdminIconName }[] = [
  { id: "principles", label: "Governing principles", icon: "compass" },
  { id: "design-language", label: "Design language", icon: "design-system" },
  { id: "motion-language", label: "Motion language", icon: "sparkles" },
];

type TabId = "principles" | "design-language" | "motion-language";

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
              className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-canvas-compact transition-colors ${
                activeTab === tab.id
                  ? "bg-canvas-ink text-canvas-card"
                  : "border border-canvas-border bg-canvas-card text-canvas-muted hover:text-canvas-ink"
              }`}
            >
              <AdminActionIcon name={tab.icon} />
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
