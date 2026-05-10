import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { getCurrentUser } from "@/lib/auth/current-user";
import { QueryProvider } from "@/components/providers/QueryProvider";

export default async function AppLayout({ children }: { children: ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return <QueryProvider>{children}</QueryProvider>;
}
