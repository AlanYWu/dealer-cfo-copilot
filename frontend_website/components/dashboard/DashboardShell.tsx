"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { Sidebar } from "@/components/sidebar/Sidebar";
import { ResultsPane } from "@/components/results/ResultsPane";
import { PdfPane } from "@/components/pdf/PdfPane";
import type {
  MissingHint,
  Quote,
  RefineHint,
  Scope,
  SearchDepth,
  SearchMode,
  Session,
} from "@/lib/rag/contract";

export function DashboardShell(props: {
  initialSession?: Session | null;
  username: string;
}) {
  const router = useRouter();
  const [quotes, setQuotes] = useState<Quote[]>(props.initialSession?.quotes ?? []);
  const [query, setQuery] = useState<string>(props.initialSession?.query ?? "");
  const [scope, setScope] = useState<Scope>(props.initialSession?.scope ?? {});
  const [mode, setMode] = useState<SearchMode>("natural");
  const [depth, setDepth] = useState<SearchDepth>("fast");
  const [refine, setRefine] = useState<RefineHint | null>(null);
  const [missing, setMissing] = useState<MissingHint | null>(null);
  const [selectedQuoteId, setSelectedQuoteId] = useState<string | null>(
    props.initialSession?.quotes?.[0]?.id ?? null
  );

  const selectedQuote = useMemo(
    () => quotes.find((q) => q.id === selectedQuoteId) ?? null,
    [quotes, selectedQuoteId]
  );

  // Auto-sync local docs into the backend index once per browser session.
  // Idempotent server-side: the route diffs against the backend's existing
  // docIds and only ingests missing ones.
  useEffect(() => {
    const KEY = "rag.backendSync.v1";
    if (sessionStorage.getItem(KEY)) return;
    sessionStorage.setItem(KEY, "1");
    fetch("/api/rag/reindex", { method: "POST" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data) console.info("[rag] backend sync", data);
      })
      .catch((err) => {
        // Backend not configured / unreachable — fall back silently to mock search.
        console.debug("[rag] backend sync skipped:", err);
        sessionStorage.removeItem(KEY);
      });
  }, []);

  function onSearchComplete(
    sessionId: string,
    newQuotes: Quote[],
    refineHint?: RefineHint,
    missingHint?: MissingHint
  ) {
    setQuotes(newQuotes);
    setSelectedQuoteId(newQuotes[0]?.id ?? null);
    setRefine(refineHint ?? null);
    setMissing(missingHint ?? null);
    router.push(`/s/${sessionId}`);
  }

  return (
    <AppShell
      sidebar={
        <Sidebar
          username={props.username}
          scope={scope}
          setScope={setScope}
        />
      }
      results={
        <ResultsPane
          query={query}
          setQuery={setQuery}
          scope={scope}
          setScope={setScope}
          mode={mode}
          setMode={setMode}
          depth={depth}
          setDepth={setDepth}
          quotes={quotes}
          refine={refine}
          missing={missing}
          selectedQuoteId={selectedQuoteId}
          onSelectQuote={setSelectedQuoteId}
          onSearchComplete={onSearchComplete}
        />
      }
      pdf={<PdfPane quote={selectedQuote} query={query} />}
    />
  );
}
