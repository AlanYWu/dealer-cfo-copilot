import { NextResponse } from "next/server";
import { z } from "zod";
import { createUser } from "@/lib/auth/users";
import { signSession, SESSION_COOKIE } from "@/lib/auth/session";

const Body = z.object({
  username: z.string().min(2).max(32),
  password: z.string().min(8).max(200),
});

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid JSON" }, { status: 400 });
  }
  const parsed = Body.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid input" }, { status: 400 });
  }

  try {
    const user = await createUser(parsed.data.username, parsed.data.password);
    const token = await signSession({ userId: user.id, username: user.username });
    const res = NextResponse.json({ userId: user.id, username: user.username }, { status: 201 });
    res.cookies.set(SESSION_COOKIE, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });
    return res;
  } catch (err: any) {
    const msg = err?.message || "signup failed";
    const status = /exists/i.test(msg) ? 409 : 400;
    return NextResponse.json({ error: msg }, { status });
  }
}
