import { NextResponse } from "next/server";
import { z } from "zod";
import { findUserByUsername } from "@/lib/auth/users";
import { verifyPassword } from "@/lib/auth/passwords";
import { signSession, SESSION_COOKIE } from "@/lib/auth/session";

const Body = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
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

  const user = await findUserByUsername(parsed.data.username);
  if (!user || !(await verifyPassword(parsed.data.password, user.passwordHash))) {
    return NextResponse.json({ error: "invalid credentials" }, { status: 401 });
  }

  const token = await signSession({ userId: user.id, username: user.username });
  const res = NextResponse.json({ userId: user.id, username: user.username });
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  return res;
}
