import type { IndexedDoc } from "@/lib/rag/indexer";

function backendUrl(): string | null {
  const url = process.env.RAG_BACKEND_URL;
  return url ? url.replace(/\/$/, "") : null;
}

export async function notifyIngest(userId: string, doc: IndexedDoc): Promise<void> {
  const base = backendUrl();
  if (!base) return;
  const body = {
    docId: doc.docId,
    folder: doc.folder,
    docName: doc.docName,
    pages: doc.pagesText.map((text, i) => ({ page: i + 1, text })),
  };
  try {
    const res = await fetch(`${base}/ingest`, {
      method: "POST",
      headers: { "content-type": "application/json", "x-user-id": userId },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      console.error("[rag/backend] ingest failed", res.status, await res.text().catch(() => ""));
    }
  } catch (err) {
    console.error("[rag/backend] ingest error", err);
  }
}

export async function notifyDelete(userId: string, docId: string): Promise<void> {
  const base = backendUrl();
  if (!base) return;
  try {
    const res = await fetch(`${base}/documents/${encodeURIComponent(docId)}`, {
      method: "DELETE",
      headers: { "x-user-id": userId },
    });
    if (!res.ok && res.status !== 404) {
      console.error("[rag/backend] delete failed", res.status, await res.text().catch(() => ""));
    }
  } catch (err) {
    console.error("[rag/backend] delete error", err);
  }
}
