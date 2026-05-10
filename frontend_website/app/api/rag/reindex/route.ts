import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getIndex } from "@/lib/rag/indexer";
import { notifyIngest } from "@/lib/rag/backend";

async function backendDocIds(userId: string): Promise<Set<string>> {
  const base = process.env.RAG_BACKEND_URL!.replace(/\/$/, "");
  const res = await fetch(`${base}/documents`, {
    headers: { "x-user-id": userId },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`backend /documents failed: ${res.status}`);
  const data = (await res.json()) as { docIds: string[] };
  return new Set(data.docIds ?? []);
}

export async function POST() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  if (!process.env.RAG_BACKEND_URL) {
    return NextResponse.json({ error: "RAG_BACKEND_URL not set" }, { status: 400 });
  }

  const idx = await getIndex(user.id);
  const local = Object.values(idx);

  let alreadyIndexed: Set<string>;
  try {
    alreadyIndexed = await backendDocIds(user.id);
  } catch (err) {
    console.error("[reindex] backend /documents unreachable, will replay all:", err);
    alreadyIndexed = new Set();
  }

  const missing = local.filter((d) => !alreadyIndexed.has(d.docId));
  let indexed = 0;
  for (const doc of missing) {
    try {
      await notifyIngest(user.id, doc);
      indexed++;
    } catch (err) {
      console.error("[reindex] failed for", doc.docId, err);
    }
  }
  return NextResponse.json({
    total: local.length,
    alreadyIndexed: alreadyIndexed.size,
    indexed,
    skipped: local.length - missing.length,
  });
}
