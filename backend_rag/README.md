# backend_rag

FastAPI service that backs the `/api/rag/search` proxy in the frontend.

## Endpoints

- `GET /health` — pings Elasticsearch; returns 503 if unreachable.
- `POST /ingest` — frontend forwards parsed PDF pages here on upload.
  Body: `{ docId, folder, docName, pages: [{page, text}] }`, header `x-user-id`.
- `DELETE /documents/{docId}` — frontend forwards on doc removal. Header `x-user-id`.
- `POST /search` — body `{ query, scope?, mode?, depth? }`, header `x-user-id`.
  - `mode`: `"keyword"` (BM25 only), `"natural"` (vector kNN, default), `"hybrid"` (BM25 ⊕ vector via RRF).
  - `depth`: `"fast"` or `"accurate"` (CrossEncoder rerank on `natural`/`hybrid`).
  - Pre-retrieval query rewrite is always on; an LLM rewrite (Claude CLI) retries once on weak retrieval.
  - Returns `{ sessionId: "", quotes: [...], refine?, missing? }`. Empty `quotes` + `missing` means score-floor refusal.
- `POST /answer` — body `{ query, scope?, depth? }`, header `x-user-id`. Runs hybrid search internally,
  then synthesizes a verbatim-quoted answer with `[p. N]` citations via the Claude CLI. Refuses pre-LLM
  if no quote clears `RETRIEVAL_FLOOR`. Returns `{ text, refused, citedPages, quotes, missing? }`.

The `Quote` shape mirrors `frontend_website/lib/rag/contract.ts`.

## Storage

Per-user Elasticsearch index `rag-<sanitized_user_id>` with both:
- `text` (BM25, `english` analyzer) — keyword mode
- `embedding` (dense_vector, cosine) — natural mode (kNN)

ES does both; we no longer keep an in-process BM25 index.

## Run

```bash
uv venv && source .venv/bin/activate
uv pip install -r requirements.txt
docker compose up -d elasticsearch
# Wait ~30s for ES to be ready, then:
curl -fsS http://localhost:9200/_cluster/health
uvicorn app.main:app --reload --port 8000
```

Then in the frontend `.env.local`: `RAG_BACKEND_URL=http://localhost:8000`.

If you have existing uploads (uploaded before the backend was wired), POST to
`/api/rag/reindex` from a logged-in session to backfill them into ES.

## Tests

```bash
python -m pytest -q
```

Unit tests don't need a live ES.

## Layout

- `app/main.py` — FastAPI app, route handlers
- `app/schemas.py` — request/response Pydantic models matching the frontend contract
- `app/store.py` — Elasticsearch wrapper (per-user index)
- `app/embed.py` — embedding + reranker singletons (sentence-transformers)
- `app/chunk.py` — page text → 3-sentence-window chunks
- `app/agent.py` — missing-doc agent (claude CLI subprocess)
- `app/answer.py` — `/answer` synthesis: verbatim-quote prompt + refusal (claude CLI subprocess)
- `app/query_rewrite.py` — heuristic rewrite + claude-CLI fallback for weak retrieval
- `app/search.py` — keyword / natural / hybrid (RRF) / refine / missing / floor-refusal algorithm
