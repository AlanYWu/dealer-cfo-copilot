import { describe, it, expect, beforeEach, afterEach } from "vitest";
import path from "node:path";
import fs from "node:fs/promises";
import os from "node:os";
import { createUser, findUserByUsername, findUserById } from "@/lib/auth/users";

let tmpRoot: string;

beforeEach(async () => {
  tmpRoot = await fs.mkdtemp(path.join(os.tmpdir(), "users-test-"));
  process.env.DATA_DIR = tmpRoot;
});

afterEach(async () => {
  await fs.rm(tmpRoot, { recursive: true, force: true });
  delete process.env.DATA_DIR;
});

describe("users", () => {
  it("creates and looks up a user", async () => {
    const u = await createUser("alice", "hunter2hunter2");
    expect(u.username).toBe("alice");
    expect(u.id).toMatch(/^u_/);
    expect(await findUserByUsername("alice")).toEqual(u);
    expect(await findUserById(u.id)).toEqual(u);
  });

  it("rejects duplicate usernames (case-insensitive)", async () => {
    await createUser("alice", "hunter2hunter2");
    await expect(createUser("ALICE", "another-pw-here")).rejects.toThrow(/exists/i);
  });

  it("provisions the workspace directory on create", async () => {
    const u = await createUser("alice", "hunter2hunter2");
    const ws = path.join(tmpRoot, "workspaces", u.id, "pdfs");
    expect((await fs.stat(ws)).isDirectory()).toBe(true);
  });

  it("returns null for unknown users", async () => {
    expect(await findUserByUsername("nobody")).toBeNull();
    expect(await findUserById("u_nobody")).toBeNull();
  });
});
