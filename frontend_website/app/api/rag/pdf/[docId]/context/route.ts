import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getIndex } from "@/lib/rag/indexer";

export async function GET(req: Request, { params }: { params: { docId: string } }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const page = Number(url.searchParams.get("page") ?? "1");
  if (!Number.isFinite(page) || page < 1) {
    return NextResponse.json({ error: "invalid page" }, { status: 400 });
  }

  const idx = await getIndex(user.id);
  const doc = idx[params.docId];
  if (!doc) return NextResponse.json({ error: "not found" }, { status: 404 });
  const text = doc.pagesText[page - 1] ?? "";
  return NextResponse.json({ docId: doc.docId, page, text });
}
