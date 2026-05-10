import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getSession, deleteSession } from "@/lib/rag/sessions";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const session = await getSession(user.id, params.id);
  if (!session) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json(session);
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const removed = await deleteSession(user.id, params.id);
  if (!removed) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
