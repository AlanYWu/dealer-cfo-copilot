import { NextResponse } from "next/server";
import fs from "node:fs/promises";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getIndex } from "@/lib/rag/indexer";
import { safeJoin } from "@/lib/rag/workspace";

export async function GET(_req: Request, { params }: { params: { docId: string } }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const idx = await getIndex(user.id);
  const doc = idx[params.docId];
  if (!doc) return NextResponse.json({ error: "not found" }, { status: 404 });

  const filePath = safeJoin(user.id, "pdfs", doc.folder, doc.docName);
  const bytes = await fs.readFile(filePath);
  return new NextResponse(bytes, {
    status: 200,
    headers: {
      "content-type": "application/pdf",
      "content-length": String(bytes.byteLength),
      "cache-control": "private, max-age=60",
    },
  });
}
