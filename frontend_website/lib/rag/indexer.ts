import path from "node:path";
import fs from "node:fs/promises";
import crypto from "node:crypto";
import { getWorkspaceRoot, safeJoin } from "@/lib/rag/workspace";
import { notifyDelete, notifyIngest } from "@/lib/rag/backend";
import type { DocumentNode } from "@/lib/rag/contract";

export type IndexedDoc = DocumentNode & {
  relativePath: string;
  pagesText: string[];
};

export type WorkspaceIndex = Record<string, IndexedDoc>;

async function loadIndex(userId: string): Promise<WorkspaceIndex> {
  const p = path.join(getWorkspaceRoot(userId), "index.json");
  const raw = await fs.readFile(p, "utf8");
  return JSON.parse(raw) as WorkspaceIndex;
}

async function saveIndex(userId: string, idx: WorkspaceIndex): Promise<void> {
  const p = path.join(getWorkspaceRoot(userId), "index.json");
  await fs.writeFile(p, JSON.stringify(idx, null, 2));
}

async function extractPages(buffer: Buffer): Promise<string[]> {
  const pdfjs: any = await import("pdfjs-dist/legacy/build/pdf.mjs");
  // In the Next.js webpack bundle the default workerSrc ("./pdf.worker.mjs")
  // resolves against the compiled vendor-chunk directory and fails.  Always
  // point it at the absolute path in node_modules before calling getDocument.
  pdfjs.GlobalWorkerOptions.workerSrc = path.join(
    process.cwd(),
    "node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs"
  );
  const data = new Uint8Array(buffer);
  const doc = await pdfjs.getDocument({ data, useSystemFonts: true }).promise;
  const pages: string[] = [];
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    const text = content.items.map((it: any) => it.str ?? "").join(" ").replace(/\s+/g, " ").trim();
    pages.push(text);
  }
  await doc.destroy();
  return pages;
}

export async function indexUploadedPdf(args: {
  userId: string;
  folder: string;
  docName: string;
  buffer: Buffer;
}): Promise<IndexedDoc> {
  const { userId, folder, docName, buffer } = args;
  if (!/^[A-Za-z0-9 _.-]+$/.test(folder)) throw new Error("invalid folder name");
  if (!/^[A-Za-z0-9 _.()-]+\.pdf$/i.test(docName)) throw new Error("invalid file name");

  const pages = await extractPages(buffer);

  const folderDir = safeJoin(userId, "pdfs", folder);
  await fs.mkdir(folderDir, { recursive: true });
  const fullPath = safeJoin(userId, "pdfs", folder, docName);
  await fs.writeFile(fullPath, buffer);

  const docId = "d_" + crypto.randomBytes(8).toString("hex");
  const doc: IndexedDoc = {
    docId,
    docName,
    folder,
    pages: pages.length,
    sizeBytes: buffer.byteLength,
    uploadedAt: new Date().toISOString(),
    relativePath: path.posix.join(folder, docName),
    pagesText: pages,
  };

  const idx = await loadIndex(userId);
  idx[docId] = doc;
  await saveIndex(userId, idx);

  await notifyIngest(userId, doc);

  return doc;
}

export async function getIndex(userId: string): Promise<WorkspaceIndex> {
  return loadIndex(userId);
}

export async function removeDoc(userId: string, docId: string): Promise<void> {
  const idx = await loadIndex(userId);
  const doc = idx[docId];
  if (!doc) return;
  const filePath = safeJoin(userId, "pdfs", doc.folder, doc.docName);
  await fs.rm(filePath, { force: true });
  delete idx[docId];
  await saveIndex(userId, idx);
  await notifyDelete(userId, docId);
}
