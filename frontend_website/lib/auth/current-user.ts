import { cookies } from "next/headers";
import { SESSION_COOKIE, verifySession, type SessionPayload } from "@/lib/auth/session";
import { findUserById, type StoredUser } from "@/lib/auth/users";

export async function getCurrentSession(): Promise<SessionPayload | null> {
  const token = cookies().get(SESSION_COOKIE)?.value ?? "";
  return verifySession(token);
}

export async function getCurrentUser(): Promise<StoredUser | null> {
  const sess = await getCurrentSession();
  if (!sess) return null;
  return findUserById(sess.userId);
}

export async function requireCurrentUser(): Promise<StoredUser> {
  const user = await getCurrentUser();
  if (!user) throw new Error("unauthorized");
  return user;
}
