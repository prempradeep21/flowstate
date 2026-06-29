"use client";

export function SpecSectionViewer({
  title,
  description,
  html,
}: {
  title: string;
  description?: string;
  html: string;
}) {
  return (
    <article className="mx-auto max-w-4xl">
      <header className="mb-6 border-b border-canvas-border pb-4">
        <h2 className="font-display text-2xl font-medium text-canvas-ink">{title}</h2>
        {description ? (
          <p className="mt-1 text-canvas-body-sm text-canvas-muted">{description}</p>
        ) : null}
      </header>
      <div
        className="admin-doc-content"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </article>
  );
}
