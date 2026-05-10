import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/current-user";
import { listSessions } from "@/lib/rag/sessions";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  return NextResponse.json({ sessions: await listSessions(user.id) });
}
