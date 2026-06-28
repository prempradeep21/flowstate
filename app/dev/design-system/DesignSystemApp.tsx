"use client";

import { useState } from "react";
import { DesignSystemThemeToggle } from "@/app/dev/design-system/DesignSystemThemeToggle";
import { ArtifactsSection } from "@/app/dev/design-system/sections/ArtifactsSection";
import { CardsSection } from "@/app/dev/design-system/sections/CardsSection";
import { ConnectorsSection } from "@/app/dev/design-system/sections/ConnectorsSection";
import {
  DocsSection,
  type DesignSystemDocContent,
} from "@/app/dev/design-system/sections/DocsSection";
import { TokensSection } from "@/app/dev/design-system/sections/TokensSection";
import {
  DESIGN_SYSTEM_SECTIONS,
  type DesignSystemSectionId,
} from "@/lib/designSystemRegistry";

export function DesignSystemApp({ docs }: { docs: DesignSystemDocContent }) {
  const [activeSection, setActiveSection] = useState<DesignSystemSectionId>("tokens");

  return (
    <div className="flex h-full min-h-0 flex-col bg-canvas-bg text-canvas-ink">
      <header className="shrink-0 border-b border-canvas-border bg-canvas-card/95 px-4 py-4 backdrop-blur-md sm:px-6">
        <div className="mx-auto flex max-w-[1400px] flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-canvas-micro font-semibold uppercase tracking-wider text-canvas-muted">
              Flowstate
            </p>
            <h1 className="font-display text-2xl font-medium">Design System</h1>
            <p className="mt-1 max-w-xl text-canvas-body-sm text-canvas-muted">
              Exportable UI specimens — artifacts, cards, connectors, and tokens.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <DesignSystemThemeToggle />
          </div>
        </div>

        <nav
          aria-label="Design system sections"
          className="mx-auto mt-4 flex max-w-[1400px] gap-2 overflow-x-auto pb-1"
        >
          {DESIGN_SYSTEM_SECTIONS.map((section) => (
            <button
              key={section.id}
              type="button"
              onClick={() => setActiveSection(section.id)}
              aria-current={activeSection === section.id ? "page" : undefined}
              className={`shrink-0 rounded-full px-4 py-2 text-canvas-compact transition-colors ${
                activeSection === section.id
                  ? "bg-canvas-accent text-white shadow-card"
                  : "border border-canvas-border bg-canvas-card text-canvas-muted hover:text-canvas-ink"
              }`}
            >
              {section.title}
            </button>
          ))}
        </nav>
      </header>

      <main className="min-h-0 flex-1 overflow-auto px-4 py-8 sm:px-6">
        <div className="mx-auto max-w-[1400px]">
          {activeSection === "tokens" ? <TokensSection /> : null}
          {activeSection === "artifacts" ? <ArtifactsSection /> : null}
          {activeSection === "cards" ? <CardsSection /> : null}
          {activeSection === "connectors" ? <ConnectorsSection /> : null}
          {activeSection === "docs" ? <DocsSection docs={docs} /> : null}
        </div>
      </main>
    </div>
  );
}
