import type {
  KnowledgeBaseTree,
  Quote,
  SearchRequest,
  SearchResponse,
  Session,
  SessionSummary,
} from "@/lib/rag/contract";

async function jsonOrThrow<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const msg = await res.text().catch(() => res.statusText);
    throw new Error(msg || `HTTP ${res.status}`);
  }
  return (await res.json()) as T;
}

export async function fetchDocuments(): Promise<KnowledgeBaseTree> {
  return jsonOrThrow(await fetch("/api/rag/documents"));
}

export async function fetchSessions(): Promise<{ sessions: SessionSummary[] }> {
  return jsonOrThrow(await fetch("/api/rag/sessions"));
}

export async function fetchSession(id: string): Promise<Session> {
  return jsonOrThrow(await fetch(`/api/rag/sessions/${id}`));
}

export async function deleteSession(id: string): Promise<void> {
  const res = await fetch(`/api/rag/sessions/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
}

export async function runSearch(body: SearchRequest): Promise<SearchResponse> {
  return jsonOrThrow(
    await fetch("/api/rag/search", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    })
  );
}

export async function uploadPdf(folder: string, file: File): Promise<void> {
  const form = new FormData();
  form.set("folder", folder);
  form.set("file", file);
  const res = await fetch("/api/rag/upload", { method: "POST", body: form });
  if (!res.ok) throw new Error(await res.text());
}

export function pdfUrl(docId: string): string {
  return `/api/rag/pdf/${encodeURIComponent(docId)}`;
}

export type SelectedQuote = { quote: Quote } | null;
