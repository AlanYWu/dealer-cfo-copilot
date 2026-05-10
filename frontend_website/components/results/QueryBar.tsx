"use client";

import { useState, type FormEvent } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { runSearch } from "@/lib/rag/client";
import type {
  MissingHint,
  Quote,
  RefineHint,
  Scope,
  SearchDepth,
  SearchMode,
} from "@/lib/rag/contract";

export function QueryBar(props: {
  query: string;
  setQuery: (q: string) => void;
  scope: Scope;
  mode: SearchMode;
  setMode: (m: SearchMode) => void;
  depth: SearchDepth;
  setDepth: (d: SearchDepth) => void;
  onSearchComplete: (
    sessionId: string,
    quotes: Quote[],
    refine?: RefineHint,
    missing?: MissingHint
  ) => void;
}) {
  const qc = useQueryClient();
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setErr(null);
    setSubmitting(true);
    try {
      const res = await runSearch({
        query: props.query,
        scope: props.scope,
        mode: props.mode,
        depth: props.depth,
      });
      props.onSearchComplete(res.sessionId, res.quotes, res.refine, res.missing);
      await qc.invalidateQueries({ queryKey: ["sessions"] });
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setSubmitting(false);
    }
  }

  const scopeLabel =
    (props.scope.folders?.length ?? 0) > 0
      ? `scoped to: ${props.scope.folders!.join(", ")}`
      : "searching all documents";

  return (
    <form onSubmit={onSubmit} className="p-4 border-b border-neutral-200 bg-white sticky top-0">
      <div className="flex gap-2">
        <input
          value={props.query}
          onChange={(e) => props.setQuery(e.target.value)}
          placeholder={
            props.mode === "keyword"
              ? "Enter keywords…"
              : props.mode === "hybrid"
              ? "Mix keywords and a question…"
              : "Ask a question about your knowledge base…"
          }
          className="flex-1 rounded border border-neutral-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
        <button
          type="submit"
          disabled={submitting || !props.query.trim()}
          className="rounded bg-brand-600 text-white px-4 py-2 font-medium hover:bg-brand-700 disabled:opacity-60"
        >
          {submitting ? "Searching…" : "Search"}
        </button>
      </div>
      <div className="mt-2 flex items-center gap-3 text-xs text-neutral-600">
        <Toggle
          options={[
            { value: "natural", label: "Natural" },
            { value: "keyword", label: "Keyword" },
            { value: "hybrid", label: "Hybrid" },
          ]}
          value={props.mode}
          onChange={(v) => props.setMode(v as SearchMode)}
        />
        <Toggle
          options={[
            { value: "fast", label: "Fast" },
            { value: "accurate", label: "Accurate" },
          ]}
          value={props.depth}
          onChange={(v) => props.setDepth(v as SearchDepth)}
        />
        <span className="ml-auto">{scopeLabel}</span>
        {err && <span className="text-red-600">{err}</span>}
      </div>
    </form>
  );
}

function Toggle(props: {
  options: { value: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="inline-flex rounded border border-neutral-300 overflow-hidden">
      {props.options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => props.onChange(o.value)}
          className={
            "px-2 py-1 " +
            (props.value === o.value
              ? "bg-brand-600 text-white"
              : "bg-white text-neutral-700 hover:bg-neutral-50")
          }
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
