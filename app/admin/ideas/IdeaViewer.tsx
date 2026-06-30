"use client";

import ReactMarkdown from "react-markdown";

export function IdeaViewer({ markdown }: { markdown: string }) {
  return (
    <article className="admin-doc-content mx-auto max-w-4xl">
      <ReactMarkdown>{markdown}</ReactMarkdown>
    </article>
  );
}
