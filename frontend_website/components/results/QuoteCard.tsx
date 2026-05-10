"use client";

import type { Quote } from "@/lib/rag/contract";

export function QuoteCard(props: {
  quote: Quote;
  selected: boolean;
  onClick: () => void;
}) {
  const q = props.quote;
  return (
    <button
      onClick={props.onClick}
      className={`block w-full text-left rounded border p-3 transition ${
        props.selected
          ? "border-brand-500 bg-brand-50"
          : "border-neutral-200 hover:border-neutral-300 bg-white"
      }`}
    >
      <div className="text-sm leading-relaxed">
        <span className="text-neutral-500">…{q.contextBefore.slice(-80)}</span>
        <mark className="bg-yellow-200 px-0.5 rounded">{q.text}</mark>
        <span className="text-neutral-500">{q.contextAfter.slice(0, 80)}…</span>
      </div>
      <div className="mt-2 text-xs text-neutral-500 flex items-center gap-2">
        <span className="font-medium">{q.docName}</span>
        <span>· page {q.page}</span>
        <span>· {q.folder}</span>
        <span className="ml-auto text-neutral-400">score {q.score.toFixed(2)}</span>
      </div>
    </button>
  );
}
