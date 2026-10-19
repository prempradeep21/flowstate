"use client";

import { Search, X } from "lucide-react";
import { forwardRef } from "react";
import { Icon } from "@/components/ui/Icon";

/**
 * Text field for filtering a list — search glyph on the left, a clear button
 * once there's a query, and Escape clears (then blurs on a second press).
 * Opts out of the bare-letter canvas shortcuts so typing "q" or "z" here
 * types the letter instead of placing a question or opening the pie menu.
 */
export const SearchField = forwardRef<
  HTMLInputElement,
  {
    value: string;
    onChange: (value: string) => void;
    placeholder: string;
    /** Trailing hint shown while the field is empty, e.g. a shortcut key. */
    hint?: string;
    className?: string;
  }
>(function SearchField({ value, onChange, placeholder, hint, className = "" }, ref) {
  return (
    <div
      data-canvas-hotkeys="off"
      className={`group flex items-center gap-2 rounded-canvas border border-canvas-border bg-canvas-card px-2.5 transition-colors focus-within:border-canvas-accent/60 hover:border-canvas-accent/30 ${className}`}
    >
      <Icon icon={Search} className="shrink-0 text-canvas-muted" />
      <input
        ref={ref}
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key !== "Escape") return;
          e.preventDefault();
          if (value) onChange("");
          else e.currentTarget.blur();
        }}
        placeholder={placeholder}
        aria-label={placeholder}
        className="min-w-0 flex-1 bg-transparent py-2 text-canvas-body-sm text-canvas-ink outline-none placeholder:text-canvas-muted [&::-webkit-search-cancel-button]:hidden"
      />
      {value ? (
        <button
          type="button"
          onClick={() => onChange("")}
          aria-label="Clear search"
          className="btn -mr-1 h-6 w-6 shrink-0 rounded-canvas text-canvas-muted hover:text-canvas-ink"
        >
          <Icon icon={X} size="inline" />
        </button>
      ) : hint ? (
        <kbd className="hidden shrink-0 rounded border border-canvas-border px-1.5 font-sans text-canvas-micro text-canvas-muted sm:inline-block">
          {hint}
        </kbd>
      ) : null}
    </div>
  );
});
