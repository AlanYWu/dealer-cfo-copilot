import { getCurrentUser } from "@/lib/auth/current-user";
import { DashboardShell } from "@/components/dashboard/DashboardShell";

export default async function DashboardPage() {
  const user = (await getCurrentUser())!;
  return <DashboardShell username={user.username} />;
}
