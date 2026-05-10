import { SignJWT, jwtVerify } from "jose";

export const SESSION_COOKIE = "rag_session";
const ALG = "HS256";
const TTL = "7d";

export type SessionPayload = {
  userId: string;
  username: string;
};

function secretKey(): Uint8Array {
  const s = process.env.SESSION_SECRET;
  if (!s || s.length < 32) {
    throw new Error("SESSION_SECRET must be set and at least 32 characters");
  }
  return new TextEncoder().encode(s);
}

export async function signSession(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: ALG })
    .setIssuedAt()
    .setExpirationTime(TTL)
    .sign(secretKey());
}

export async function verifySession(token: string): Promise<SessionPayload | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secretKey(), { algorithms: [ALG] });
    if (typeof payload.userId !== "string" || typeof payload.username !== "string") return null;
    return { userId: payload.userId, username: payload.username };
  } catch {
    return null;
  }
}
