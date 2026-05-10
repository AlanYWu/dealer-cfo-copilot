import { describe, it, expect, beforeEach, afterEach } from "vitest";
import path from "node:path";
import fs from "node:fs/promises";
import os from "node:os";
import {
  getWorkspaceRoot,
  ensureWorkspace,
  safeJoin,
} from "@/lib/rag/workspace";

let tmpRoot: string;

beforeEach(async () => {
  tmpRoot = await fs.mkdtemp(path.join(os.tmpdir(), "ws-test-"));
  process.env.DATA_DIR = tmpRoot;
});

afterEach(async () => {
  await fs.rm(tmpRoot, { recursive: true, force: true });
  delete process.env.DATA_DIR;
});

describe("workspace", () => {
  it("getWorkspaceRoot returns data/workspaces/<userId>", () => {
    const p = getWorkspaceRoot("u_alice");
    expect(p).toBe(path.join(tmpRoot, "workspaces", "u_alice"));
  });

  it("ensureWorkspace creates pdfs/ and seed files", async () => {
    await ensureWorkspace("u_alice");
    const root = getWorkspaceRoot("u_alice");
    expect((await fs.stat(path.join(root, "pdfs"))).isDirectory()).toBe(true);
    const index = JSON.parse(await fs.readFile(path.join(root, "index.json"), "utf8"));
    const sessions = JSON.parse(await fs.readFile(path.join(root, "sessions.json"), "utf8"));
    expect(index).toEqual({});
    expect(sessions).toEqual([]);
  });

  it("safeJoin resolves paths under the workspace", () => {
    const p = safeJoin("u_alice", "pdfs", "Ford", "Manual.pdf");
    expect(p).toBe(path.join(tmpRoot, "workspaces", "u_alice", "pdfs", "Ford", "Manual.pdf"));
  });

  it("safeJoin throws on path traversal", () => {
    expect(() => safeJoin("u_alice", "..", "..", "etc", "passwd")).toThrow(/outside workspace/);
    expect(() => safeJoin("u_alice", "pdfs", "../../../etc/passwd")).toThrow(/outside workspace/);
  });

  it("safeJoin throws on absolute path segment", () => {
    expect(() => safeJoin("u_alice", "/etc/passwd")).toThrow(/outside workspace/);
  });
});
