import path from "node:path";
import fs from "node:fs/promises";

function dataDir(): string {
  return process.env.DATA_DIR || path.join(process.cwd(), "data");
}

export function getWorkspaceRoot(userId: string): string {
  if (!/^[a-zA-Z0-9_-]+$/.test(userId)) {
    throw new Error("invalid userId");
  }
  return path.join(dataDir(), "workspaces", userId);
}

export async function ensureWorkspace(userId: string): Promise<void> {
  const root = getWorkspaceRoot(userId);
  await fs.mkdir(path.join(root, "pdfs"), { recursive: true });
  const indexPath = path.join(root, "index.json");
  const sessionsPath = path.join(root, "sessions.json");
  try {
    await fs.access(indexPath);
  } catch {
    await fs.writeFile(indexPath, "{}");
  }
  try {
    await fs.access(sessionsPath);
  } catch {
    await fs.writeFile(sessionsPath, "[]");
  }
}

export function safeJoin(userId: string, ...segments: string[]): string {
  const root = getWorkspaceRoot(userId);
  const resolved = path.resolve(root, ...segments);
  const normalizedRoot = path.resolve(root) + path.sep;
  if (resolved !== path.resolve(root) && !resolved.startsWith(normalizedRoot)) {
    throw new Error("path outside workspace");
  }
  return resolved;
}
