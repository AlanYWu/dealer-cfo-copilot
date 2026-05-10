# RAG Website Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a prototype Next.js web application where authenticated users search their private PDF knowledge base and receive ranked verbatim quotes, each clickable to jump into a side-by-side PDF viewer.

**Architecture:** Single Next.js 14 App Router project (TypeScript + Tailwind). Real local auth (JSON + bcrypt + JWT cookie). RAG API endpoints under `/api/rag/*` conform to a contract in `lib/rag/contract.ts` so a real backend can replace the in-process mock via `RAG_BACKEND_URL`. Per-user workspaces under `data/workspaces/<userId>/`. PDF rendering via `react-pdf`.

**Tech Stack:** Next.js 14, React 18, TypeScript, Tailwind CSS, `react-pdf`, `pdf-parse`, `bcryptjs`, `jose` (JWT), `@tanstack/react-query`, `zod`, Vitest, Playwright.

**Reference:** See `plan/superpowers/specs/2026-04-16-rag-website-design.md` for the full design.

---

## Phase 1 — Project Foundation

### Task 1: Scaffold the Next.js project

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `next.config.mjs`
- Create: `tailwind.config.ts`
- Create: `postcss.config.mjs`
- Create: `app/layout.tsx`
- Create: `app/page.tsx`
- Create: `app/globals.css`
- Create: `env.example`

- [ ] **Step 1: Create `package.json`**

```json
{
  "name": "rag-frontend-website",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:e2e": "playwright test",
    "seed:robert": "tsx scripts/seed-robert.ts"
  },
  "dependencies": {
    "@tanstack/react-query": "^5.51.0",
    "bcryptjs": "^2.4.3",
    "jose": "^5.6.3",
    "next": "14.2.5",
    "pdf-parse": "^1.1.1",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-pdf": "^9.1.0",
    "zod": "^3.23.8"
  },
  "devDependencies": {
    "@playwright/test": "^1.46.0",
    "@types/bcryptjs": "^2.4.6",
    "@types/node": "^20.14.10",
    "@types/pdf-parse": "^1.1.4",
    "@types/react": "^18.3.3",
    "@types/react-dom": "^18.3.0",
    "autoprefixer": "^10.4.19",
    "eslint": "^8.57.0",
    "eslint-config-next": "14.2.5",
    "postcss": "^8.4.39",
    "tailwindcss": "^3.4.6",
    "tsx": "^4.16.2",
    "typescript": "^5.5.3",
    "vitest": "^2.0.3"
  }
}
```

- [ ] **Step 2: Create `tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./*"] }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

- [ ] **Step 3: Create `next.config.mjs`**

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config) => {
    config.resolve.alias.canvas = false;
    return config;
  },
};

export default nextConfig;
```

- [ ] **Step 4: Create `postcss.config.mjs`**

```javascript
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
```

- [ ] **Step 5: Create `tailwind.config.ts`**

```typescript
import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eef2ff",
          500: "#6366f1",
          600: "#4f46e5",
          700: "#4338ca",
        },
      },
    },
  },
  plugins: [],
};
export default config;
```

- [ ] **Step 6: Create `app/globals.css`**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

html, body, #__next {
  height: 100%;
}
body {
  @apply bg-white text-neutral-900 antialiased;
}
```

- [ ] **Step 7: Create `app/layout.tsx`**

```tsx
import "./globals.css";
import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "RAG Workspace",
  description: "Search your PDF knowledge base with exact citations.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
```

- [ ] **Step 8: Create `app/page.tsx` (root redirect)**

```tsx
import { redirect } from "next/navigation";

export default function Home() {
  redirect("/login");
}
```

- [ ] **Step 9: Create `env.example`**

```
# 32+ character random string used to sign session JWTs.
SESSION_SECRET=change-me-to-a-long-random-string-please-32chars

# Optional: point at a real backend. When unset, the in-process mock is used.
# RAG_BACKEND_URL=http://localhost:8000
```

- [ ] **Step 10: Install and verify**

Run:

```bash
cp env.example .env.local
npm install
npm run dev
```

Expected: dev server starts on `http://localhost:3000` and redirects to `/login` (which 404s — that is expected until Task 11).

Press Ctrl+C to stop.

- [ ] **Step 11: Commit**

```bash
git add package.json package-lock.json tsconfig.json next.config.mjs tailwind.config.ts postcss.config.mjs app/ env.example
git commit -m "feat: scaffold Next.js project with TypeScript and Tailwind"
```

---

### Task 2: Define the RAG API contract types

**Files:**
- Create: `lib/rag/contract.ts`

- [ ] **Step 1: Write the contract types**

Create `lib/rag/contract.ts`:

```typescript
export type Quote = {
  id: string;
  text: string;
  docId: string;
  docName: string;
  folder: string;
  page: number;
  bbox?: [number, number, number, number];
  contextBefore: string;
  contextAfter: string;
  score: number;
};

export type Scope = {
  folders?: string[];
  docIds?: string[];
};

export type SearchRequest = {
  query: string;
  scope?: Scope;
};

export type SearchResponse = {
  sessionId: string;
  quotes: Quote[];
};

export type SessionSummary = {
  id: string;
  query: string;
  createdAt: string;
  quoteCount: number;
};

export type Session = SessionSummary & {
  scope?: Scope;
  quotes: Quote[];
};

export type DocumentNode = {
  docId: string;
  docName: string;
  folder: string;
  pages: number;
  sizeBytes: number;
  uploadedAt: string;
};

export type KnowledgeBaseTree = {
  folders: Array<{ name: string; documents: DocumentNode[] }>;
};
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add lib/rag/contract.ts
git commit -m "feat: define RAG API contract types"
```

---

### Task 3: Workspace path helpers with path-traversal guard

**Files:**
- Create: `lib/rag/workspace.ts`
- Create: `vitest.config.ts`
- Create: `tests/unit/workspace.test.ts`

- [ ] **Step 1: Create `vitest.config.ts`**

```typescript
import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/unit/**/*.test.ts"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
});
```

- [ ] **Step 2: Write the failing test**

Create `tests/unit/workspace.test.ts`:

```typescript
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
```

- [ ] **Step 3: Run the test to verify it fails**

Run: `npm run test -- tests/unit/workspace.test.ts`

Expected: FAIL — `Cannot find module '@/lib/rag/workspace'`.

- [ ] **Step 4: Implement the module**

Create `lib/rag/workspace.ts`:

```typescript
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
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `npm run test -- tests/unit/workspace.test.ts`

Expected: PASS — all 5 tests green.

- [ ] **Step 6: Commit**

```bash
git add vitest.config.ts lib/rag/workspace.ts tests/unit/workspace.test.ts
git commit -m "feat: per-user workspace helpers with path-traversal guard"
```

---

## Phase 2 — Authentication

### Task 4: Password hashing helpers

**Files:**
- Create: `lib/auth/passwords.ts`
- Create: `tests/unit/passwords.test.ts`

- [ ] **Step 1: Write the failing test**

Create `tests/unit/passwords.test.ts`:

```typescript
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
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm run test -- tests/unit/passwords.test.ts`

Expected: FAIL — `Cannot find module '@/lib/auth/passwords'`.

- [ ] **Step 3: Implement the module**

Create `lib/auth/passwords.ts`:

```typescript
import bcrypt from "bcryptjs";

const COST = 12;

export async function hashPassword(plain: string): Promise<string> {
  if (plain.length < 6) throw new Error("password too short");
  return bcrypt.hash(plain, COST);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm run test -- tests/unit/passwords.test.ts`

Expected: PASS — 2 tests green.

- [ ] **Step 5: Commit**

```bash
git add lib/auth/passwords.ts tests/unit/passwords.test.ts
git commit -m "feat: bcrypt password hashing helpers"
```

---

### Task 5: Session JWT helpers and cookie handling

**Files:**
- Create: `lib/auth/session.ts`
- Create: `tests/unit/session.test.ts`

- [ ] **Step 1: Write the failing test**

Create `tests/unit/session.test.ts`:

```typescript
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
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm run test -- tests/unit/session.test.ts`

Expected: FAIL — module not found.

- [ ] **Step 3: Implement the module**

Create `lib/auth/session.ts`:

```typescript
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
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm run test -- tests/unit/session.test.ts`

Expected: PASS — 3 tests green.

- [ ] **Step 5: Commit**

```bash
git add lib/auth/session.ts tests/unit/session.test.ts
git commit -m "feat: signed JWT session helpers"
```

---

### Task 6: User store backed by users.json

**Files:**
- Create: `lib/auth/users.ts`
- Create: `tests/unit/users.test.ts`

- [ ] **Step 1: Write the failing test**

Create `tests/unit/users.test.ts`:

```typescript
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
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm run test -- tests/unit/users.test.ts`

Expected: FAIL — module not found.

- [ ] **Step 3: Implement the module**

Create `lib/auth/users.ts`:

```typescript
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
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm run test -- tests/unit/users.test.ts`

Expected: PASS — 4 tests green.

- [ ] **Step 5: Commit**

```bash
git add lib/auth/users.ts tests/unit/users.test.ts
git commit -m "feat: JSON-backed user store with workspace provisioning"
```

---

### Task 7: Current-session helper for route handlers and server components

**Files:**
- Create: `lib/auth/current-user.ts`

- [ ] **Step 1: Create the helper**

This reads the session cookie via `next/headers` and resolves it to the stored user. Used by `/api/rag/*` routes and the gated layout.

Create `lib/auth/current-user.ts`:

```typescript
import { cookies } from "next/headers";
import { SESSION_COOKIE, verifySession, type SessionPayload } from "@/lib/auth/session";
import { findUserById, type StoredUser } from "@/lib/auth/users";

export async function getCurrentSession(): Promise<SessionPayload | null> {
  const token = cookies().get(SESSION_COOKIE)?.value ?? "";
  return verifySession(token);
}

export async function getCurrentUser(): Promise<StoredUser | null> {
  const sess = await getCurrentSession();
  if (!sess) return null;
  return findUserById(sess.userId);
}

export async function requireCurrentUser(): Promise<StoredUser> {
  const user = await getCurrentUser();
  if (!user) throw new Error("unauthorized");
  return user;
}
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add lib/auth/current-user.ts
git commit -m "feat: current-user server helper"
```

---

### Task 8: Signup route

**Files:**
- Create: `app/api/auth/signup/route.ts`

- [ ] **Step 1: Implement the route**

Create `app/api/auth/signup/route.ts`:

```typescript
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
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`

Expected: no errors.

- [ ] **Step 3: Manual smoke test**

Run `npm run dev` in one terminal. In another, run:

```bash
curl -i -X POST http://localhost:3000/api/auth/signup \
  -H 'content-type: application/json' \
  -d '{"username":"alice","password":"hunter2pw"}'
```

Expected: HTTP 201 with a `Set-Cookie: rag_session=...` header and body `{"userId":"u_...","username":"alice"}`.

Stop the dev server (Ctrl+C). Remove the created test user:

```bash
rm -rf data/
```

- [ ] **Step 4: Commit**

```bash
git add app/api/auth/signup/route.ts
git commit -m "feat: /api/auth/signup route"
```

---

### Task 9: Login route

**Files:**
- Create: `app/api/auth/login/route.ts`

- [ ] **Step 1: Implement the route**

Create `app/api/auth/login/route.ts`:

```typescript
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
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add app/api/auth/login/route.ts
git commit -m "feat: /api/auth/login route"
```

---

### Task 10: Logout and me routes

**Files:**
- Create: `app/api/auth/logout/route.ts`
- Create: `app/api/auth/me/route.ts`

- [ ] **Step 1: Implement logout**

Create `app/api/auth/logout/route.ts`:

```typescript
import { NextResponse } from "next/server";
import { SESSION_COOKIE } from "@/lib/auth/session";

export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, "", { httpOnly: true, path: "/", maxAge: 0 });
  return res;
}
```

- [ ] **Step 2: Implement /api/auth/me**

Create `app/api/auth/me/route.ts`:

```typescript
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/current-user";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ user: null }, { status: 200 });
  return NextResponse.json({ user: { id: user.id, username: user.username } });
}
```

- [ ] **Step 3: Type-check**

Run: `npx tsc --noEmit`

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add app/api/auth/logout/route.ts app/api/auth/me/route.ts
git commit -m "feat: /api/auth/logout and /api/auth/me routes"
```

---

### Task 11: Login and signup pages

**Files:**
- Create: `components/auth/LoginForm.tsx`
- Create: `components/auth/SignupForm.tsx`
- Create: `app/(auth)/login/page.tsx`
- Create: `app/(auth)/signup/page.tsx`

- [ ] **Step 1: Create the shared shell**

Create `app/(auth)/login/page.tsx`:

```tsx
import Link from "next/link";
import { LoginForm } from "@/components/auth/LoginForm";

export default function LoginPage() {
  return (
    <main className="min-h-screen grid place-items-center bg-neutral-50">
      <div className="w-full max-w-sm p-8 bg-white rounded-lg border border-neutral-200 shadow-sm">
        <h1 className="text-2xl font-semibold mb-1">Sign in</h1>
        <p className="text-sm text-neutral-600 mb-6">RAG Workspace</p>
        <LoginForm />
        <p className="mt-6 text-sm text-neutral-600">
          No account? <Link className="text-brand-600 hover:underline" href="/signup">Create one</Link>
        </p>
      </div>
    </main>
  );
}
```

- [ ] **Step 2: Create the login form component**

Create `components/auth/LoginForm.tsx`:

```tsx
"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

export function LoginForm() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "login failed");
      }
      router.replace("/");
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <label className="block">
        <span className="text-sm text-neutral-700">Username</span>
        <input
          required
          autoFocus
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="mt-1 w-full rounded border border-neutral-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
      </label>
      <label className="block">
        <span className="text-sm text-neutral-700">Password</span>
        <input
          required
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mt-1 w-full rounded border border-neutral-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
      </label>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded bg-brand-600 px-4 py-2 text-white font-medium hover:bg-brand-700 disabled:opacity-60"
      >
        {submitting ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
```

- [ ] **Step 3: Create the signup page and form**

Create `app/(auth)/signup/page.tsx`:

```tsx
import Link from "next/link";
import { SignupForm } from "@/components/auth/SignupForm";

export default function SignupPage() {
  return (
    <main className="min-h-screen grid place-items-center bg-neutral-50">
      <div className="w-full max-w-sm p-8 bg-white rounded-lg border border-neutral-200 shadow-sm">
        <h1 className="text-2xl font-semibold mb-1">Create account</h1>
        <p className="text-sm text-neutral-600 mb-6">RAG Workspace</p>
        <SignupForm />
        <p className="mt-6 text-sm text-neutral-600">
          Already have an account? <Link className="text-brand-600 hover:underline" href="/login">Sign in</Link>
        </p>
      </div>
    </main>
  );
}
```

Create `components/auth/SignupForm.tsx`:

```tsx
"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

export function SignupForm() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "signup failed");
      }
      router.replace("/");
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <label className="block">
        <span className="text-sm text-neutral-700">Username</span>
        <input
          required
          autoFocus
          minLength={2}
          maxLength={32}
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="mt-1 w-full rounded border border-neutral-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
      </label>
      <label className="block">
        <span className="text-sm text-neutral-700">Password (8+ chars)</span>
        <input
          required
          type="password"
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mt-1 w-full rounded border border-neutral-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
      </label>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded bg-brand-600 px-4 py-2 text-white font-medium hover:bg-brand-700 disabled:opacity-60"
      >
        {submitting ? "Creating…" : "Create account"}
      </button>
    </form>
  );
}
```

- [ ] **Step 4: Manual smoke test**

Run `npm run dev`. Visit `http://localhost:3000/signup`, create a user, watch the redirect to `/` (which currently 404s — next task fixes). Then `rm -rf data/` to clean up.

- [ ] **Step 5: Commit**

```bash
git add app/\(auth\) components/auth/
git commit -m "feat: login and signup pages"
```

---

### Task 12: Session-gated (app) layout

**Files:**
- Create: `app/(app)/layout.tsx`
- Create: `app/(app)/dashboard/page.tsx`
- Modify: `app/page.tsx`

> **Route note:** The `(app)` group is a route-group — it doesn't contribute a URL segment. To avoid a route conflict with `app/page.tsx` (both would resolve to `/`), the dashboard lives at `app/(app)/dashboard/page.tsx` and `app/page.tsx` redirects there.

- [ ] **Step 1: Create the gated layout**

Create `app/(app)/layout.tsx`:

```tsx
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { getCurrentUser } from "@/lib/auth/current-user";

export default async function AppLayout({ children }: { children: ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return <>{children}</>;
}
```

- [ ] **Step 2: Create the dashboard placeholder page**

Create `app/(app)/dashboard/page.tsx`:

```tsx
import { getCurrentUser } from "@/lib/auth/current-user";

export default async function DashboardPage() {
  const user = (await getCurrentUser())!;
  return (
    <main className="min-h-screen grid place-items-center text-neutral-600">
      Signed in as {user.username}. Dashboard UI coming next.
    </main>
  );
}
```

- [ ] **Step 3: Update the root redirect**

Replace `app/page.tsx` contents so the root forwards to the dashboard when signed in:

```tsx
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/current-user";

export default async function Home() {
  const user = await getCurrentUser();
  redirect(user ? "/dashboard" : "/login");
}
```

- [ ] **Step 4: Manual smoke test**

Run `npm run dev`. Visit `/dashboard` while signed out → redirect to `/login`. Sign up, then visit `/` → redirect to `/dashboard` with the signed-in message. Stop the server and `rm -rf data/`.

- [ ] **Step 5: Commit**

```bash
git add app/\(app\) app/page.tsx
git commit -m "feat: session-gated app layout and dashboard placeholder"
```

---

## Phase 3 — RAG Core

### Task 13: PDF text indexer

**Files:**
- Create: `lib/rag/indexer.ts`

- [ ] **Step 1: Implement the indexer**

The indexer reads a PDF file, extracts text per page (using `pdf-parse`), and writes an entry to the user's `index.json`.

Create `lib/rag/indexer.ts`:

```typescript
import path from "node:path";
import fs from "node:fs/promises";
import crypto from "node:crypto";
import pdfParse from "pdf-parse";
import { getWorkspaceRoot, safeJoin } from "@/lib/rag/workspace";
import type { DocumentNode } from "@/lib/rag/contract";

export type IndexedDoc = DocumentNode & {
  relativePath: string;              // relative to pdfs/
  pagesText: string[];               // one string per page
};

export type WorkspaceIndex = Record<string, IndexedDoc>;

async function loadIndex(userId: string): Promise<WorkspaceIndex> {
  const p = path.join(getWorkspaceRoot(userId), "index.json");
  const raw = await fs.readFile(p, "utf8");
  return JSON.parse(raw) as WorkspaceIndex;
}

async function saveIndex(userId: string, idx: WorkspaceIndex): Promise<void> {
  const p = path.join(getWorkspaceRoot(userId), "index.json");
  await fs.writeFile(p, JSON.stringify(idx, null, 2));
}

function splitPages(fullText: string, pageCount: number): string[] {
  // pdf-parse separates pages with \f (form feed). Fall back to even-ish chunks.
  const byFF = fullText.split(/\f/);
  if (byFF.length === pageCount) return byFF.map((s) => s.trim());
  const chunkSize = Math.ceil(fullText.length / Math.max(1, pageCount));
  const out: string[] = [];
  for (let i = 0; i < pageCount; i++) {
    out.push(fullText.slice(i * chunkSize, (i + 1) * chunkSize).trim());
  }
  return out;
}

export async function indexUploadedPdf(args: {
  userId: string;
  folder: string;
  docName: string;
  buffer: Buffer;
}): Promise<IndexedDoc> {
  const { userId, folder, docName, buffer } = args;
  if (!/^[A-Za-z0-9 _.-]+$/.test(folder)) throw new Error("invalid folder name");
  if (!/^[A-Za-z0-9 _.()-]+\.pdf$/i.test(docName)) throw new Error("invalid file name");

  const parsed = await pdfParse(buffer);
  const pages = splitPages(parsed.text ?? "", parsed.numpages || 1);

  const folderDir = safeJoin(userId, "pdfs", folder);
  await fs.mkdir(folderDir, { recursive: true });
  const fullPath = safeJoin(userId, "pdfs", folder, docName);
  await fs.writeFile(fullPath, buffer);

  const docId = "d_" + crypto.randomBytes(8).toString("hex");
  const doc: IndexedDoc = {
    docId,
    docName,
    folder,
    pages: parsed.numpages || pages.length,
    sizeBytes: buffer.byteLength,
    uploadedAt: new Date().toISOString(),
    relativePath: path.posix.join(folder, docName),
    pagesText: pages,
  };

  const idx = await loadIndex(userId);
  idx[docId] = doc;
  await saveIndex(userId, idx);

  return doc;
}

export async function getIndex(userId: string): Promise<WorkspaceIndex> {
  return loadIndex(userId);
}

export async function removeDoc(userId: string, docId: string): Promise<void> {
  const idx = await loadIndex(userId);
  const doc = idx[docId];
  if (!doc) return;
  const filePath = safeJoin(userId, "pdfs", doc.folder, doc.docName);
  await fs.rm(filePath, { force: true });
  delete idx[docId];
  await saveIndex(userId, idx);
}
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add lib/rag/indexer.ts
git commit -m "feat: PDF text indexer with per-page extraction"
```

---

### Task 14: Mock search with tests

**Files:**
- Create: `lib/rag/mock-search.ts`
- Create: `tests/unit/mock-search.test.ts`

- [ ] **Step 1: Write the failing test**

Create `tests/unit/mock-search.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { searchIndex } from "@/lib/rag/mock-search";
import type { WorkspaceIndex } from "@/lib/rag/indexer";

const INDEX: WorkspaceIndex = {
  d_1: {
    docId: "d_1",
    docName: "Ford_Manual.pdf",
    folder: "Ford",
    pages: 2,
    sizeBytes: 100,
    uploadedAt: "2026-04-16T00:00:00Z",
    relativePath: "Ford/Ford_Manual.pdf",
    pagesText: [
      "Chapter 1. Each technician has an hourly rate. Flat rate technicians are paid per booked hour.",
      "Unapplied labor is the amount of time you are paying for but not collecting from a customer.",
    ],
  },
  d_2: {
    docId: "d_2",
    docName: "GMC_Guide.pdf",
    folder: "GMC",
    pages: 1,
    sizeBytes: 100,
    uploadedAt: "2026-04-16T00:00:00Z",
    relativePath: "GMC/GMC_Guide.pdf",
    pagesText: [
      "This guide covers warranty rates and retention policies for GMC dealerships.",
    ],
  },
};

describe("mock-search", () => {
  it("returns quotes that contain all query terms", () => {
    const quotes = searchIndex(INDEX, "unapplied labor");
    expect(quotes.length).toBeGreaterThan(0);
    const top = quotes[0];
    expect(top.docId).toBe("d_1");
    expect(top.page).toBe(2);
    expect(top.text.toLowerCase()).toContain("unapplied");
  });

  it("includes contextBefore and contextAfter around the match", () => {
    const quotes = searchIndex(INDEX, "unapplied labor");
    expect(quotes[0].contextBefore).toBeDefined();
    expect(quotes[0].contextAfter).toBeDefined();
    expect(quotes[0].text.length).toBeLessThanOrEqual(500);
  });

  it("filters by scope.folders", () => {
    const ford = searchIndex(INDEX, "technician", { folders: ["Ford"] });
    expect(ford.every((q) => q.folder === "Ford")).toBe(true);

    const gmc = searchIndex(INDEX, "technician", { folders: ["GMC"] });
    expect(gmc.length).toBe(0);
  });

  it("filters by scope.docIds", () => {
    const quotes = searchIndex(INDEX, "rate", { docIds: ["d_2"] });
    expect(quotes.every((q) => q.docId === "d_2")).toBe(true);
  });

  it("returns quotes ranked by score descending", () => {
    const quotes = searchIndex(INDEX, "technician rate hourly");
    for (let i = 1; i < quotes.length; i++) {
      expect(quotes[i - 1].score).toBeGreaterThanOrEqual(quotes[i].score);
    }
  });

  it("returns an empty list when nothing matches", () => {
    expect(searchIndex(INDEX, "xylophone xyz12345")).toEqual([]);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm run test -- tests/unit/mock-search.test.ts`

Expected: FAIL — module not found.

- [ ] **Step 3: Implement the module**

Create `lib/rag/mock-search.ts`:

```typescript
import crypto from "node:crypto";
import type { Quote, Scope } from "@/lib/rag/contract";
import type { WorkspaceIndex, IndexedDoc } from "@/lib/rag/indexer";

const CONTEXT_CHARS = 200;

function tokenize(q: string): string[] {
  return q
    .toLowerCase()
    .split(/[^a-z0-9']+/g)
    .filter((t) => t.length >= 2);
}

function scoreSentence(sentence: string, terms: string[]): number {
  const hay = sentence.toLowerCase();
  let hits = 0;
  for (const t of terms) {
    if (hay.includes(t)) hits++;
  }
  if (hits === 0) return 0;
  // Reward coverage; normalize by sqrt of sentence length to avoid long sentences dominating.
  return hits / terms.length + 1 / Math.sqrt(Math.max(sentence.length, 50));
}

function splitSentences(pageText: string): string[] {
  return pageText
    .replace(/\s+/g, " ")
    .split(/(?<=[.!?])\s+(?=[A-Z])/g)
    .map((s) => s.trim())
    .filter(Boolean);
}

function inScope(doc: IndexedDoc, scope?: Scope): boolean {
  if (!scope) return true;
  if (scope.docIds && scope.docIds.length > 0 && !scope.docIds.includes(doc.docId)) return false;
  if (scope.folders && scope.folders.length > 0 && !scope.folders.includes(doc.folder)) return false;
  return true;
}

export function searchIndex(index: WorkspaceIndex, query: string, scope?: Scope): Quote[] {
  const terms = tokenize(query);
  if (terms.length === 0) return [];

  const quotes: Quote[] = [];
  for (const doc of Object.values(index)) {
    if (!inScope(doc, scope)) continue;
    doc.pagesText.forEach((pageText, pageIdx) => {
      const sentences = splitSentences(pageText);
      let cursor = 0;
      for (const s of sentences) {
        const score = scoreSentence(s, terms);
        if (score > 0) {
          const start = pageText.indexOf(s, cursor);
          const from = Math.max(0, start - CONTEXT_CHARS);
          const to = Math.min(pageText.length, start + s.length + CONTEXT_CHARS);
          quotes.push({
            id: "q_" + crypto.randomBytes(6).toString("hex"),
            text: s,
            docId: doc.docId,
            docName: doc.docName,
            folder: doc.folder,
            page: pageIdx + 1,
            contextBefore: pageText.slice(from, start),
            contextAfter: pageText.slice(start + s.length, to),
            score,
          });
        }
        cursor = Math.max(cursor, pageText.indexOf(s, cursor) + s.length);
      }
    });
  }

  quotes.sort((a, b) => b.score - a.score);
  return quotes.slice(0, 20);
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm run test -- tests/unit/mock-search.test.ts`

Expected: PASS — 6 tests green.

- [ ] **Step 5: Commit**

```bash
git add lib/rag/mock-search.ts tests/unit/mock-search.test.ts
git commit -m "feat: in-process mock search over the workspace index"
```

---

### Task 15: Session store

**Files:**
- Create: `lib/rag/sessions.ts`

- [ ] **Step 1: Implement the store**

Create `lib/rag/sessions.ts`:

```typescript
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
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add lib/rag/sessions.ts
git commit -m "feat: per-user session store"
```

---

### Task 16: /api/rag/documents route

**Files:**
- Create: `app/api/rag/documents/route.ts`

- [ ] **Step 1: Implement**

Create `app/api/rag/documents/route.ts`:

```typescript
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getIndex } from "@/lib/rag/indexer";
import type { DocumentNode, KnowledgeBaseTree } from "@/lib/rag/contract";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const idx = await getIndex(user.id);
  const byFolder = new Map<string, DocumentNode[]>();
  for (const d of Object.values(idx)) {
    const node: DocumentNode = {
      docId: d.docId,
      docName: d.docName,
      folder: d.folder,
      pages: d.pages,
      sizeBytes: d.sizeBytes,
      uploadedAt: d.uploadedAt,
    };
    const arr = byFolder.get(d.folder) ?? [];
    arr.push(node);
    byFolder.set(d.folder, arr);
  }
  const tree: KnowledgeBaseTree = {
    folders: Array.from(byFolder.entries())
      .map(([name, documents]) => ({
        name,
        documents: documents.sort((a, b) => a.docName.localeCompare(b.docName)),
      }))
      .sort((a, b) => a.name.localeCompare(b.name)),
  };
  return NextResponse.json(tree);
}
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add app/api/rag/documents/route.ts
git commit -m "feat: /api/rag/documents returns the KB tree"
```

---

### Task 17: /api/rag/upload route

**Files:**
- Create: `app/api/rag/upload/route.ts`

- [ ] **Step 1: Implement**

Create `app/api/rag/upload/route.ts`:

```typescript
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/current-user";
import { indexUploadedPdf } from "@/lib/rag/indexer";

const MAX_BYTES = 50 * 1024 * 1024; // 50 MB

function isPdf(buf: Buffer): boolean {
  return buf.length >= 5 && buf.subarray(0, 5).toString("ascii") === "%PDF-";
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const form = await req.formData();
  const folder = String(form.get("folder") ?? "").trim();
  const file = form.get("file");

  if (!folder) return NextResponse.json({ error: "folder is required" }, { status: 400 });
  if (!(file instanceof File)) return NextResponse.json({ error: "file is required" }, { status: 400 });

  const arrayBuf = await file.arrayBuffer();
  if (arrayBuf.byteLength > MAX_BYTES) {
    return NextResponse.json({ error: "file too large" }, { status: 413 });
  }
  const buffer = Buffer.from(arrayBuf);
  if (!isPdf(buffer)) {
    return NextResponse.json({ error: "only PDF files are accepted" }, { status: 415 });
  }

  try {
    const doc = await indexUploadedPdf({
      userId: user.id,
      folder,
      docName: file.name,
      buffer,
    });
    return NextResponse.json({
      docId: doc.docId,
      docName: doc.docName,
      folder: doc.folder,
      pages: doc.pages,
      sizeBytes: doc.sizeBytes,
      uploadedAt: doc.uploadedAt,
    }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "upload failed" }, { status: 400 });
  }
}
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add app/api/rag/upload/route.ts
git commit -m "feat: /api/rag/upload accepts PDFs and indexes them"
```

---

### Task 18: /api/rag/search route

**Files:**
- Create: `app/api/rag/search/route.ts`

- [ ] **Step 1: Implement**

Create `app/api/rag/search/route.ts`:

```typescript
import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getIndex } from "@/lib/rag/indexer";
import { searchIndex } from "@/lib/rag/mock-search";
import { appendSession } from "@/lib/rag/sessions";
import type { SearchResponse } from "@/lib/rag/contract";

const Body = z.object({
  query: z.string().min(1).max(500),
  scope: z
    .object({
      folders: z.array(z.string()).optional(),
      docIds: z.array(z.string()).optional(),
    })
    .optional(),
});

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid JSON" }, { status: 400 });
  }
  const parsed = Body.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "invalid input" }, { status: 400 });

  const backend = process.env.RAG_BACKEND_URL;
  if (backend) {
    const upstream = await fetch(`${backend.replace(/\/$/, "")}/search`, {
      method: "POST",
      headers: { "content-type": "application/json", "x-user-id": user.id },
      body: JSON.stringify(parsed.data),
    });
    if (!upstream.ok) {
      return NextResponse.json({ error: "upstream error" }, { status: 502 });
    }
    const data = (await upstream.json()) as SearchResponse;
    return NextResponse.json(data);
  }

  const idx = await getIndex(user.id);
  const quotes = searchIndex(idx, parsed.data.query, parsed.data.scope);
  const session = await appendSession({
    userId: user.id,
    query: parsed.data.query,
    scope: parsed.data.scope,
    quotes,
  });
  const res: SearchResponse = { sessionId: session.id, quotes };
  return NextResponse.json(res);
}
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add app/api/rag/search/route.ts
git commit -m "feat: /api/rag/search with mock retrieval and backend proxy"
```

---

### Task 19: /api/rag/sessions list, detail, delete

**Files:**
- Create: `app/api/rag/sessions/route.ts`
- Create: `app/api/rag/sessions/[id]/route.ts`

- [ ] **Step 1: Implement list route**

Create `app/api/rag/sessions/route.ts`:

```typescript
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/current-user";
import { listSessions } from "@/lib/rag/sessions";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  return NextResponse.json({ sessions: await listSessions(user.id) });
}
```

- [ ] **Step 2: Implement detail + delete route**

Create `app/api/rag/sessions/[id]/route.ts`:

```typescript
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getSession, deleteSession } from "@/lib/rag/sessions";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const session = await getSession(user.id, params.id);
  if (!session) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json(session);
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const removed = await deleteSession(user.id, params.id);
  if (!removed) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 3: Type-check**

Run: `npx tsc --noEmit`

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add app/api/rag/sessions/
git commit -m "feat: session list, detail, delete endpoints"
```

---

### Task 20: /api/rag/pdf/[docId] route (serve bytes)

**Files:**
- Create: `app/api/rag/pdf/[docId]/route.ts`

- [ ] **Step 1: Implement**

Create `app/api/rag/pdf/[docId]/route.ts`:

```typescript
import { NextResponse } from "next/server";
import fs from "node:fs/promises";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getIndex } from "@/lib/rag/indexer";
import { safeJoin } from "@/lib/rag/workspace";

export async function GET(_req: Request, { params }: { params: { docId: string } }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const idx = await getIndex(user.id);
  const doc = idx[params.docId];
  if (!doc) return NextResponse.json({ error: "not found" }, { status: 404 });

  const filePath = safeJoin(user.id, "pdfs", doc.folder, doc.docName);
  const bytes = await fs.readFile(filePath);
  return new NextResponse(bytes, {
    status: 200,
    headers: {
      "content-type": "application/pdf",
      "content-length": String(bytes.byteLength),
      "cache-control": "private, max-age=60",
    },
  });
}
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add app/api/rag/pdf/\[docId\]/route.ts
git commit -m "feat: /api/rag/pdf/[docId] serves user PDFs"
```

---

### Task 21: /api/rag/pdf/[docId]/context route

**Files:**
- Create: `app/api/rag/pdf/[docId]/context/route.ts`

- [ ] **Step 1: Implement**

Create `app/api/rag/pdf/[docId]/context/route.ts`:

```typescript
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getIndex } from "@/lib/rag/indexer";

export async function GET(req: Request, { params }: { params: { docId: string } }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const page = Number(url.searchParams.get("page") ?? "1");
  if (!Number.isFinite(page) || page < 1) {
    return NextResponse.json({ error: "invalid page" }, { status: 400 });
  }

  const idx = await getIndex(user.id);
  const doc = idx[params.docId];
  if (!doc) return NextResponse.json({ error: "not found" }, { status: 404 });
  const text = doc.pagesText[page - 1] ?? "";
  return NextResponse.json({ docId: doc.docId, page, text });
}
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add app/api/rag/pdf/\[docId\]/context/
git commit -m "feat: /api/rag/pdf/[docId]/context returns page text"
```

---

## Phase 4 — Dashboard UI

### Task 22: React Query provider

**Files:**
- Create: `components/providers/QueryProvider.tsx`
- Modify: `app/(app)/layout.tsx`

- [ ] **Step 1: Create the provider**

Create `components/providers/QueryProvider.tsx`:

```tsx
"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";

export function QueryProvider({ children }: { children: ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { staleTime: 5_000, refetchOnWindowFocus: false },
        },
      })
  );
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
```

- [ ] **Step 2: Wrap the gated layout**

Replace `app/(app)/layout.tsx` with:

```tsx
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { getCurrentUser } from "@/lib/auth/current-user";
import { QueryProvider } from "@/components/providers/QueryProvider";

export default async function AppLayout({ children }: { children: ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return <QueryProvider>{children}</QueryProvider>;
}
```

- [ ] **Step 3: Commit**

```bash
git add components/providers/QueryProvider.tsx app/\(app\)/layout.tsx
git commit -m "feat: React Query provider in gated layout"
```

---

### Task 23: AppShell three-column grid

**Files:**
- Create: `components/layout/AppShell.tsx`

- [ ] **Step 1: Create the shell**

Create `components/layout/AppShell.tsx`:

```tsx
import type { ReactNode } from "react";

export function AppShell(props: {
  sidebar: ReactNode;
  results: ReactNode;
  pdf: ReactNode;
}) {
  return (
    <div className="h-screen grid" style={{ gridTemplateColumns: "260px 1fr 1fr" }}>
      <aside className="border-r border-neutral-200 bg-neutral-50 overflow-y-auto">
        {props.sidebar}
      </aside>
      <section className="overflow-y-auto border-r border-neutral-200">
        {props.results}
      </section>
      <section className="overflow-hidden bg-neutral-100">
        {props.pdf}
      </section>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/layout/AppShell.tsx
git commit -m "feat: AppShell three-column layout"
```

---

### Task 24: Dashboard client shell state

**Files:**
- Create: `components/dashboard/DashboardShell.tsx`
- Create: `lib/rag/client.ts`

- [ ] **Step 1: Create the client fetch helpers**

Create `lib/rag/client.ts`:

```typescript
import type {
  KnowledgeBaseTree,
  Quote,
  SearchRequest,
  SearchResponse,
  Session,
  SessionSummary,
} from "@/lib/rag/contract";

async function jsonOrThrow<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const msg = await res.text().catch(() => res.statusText);
    throw new Error(msg || `HTTP ${res.status}`);
  }
  return (await res.json()) as T;
}

export async function fetchDocuments(): Promise<KnowledgeBaseTree> {
  return jsonOrThrow(await fetch("/api/rag/documents"));
}

export async function fetchSessions(): Promise<{ sessions: SessionSummary[] }> {
  return jsonOrThrow(await fetch("/api/rag/sessions"));
}

export async function fetchSession(id: string): Promise<Session> {
  return jsonOrThrow(await fetch(`/api/rag/sessions/${id}`));
}

export async function deleteSession(id: string): Promise<void> {
  const res = await fetch(`/api/rag/sessions/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
}

export async function runSearch(body: SearchRequest): Promise<SearchResponse> {
  return jsonOrThrow(
    await fetch("/api/rag/search", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    })
  );
}

export async function uploadPdf(folder: string, file: File): Promise<void> {
  const form = new FormData();
  form.set("folder", folder);
  form.set("file", file);
  const res = await fetch("/api/rag/upload", { method: "POST", body: form });
  if (!res.ok) throw new Error(await res.text());
}

export function pdfUrl(docId: string): string {
  return `/api/rag/pdf/${encodeURIComponent(docId)}`;
}

export type SelectedQuote = { quote: Quote } | null;
```

- [ ] **Step 2: Create the dashboard shell**

Create `components/dashboard/DashboardShell.tsx`:

```tsx
"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { Sidebar } from "@/components/sidebar/Sidebar";
import { ResultsPane } from "@/components/results/ResultsPane";
import { PdfPane } from "@/components/pdf/PdfPane";
import type { Quote, Scope, Session } from "@/lib/rag/contract";

export function DashboardShell(props: {
  initialSession?: Session | null;
  username: string;
}) {
  const router = useRouter();
  const [quotes, setQuotes] = useState<Quote[]>(props.initialSession?.quotes ?? []);
  const [query, setQuery] = useState<string>(props.initialSession?.query ?? "");
  const [scope, setScope] = useState<Scope>(props.initialSession?.scope ?? {});
  const [selectedQuoteId, setSelectedQuoteId] = useState<string | null>(
    props.initialSession?.quotes?.[0]?.id ?? null
  );

  const selectedQuote = useMemo(
    () => quotes.find((q) => q.id === selectedQuoteId) ?? null,
    [quotes, selectedQuoteId]
  );

  function onSearchComplete(sessionId: string, newQuotes: Quote[]) {
    setQuotes(newQuotes);
    setSelectedQuoteId(newQuotes[0]?.id ?? null);
    router.push(`/s/${sessionId}`);
  }

  return (
    <AppShell
      sidebar={
        <Sidebar
          username={props.username}
          scope={scope}
          setScope={setScope}
        />
      }
      results={
        <ResultsPane
          query={query}
          setQuery={setQuery}
          scope={scope}
          quotes={quotes}
          selectedQuoteId={selectedQuoteId}
          onSelectQuote={setSelectedQuoteId}
          onSearchComplete={onSearchComplete}
        />
      }
      pdf={<PdfPane quote={selectedQuote} />}
    />
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add lib/rag/client.ts components/dashboard/DashboardShell.tsx
git commit -m "feat: dashboard shell and API client helpers"
```

---

### Task 25: Sidebar — user menu, new search, session list

**Files:**
- Create: `components/sidebar/Sidebar.tsx`
- Create: `components/sidebar/UserMenu.tsx`
- Create: `components/sidebar/SessionList.tsx`

- [ ] **Step 1: Create UserMenu**

Create `components/sidebar/UserMenu.tsx`:

```tsx
"use client";

import { useRouter } from "next/navigation";

export function UserMenu({ username }: { username: string }) {
  const router = useRouter();
  async function onLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/login");
    router.refresh();
  }
  return (
    <div className="flex items-center justify-between px-3 py-2 border-b border-neutral-200">
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-full bg-brand-500 text-white grid place-items-center text-xs font-semibold">
          {username.slice(0, 1).toUpperCase()}
        </div>
        <span className="text-sm font-medium">{username}</span>
      </div>
      <button onClick={onLogout} className="text-xs text-neutral-500 hover:text-neutral-800">
        Log out
      </button>
    </div>
  );
}
```

- [ ] **Step 2: Create SessionList**

Create `components/sidebar/SessionList.tsx`:

```tsx
"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { usePathname } from "next/navigation";
import { fetchSessions } from "@/lib/rag/client";

export function SessionList() {
  const { data } = useQuery({
    queryKey: ["sessions"],
    queryFn: fetchSessions,
  });
  const pathname = usePathname();

  return (
    <div className="px-3 py-2">
      <div className="text-xs uppercase tracking-wider text-neutral-500 mb-1">Sessions</div>
      {data?.sessions.length === 0 && (
        <p className="text-xs text-neutral-400 px-2 py-1">No searches yet.</p>
      )}
      <ul className="space-y-0.5">
        {data?.sessions.map((s) => {
          const active = pathname === `/s/${s.id}`;
          return (
            <li key={s.id}>
              <Link
                href={`/s/${s.id}`}
                className={`block truncate rounded px-2 py-1 text-sm ${
                  active ? "bg-brand-50 text-brand-700" : "hover:bg-neutral-100"
                }`}
                title={s.query}
              >
                {s.query}
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
```

- [ ] **Step 3: Create Sidebar shell**

Create `components/sidebar/Sidebar.tsx`:

```tsx
"use client";

import Link from "next/link";
import type { Scope } from "@/lib/rag/contract";
import { UserMenu } from "./UserMenu";
import { SessionList } from "./SessionList";
import { KnowledgeBaseTree } from "./KnowledgeBaseTree";

export function Sidebar(props: {
  username: string;
  scope: Scope;
  setScope: (s: Scope) => void;
}) {
  return (
    <div className="flex flex-col h-full">
      <UserMenu username={props.username} />
      <div className="px-3 py-2">
        <Link
          href="/dashboard"
          className="block w-full rounded bg-brand-600 text-white px-3 py-2 text-center text-sm font-medium hover:bg-brand-700"
        >
          + New search
        </Link>
      </div>
      <div className="flex-1 overflow-y-auto">
        <SessionList />
        <KnowledgeBaseTree scope={props.scope} setScope={props.setScope} />
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add components/sidebar/
git commit -m "feat: sidebar with user menu, new-search, session list"
```

---

### Task 26: Knowledge base tree with scope checkboxes and upload

**Files:**
- Create: `components/sidebar/KnowledgeBaseTree.tsx`
- Create: `components/sidebar/UploadButton.tsx`

- [ ] **Step 1: Create UploadButton**

Create `components/sidebar/UploadButton.tsx`:

```tsx
"use client";

import { useState, type ChangeEvent } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { uploadPdf } from "@/lib/rag/client";

export function UploadButton({ folder }: { folder: string }) {
  const qc = useQueryClient();
  const [uploading, setUploading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function onChange(e: ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploading(true);
    setErr(null);
    try {
      for (const f of Array.from(files)) {
        await uploadPdf(folder, f);
      }
      await qc.invalidateQueries({ queryKey: ["documents"] });
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  return (
    <label className="inline-flex items-center text-xs text-brand-600 hover:underline cursor-pointer">
      <input
        type="file"
        accept="application/pdf"
        multiple
        hidden
        onChange={onChange}
        disabled={uploading}
      />
      {uploading ? "Uploading…" : "+ Upload PDF"}
      {err && <span className="ml-2 text-red-600">{err}</span>}
    </label>
  );
}
```

- [ ] **Step 2: Create KnowledgeBaseTree**

Create `components/sidebar/KnowledgeBaseTree.tsx`:

```tsx
"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { Scope } from "@/lib/rag/contract";
import { fetchDocuments } from "@/lib/rag/client";
import { UploadButton } from "./UploadButton";

export function KnowledgeBaseTree(props: {
  scope: Scope;
  setScope: (s: Scope) => void;
}) {
  const { data } = useQuery({ queryKey: ["documents"], queryFn: fetchDocuments });
  const [newFolder, setNewFolder] = useState("");

  function toggleFolder(name: string) {
    const set = new Set(props.scope.folders ?? []);
    if (set.has(name)) set.delete(name);
    else set.add(name);
    props.setScope({ ...props.scope, folders: Array.from(set) });
  }

  return (
    <div className="px-3 py-2 border-t border-neutral-200 mt-2">
      <div className="flex items-center justify-between mb-1">
        <div className="text-xs uppercase tracking-wider text-neutral-500">Knowledge Base</div>
      </div>
      {(!data || data.folders.length === 0) && (
        <p className="text-xs text-neutral-400 px-1 py-1">No documents yet.</p>
      )}
      <ul className="space-y-1">
        {data?.folders.map((f) => {
          const checked = (props.scope.folders ?? []).includes(f.name);
          return (
            <li key={f.name}>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggleFolder(f.name)}
                />
                <span className="font-medium">{f.name}</span>
                <span className="text-xs text-neutral-400">({f.documents.length})</span>
              </label>
              <ul className="pl-6 text-xs text-neutral-600">
                {f.documents.map((d) => (
                  <li key={d.docId} className="truncate py-0.5" title={d.docName}>
                    {d.docName}
                  </li>
                ))}
              </ul>
              <div className="pl-6">
                <UploadButton folder={f.name} />
              </div>
            </li>
          );
        })}
      </ul>
      <div className="mt-3 flex gap-2 items-center">
        <input
          className="text-xs border border-neutral-300 rounded px-2 py-1 w-28"
          placeholder="New folder"
          value={newFolder}
          onChange={(e) => setNewFolder(e.target.value)}
        />
        {newFolder.trim() && <UploadButton folder={newFolder.trim()} />}
      </div>
      {(props.scope.folders?.length ?? 0) > 0 && (
        <button
          onClick={() => props.setScope({})}
          className="mt-2 text-xs text-neutral-500 hover:text-neutral-800"
        >
          Clear scope
        </button>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add components/sidebar/KnowledgeBaseTree.tsx components/sidebar/UploadButton.tsx
git commit -m "feat: KB tree with scope checkboxes and per-folder upload"
```

---

### Task 27: Results pane — query bar, quote list, quote card

**Files:**
- Create: `components/results/ResultsPane.tsx`
- Create: `components/results/QueryBar.tsx`
- Create: `components/results/QuoteCard.tsx`

- [ ] **Step 1: Create QueryBar**

Create `components/results/QueryBar.tsx`:

```tsx
"use client";

import { useState, type FormEvent } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { runSearch } from "@/lib/rag/client";
import type { Quote, Scope } from "@/lib/rag/contract";

export function QueryBar(props: {
  query: string;
  setQuery: (q: string) => void;
  scope: Scope;
  onSearchComplete: (sessionId: string, quotes: Quote[]) => void;
}) {
  const qc = useQueryClient();
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setErr(null);
    setSubmitting(true);
    try {
      const res = await runSearch({ query: props.query, scope: props.scope });
      props.onSearchComplete(res.sessionId, res.quotes);
      await qc.invalidateQueries({ queryKey: ["sessions"] });
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setSubmitting(false);
    }
  }

  const scopeLabel =
    (props.scope.folders?.length ?? 0) > 0
      ? `scoped to: ${props.scope.folders!.join(", ")}`
      : "searching all documents";

  return (
    <form onSubmit={onSubmit} className="p-4 border-b border-neutral-200 bg-white sticky top-0">
      <div className="flex gap-2">
        <input
          value={props.query}
          onChange={(e) => props.setQuery(e.target.value)}
          placeholder="Ask a question about your knowledge base…"
          className="flex-1 rounded border border-neutral-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
        <button
          type="submit"
          disabled={submitting || !props.query.trim()}
          className="rounded bg-brand-600 text-white px-4 py-2 font-medium hover:bg-brand-700 disabled:opacity-60"
        >
          {submitting ? "Searching…" : "Search"}
        </button>
      </div>
      <div className="mt-2 flex items-center justify-between text-xs text-neutral-500">
        <span>{scopeLabel}</span>
        {err && <span className="text-red-600">{err}</span>}
      </div>
    </form>
  );
}
```

- [ ] **Step 2: Create QuoteCard**

Create `components/results/QuoteCard.tsx`:

```tsx
"use client";

import type { Quote } from "@/lib/rag/contract";

export function QuoteCard(props: {
  quote: Quote;
  selected: boolean;
  onClick: () => void;
}) {
  const q = props.quote;
  return (
    <button
      onClick={props.onClick}
      className={`block w-full text-left rounded border p-3 transition ${
        props.selected
          ? "border-brand-500 bg-brand-50"
          : "border-neutral-200 hover:border-neutral-300 bg-white"
      }`}
    >
      <div className="text-sm leading-relaxed">
        <span className="text-neutral-500">…{q.contextBefore.slice(-80)}</span>
        <mark className="bg-yellow-200 px-0.5 rounded">{q.text}</mark>
        <span className="text-neutral-500">{q.contextAfter.slice(0, 80)}…</span>
      </div>
      <div className="mt-2 text-xs text-neutral-500 flex items-center gap-2">
        <span className="font-medium">{q.docName}</span>
        <span>· page {q.page}</span>
        <span>· {q.folder}</span>
        <span className="ml-auto text-neutral-400">score {q.score.toFixed(2)}</span>
      </div>
    </button>
  );
}
```

- [ ] **Step 3: Create ResultsPane**

Create `components/results/ResultsPane.tsx`:

```tsx
"use client";

import type { Quote, Scope } from "@/lib/rag/contract";
import { QueryBar } from "./QueryBar";
import { QuoteCard } from "./QuoteCard";

export function ResultsPane(props: {
  query: string;
  setQuery: (q: string) => void;
  scope: Scope;
  quotes: Quote[];
  selectedQuoteId: string | null;
  onSelectQuote: (id: string) => void;
  onSearchComplete: (sessionId: string, quotes: Quote[]) => void;
}) {
  return (
    <div className="h-full flex flex-col">
      <QueryBar
        query={props.query}
        setQuery={props.setQuery}
        scope={props.scope}
        onSearchComplete={props.onSearchComplete}
      />
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {props.quotes.length === 0 ? (
          <p className="text-sm text-neutral-500">No results. Try a search above.</p>
        ) : (
          <>
            <div className="text-xs text-brand-600 font-medium">
              {props.quotes.length} quotes found
            </div>
            {props.quotes.map((q) => (
              <QuoteCard
                key={q.id}
                quote={q}
                selected={props.selectedQuoteId === q.id}
                onClick={() => props.onSelectQuote(q.id)}
              />
            ))}
          </>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add components/results/
git commit -m "feat: results pane with query bar, quote list, quote card"
```

---

### Task 28: PDF pane with react-pdf

**Files:**
- Create: `components/pdf/PdfPane.tsx`
- Create: `components/pdf/PdfSetup.ts`

- [ ] **Step 1: Configure react-pdf worker**

Create `components/pdf/PdfSetup.ts`:

```typescript
"use client";

import { pdfjs } from "react-pdf";

// Uses the CDN worker; react-pdf ships with a matching worker URL helper.
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.mjs`;
```

- [ ] **Step 2: Create PdfPane**

Create `components/pdf/PdfPane.tsx`:

```tsx
"use client";

import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
import "./PdfSetup";

import { useEffect, useRef, useState } from "react";
import { Document, Page } from "react-pdf";
import type { Quote } from "@/lib/rag/contract";
import { pdfUrl } from "@/lib/rag/client";

export function PdfPane({ quote }: { quote: Quote | null }) {
  const [numPages, setNumPages] = useState<number>(0);
  const [zoom, setZoom] = useState(1.0);
  const pageRefs = useRef<Record<number, HTMLDivElement | null>>({});

  useEffect(() => {
    if (!quote) return;
    const el = pageRefs.current[quote.page];
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [quote?.id, quote?.page, numPages]);

  if (!quote) {
    return (
      <div className="h-full grid place-items-center text-neutral-500 text-sm">
        Select a quote to view its source PDF.
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between px-3 py-2 bg-white border-b border-neutral-200 text-sm">
        <div className="truncate">
          <span className="font-medium">{quote.docName}</span>
          <span className="text-neutral-500"> · page {quote.page}</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setZoom((z) => Math.max(0.5, z - 0.1))}
            className="px-2 py-0.5 border border-neutral-300 rounded"
            aria-label="Zoom out"
          >−</button>
          <span className="text-xs w-10 text-center">{Math.round(zoom * 100)}%</span>
          <button
            onClick={() => setZoom((z) => Math.min(2.5, z + 0.1))}
            className="px-2 py-0.5 border border-neutral-300 rounded"
            aria-label="Zoom in"
          >+</button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto px-4 py-4 bg-neutral-100">
        <Document
          file={pdfUrl(quote.docId)}
          onLoadSuccess={({ numPages }) => setNumPages(numPages)}
          loading={<div className="text-sm text-neutral-500">Loading PDF…</div>}
          error={<div className="text-sm text-red-600">Failed to load PDF.</div>}
        >
          {Array.from({ length: numPages }, (_, i) => i + 1).map((p) => (
            <div
              key={p}
              ref={(el) => { pageRefs.current[p] = el; }}
              className="mb-4 bg-white shadow-sm mx-auto w-fit"
              data-page={p}
            >
              {p === quote.page && (
                <div className="bg-yellow-100 border-l-4 border-yellow-400 text-xs text-yellow-800 px-2 py-1">
                  Matched passage on this page
                </div>
              )}
              <Page pageNumber={p} scale={zoom} />
            </div>
          ))}
        </Document>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add components/pdf/
git commit -m "feat: PDF pane with react-pdf, zoom, page scroll, match banner"
```

---

### Task 29: Wire dashboard pages

**Files:**
- Modify: `app/(app)/dashboard/page.tsx`
- Create: `app/(app)/s/[sessionId]/page.tsx`

- [ ] **Step 1: Replace the placeholder dashboard page**

Replace `app/(app)/dashboard/page.tsx`:

```tsx
import { getCurrentUser } from "@/lib/auth/current-user";
import { DashboardShell } from "@/components/dashboard/DashboardShell";

export default async function DashboardPage() {
  const user = (await getCurrentUser())!;
  return <DashboardShell username={user.username} />;
}
```

- [ ] **Step 2: Create the session-detail page**

Create `app/(app)/s/[sessionId]/page.tsx`:

```tsx
import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getSession } from "@/lib/rag/sessions";
import { DashboardShell } from "@/components/dashboard/DashboardShell";

export default async function SessionPage({ params }: { params: { sessionId: string } }) {
  const user = (await getCurrentUser())!;
  const session = await getSession(user.id, params.sessionId);
  if (!session) notFound();
  return <DashboardShell username={user.username} initialSession={session} />;
}
```

- [ ] **Step 3: Manual smoke test**

Run `npm run dev`. Sign up, visit `/dashboard`, upload a small PDF, run a search. Expected: quotes appear, clicking a quote scrolls the PDF pane. Visit a session URL directly → same state restored. Stop the server.

- [ ] **Step 4: Commit**

```bash
git add app/\(app\)/dashboard/page.tsx app/\(app\)/s
git commit -m "feat: wire dashboard page and session-detail route"
```

---

## Phase 5 — Seed Script, E2E Tests, Docs

### Task 30: Seed script for Robert

**Files:**
- Create: `scripts/seed-robert.ts`

- [ ] **Step 1: Implement the seed script**

Create `scripts/seed-robert.ts`:

```typescript
import path from "node:path";
import fs from "node:fs/promises";
import { createUser, findUserByUsername } from "../lib/auth/users";
import { indexUploadedPdf } from "../lib/rag/indexer";

const SEED_ROOT = path.resolve(__dirname, "../../rag_knowledge_base/car_dealership_knowledge_base");
const USERNAME = "robert";
const PASSWORD = "robert-demo-pw";

async function main() {
  let user = await findUserByUsername(USERNAME);
  if (!user) {
    console.log(`creating user "${USERNAME}" with password "${PASSWORD}"`);
    user = await createUser(USERNAME, PASSWORD);
  } else {
    console.log(`user "${USERNAME}" exists, adding any missing documents`);
  }

  const entries = await fs.readdir(SEED_ROOT, { withFileTypes: true });
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const folder = entry.name;
    const folderPath = path.join(SEED_ROOT, folder);
    const files = await fs.readdir(folderPath);
    for (const f of files) {
      if (!f.toLowerCase().endsWith(".pdf")) continue;
      const full = path.join(folderPath, f);
      const buf = await fs.readFile(full);
      try {
        const doc = await indexUploadedPdf({
          userId: user.id,
          folder,
          docName: f,
          buffer: buf,
        });
        console.log(`  indexed ${folder}/${f} → ${doc.docId} (${doc.pages} pages)`);
      } catch (err: any) {
        console.warn(`  skipped ${folder}/${f}: ${err.message}`);
      }
    }
  }
  console.log("done");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
```

- [ ] **Step 2: Add tsconfig shim for scripts**

Ensure scripts can resolve the `@/...` alias under `tsx`. Create `scripts/tsconfig.json`:

```json
{
  "extends": "../tsconfig.json",
  "compilerOptions": {
    "module": "commonjs",
    "moduleResolution": "node",
    "jsx": "react-jsx",
    "paths": { "@/*": ["../*"] }
  },
  "include": ["./**/*.ts"]
}
```

- [ ] **Step 3: Manual run**

Place at least one PDF into `../rag_knowledge_base/car_dealership_knowledge_base/Ford/` (the folders currently exist but are empty). Then:

```bash
npm run seed:robert
```

Expected: `creating user "robert"...`, followed by `indexed Ford/<file>.pdf → d_... (N pages)` lines.

Verify `data/users.json` contains a `robert` entry and `data/workspaces/<userId>/pdfs/Ford/` contains the PDF.

- [ ] **Step 4: Commit**

```bash
git add scripts/
git commit -m "feat: seed script for Robert's demo workspace"
```

---

### Task 31: Playwright setup and fixture PDF

**Files:**
- Create: `playwright.config.ts`
- Create: `scripts/make-fixture-pdf.ts`
- Create: `tests/e2e/fixtures/tiny.pdf` (generated)
- Modify: `package.json` (add `pdfkit` to devDependencies and a fixture script)

- [ ] **Step 1: Add pdfkit dev dependency and fixture script**

Modify `package.json`:

- Add under `devDependencies`: `"pdfkit": "^0.15.0"` and `"@types/pdfkit": "^0.13.4"`
- Add under `scripts`: `"fixtures:make": "tsx scripts/make-fixture-pdf.ts"`

Then run:

```bash
npm install
```

- [ ] **Step 2: Create the fixture generator**

Create `scripts/make-fixture-pdf.ts`:

```typescript
import fs from "node:fs";
import path from "node:path";
import PDFDocument from "pdfkit";

const outDir = path.resolve(__dirname, "../tests/e2e/fixtures");
fs.mkdirSync(outDir, { recursive: true });
const outPath = path.join(outDir, "tiny.pdf");

const doc = new PDFDocument({ size: "LETTER", margin: 50 });
const stream = fs.createWriteStream(outPath);
doc.pipe(stream);
doc.fontSize(14).text("RAG Test Fixture", { align: "left" });
doc.moveDown();
doc.fontSize(12).text(
  "Unapplied labor is the amount of time you are paying for but not collecting from a customer. " +
  "This happens when flat-rate technicians finish their work early. In a healthy service shop " +
  "you want hours billed to exceed hours paid, not the other way around.",
  { align: "left" }
);
doc.end();
stream.on("finish", () => console.log(`wrote ${outPath}`));
```

- [ ] **Step 3: Generate the fixture and verify**

Run:

```bash
npm run fixtures:make
node -e "require('pdf-parse')(require('fs').readFileSync('tests/e2e/fixtures/tiny.pdf')).then(r=>console.log(JSON.stringify({pages:r.numpages,contains:r.text.toLowerCase().includes('unapplied labor')})))"
```

Expected: prints `{"pages":1,"contains":true}`.

- [ ] **Step 4: Create `playwright.config.ts`**

```typescript
import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 30_000,
  fullyParallel: false,
  workers: 1,
  reporter: "list",
  use: {
    baseURL: "http://localhost:3000",
    headless: true,
    trace: "retain-on-failure",
  },
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: true,
    timeout: 120_000,
    env: {
      DATA_DIR: "./tests/e2e/.tmp-data",
      SESSION_SECRET: "test-secret-at-least-32-characters-long",
    },
  },
});
```

- [ ] **Step 5: Install the Playwright browser binary**

Run: `npx playwright install chromium`

Expected: Chromium downloads on first run.

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json playwright.config.ts scripts/make-fixture-pdf.ts tests/e2e/fixtures/tiny.pdf
git commit -m "test: Playwright config and pdfkit-generated fixture PDF"
```

---

### Task 32: E2E — happy path 1 (signup → upload → search → PDF jumps)

**Files:**
- Create: `tests/e2e/happy-path-1.spec.ts`

- [ ] **Step 1: Write the test**

Create `tests/e2e/happy-path-1.spec.ts`:

```typescript
import { test, expect } from "@playwright/test";
import path from "node:path";
import fs from "node:fs";

const FIXTURE_PDF = path.resolve(__dirname, "fixtures/tiny.pdf");

test.beforeEach(async () => {
  const dir = path.resolve(__dirname, ".tmp-data");
  if (fs.existsSync(dir)) fs.rmSync(dir, { recursive: true, force: true });
});

test("signup → upload → search → see quote → PDF pane updates", async ({ page }) => {
  const username = "alice" + Date.now().toString(36);

  await page.goto("/signup");
  await page.fill('input[minlength="2"]', username);
  await page.fill('input[type="password"]', "testtest1");
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/dashboard$/);

  // type a folder name, then upload via that folder's upload button
  await page.fill('input[placeholder="New folder"]', "Ford");
  const chooser = await Promise.all([
    page.waitForEvent("filechooser"),
    page.getByText("+ Upload PDF").last().click(),
  ]);
  await chooser[0].setFiles(FIXTURE_PDF);

  // wait until document appears in the sidebar (query invalidation)
  await expect(page.getByText("tiny.pdf")).toBeVisible({ timeout: 10_000 });

  // run a search
  await page.fill("input[placeholder^='Ask a question']", "unapplied labor");
  await page.click('button:has-text("Search")');

  // the session URL should change
  await page.waitForURL(/\/s\/s_[a-f0-9]+$/, { timeout: 10_000 });

  // a quote card should appear
  const firstCard = page.locator('button:has(mark)').first();
  await expect(firstCard).toBeVisible();
  await expect(firstCard).toContainText("unapplied");

  // the PDF pane loads
  await expect(page.getByText(/tiny\.pdf/)).toBeVisible();
});
```

- [ ] **Step 2: Run the test**

Run: `npm run test:e2e -- tests/e2e/happy-path-1.spec.ts`

Expected: PASS (the dev server will be started automatically per `webServer` config).

If the test fails because the fixture PDF didn't produce matching text, regenerate a cleaner fixture (see Task 31 Step 3).

- [ ] **Step 3: Commit**

```bash
git add tests/e2e/happy-path-1.spec.ts
git commit -m "test: E2E happy path — signup, upload, search, view PDF"
```

---

### Task 33: E2E — happy path 2 (reopen past session)

**Files:**
- Create: `tests/e2e/happy-path-2.spec.ts`

- [ ] **Step 1: Write the test**

Create `tests/e2e/happy-path-2.spec.ts`:

```typescript
import { test, expect } from "@playwright/test";
import path from "node:path";
import fs from "node:fs";

const FIXTURE_PDF = path.resolve(__dirname, "fixtures/tiny.pdf");

test.beforeEach(async () => {
  const dir = path.resolve(__dirname, ".tmp-data");
  if (fs.existsSync(dir)) fs.rmSync(dir, { recursive: true, force: true });
});

test("log out, log back in, reopen past session from sidebar", async ({ page }) => {
  const username = "bob" + Date.now().toString(36);
  const password = "testtest1";

  // create the user, upload, search, record session URL
  await page.goto("/signup");
  await page.fill('input[minlength="2"]', username);
  await page.fill('input[type="password"]', password);
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/dashboard$/);

  await page.fill('input[placeholder="New folder"]', "Ford");
  const [chooser] = await Promise.all([
    page.waitForEvent("filechooser"),
    page.getByText("+ Upload PDF").last().click(),
  ]);
  await chooser.setFiles(FIXTURE_PDF);
  await expect(page.getByText("tiny.pdf")).toBeVisible({ timeout: 10_000 });

  await page.fill("input[placeholder^='Ask a question']", "unapplied labor");
  await page.click('button:has-text("Search")');
  await page.waitForURL(/\/s\/s_[a-f0-9]+$/);
  const sessionUrl = page.url();

  // log out
  await page.click('button:has-text("Log out")');
  await page.waitForURL(/\/login$/);

  // log back in
  await page.fill("input", username);
  await page.fill('input[type="password"]', password);
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/dashboard$/);

  // sidebar should show the prior session
  await expect(page.getByText("unapplied labor")).toBeVisible();

  // click it and the session is restored with quotes
  await page.click('a:has-text("unapplied labor")');
  await page.waitForURL(sessionUrl);
  await expect(page.locator('button:has(mark)').first()).toBeVisible();
});
```

- [ ] **Step 2: Run both E2E tests together**

Run: `npm run test:e2e`

Expected: 2 tests pass.

- [ ] **Step 3: Commit**

```bash
git add tests/e2e/happy-path-2.spec.ts
git commit -m "test: E2E happy path — reopen past session after re-login"
```

---

### Task 34: README

**Files:**
- Create: `README.md`

- [ ] **Step 1: Write the README**

Create `README.md`:

````markdown
# RAG Workspace — Prototype

A Next.js web app where authenticated users search their private PDF knowledge base and see ranked verbatim quotes with a side-by-side PDF viewer.

## Run it

```bash
cp env.example .env.local
# edit SESSION_SECRET to any 32+ char random string
npm install
npm run dev
```

Then visit http://localhost:3000 — you'll be sent to the sign-in page. Create an account via the "Create one" link, upload a PDF in the sidebar, and run a search.

## Seed Robert's demo workspace

Drop PDFs into `../rag_knowledge_base/car_dealership_knowledge_base/{Chevrolet,Ford,GMC}/` and run:

```bash
npm run seed:robert
```

This creates a `robert` user (password `robert-demo-pw`) and indexes the PDFs into his workspace.

## Tests

```bash
npm run test         # unit tests (Vitest)
npm run test:e2e     # end-to-end (Playwright) — installs Chromium on first run
```

## Swap the mock retriever for a real backend

The contract lives in `lib/rag/contract.ts`. Set `RAG_BACKEND_URL` in `.env.local` (e.g., `http://localhost:8000`) and `/api/rag/search` will proxy requests to your backend's `POST /search` endpoint using the same `SearchRequest` / `SearchResponse` shapes. No frontend changes needed.

The backend receives the header `x-user-id: <userId>` for tenant isolation; other `/api/rag/*` endpoints (documents, upload, sessions, PDF serving) remain Next.js-local because they read and write the user's filesystem workspace. If you move those to a real backend, update `lib/rag/client.ts` accordingly.

## Layout

- `app/` — routes (auth group, app group, api routes)
- `components/` — UI (sidebar, results, pdf, auth)
- `lib/auth/` — passwords, session JWT, user store, current-user helper
- `lib/rag/` — contract types, mock search, indexer, sessions, workspace helpers
- `scripts/seed-robert.ts` — demo seed
- `data/` (gitignored) — `users.json` and `workspaces/<userId>/` per-user state
- `tests/unit/` — Vitest
- `tests/e2e/` — Playwright

## Security notes (prototype)

- Passwords bcrypt-hashed (cost 12)
- Session cookie: HTTP-only, SameSite=Lax, Secure in production
- All `/api/rag/*` handlers resolve `userId` from the session; filesystem access goes through `lib/rag/workspace.ts` which guards against path traversal
- Uploads: PDF-only (MIME + magic-byte), 50 MB cap
````

- [ ] **Step 2: Commit**

```bash
git add README.md
git commit -m "docs: add README with setup, seed, tests, and backend-swap notes"
```

---

## Phase 6 — Final Verification

### Task 35: Full verification sweep

- [ ] **Step 1: All unit tests green**

Run: `npm run test`

Expected: all tests pass (workspace, passwords, session, users, mock-search).

- [ ] **Step 2: All E2E tests green**

Run: `npm run test:e2e`

Expected: 2 tests pass.

- [ ] **Step 3: Type-check is clean**

Run: `npx tsc --noEmit`

Expected: no errors.

- [ ] **Step 4: Lint is clean**

Run: `npm run lint`

Expected: no errors. (If warnings appear for unused vars in stub code, fix them or suppress with targeted comments.)

- [ ] **Step 5: Build succeeds**

Run: `npm run build`

Expected: completes without errors.

- [ ] **Step 6: Manual full-flow smoke test**

1. `rm -rf data/ tests/e2e/.tmp-data/`
2. `npm run dev`
3. Visit `/signup`; create user `demo` / `demopassword`.
4. In the sidebar, type `Ford` into "New folder", click "+ Upload PDF", pick `tests/e2e/fixtures/tiny.pdf`.
5. Wait for it to appear under the Ford folder.
6. Type a query like "unapplied labor", click Search.
7. Verify a quote card appears, highlighted.
8. Click the card; the right pane should show the PDF with the "Matched passage on this page" banner on the correct page.
9. Click "Log out"; log back in with the same credentials; confirm the session appears in the sidebar and reopens correctly.

- [ ] **Step 7: Commit (if any fixes were made during verification)**

If you made any fixes during verification:

```bash
git add -A
git commit -m "fix: verification-pass corrections"
```

Otherwise, no commit is needed — the project is done.
