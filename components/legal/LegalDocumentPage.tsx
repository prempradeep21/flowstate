import Link from "next/link";
import "@/components/legal/legal-doc.css";

function FlowstateMark() {
  return (
    <svg viewBox="0 0 32 32" className="h-7 w-7 shrink-0" aria-hidden fill="none">
      <rect width="32" height="32" rx="8" className="fill-canvas-ink" />
      <path
        d="M8 22c4-8 8-12 16-14M8 10c3 4 8 8 16 10"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        className="text-canvas-card"
      />
      <circle cx="24" cy="8" r="2" className="fill-canvas-accent" />
    </svg>
  );
}

export function LegalDocumentPage({ html }: { html: string }) {
  return (
    <div className="min-h-full bg-canvas-bg font-sans text-canvas-ink">
      <header className="sticky top-0 z-10 border-b border-canvas-border/60 bg-canvas-bg/90 backdrop-blur-lg">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-6 py-4">
          <Link
            href="/landing"
            className="text-canvas-compact text-canvas-muted transition-colors hover:text-canvas-ink"
          >
            ← Back to Flowstate
          </Link>
          <Link href="/landing" className="flex items-center gap-2" aria-label="Flowstate home">
            <FlowstateMark />
            <span className="font-display text-canvas-brand font-semibold text-canvas-ink">
              Flowstate
            </span>
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-10 pb-16">
        <article
          className="legal-doc-content text-canvas-body leading-relaxed"
          dangerouslySetInnerHTML={{ __html: html }}
        />

        <footer className="mt-12 flex flex-wrap gap-4 border-t border-canvas-border/50 pt-6 text-canvas-caption text-canvas-muted">
          <Link href="/terms" className="hover:text-canvas-ink">
            Terms
          </Link>
          <Link href="/privacy" className="hover:text-canvas-ink">
            Privacy
          </Link>
          <Link href="/landing" className="hover:text-canvas-ink">
            Home
          </Link>
        </footer>
      </main>
    </div>
  );
}
