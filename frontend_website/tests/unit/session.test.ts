import { describe, it, expect, beforeAll } from "vitest";
import { signSession, verifySession } from "@/lib/auth/session";

beforeAll(() => {
  process.env.SESSION_SECRET = "x".repeat(32);
});

describe("session", () => {
  it("signs and verifies a session token", async () => {
    const token = await signSession({ userId: "u_alice", username: "alice" });
    const payload = await verifySession(token);
    expect(payload?.userId).toBe("u_alice");
    expect(payload?.username).toBe("alice");
  });

  it("returns null on a tampered token", async () => {
    const token = await signSession({ userId: "u_alice", username: "alice" });
    const bad = token.slice(0, -2) + "xx";
    expect(await verifySession(bad)).toBeNull();
  });

  it("returns null on a malformed token", async () => {
    expect(await verifySession("not.a.jwt")).toBeNull();
    expect(await verifySession("")).toBeNull();
  });
});
