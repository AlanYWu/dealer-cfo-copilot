import path from "node:path";
import fs from "node:fs/promises";
import crypto from "node:crypto";
import { hashPassword } from "@/lib/auth/passwords";
import { ensureWorkspace } from "@/lib/rag/workspace";

export type StoredUser = {
  id: string;
  username: string;
  passwordHash: string;
  createdAt: string;
};

function dataDir(): string {
  return process.env.DATA_DIR || path.join(process.cwd(), "data");
}

function usersPath(): string {
  return path.join(dataDir(), "users.json");
}

async function readAll(): Promise<StoredUser[]> {
  try {
    const raw = await fs.readFile(usersPath(), "utf8");
    return JSON.parse(raw) as StoredUser[];
  } catch (err: any) {
    if (err?.code === "ENOENT") return [];
    throw err;
  }
}

async function writeAll(users: StoredUser[]): Promise<void> {
  await fs.mkdir(dataDir(), { recursive: true });
  await fs.writeFile(usersPath(), JSON.stringify(users, null, 2));
}

export async function findUserByUsername(username: string): Promise<StoredUser | null> {
  const users = await readAll();
  const u = users.find((x) => x.username.toLowerCase() === username.toLowerCase());
  return u ?? null;
}

export async function findUserById(id: string): Promise<StoredUser | null> {
  const users = await readAll();
  return users.find((x) => x.id === id) ?? null;
}

export async function createUser(username: string, password: string): Promise<StoredUser> {
  if (!/^[a-zA-Z0-9_-]{2,32}$/.test(username)) {
    throw new Error("username must be 2-32 chars of letters, digits, _ or -");
  }
  const existing = await findUserByUsername(username);
  if (existing) throw new Error("username already exists");
  const users = await readAll();
  const user: StoredUser = {
    id: "u_" + crypto.randomBytes(6).toString("hex"),
    username,
    passwordHash: await hashPassword(password),
    createdAt: new Date().toISOString(),
  };
  users.push(user);
  await writeAll(users);
  await ensureWorkspace(user.id);
  return user;
}
