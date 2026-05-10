import { describe, it, expect } from "vitest";
import { hashPassword, verifyPassword } from "@/lib/auth/passwords";

describe("passwords", () => {
  it("hashes and verifies a password", async () => {
    const hash = await hashPassword("hunter2");
    expect(hash).not.toBe("hunter2");
    expect(await verifyPassword("hunter2", hash)).toBe(true);
    expect(await verifyPassword("wrong", hash)).toBe(false);
  });

  it("produces distinct hashes for the same password (salted)", async () => {
    const a = await hashPassword("hunter2");
    const b = await hashPassword("hunter2");
    expect(a).not.toBe(b);
  });
});
