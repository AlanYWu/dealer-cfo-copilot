import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getIndex } from "@/lib/rag/indexer";
import { searchIndex } from "@/lib/rag/mock-search";
import { appendSession } from "@/lib/rag/sessions";
import type { SearchResponse } from "@/lib/rag/contract";

const Body = z.object({
  query: z.string().min(1).max(500),
  scope: z
    .object({
      folders: z.array(z.string()).optional(),
      docIds: z.array(z.string()).optional(),
    })
    .optional(),
  mode: z.enum(["keyword", "natural", "hybrid"]).optional(),
  depth: z.enum(["fast", "accurate"]).optional(),
});

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid JSON" }, { status: 400 });
  }
  const parsed = Body.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "invalid input" }, { status: 400 });

  const backend = process.env.RAG_BACKEND_URL;
  let quotes: SearchResponse["quotes"];
  let refine: SearchResponse["refine"];
  let missing: SearchResponse["missing"];

  if (backend) {
    const upstream = await fetch(`${backend.replace(/\/$/, "")}/search`, {
      method: "POST",
      headers: { "content-type": "application/json", "x-user-id": user.id },
      body: JSON.stringify(parsed.data),
    });
    if (!upstream.ok) {
      return NextResponse.json({ error: "upstream error" }, { status: 502 });
    }
    const data = (await upstream.json()) as SearchResponse;
    quotes = data.quotes;
    refine = data.refine;
    missing = data.missing;
  } else {
    const idx = await getIndex(user.id);
    quotes = searchIndex(idx, parsed.data.query, parsed.data.scope);
  }

  const session = await appendSession({
    userId: user.id,
    query: parsed.data.query,
    scope: parsed.data.scope,
    quotes,
  });
  const res: SearchResponse = { sessionId: session.id, quotes, refine, missing };
  return NextResponse.json(res);
}
