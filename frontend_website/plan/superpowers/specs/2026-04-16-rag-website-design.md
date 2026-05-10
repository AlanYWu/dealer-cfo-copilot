# RAG Website — Design Spec

**Date:** 2026-04-16
**Status:** Approved for implementation planning
**Scope:** Frontend web application for an AI-aided retrieval system over a per-user PDF knowledge base.

---

## 1. Purpose & Users

Build a web application that lets authenticated users query a personal knowledge base of PDF documents and receive exact quotations with in-context PDF previews.

**Target users:** Car dealership accountants and service managers. Prototype-stage; Robert is the initial user whose existing `rag_knowledge_base/car_dealership_knowledge_base/` corpus (Chevrolet, Ford, GMC manuals) will seed his workspace.

**Core use case:** A user signs in, types a natural-language question (e.g., "What is unapplied labor?"), picks an optional scope, and sees a ranked list of verbatim quotes extracted from their PDFs. Clicking a quote opens that PDF in a side pane scrolled to the exact page with the matched passage highlighted. The user can scroll the PDF freely for surrounding context.

---

## 2. Interaction Model

Hybrid search + sessions, not chat:

- Each submitted query creates a **session**. A session has one query and its ranked quote results — no multi-turn conversation.
- Sessions persist in a Claude-style left sidebar per user. Clicking a past session restores its query and quotes.
- Retrieval is **AI-aided** (the backend may use embeddings, reranking, and query understanding), but the **user-facing output is only verbatim quotes**. No AI-generated prose answer is rendered — just the retrieved text with citations.
- Default scope = everything in the workspace. Users may check folders or individual documents in the sidebar to narrow the next query.

---

## 3. High-Level Architecture

Single Next.js 14+ project (App Router, TypeScript, Tailwind). Three concerns with clean boundaries:

1. **Next.js frontend** — All UI. Client components for interactivity; server components for auth-gated layouts.
2. **Next.js Route Handlers (`app/api/*`)**:
   - **Auth endpoints** — real local auth backed by a JSON file.
   - **RAG mock endpoints** — conform to a **contract** (`lib/rag/contract.ts`). A real backend later replaces the mock by proxying through `RAG_BACKEND_URL`; the frontend does not change.
3. **Filesystem workspace storage** — `data/workspaces/<userId>/` contains that user's PDFs, extracted-text index, and session history. No database in the prototype.

**PDF rendering** uses `react-pdf` (pdf.js wrapper) for page-jump, text highlighting, and free scroll.

**Rationale:** single process and single command (`npm run dev`) to run; contract-first API makes real-backend integration a base-URL swap; filesystem state defers the database choice without locking in anything.

---

## 4. API Contract

All RAG endpoints live under `/api/rag/*` and match TypeScript types in `lib/rag/contract.ts`.

### Endpoints

```
POST  /api/rag/search
  body:  { query: string, scope?: { folders?: string[], docIds?: string[] } }
  resp:  { sessionId: string, quotes: Quote[] }

GET    /api/rag/sessions                  → SessionSummary[]
GET    /api/rag/sessions/:id              → Session
DELETE /api/rag/sessions/:id

GET    /api/rag/documents                 → KB tree (folders + PDFs)
POST   /api/rag/upload                    → multipart; adds PDFs to a folder
DELETE /api/rag/documents/:docId

GET    /api/rag/pdf/:docId                → raw PDF bytes (for viewer)
GET    /api/rag/pdf/:docId/context?page=N → surrounding text for inline expand
```

### Core Types

```ts
type Quote = {
  id: string;
  text: string;                // exact quote
  docId: string;
  docName: string;             // e.g., "Ford_Service_Manual.pdf"
  folder: string;              // e.g., "Ford"
  page: number;                // 1-indexed
  bbox?: [number, number, number, number]; // optional highlight rect
  contextBefore: string;       // ~200 chars before
  contextAfter: string;        // ~200 chars after
  score: number;               // 0..1 relevance
};

type SessionSummary = { id: string; query: string; createdAt: string; quoteCount: number };
type Session        = SessionSummary & { scope?: { folders?: string[]; docIds?: string[] }; quotes: Quote[] };
```

The `bbox` enables precise in-page highlight. If the backend does not emit bboxes, the frontend falls back to page-level highlighting without code changes.

### Mock Retrieval (prototype)

`/api/rag/search` performs substring + keyword scoring over each PDF's extracted text (produced once on upload via `pdf-parse`, cached as JSON in the user's `index.json`). Enough to demo the full UI end-to-end; not a real retriever.

---

## 5. UI — Dashboard Layout

**Selected layout:** three-column, always visible (approved from mockup A).

```
┌────────────┬─────────────────────┬──────────────────┐
│  Sidebar   │   Results pane      │    PDF pane      │
│            │                     │                  │
│ · User menu│  · Query bar        │  · Doc toolbar   │
│ · New      │  · Quote cards      │  · Scrollable    │
│   search   │    (click → PDF)    │    PDF viewer    │
│ · Sessions │                     │  · Highlight     │
│ · KB tree  │                     │    overlay       │
│   + scope  │                     │                  │
│   checks   │                     │                  │
│ · Upload   │                     │                  │
└────────────┴─────────────────────┴──────────────────┘
```

**Routes (App Router):**

```
app/
  (auth)/
    login/page.tsx           ← login portal (first screen)
    signup/page.tsx          ← simple public signup
  (app)/
    layout.tsx               ← session-gated; renders three-column shell
    page.tsx                 ← "new search" default view
    s/[sessionId]/page.tsx   ← a specific past session
  api/
    auth/[login|logout|me|signup]/route.ts
    rag/[...]/route.ts
```

**Component tree (dashboard):**

```
<AppShell>
  <Sidebar>
    <UserMenu />              // avatar, logout
    <NewSearchButton />
    <SessionList />           // past queries
    <KnowledgeBaseTree>
      <ScopeCheckboxes />     // narrow the next query
      <UploadButton />        // drag/drop or file picker
    </KnowledgeBaseTree>
  </Sidebar>

  <ResultsPane>
    <QueryBar />
    <QuoteList>
      <QuoteCard />           // click → PDF pane jumps
    </QuoteList>
  </ResultsPane>

  <PdfPane>
    <PdfToolbar />            // doc name, page, zoom, close
    <PdfDocument />           // react-pdf viewer, scrollable
    <HighlightOverlay />      // yellow box on matched region
  </PdfPane>
</AppShell>
```

### Search Data Flow

1. User types a query; optionally checks scope folders/docs in the sidebar.
2. `QueryBar` calls `POST /api/rag/search` with `{ query, scope }`.
3. Route handler (mock): loads the user's `index.json`, ranks matches, builds `Quote[]`, appends a new session to `sessions.json`, returns `{ sessionId, quotes }`.
4. Client navigates to `/s/<sessionId>` (URL reflects session; bookmarkable).
5. `ResultsPane` renders the quote list; the first quote is auto-selected; `PdfPane` loads that doc and scrolls to `page` (and `bbox` if present).
6. Clicking a different quote updates the `PdfPane` in place.
7. The sidebar's `SessionList` refetches and shows the new session at the top.

### State Management

- **Server state:** TanStack Query (React Query) for sessions, documents, quotes.
- **UI state:** `useState` + URL params for the selected quote and PDF scroll target. No Redux/Zustand needed.

### PDF Viewer Behavior

- Lazy page rendering (react-pdf's windowed mode) so large PDFs stay responsive.
- Free scroll up and down the full document.
- Highlight layer positioned by `bbox` when available; falls back to a page-level highlight banner otherwise.
- Reflows correctly on zoom change.

---

## 6. Authentication & Workspaces

### User Store

`data/users.json` (gitignored):

```json
[
  { "id": "u_robert", "username": "robert", "passwordHash": "$2b$12$...", "createdAt": "2026-04-16T…" }
]
```

### Flows

- **Signup** — `POST /api/auth/signup { username, password }` creates the entry, bcrypt-hashes the password (cost 12), and provisions the workspace directory. No email verification. Public signup is enabled for the prototype.
- **Login** — `POST /api/auth/login` bcrypt-compares, then sets a signed JWT in an HTTP-only, `SameSite=Lax` session cookie (7-day expiry). `jose` is used for JWT sign/verify.
- **Session enforcement** — the `(app)` layout performs a server-side `/api/auth/me` check and redirects to `/login` if no valid session.
- **Logout** — clears the cookie.

### Per-User Workspace Layout

```
data/workspaces/<userId>/
  pdfs/
    Chevrolet/
      Malibu_Service.pdf
    Ford/
      Ford_Service_Manual.pdf
    GMC/
  index.json                 // { docId → { path, folder, pages, extractedText } }
  sessions.json              // Session[]
```

### Seeding

New users start with an empty workspace. No automatic seeding from the repo-root `rag_knowledge_base/`. A small `npm run seed:robert` script copies the existing Chevrolet/Ford/GMC folders into Robert's workspace and runs the indexer once, for the prototype demo.

### Upload Flow

- `POST /api/rag/upload` (multipart) — any authenticated user can upload PDFs into any folder in their own workspace (existing or new).
- Server saves under `pdfs/<folder>/`, then runs `pdf-parse` to extract text and appends to `index.json`.
- Accepts `.pdf` only (MIME check + magic-byte sniff). Size cap 50 MB per file.

### Security

- Passwords bcrypt-hashed (cost 12).
- Session cookie: HTTP-only, `SameSite=Lax`, `Secure` in production.
- All `/api/rag/*` handlers resolve `userId` from the session and read/write only within that user's workspace directory. `lib/rag/workspace.ts` provides path helpers that `path.resolve` and verify the resolved path is still under the workspace root (path-traversal guard).
- Upload size cap enforced before writing to disk.
- Input validated with `zod` at every route boundary.

---

## 7. Project Structure

```
frontend_website/
  app/                              # routes (see Section 5)
  components/
    sidebar/                        # Sidebar, SessionList, KnowledgeBaseTree, UploadButton
    results/                        # QueryBar, QuoteCard, QuoteList
    pdf/                            # PdfPane, PdfToolbar, HighlightOverlay
    auth/                           # LoginForm, SignupForm
    ui/                             # shared primitives (Button, Input, Dialog)
  lib/
    auth/                           # cookie session, bcrypt, middleware
    rag/
      contract.ts                   # Quote, Session, request/response types
      mock-search.ts                # prototype retriever
      indexer.ts                    # pdf-parse → index.json
      workspace.ts                  # per-user path helpers (traversal-safe)
    react-query-provider.tsx
  data/                             # gitignored: users.json + workspaces/
  public/
  tests/
    e2e/                            # Playwright happy paths
    unit/                           # Vitest: contract types, workspace, mock search
  plan/
    superpowers/specs/              # this design
  env.example                # RAG_BACKEND_URL, SESSION_SECRET
  .gitignore                        # data/, .superpowers/, node_modules/, .next/
  package.json
  tsconfig.json
  tailwind.config.ts
  README.md
```

### Key Dependencies

- `next`, `react`, `tailwindcss`
- `react-pdf` (PDF viewer), `pdf-parse` (text extraction)
- `bcryptjs`, `jose` (auth)
- `@tanstack/react-query`, `zod`
- `vitest` + `@playwright/test` for tests

---

## 8. Testing Strategy

Prototype-appropriate, not exhaustive.

**Vitest unit tests** — contract-critical logic:

- `lib/rag/workspace.ts` — path-traversal guard, user isolation.
- `lib/rag/mock-search.ts` — queries return expected quotes against a fixture index.
- `lib/auth/*` — hashing, session encode/decode, middleware redirects.

**Playwright E2E — two happy paths:**

1. Signup → login → upload a PDF → search → see a quote → PDF pane jumps to the page.
2. Login as existing user → reopen a past session from the sidebar → all quotes and the PDF restore.

**Out of scope for prototype tests:** visual regression, full accessibility audit, load testing, exhaustive negative-path coverage.

---

## 9. Out of Scope (Deferred)

- Sharing sessions or documents between users.
- Non-PDF formats (text, markdown, Excel, CSV) — PDF-only for now.
- AI-generated prose answers — only verbatim quotes surface to the user.
- Real RAG backend (embeddings, vector DB, reranking) — replaced later behind the API contract.
- Multi-turn follow-up questions within a session.
- Email verification, password reset, role-based access (no admin role).
- Postgres or other database — JSON + filesystem is the prototype store.

---

## 10. Developer Experience

- `npm run dev` — start the app (single Next.js process).
- `npm run seed:robert` — copy the repo-root `rag_knowledge_base/car_dealership_knowledge_base/*` into Robert's workspace and index it.
- `npm run test` — Vitest.
- `npm run test:e2e` — Playwright.
- `README.md` documents: running the app, creating users (signup or seed script), where PDFs live, how to switch to a real backend via `RAG_BACKEND_URL`.

---

## 11. Success Criteria

The prototype is complete when:

1. A new user can sign up, log in, upload a PDF, run a search, see quotes, click a quote, and watch the PDF pane scroll to the correct page with the match highlighted.
2. Logging out and back in restores all prior sessions in the sidebar, each re-openable with its quotes and PDF views intact.
3. Two users on the same machine see only their own documents and sessions — no cross-workspace leakage, verified by tests.
4. The `RAG_BACKEND_URL` env flag, when set, causes `/api/rag/search` to proxy to an external service using the documented contract; unset, the in-process mock is used.
