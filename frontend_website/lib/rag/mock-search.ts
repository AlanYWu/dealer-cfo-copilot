import crypto from "node:crypto";
import type { Quote, Scope } from "@/lib/rag/contract";
import type { WorkspaceIndex, IndexedDoc } from "@/lib/rag/indexer";

const CONTEXT_CHARS = 200;

function tokenize(q: string): string[] {
  return q
    .toLowerCase()
    .split(/[^a-z0-9']+/g)
    .filter((t) => t.length >= 2);
}

function scoreSentence(sentence: string, terms: string[]): number {
  const hay = sentence.toLowerCase();
  let hits = 0;
  for (const t of terms) {
    if (hay.includes(t)) hits++;
  }
  if (hits === 0) return 0;
  // Reward coverage; normalize by sqrt of sentence length to avoid long sentences dominating.
  return hits / terms.length + 1 / Math.sqrt(Math.max(sentence.length, 50));
}

function splitSentences(pageText: string): string[] {
  return pageText
    .replace(/\s+/g, " ")
    .split(/(?<=[.!?])\s+(?=[A-Z])/g)
    .map((s) => s.trim())
    .filter(Boolean);
}

function inScope(doc: IndexedDoc, scope?: Scope): boolean {
  if (!scope) return true;
  if (scope.docIds && scope.docIds.length > 0 && !scope.docIds.includes(doc.docId)) return false;
  if (scope.folders && scope.folders.length > 0 && !scope.folders.includes(doc.folder)) return false;
  return true;
}

export function searchIndex(index: WorkspaceIndex, query: string, scope?: Scope): Quote[] {
  const terms = tokenize(query);
  if (terms.length === 0) return [];

  const quotes: Quote[] = [];
  for (const doc of Object.values(index)) {
    if (!inScope(doc, scope)) continue;
    doc.pagesText.forEach((pageText, pageIdx) => {
      const sentences = splitSentences(pageText);
      let cursor = 0;
      for (const s of sentences) {
        const score = scoreSentence(s, terms);
        if (score > 0) {
          const start = pageText.indexOf(s, cursor);
          const from = Math.max(0, start - CONTEXT_CHARS);
          const to = Math.min(pageText.length, start + s.length + CONTEXT_CHARS);
          quotes.push({
            id: "q_" + crypto.randomBytes(6).toString("hex"),
            text: s,
            docId: doc.docId,
            docName: doc.docName,
            folder: doc.folder,
            page: pageIdx + 1,
            contextBefore: pageText.slice(from, start),
            contextAfter: pageText.slice(start + s.length, to),
            score,
          });
        }
        cursor = Math.max(cursor, pageText.indexOf(s, cursor) + s.length);
      }
    });
  }

  quotes.sort((a, b) => b.score - a.score);
  return quotes.slice(0, 20);
}
