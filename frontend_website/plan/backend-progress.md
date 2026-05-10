# RAG Backend Integration — Progress & TODOs

_Last updated: 2026-05-09_

## Architecture

```
Browser
   │
   ▼
Next.js (frontend_website)
   ├── /api/rag/search ──────► backend_rag  POST /search        (when RAG_BACKEND_URL set)
   ├── /api/rag/upload  ─────► backend_rag  POST /ingest        (fire-and-forget)
   ├── /api/rag/documents/X ─► backend_rag  DELETE /documents/X (fire-and-forget)
   ├── /api/rag/reindex      ─► backend_rag  POST /ingest       (replay every local doc)
   ├── /api/rag/sessions/*    (always local — sessions live in Next.js)
   ├── /api/rag/documents     (always local — reads index.json)
   └── /api/rag/pdf/*         (always local — streams PDF bytes)

backend_rag (FastAPI)
   └── Elasticsearch per-user index `rag-<userId>`
          - text (BM25, english analyzer) — keyword mode
          - embedding (dense_vector, cosine) — natural mode (kNN)
       Claude CLI subprocess (missing-doc agent)
```

The frontend remains the source of truth for user files, the document index, and session history. The backend only owns embeddings + retrieval.

## Search algorithm (implemented)

User picks `mode` (`keyword` | `natural`) and `depth` (`fast` | `accurate`).

- **keyword:** BM25 over chunks
  - 0 hits → fall through to natural path
  - 1–100 hits → return top-20 quotes
  - >100 hits → return top-20 + `refine` hint with folder/doc filter chips
- **natural:** embed query → Qdrant top-50
  - `accurate` → cross-encoder rerank top-50, return top-20
  - `fast` → return top-20 directly
  - 0 hits → spawn `claude -p ...` for "missing doc" suggestions
- **LLM synthesis tier:** intentionally not implemented (per Alan).

## What's done

### Frontend (`frontend_website/`)
- `lib/rag/contract.ts` — added `SearchMode`, `SearchDepth`, `RefineHint`, `MissingHint`, `RefineSuggestion`. `SearchRequest` gained `mode?` and `depth?`. `SearchResponse` gained optional `refine` and `missing`.
- `lib/rag/backend.ts` (new) — `notifyIngest` and `notifyDelete` helpers, no-op when `RAG_BACKEND_URL` is unset.
- `lib/rag/indexer.ts` — calls `notifyIngest` after upload, `notifyDelete` after `removeDoc`.
- `app/api/rag/search/route.ts` — proxies to backend when env set; **always** calls `appendSession` so backend-proxied results show up in the sidebar history (this was a pre-existing bug); threads `refine`/`missing` through.
- `components/results/QueryBar.tsx` — Natural/Keyword and Fast/Accurate toggles.
- `components/results/ResultsPane.tsx` — amber "refine" banner with clickable filter chips, blue "missing" banner with agent suggestions.
- `components/dashboard/DashboardShell.tsx` — wires mode/depth/refine/missing state and exposes `setScope` to ResultsPane.

Verification: `npx tsc --noEmit` → exit 0. `npx vitest run` → 20/20 pass.

### Backend (`backend_rag/`)
- `app/main.py` — FastAPI: `/health`, `POST /ingest`, `DELETE /documents/{docId}`, `POST /search`. All require `x-user-id` header.
- `app/schemas.py` — Pydantic mirrors of the frontend contract.
- `app/config.py` — env-driven config: `ELASTICSEARCH_URL`, `EMBED_MODEL` (`bge-small-en-v1.5`), `RERANK_MODEL` (`bge-reranker-base`), `TOP_K_VECTOR=50`, `TOP_K_RETURN=20`, `REFINE_THRESHOLD=100`, `CLAUDE_CLI=claude`.
- `app/chunk.py` — sentence-window chunker (3 sentences, 1 overlap) preserving `contextBefore/After`.
- `app/embed.py` — lazy `SentenceTransformer` + `CrossEncoder` singletons.
- `app/store.py` — Elasticsearch wrapper. Per-user index `rag-<sanitized_user_id>` with `english` BM25 + `dense_vector` kNN. ES holds all chunk state; no in-process BM25 or Qdrant.
- `app/agent.py` — missing-doc agent shells out `claude -p`, parses JSON array, silent-fails if CLI absent.
- `app/search.py` — the three-tier algorithm above.
- `tests/` — unit tests for `chunk.chunk_page`, `search._build_refine_hint`, `agent._parse_json_array`. Run with `python -m pytest -q`.
- `requirements.txt`, `.env.example`, `docker-compose.yml` (Elasticsearch 8.13 single-node, security disabled for dev), `.gitignore`, `README.md`.

Verification: 9/9 backend unit tests pass; `ast.parse` on every file → OK. **End-to-end not run yet** — requires `docker compose up -d elasticsearch` locally.

## To run end-to-end

```bash
# backend
cd backend_rag
uv venv && source .venv/bin/activate
uv pip install -r requirements.txt
docker compose up -d elasticsearch
# wait ~30s for ES to be ready, then:
curl -fsS http://localhost:9200/_cluster/health
uvicorn app.main:app --reload --port 8000

# frontend (separate shell)
cd frontend_website
echo "RAG_BACKEND_URL=http://localhost:8000" >> .env.local
npm run dev
```

Existing uploads predate the backend, so POST `/api/rag/reindex` once after starting the backend to backfill them into ES (or just re-upload).

## Remaining TODOs

### High priority
1. ~~**Backfill ingest endpoint.**~~ ✅ Implemented as `POST /api/rag/reindex` (`frontend_website/app/api/rag/reindex/route.ts`).
2. **End-to-end smoke test.** Spin up Elasticsearch + uvicorn locally; upload one PDF; run keyword + natural searches; trigger refine path (broad keyword) and missing path (gibberish query). Static checks + unit tests are green; live ES not yet exercised.
3. ~~**Backend unit tests.**~~ ✅ `backend_rag/tests/` covers chunk, refine-hint, agent JSON parsing. 9/9 pass.
4. **Playwright e2e.** Existing `tests/e2e/` covers the mock path. Add a variant that runs against a backend (skip-if-env-unset).

### Medium priority
5. **bbox highlights.** Currently `lib/rag/indexer.ts` discards `pdfjs` `transform`/`width`/`height`. To enable PDF viewer highlight, capture per-line bboxes during extraction, fold them into chunks, forward in `notifyIngest`, store on the ES `_source`, populate `Quote.bbox` in `_to_quote`. Frontend already renders it.
6. ~~**Backend startup health gate.**~~ ✅ `GET /health` now pings ES and returns 503 on failure.
7. **Refine suggestion quality.** Today `_build_refine_hint` ranks by raw match count from the top-`TOP_K_RETURN` window (we no longer have the full match list to count over — it lives in ES). A `terms` aggregation on `docId`/`folder` filtered by the same query would let us count across all matches. Worth doing once we have real data to test against.
8. **Concurrency.** With ES owning all chunk state, multiple uvicorn workers (`--workers N`) are now safe — there's no in-process index to desync. The embedder/reranker singletons are still per-process, which is fine.

### Low priority / nice to have
9. **Reranker on by default for `accurate`.** Confirm latency budget on real data.
10. **Caching.** `_embedder()` is `lru_cache(1)`, but cold start is slow (~2s for bge-small). Consider warm-up at uvicorn startup.
11. **Auth between frontend and backend.** Today `x-user-id` is unauthenticated — anyone who can reach the backend port can impersonate any user. Fine for localhost; before any deploy add a shared bearer token or mTLS.
12. **Forward query mode/depth in `notifyIngest`.** Not needed — ingest doesn't depend on these.
13. **Sessions store the search but not the hints.** If user reopens a past session that had a `refine` or `missing` banner, the banner is gone. Decide whether sessions should persist hints.

## Files touched (for git)

```
M  app/api/rag/search/route.ts
M  components/dashboard/DashboardShell.tsx
M  components/results/QueryBar.tsx
M  components/results/ResultsPane.tsx
M  lib/rag/contract.ts
M  lib/rag/indexer.ts
A  lib/rag/backend.ts
A  app/api/rag/reindex/route.ts
A  plan/backend-progress.md   (this file)
A  plan/superpowers/plans/2026-05-09-elasticsearch-backend.md

A  ../backend_rag/README.md
M  ../backend_rag/requirements.txt        (qdrant/bm25 → elasticsearch)
M  ../backend_rag/docker-compose.yml      (qdrant → elasticsearch:8.13)
M  ../backend_rag/.env.example            (QDRANT_URL → ELASTICSEARCH_URL)
A  ../backend_rag/.gitignore
A  ../backend_rag/app/__init__.py
M  ../backend_rag/app/main.py             (/health pings ES)
A  ../backend_rag/app/schemas.py
M  ../backend_rag/app/config.py           (QDRANT_URL → ELASTICSEARCH_URL)
A  ../backend_rag/app/chunk.py
A  ../backend_rag/app/embed.py
M  ../backend_rag/app/store.py            (full rewrite around ES)
A  ../backend_rag/app/agent.py
M  ../backend_rag/app/search.py           (new keyword_search return shape)
A  ../backend_rag/pytest.ini
A  ../backend_rag/tests/__init__.py
A  ../backend_rag/tests/test_chunk.py
A  ../backend_rag/tests/test_search_helpers.py
A  ../backend_rag/tests/test_agent.py
```
