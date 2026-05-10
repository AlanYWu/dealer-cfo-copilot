"use client";

import type {
  MissingHint,
  Quote,
  RefineHint,
  RefineSuggestion,
  Scope,
  SearchDepth,
  SearchMode,
} from "@/lib/rag/contract";
import { QueryBar } from "./QueryBar";
import { QuoteCard } from "./QuoteCard";

export function ResultsPane(props: {
  query: string;
  setQuery: (q: string) => void;
  scope: Scope;
  setScope: (s: Scope) => void;
  mode: SearchMode;
  setMode: (m: SearchMode) => void;
  depth: SearchDepth;
  setDepth: (d: SearchDepth) => void;
  quotes: Quote[];
  refine: RefineHint | null;
  missing: MissingHint | null;
  selectedQuoteId: string | null;
  onSelectQuote: (id: string) => void;
  onSearchComplete: (
    sessionId: string,
    quotes: Quote[],
    refine?: RefineHint,
    missing?: MissingHint
  ) => void;
}) {
  function applySuggestion(s: RefineSuggestion) {
    if (s.kind === "folder" && s.folder) {
      props.setScope({ ...props.scope, folders: [s.folder] });
    } else if (s.kind === "doc" && s.docId) {
      props.setScope({ ...props.scope, docIds: [s.docId] });
    }
  }

  return (
    <div className="h-full flex flex-col">
      <QueryBar
        query={props.query}
        setQuery={props.setQuery}
        scope={props.scope}
        mode={props.mode}
        setMode={props.setMode}
        depth={props.depth}
        setDepth={props.setDepth}
        onSearchComplete={props.onSearchComplete}
      />
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {props.refine && (
          <div className="rounded border border-amber-200 bg-amber-50 p-3 text-sm">
            <div className="font-medium text-amber-900">
              {props.refine.totalMatches} matches — narrow it down
            </div>
            <div className="mt-1 text-amber-800">
              Showing top results. Pick a filter to narrow:
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              {props.refine.suggestions.map((s, i) => (
                <button
                  key={i}
                  onClick={() => applySuggestion(s)}
                  className="rounded-full border border-amber-300 bg-white px-3 py-1 text-xs hover:bg-amber-100"
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        )}
        {props.missing && (
          <div className="rounded border border-blue-200 bg-blue-50 p-3 text-sm">
            <div className="font-medium text-blue-900">No matches in your knowledge base</div>
            <div className="mt-1 text-blue-800">
              You may want to add a document like:
            </div>
            <ul className="mt-1 list-disc list-inside text-blue-900">
              {props.missing.suggestions.map((s, i) => (
                <li key={i}>{s}</li>
              ))}
            </ul>
          </div>
        )}
        {props.quotes.length === 0 && !props.refine && !props.missing ? (
          <p className="text-sm text-neutral-500">No results. Try a search above.</p>
        ) : props.quotes.length > 0 ? (
          <>
            <div className="text-xs text-brand-600 font-medium">
              {props.quotes.length} quotes shown
            </div>
            {props.quotes.map((q) => (
              <QuoteCard
                key={q.id}
                quote={q}
                selected={props.selectedQuoteId === q.id}
                onClick={() => props.onSelectQuote(q.id)}
              />
            ))}
          </>
        ) : null}
      </div>
    </div>
  );
}
