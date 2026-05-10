"use client";

import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
import "./PdfSetup";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Document, Page } from "react-pdf";
import type { Quote } from "@/lib/rag/contract";
import { pdfUrl } from "@/lib/rag/client";

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function highlightTokens(query: string, quoteText: string): string[] {
  const raw = `${query} ${quoteText}`.toLowerCase();
  const set = new Set<string>();
  for (const t of raw.split(/[^a-z0-9']+/g)) {
    if (t.length >= 2) set.add(t);
  }
  return Array.from(set).sort((a, b) => b.length - a.length);
}

export function PdfPane({ quote, query }: { quote: Quote | null; query?: string }) {
  const [numPages, setNumPages] = useState<number>(0);
  const [zoom, setZoom] = useState(1.0);
  const pageRefs = useRef<Record<number, HTMLDivElement | null>>({});

  const highlightRegex = useMemo<RegExp | null>(() => {
    const tokens = highlightTokens(query ?? "", quote?.text ?? "");
    if (tokens.length === 0) return null;
    return new RegExp(`(${tokens.map(escapeRegex).join("|")})`, "gi");
  }, [query, quote?.text]);

  const renderHighlighted = useCallback(
    ({ str }: { str: string }) => {
      const esc = escapeHtml(str);
      if (!highlightRegex) return esc;
      return esc.replace(highlightRegex, (m) => `<mark class="rag-hit">${m}</mark>`);
    },
    [highlightRegex]
  );

  useEffect(() => {
    if (!quote) return;
    const el = pageRefs.current[quote.page];
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [quote?.id, quote?.page, numPages]);

  if (!quote) {
    return (
      <div className="h-full grid place-items-center text-neutral-500 text-sm">
        Select a quote to view its source PDF.
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between px-3 py-2 bg-white border-b border-neutral-200 text-sm">
        <div className="truncate">
          <span className="font-medium">{quote.docName}</span>
          <span className="text-neutral-500"> · page {quote.page}</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setZoom((z) => Math.max(0.5, z - 0.1))}
            className="px-2 py-0.5 border border-neutral-300 rounded"
            aria-label="Zoom out"
          >−</button>
          <span className="text-xs w-10 text-center">{Math.round(zoom * 100)}%</span>
          <button
            onClick={() => setZoom((z) => Math.min(2.5, z + 0.1))}
            className="px-2 py-0.5 border border-neutral-300 rounded"
            aria-label="Zoom in"
          >+</button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto px-4 py-4 bg-neutral-100">
        <Document
          file={pdfUrl(quote.docId)}
          onLoadSuccess={({ numPages }) => setNumPages(numPages)}
          loading={<div className="text-sm text-neutral-500">Loading PDF…</div>}
          error={<div className="text-sm text-red-600">Failed to load PDF.</div>}
        >
          {Array.from({ length: numPages }, (_, i) => i + 1).map((p) => (
            <div
              key={p}
              ref={(el) => { pageRefs.current[p] = el; }}
              className="mb-4 bg-white shadow-sm mx-auto w-fit"
              data-page={p}
            >
              {p === quote.page && (
                <div className="bg-yellow-100 border-l-4 border-yellow-400 text-xs text-yellow-800 px-2 py-1">
                  Matched passage on this page
                </div>
              )}
              <Page
                pageNumber={p}
                scale={zoom}
                customTextRenderer={p === quote.page ? renderHighlighted : undefined}
              />
            </div>
          ))}
        </Document>
      </div>
    </div>
  );
}
