import path from "node:path";
import fs from "node:fs/promises";
import crypto from "node:crypto";
import { getWorkspaceRoot } from "@/lib/rag/workspace";
import type { Quote, Scope, Session, SessionSummary } from "@/lib/rag/contract";

function sessionsPath(userId: string): string {
  return path.join(getWorkspaceRoot(userId), "sessions.json");
}

async function readAll(userId: string): Promise<Session[]> {
  const raw = await fs.readFile(sessionsPath(userId), "utf8");
  return JSON.parse(raw) as Session[];
}

async function writeAll(userId: string, sessions: Session[]): Promise<void> {
  await fs.writeFile(sessionsPath(userId), JSON.stringify(sessions, null, 2));
}

function summarize(s: Session): SessionSummary {
  return { id: s.id, query: s.query, createdAt: s.createdAt, quoteCount: s.quotes.length };
}

export async function listSessions(userId: string): Promise<SessionSummary[]> {
  const all = await readAll(userId);
  return all.map(summarize).sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

export async function getSession(userId: string, id: string): Promise<Session | null> {
  const all = await readAll(userId);
  return all.find((s) => s.id === id) ?? null;
}

export async function appendSession(args: {
  userId: string;
  query: string;
  scope?: Scope;
  quotes: Quote[];
}): Promise<Session> {
  const session: Session = {
    id: "s_" + crypto.randomBytes(8).toString("hex"),
    query: args.query,
    scope: args.scope,
    quotes: args.quotes,
    createdAt: new Date().toISOString(),
    quoteCount: args.quotes.length,
  };
  const all = await readAll(args.userId);
  all.push(session);
  await writeAll(args.userId, all);
  return session;
}

export async function deleteSession(userId: string, id: string): Promise<boolean> {
  const all = await readAll(userId);
  const next = all.filter((s) => s.id !== id);
  if (next.length === all.length) return false;
  await writeAll(userId, next);
  return true;
}
