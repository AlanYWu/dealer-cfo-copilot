import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getIndex } from "@/lib/rag/indexer";
import type { DocumentNode, KnowledgeBaseTree } from "@/lib/rag/contract";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const idx = await getIndex(user.id);
  const byFolder = new Map<string, DocumentNode[]>();
  for (const d of Object.values(idx)) {
    const node: DocumentNode = {
      docId: d.docId,
      docName: d.docName,
      folder: d.folder,
      pages: d.pages,
      sizeBytes: d.sizeBytes,
      uploadedAt: d.uploadedAt,
    };
    const arr = byFolder.get(d.folder) ?? [];
    arr.push(node);
    byFolder.set(d.folder, arr);
  }
  const tree: KnowledgeBaseTree = {
    folders: Array.from(byFolder.entries())
      .map(([name, documents]) => ({
        name,
        documents: documents.sort((a, b) => a.docName.localeCompare(b.docName)),
      }))
      .sort((a, b) => a.name.localeCompare(b.name)),
  };
  return NextResponse.json(tree);
}
