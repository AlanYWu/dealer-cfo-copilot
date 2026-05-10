# RAG Workspace — Prototype

A Next.js web app where authenticated users search their private PDF knowledge base and see ranked verbatim quotes with a side-by-side PDF viewer.

## Run it

Frontend only (uses the in-process mock search):

```bash
cp env.example .env.local
# edit SESSION_SECRET to any 32+ char random string
npm install
npm run dev
```

Frontend + Elasticsearch backend in one shot:

```bash
# .env.local needs `RAG_BACKEND_URL=http://localhost:8001`
# backend deps must already be installed: `cd ../backend_rag && uv venv && uv pip install -r requirements.txt`
npm run dev:all
```

`dev:all` launches Docker Desktop if needed, brings up the Elasticsearch container, starts the FastAPI backend on `:8001`, then `next dev`. Ctrl+C tears down the backend; ES is left running. Stop ES with `npm run stack:stop`.

Then visit http://localhost:3000 — you'll be sent to the sign-in page. Create an account via the "Create one" link, upload a PDF in the sidebar, and run a search. On first dashboard load with `RAG_BACKEND_URL` set, the frontend silently syncs your local PDFs into ES (idempotent — runs once per session).

## Seed Robert's demo workspace

Drop PDFs into `../rag_knowledge_base/car_dealership_knowledge_base/{Chevrolet,Ford,GMC}/` and run:

```bash
npm run seed:robert
```

This creates a `robert` user (password `robert-demo-pw`) and indexes the PDFs into his workspace.

## Tests

```bash
npm run test         # unit tests (Vitest)
npm run test:e2e     # end-to-end (Playwright)
```

## Swap the mock retriever for a real backend

The contract lives in `lib/rag/contract.ts`. Set `RAG_BACKEND_URL` in `.env.local` (e.g., `http://localhost:8001`) and `/api/rag/search` will proxy requests to your backend's `POST /search` endpoint using the same `SearchRequest` / `SearchResponse` shapes. No frontend changes needed.

The backend receives the header `x-user-id: <userId>` for tenant isolation; other `/api/rag/*` endpoints (documents, upload, sessions, PDF serving) remain Next.js-local because they read and write the user's filesystem workspace. If you move those to a real backend, update `lib/rag/client.ts` accordingly.

The reference backend lives at `../backend_rag/` (Elasticsearch + sentence-transformers; BM25 + dense_vector kNN + RRF hybrid). `/api/rag/reindex` diffs local docs against the backend and replays only the missing ones — `DashboardShell` calls it on mount once per session, so existing uploads land in ES without manual action.

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
