import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getSession } from "@/lib/rag/sessions";
import { DashboardShell } from "@/components/dashboard/DashboardShell";

export default async function SessionPage({ params }: { params: { sessionId: string } }) {
  const user = (await getCurrentUser())!;
  const session = await getSession(user.id, params.sessionId);
  if (!session) notFound();
  return <DashboardShell username={user.username} initialSession={session} />;
}
