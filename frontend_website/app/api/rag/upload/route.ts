import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/current-user";
import { indexUploadedPdf } from "@/lib/rag/indexer";

const MAX_BYTES = 50 * 1024 * 1024; // 50 MB

function isPdf(buf: Buffer): boolean {
  return buf.length >= 5 && buf.subarray(0, 5).toString("ascii") === "%PDF-";
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const form = await req.formData();
  const folder = String(form.get("folder") ?? "").trim();
  const file = form.get("file");

  if (!folder) return NextResponse.json({ error: "folder is required" }, { status: 400 });
  if (!(file instanceof File)) return NextResponse.json({ error: "file is required" }, { status: 400 });

  const arrayBuf = await file.arrayBuffer();
  if (arrayBuf.byteLength > MAX_BYTES) {
    return NextResponse.json({ error: "file too large" }, { status: 413 });
  }
  const buffer = Buffer.from(arrayBuf);
  if (!isPdf(buffer)) {
    return NextResponse.json({ error: "only PDF files are accepted" }, { status: 415 });
  }

  try {
    const doc = await indexUploadedPdf({
      userId: user.id,
      folder,
      docName: file.name,
      buffer,
    });
    return NextResponse.json({
      docId: doc.docId,
      docName: doc.docName,
      folder: doc.folder,
      pages: doc.pages,
      sizeBytes: doc.sizeBytes,
      uploadedAt: doc.uploadedAt,
    }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "upload failed" }, { status: 400 });
  }
}
